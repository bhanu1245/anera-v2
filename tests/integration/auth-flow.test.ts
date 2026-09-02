import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { POST as logoutRoute } from '@/app/api/auth/logout/route';
import { GET as sessionRoute } from '@/app/api/auth/session/route';
import { PUT as setPrimaryPhotoRoute } from '@/app/api/profile/photos/primary/route';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  validateSession,
  revokeSession,
  requireOwnership,
} from '@/lib/auth';
import { __resetRateLimits } from '@/lib/auth/rate-limit';

/**
 * Anera V2 — M4 authentication security tests.
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md,
 *            docs/TESTING-STRATEGY.md §4.3, docs/SECURITY-GUIDELINES.md.
 *
 * These run against the real PostgreSQL development database. Persistence is
 * never mocked (D40) — a mocked session store would prove nothing about the
 * property under test, which is that the SERVER decides.
 *
 * Route handlers are invoked directly rather than over HTTP. That exercises
 * the real authentication path (cookie parsing, session lookup, ownership
 * checks) without a server process; browser-level behaviour is covered by
 * the Playwright suite in tests/e2e.
 */

// Each test uses a distinct client IP so the shared rate-limit counters of
// one test cannot fail another.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter % 254}`;
}

interface RequestInitLike {
  method?: string;
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
  ip?: string;
}

function makeRequest(url: string, init: RequestInitLike = {}): NextRequest {
  const headers = new Headers(init.headers ?? {});
  headers.set('x-forwarded-for', init.ip ?? nextIp());
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** Reads the session cookie a route handler set on its response. */
function sessionCookieOf(response: NextResponse) {
  return response.cookies.get(SESSION_COOKIE_NAME);
}

/** Formats a session id as a request `Cookie` header. */
function cookieHeader(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}`;
}

const TEST_EMAIL_DOMAIN = 'm4-authtest.invalid';
let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `m4-user-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

const VALID_PASSWORD = 'correct-horse-battery';

interface Registered {
  userId: string;
  email: string;
  sessionId: string;
}

/** Registers an account through the real endpoint and returns its session. */
async function registerUser(password = VALID_PASSWORD): Promise<Registered> {
  const email = uniqueEmail();
  const res = (await registerRoute(
    makeRequest('/api/auth/register', { method: 'POST', body: { email, password } }),
  )) as NextResponse;
  expect(res.status).toBe(201);
  const body = await res.json();
  const cookie = sessionCookieOf(res);
  expect(cookie).toBeDefined();
  return { userId: body.data.user.id, email, sessionId: cookie!.value };
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
}

beforeAll(cleanup);
afterAll(cleanup);
beforeEach(() => {
  __resetRateLimits();
});

// ─────────────────────────────────────────────────────────────────────────
// 1–3. Registration
// ─────────────────────────────────────────────────────────────────────────

describe('registration', () => {
  it('1. creates an account and returns the identity without session material', async () => {
    const email = uniqueEmail();
    const res = (await registerRoute(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email, password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.user.email).toBe(email.toLowerCase());
    expect(body.data.needsOnboarding).toBe(true);

    const stored = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    expect(stored).not.toBeNull();
  });

  it('2. rejects a duplicate email with 409 and creates no second account', async () => {
    const { email } = await registerUser();

    const res = (await registerRoute(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email, password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(res.status).toBe(409);
    expect(await db.user.count({ where: { email: email.toLowerCase() } })).toBe(1);
  });

  it('3. stores a bcrypt hash, never the plaintext password', async () => {
    const { userId } = await registerUser();

    const stored = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    expect(stored.passwordHash).not.toBe(VALID_PASSWORD);
    expect(stored.passwordHash).not.toContain(VALID_PASSWORD);
    // bcrypt identifier — proves the D36-locked algorithm actually ran.
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4–6. Login
// ─────────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('4. succeeds with correct credentials and issues a session cookie', async () => {
    const { email, userId } = await registerUser();

    const res = (await loginRoute(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.id).toBe(userId);

    const cookie = sessionCookieOf(res);
    expect(cookie?.value).toBeTruthy();
  });

  it('5. rejects an invalid password with 401 and issues no session', async () => {
    const { email } = await registerUser();

    const res = (await loginRoute(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'not-the-password' },
      }),
    )) as NextResponse;

    expect(res.status).toBe(401);
    expect(sessionCookieOf(res)?.value).toBeFalsy();
  });

  it('6. rejects an unknown email with a response indistinguishable from a wrong password', async () => {
    const { email } = await registerUser();

    const wrongPassword = (await loginRoute(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'not-the-password' },
      }),
    )) as NextResponse;
    const unknownEmail = (await loginRoute(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: uniqueEmail(), password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(unknownEmail.status).toBe(wrongPassword.status);
    // Identical bodies: the endpoint cannot be used to enumerate accounts.
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
  });

  it('6b. costs comparable time for an unknown email and a wrong password', async () => {
    // An identical body is not enough: skipping the hash comparison when the
    // email is unknown enumerates accounts by response time instead.
    const { email } = await registerUser();

    async function timeOf(body: { email: string; password: string }): Promise<number> {
      const start = performance.now();
      await loginRoute(makeRequest('/api/auth/login', { method: 'POST', body }));
      return performance.now() - start;
    }

    // Warm the module and connection pool so the first call is not an outlier.
    await timeOf({ email, password: 'warmup-not-the-password' });

    const wrongPassword = await timeOf({ email, password: 'still-not-the-password' });
    const unknownEmail = await timeOf({ email: uniqueEmail(), password: VALID_PASSWORD });

    // The unknown-email path must not short-circuit past bcrypt. A generous
    // floor: the point is that the work happens at all, not that timings match
    // exactly on a shared CI runner.
    expect(unknownEmail).toBeGreaterThan(wrongPassword * 0.4);
  }, 20_000);
});

// ─────────────────────────────────────────────────────────────────────────
// 7–9. Session creation and cookie attributes
// ─────────────────────────────────────────────────────────────────────────

describe('session creation and cookie transport', () => {
  it('7. persists a session row bound to the user, with a future expiry', async () => {
    const { userId, sessionId } = await registerUser();

    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(row.userId).toBe(userId);
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(row.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + SESSION_TTL_MS + 1000);
  });

  it('8. marks the session cookie HttpOnly so script cannot read it', async () => {
    const res = (await registerRoute(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email: uniqueEmail(), password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(sessionCookieOf(res)?.httpOnly).toBe(true);
  });

  it('9. sets the locked cookie security attributes (AUTHENTICATION.md §3.2)', async () => {
    const res = (await registerRoute(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email: uniqueEmail(), password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    const cookie = sessionCookieOf(res)!;
    expect(cookie.sameSite).toBe('lax');
    expect(cookie.path).toBe('/');
    expect(cookie.maxAge).toBe(SESSION_TTL_MS / 1000);
    // Secure is disabled only for plain-HTTP local development.
    expect(cookie.secure).toBe(process.env.NODE_ENV !== 'development');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 10–12. Persistence
// ─────────────────────────────────────────────────────────────────────────

describe('session persistence', () => {
  it('10. survives a refresh — a fresh request carrying only the cookie is authenticated', async () => {
    const { userId, sessionId } = await registerUser();

    const res = (await sessionRoute(
      makeRequest('/api/auth/session', { cookie: cookieHeader(sessionId) }),
    )) as NextResponse;

    const body = await res.json();
    expect(body.data.authenticated).toBe(true);
    expect(body.data.user.id).toBe(userId);
  });

  it('11. survives navigation — repeated independent requests resolve the same identity', async () => {
    const { userId, sessionId } = await registerUser();

    for (let i = 0; i < 3; i++) {
      const res = (await sessionRoute(
        makeRequest('/api/auth/session', { cookie: cookieHeader(sessionId) }),
      )) as NextResponse;
      const body = await res.json();
      expect(body.data.authenticated).toBe(true);
      expect(body.data.user.id).toBe(userId);
    }
  });

  it('12. resolves identity by database lookup, not by trusting the cookie value', async () => {
    const { userId, sessionId } = await registerUser();

    expect(await validateSession(sessionId)).toEqual({ userId, sessionId });

    // A well-formed but unknown id is rejected: nothing is derived from the
    // cookie itself, so a forged value cannot authenticate.
    expect(await validateSession('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')).toBeNull();

    // Deleting the row alone ends the session — the row IS the session.
    await db.session.delete({ where: { id: sessionId } });
    expect(await validateSession(sessionId)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 13–14, 17–18. Logout, revocation and expiry
// ─────────────────────────────────────────────────────────────────────────

describe('logout, revocation and expiry', () => {
  it('13. logs out, clearing the cookie, and is idempotent', async () => {
    const { sessionId } = await registerUser();

    const res = (await logoutRoute(
      makeRequest('/api/auth/logout', { method: 'POST', cookie: cookieHeader(sessionId) }),
    )) as NextResponse;
    expect(res.status).toBe(200);
    expect(sessionCookieOf(res)?.value).toBe('');
    expect(sessionCookieOf(res)?.maxAge).toBe(0);

    // Logging out again succeeds rather than erroring.
    const again = (await logoutRoute(
      makeRequest('/api/auth/logout', { method: 'POST', cookie: cookieHeader(sessionId) }),
    )) as NextResponse;
    expect(again.status).toBe(200);
  });

  it('14. revokes the session server-side, so a replayed cookie no longer works', async () => {
    const { sessionId } = await registerUser();

    await logoutRoute(
      makeRequest('/api/auth/logout', { method: 'POST', cookie: cookieHeader(sessionId) }),
    );

    // The row is gone: revocation does not depend on the browser cooperating.
    expect(await db.session.findUnique({ where: { id: sessionId } })).toBeNull();

    // Replaying the exact cookie the client still holds is refused.
    const replay = (await sessionRoute(
      makeRequest('/api/auth/session', { cookie: cookieHeader(sessionId) }),
    )) as NextResponse;
    expect((await replay.json()).data.authenticated).toBe(false);
  });

  it('17. rejects an expired session and deletes the stale row', async () => {
    const { userId, sessionId } = await registerUser();

    await db.session.update({
      where: { id: sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await validateSession(sessionId)).toBeNull();
    expect(await db.session.findUnique({ where: { id: sessionId } })).toBeNull();

    const res = (await sessionRoute(
      makeRequest('/api/auth/session', { cookie: cookieHeader(sessionId) }),
    )) as NextResponse;
    expect((await res.json()).data.authenticated).toBe(false);

    // The account itself is untouched — only the session expired.
    expect(await db.user.findUnique({ where: { id: userId } })).not.toBeNull();
  });

  it('18. refuses a revoked session on a protected endpoint', async () => {
    const { sessionId } = await registerUser();
    await revokeSession(sessionId);

    const res = (await setPrimaryPhotoRoute(
      makeRequest('/api/profile/photos/primary', {
        method: 'PUT',
        cookie: cookieHeader(sessionId),
        body: { photoId: 'anything' },
      }),
    )) as NextResponse;

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 15–16, 19–20. Protected access and isolation
// ─────────────────────────────────────────────────────────────────────────

describe('protected endpoints and isolation', () => {
  /** Creates a profile with one photo for an existing user. */
  async function seedPhoto(userId: string) {
    const profile = await db.profile.create({
      data: {
        userId,
        displayName: 'M4 Test',
        birthDate: new Date('1995-01-01'),
        gender: 'unspecified',
      },
    });
    const photo = await db.photo.create({
      data: { profileId: profile.id, url: '/uploads/m4-test.jpg', order: 0 },
    });
    return { profileId: profile.id, photoId: photo.id };
  }

  it('15. refuses a protected endpoint with no session', async () => {
    const res = (await setPrimaryPhotoRoute(
      makeRequest('/api/profile/photos/primary', {
        method: 'PUT',
        body: { photoId: 'anything' },
      }),
    )) as NextResponse;

    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHENTICATED');
  });

  it('16. allows a protected endpoint with a valid session', async () => {
    const { userId, sessionId } = await registerUser();
    const { photoId } = await seedPhoto(userId);

    const res = (await setPrimaryPhotoRoute(
      makeRequest('/api/profile/photos/primary', {
        method: 'PUT',
        cookie: cookieHeader(sessionId),
        body: { photoId },
      }),
    )) as NextResponse;

    expect(res.status).toBe(200);
    const updated = await db.photo.findUniqueOrThrow({ where: { id: photoId } });
    expect(updated.isPrimary).toBe(true);
  });

  it('19. isolates concurrent accounts — each session resolves only its own user', async () => {
    const alice = await registerUser();
    const bob = await registerUser();

    expect(alice.userId).not.toBe(bob.userId);
    expect(alice.sessionId).not.toBe(bob.sessionId);

    const aliceView = await (
      (await sessionRoute(
        makeRequest('/api/auth/session', { cookie: cookieHeader(alice.sessionId) }),
      )) as NextResponse
    ).json();
    const bobView = await (
      (await sessionRoute(
        makeRequest('/api/auth/session', { cookie: cookieHeader(bob.sessionId) }),
      )) as NextResponse
    ).json();

    expect(aliceView.data.user.id).toBe(alice.userId);
    expect(bobView.data.user.id).toBe(bob.userId);

    // Revoking one session leaves the other working.
    await revokeSession(alice.sessionId);
    expect(await validateSession(alice.sessionId)).toBeNull();
    expect(await validateSession(bob.sessionId)).not.toBeNull();
  });

  it('20a. requireOwnership distinguishes unauthenticated, not-the-owner and owner', async () => {
    const owner = await registerUser();
    const attacker = await registerUser();
    const target = '/api/profile/photos/primary';

    const anonymous = await requireOwnership(makeRequest(target), owner.userId);
    expect(anonymous).toBeInstanceOf(NextResponse);
    expect((anonymous as NextResponse).status).toBe(401);

    const wrongUser = await requireOwnership(
      makeRequest(target, { cookie: cookieHeader(attacker.sessionId) }),
      owner.userId,
    );
    expect(wrongUser).toBeInstanceOf(NextResponse);
    // 403, not 401: authenticated, but not entitled to this resource.
    expect((wrongUser as NextResponse).status).toBe(403);

    const rightUser = await requireOwnership(
      makeRequest(target, { cookie: cookieHeader(owner.sessionId) }),
      owner.userId,
    );
    expect(rightUser).not.toBeInstanceOf(NextResponse);
    expect((rightUser as { userId: string }).userId).toBe(owner.userId);
  });

  it("20. refuses to act on another account's resource, even with a valid session", async () => {
    const owner = await registerUser();
    const attacker = await registerUser();
    const { photoId } = await seedPhoto(owner.userId);

    const res = (await setPrimaryPhotoRoute(
      makeRequest('/api/profile/photos/primary', {
        method: 'PUT',
        cookie: cookieHeader(attacker.sessionId),
        body: { photoId, userId: owner.userId }, // client-asserted id is ignored
      }),
    )) as NextResponse;

    expect(res.status).toBe(403);
    const unchanged = await db.photo.findUniqueOrThrow({ where: { id: photoId } });
    expect(unchanged.isPrimary).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 21, 23, 25. Transport boundaries
// ─────────────────────────────────────────────────────────────────────────

describe('transport boundaries', () => {
  it('21. never returns session material in a response body', async () => {
    const email = uniqueEmail();

    const register = (await registerRoute(
      makeRequest('/api/auth/register', { method: 'POST', body: { email, password: VALID_PASSWORD } }),
    )) as NextResponse;
    const registerSid = sessionCookieOf(register)!.value;
    const registerBody = JSON.stringify(await register.json());

    const login = (await loginRoute(
      makeRequest('/api/auth/login', { method: 'POST', body: { email, password: VALID_PASSWORD } }),
    )) as NextResponse;
    const loginSid = sessionCookieOf(login)!.value;
    const loginBody = JSON.stringify(await login.json());

    const session = (await sessionRoute(
      makeRequest('/api/auth/session', { cookie: cookieHeader(loginSid) }),
    )) as NextResponse;
    const sessionBody = JSON.stringify(await session.json());

    for (const [name, body, sid] of [
      ['register', registerBody, registerSid],
      ['login', loginBody, loginSid],
      ['session', sessionBody, loginSid],
    ] as const) {
      expect(body, `${name} body leaked the session id`).not.toContain(sid);
      // No token-shaped field of any name.
      expect(body).not.toMatch(/"(token|accessToken|sessionToken|sessionId|jwt)"\s*:/i);
      // And never the credential material.
      expect(body).not.toContain(VALID_PASSWORD);
      expect(body).not.toContain('passwordHash');
    }
  });

  it('23. does not honour Bearer authentication, even with a genuine session id', async () => {
    const { sessionId } = await registerUser();

    // The exact value that authenticates in a cookie must fail in a header.
    const viaHeader = (await setPrimaryPhotoRoute(
      makeRequest('/api/profile/photos/primary', {
        method: 'PUT',
        headers: { authorization: `Bearer ${sessionId}` },
        body: { photoId: 'anything' },
      }),
    )) as NextResponse;
    expect(viaHeader.status).toBe(401);

    const sessionViaHeader = (await sessionRoute(
      makeRequest('/api/auth/session', { headers: { authorization: `Bearer ${sessionId}` } }),
    )) as NextResponse;
    expect((await sessionViaHeader.json()).data.authenticated).toBe(false);
  });

  it('25. never writes the session id or password to the logs', async () => {
    const email = uniqueEmail();
    const written: string[] = [];
    const record = (...args: unknown[]) => {
      written.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    };

    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(record),
    );

    let sessionId: string;
    try {
      const register = (await registerRoute(
        makeRequest('/api/auth/register', {
          method: 'POST',
          body: { email, password: VALID_PASSWORD },
        }),
      )) as NextResponse;
      sessionId = sessionCookieOf(register)!.value;

      await sessionRoute(makeRequest('/api/auth/session', { cookie: cookieHeader(sessionId) }));
      // Deliberately trigger the protected route's error path too.
      await setPrimaryPhotoRoute(
        makeRequest('/api/profile/photos/primary', {
          method: 'PUT',
          cookie: cookieHeader(sessionId),
          body: { photoId: 'does-not-exist' },
        }),
      );
      await logoutRoute(
        makeRequest('/api/auth/logout', { method: 'POST', cookie: cookieHeader(sessionId) }),
      );
    } finally {
      spies.forEach((s) => s.mockRestore());
    }

    const logged = written.join('\n');
    expect(logged).not.toContain(sessionId!);
    expect(logged).not.toContain(VALID_PASSWORD);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 26. Rate limiting
// ─────────────────────────────────────────────────────────────────────────

describe('rate limiting', () => {
  it('26. throttles repeated login attempts from one client and reports Retry-After', async () => {
    const { email } = await registerUser();
    const ip = '198.51.100.7';

    let throttled: NextResponse | null = null;
    for (let i = 0; i < 12; i++) {
      const res = (await loginRoute(
        makeRequest('/api/auth/login', {
          method: 'POST',
          ip,
          body: { email, password: 'wrong-password' },
        }),
      )) as NextResponse;
      if (res.status === 429) {
        throttled = res;
        break;
      }
    }

    expect(throttled, 'login was never rate limited').not.toBeNull();
    expect(throttled!.headers.get('Retry-After')).toBeTruthy();
    expect((await throttled!.json()).error.code).toBe('RATE_LIMITED');
    // bcrypt at cost 12 is deliberately slow, and this test pays it per attempt.
  }, 30_000);

  it('26b. throttles repeated registrations from one client', async () => {
    const ip = '198.51.100.8';

    let throttled = false;
    for (let i = 0; i < 8; i++) {
      const res = (await registerRoute(
        makeRequest('/api/auth/register', {
          method: 'POST',
          ip,
          body: { email: uniqueEmail(), password: VALID_PASSWORD },
        }),
      )) as NextResponse;
      if (res.status === 429) {
        throttled = true;
        break;
      }
    }

    expect(throttled, 'registration was never rate limited').toBe(true);
  }, 30_000);

  it('26c. limits each client independently, so one client cannot lock out another', async () => {
    const { email } = await registerUser();

    for (let i = 0; i < 12; i++) {
      await loginRoute(
        makeRequest('/api/auth/login', {
          method: 'POST',
          ip: '198.51.100.9',
          body: { email, password: 'wrong-password' },
        }),
      );
    }

    const other = (await loginRoute(
      makeRequest('/api/auth/login', {
        method: 'POST',
        ip: '198.51.100.10',
        body: { email, password: VALID_PASSWORD },
      }),
    )) as NextResponse;

    expect(other.status).toBe(200);
  }, 30_000);
});
