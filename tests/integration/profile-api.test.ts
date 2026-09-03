import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import {
  GET as getProfile,
  POST as createProfile,
  PATCH as updateProfile,
} from '@/app/api/profile/route';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { __resetRateLimits } from '@/lib/auth/rate-limit';
import { MIN_AGE_YEARS } from '@/lib/profile/constants';

/**
 * Anera V2 — M6 profile API.
 *
 * Authority: docs/API-SPECIFICATION.md §4, docs/02-APP-FLOW.md §2.6/§2.7,
 *            docs/TESTING-STRATEGY.md §4.2 #16, #17, #20.
 *
 * Runs against the real PostgreSQL development database (D40 — persistence is
 * never mocked). Route handlers are invoked directly, which exercises the real
 * authentication and ownership path without a server process.
 */

let ipCounter = 0;
interface Init {
  method?: string;
  body?: unknown;
  cookie?: string;
}

function makeRequest(url: string, init: Init = {}): NextRequest {
  ipCounter += 1;
  const headers = new Headers({ 'x-forwarded-for': `203.0.113.${ipCounter % 254}` });
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const TEST_EMAIL_DOMAIN = 'm6-profile.invalid';
let emailCounter = 0;

interface Account {
  userId: string;
  cookie: string;
}

/** Registers through the real endpoint and returns a usable session cookie. */
async function newAccount(): Promise<Account> {
  emailCounter += 1;
  const email = `m6-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
  const res = (await registerRoute(
    makeRequest('/api/auth/register', {
      method: 'POST',
      body: { email, password: 'correct-horse-battery' },
    }),
  )) as NextResponse;
  expect(res.status).toBe(201);

  const body = await res.json();
  const sid = res.cookies.get(SESSION_COOKIE_NAME)!.value;
  return { userId: body.data.user.id, cookie: `${SESSION_COOKIE_NAME}=${sid}` };
}

/** A birth date exactly `years` years before today, in UTC. */
function birthDateFor(years: number, dayOffset = 0): string {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate() + dayOffset),
  );
  return d.toISOString().slice(0, 10);
}

const VALID = {
  displayName: 'Ada Lovelace',
  birthDate: birthDateFor(30),
  gender: 'female',
  bio: 'Mathematician.',
  city: 'London',
  intent: 'serious',
  interests: ['Music', 'Tech'],
};

async function create(account: Account, overrides: Record<string, unknown> = {}) {
  return (await createProfile(
    makeRequest('/api/profile', {
      method: 'POST',
      cookie: account.cookie,
      body: { ...VALID, ...overrides },
    }),
  )) as NextResponse;
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
}

beforeAll(cleanup);
afterAll(cleanup);
beforeEach(() => __resetRateLimits());

// ─────────────────────────────────────────────────────────────────────────
// Authentication boundary
// ─────────────────────────────────────────────────────────────────────────

describe('authentication', () => {
  it('refuses every method without a session', async () => {
    const cases: [string, NextResponse][] = [
      ['GET', (await getProfile(makeRequest('/api/profile'))) as NextResponse],
      [
        'POST',
        (await createProfile(
          makeRequest('/api/profile', { method: 'POST', body: VALID }),
        )) as NextResponse,
      ],
      [
        'PATCH',
        (await updateProfile(
          makeRequest('/api/profile', { method: 'PATCH', body: { bio: 'x' } }),
        )) as NextResponse,
      ],
    ];

    for (const [method, res] of cases) {
      expect(res.status, `${method} should be 401`).toBe(401);
      expect((await res.json()).error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('refuses a revoked session', async () => {
    const account = await newAccount();
    await db.session.deleteMany({ where: { userId: account.userId } });

    const res = (await getProfile(
      makeRequest('/api/profile', { cookie: account.cookie }),
    )) as NextResponse;
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Creation, retrieval, update
// ─────────────────────────────────────────────────────────────────────────

describe('profile lifecycle', () => {
  it('reports 404 before a profile exists', async () => {
    const account = await newAccount();
    const res = (await getProfile(
      makeRequest('/api/profile', { cookie: account.cookie }),
    )) as NextResponse;

    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('creates a profile, marks it onboarded, and persists interests', async () => {
    const account = await newAccount();
    const res = await create(account);

    expect(res.status).toBe(201);
    const { profile } = (await res.json()).data;
    expect(profile.displayName).toBe('Ada Lovelace');
    expect(profile.isOnboarded).toBe(true);
    expect(profile.interests.sort()).toEqual(['Music', 'Tech']);

    // Persisted, not merely echoed.
    const stored = await db.profile.findUniqueOrThrow({
      where: { userId: account.userId },
      include: { interests: true },
    });
    expect(stored.displayName).toBe('Ada Lovelace');
    expect(stored.interests).toHaveLength(2);
  });

  it('derives age instead of storing it', async () => {
    const account = await newAccount();
    const res = await create(account, { birthDate: birthDateFor(30) });
    const { profile } = (await res.json()).data;

    expect(profile.age).toBe(30);
    // The column does not exist; age is computed on read (BACKEND-SCHEMA §2.1).
    const stored = await db.profile.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored).not.toHaveProperty('age');
    expect(stored.birthDate.toISOString().slice(0, 10)).toBe(birthDateFor(30));
  });

  it('refuses a second profile with 409', async () => {
    const account = await newAccount();
    expect((await create(account)).status).toBe(201);

    const again = await create(account, { displayName: 'Someone Else' });
    expect(again.status).toBe(409);
    expect((await again.json()).error.code).toBe('PROFILE_EXISTS');

    const stored = await db.profile.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored.displayName).toBe('Ada Lovelace');
  });

  it('returns the caller their own profile', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await getProfile(
      makeRequest('/api/profile', { cookie: account.cookie }),
    )) as NextResponse;
    expect(res.status).toBe(200);
    const { profile } = (await res.json()).data;
    expect(profile.city).toBe('London');
    expect(profile.bio).toBe('Mathematician.');
  });

  it('applies a partial update and leaves untouched fields alone', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: account.cookie,
        body: { bio: 'Wrote the first algorithm.' },
      }),
    )) as NextResponse;

    expect(res.status).toBe(200);
    const { profile } = (await res.json()).data;
    expect(profile.bio).toBe('Wrote the first algorithm.');
    expect(profile.displayName).toBe('Ada Lovelace');
    expect(profile.city).toBe('London');
  });

  it('replaces the interest set on update rather than merging it', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: account.cookie,
        body: { interests: ['Hiking'] },
      }),
    )) as NextResponse;

    // Merging would make removal impossible.
    expect((await res.json()).data.profile.interests).toEqual(['Hiking']);
    const stored = await db.profileInterest.findMany({
      where: { profile: { userId: account.userId } },
    });
    expect(stored.map((i) => i.interest)).toEqual(['Hiking']);
  });

  it('allows clearing the interest set entirely', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: account.cookie,
        body: { interests: [] },
      }),
    )) as NextResponse;

    expect((await res.json()).data.profile.interests).toEqual([]);
  });

  it('refuses an update when no profile exists', async () => {
    const account = await newAccount();
    const res = (await updateProfile(
      makeRequest('/api/profile', { method: 'PATCH', cookie: account.cookie, body: { bio: 'x' } }),
    )) as NextResponse;

    expect(res.status).toBe(404);
  });

  it('survives a fresh client — the data is in PostgreSQL, not in a request', async () => {
    const account = await newAccount();
    await create(account);

    // A brand-new request object with only the cookie.
    const res = (await getProfile(
      makeRequest('/api/profile', { cookie: account.cookie }),
    )) as NextResponse;
    expect((await res.json()).data.profile.displayName).toBe('Ada Lovelace');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────

describe('validation', () => {
  async function expectRejected(overrides: Record<string, unknown>, field: string) {
    const account = await newAccount();
    const res = await create(account, overrides);

    expect(res.status, `expected 400 for ${field}`).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details.some((d: { field: string }) => d.field === field)).toBe(true);

    // Nothing was written.
    expect(await db.profile.findUnique({ where: { userId: account.userId } })).toBeNull();
  }

  it('requires a display name', async () => {
    await expectRejected({ displayName: '' }, 'displayName');
    await expectRejected({ displayName: '   ' }, 'displayName');
    await expectRejected({ displayName: undefined }, 'displayName');
  });

  it('requires a gender value but does not police the value set', async () => {
    await expectRejected({ gender: '' }, 'gender');

    // OQ-B07 / OQ-P01 are unresolved, so an unfamiliar value must NOT be
    // rejected — doing so would ratify an open question by implementation.
    const account = await newAccount();
    const res = await create(account, { gender: 'genderqueer', intent: 'networking' });
    expect(res.status).toBe(201);
  });

  it('enforces the documented length limits (R-10)', async () => {
    await expectRejected({ displayName: 'a'.repeat(51) }, 'displayName');
    await expectRejected({ bio: 'a'.repeat(501) }, 'bio');
    await expectRejected({ city: 'a'.repeat(101) }, 'city');
  });

  it('caps interests at ten and rejects non-text entries', async () => {
    await expectRejected(
      { interests: Array.from({ length: 11 }, (_, i) => `interest-${i}`) },
      'interests',
    );
    await expectRejected({ interests: [123] }, 'interests');
    await expectRejected({ interests: 'Music' }, 'interests');
  });

  it('de-duplicates interests rather than failing on the composite key', async () => {
    const account = await newAccount();
    const res = await create(account, { interests: ['Music', 'music', 'Music', ' Tech '] });

    expect(res.status).toBe(201);
    expect((await res.json()).data.profile.interests).toEqual(['Music', 'Tech']);
  });

  it('trims whitespace rather than storing it', async () => {
    const account = await newAccount();
    const res = await create(account, { displayName: '  Ada  ', city: '  London  ' });
    const { profile } = (await res.json()).data;

    expect(profile.displayName).toBe('Ada');
    expect(profile.city).toBe('London');
  });

  it('rejects a non-object body', async () => {
    const account = await newAccount();
    for (const body of [null, [], 'text', 42]) {
      const res = (await createProfile(
        makeRequest('/api/profile', { method: 'POST', cookie: account.cookie, body }),
      )) as NextResponse;
      expect(res.status).toBe(400);
    }
  });

  it('rejects an update that supplies nothing editable', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await updateProfile(
      makeRequest('/api/profile', { method: 'PATCH', cookie: account.cookie, body: {} }),
    )) as NextResponse;
    expect(res.status).toBe(400);
  });

  it('never leaks internals in an error', async () => {
    const account = await newAccount();
    const res = await create(account, { displayName: '' });
    const raw = JSON.stringify(await res.json());

    expect(raw).not.toMatch(/prisma|PrismaClient|SELECT |INSERT |at Object\.|\/src\/|node_modules/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Age floor — TESTING-STRATEGY.md §4.2 #20
// ─────────────────────────────────────────────────────────────────────────

describe('age floor', () => {
  it(`accepts someone who turns ${MIN_AGE_YEARS} today`, async () => {
    const account = await newAccount();
    const res = await create(account, { birthDate: birthDateFor(MIN_AGE_YEARS) });

    expect(res.status).toBe(201);
    expect((await res.json()).data.profile.age).toBe(MIN_AGE_YEARS);
  });

  it(`rejects someone one day short of ${MIN_AGE_YEARS}`, async () => {
    const account = await newAccount();
    // Born one day later than the boundary — still 17 today.
    const res = await create(account, { birthDate: birthDateFor(MIN_AGE_YEARS, 1) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.details.some((d: { field: string }) => d.field === 'birthDate')).toBe(true);
    expect(await db.profile.findUnique({ where: { userId: account.userId } })).toBeNull();
  });

  it('rejects a clearly under-age date', async () => {
    const account = await newAccount();
    expect((await create(account, { birthDate: birthDateFor(12) })).status).toBe(400);
  });

  it('rejects a future date of birth', async () => {
    const account = await newAccount();
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    expect((await create(account, { birthDate: future })).status).toBe(400);
  });

  it('rejects malformed and impossible dates', async () => {
    for (const value of [
      'not-a-date',
      '1990-13-01', // month 13
      '2001-02-30', // does not exist; Date.UTC would roll it into March
      '1990/01/01',
      '1990-1-1',
      '',
      12345,
      null,
    ]) {
      const account = await newAccount();
      const res = await create(account, { birthDate: value });
      expect(res.status, `expected 400 for birthDate=${JSON.stringify(value)}`).toBe(400);
    }
  });

  it('rejects an implausibly old date', async () => {
    const account = await newAccount();
    expect((await create(account, { birthDate: '1800-01-01' })).status).toBe(400);
  });

  it('cannot be bypassed through PATCH', async () => {
    const account = await newAccount();
    await create(account);

    const res = (await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: account.cookie,
        body: { birthDate: birthDateFor(10) },
      }),
    )) as NextResponse;

    expect(res.status).toBe(400);
    const stored = await db.profile.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored.birthDate.toISOString().slice(0, 10)).toBe(VALID.birthDate);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Ownership — TESTING-STRATEGY.md §4.2 #15, #17
// ─────────────────────────────────────────────────────────────────────────

describe('ownership isolation', () => {
  it('gives each account only its own profile', async () => {
    const alice = await newAccount();
    const bob = await newAccount();
    await create(alice, { displayName: 'Alice' });
    await create(bob, { displayName: 'Bob' });

    const aliceView = await (
      (await getProfile(makeRequest('/api/profile', { cookie: alice.cookie }))) as NextResponse
    ).json();
    const bobView = await (
      (await getProfile(makeRequest('/api/profile', { cookie: bob.cookie }))) as NextResponse
    ).json();

    expect(aliceView.data.profile.displayName).toBe('Alice');
    expect(bobView.data.profile.displayName).toBe('Bob');
  });

  it('ignores a userId supplied in the body — identity comes from the session', async () => {
    const alice = await newAccount();
    const bob = await newAccount();
    await create(alice, { displayName: 'Alice' });
    await create(bob, { displayName: 'Bob' });

    // Bob names Alice explicitly. The route has no parameter that could
    // address her, so the claim is inert rather than merely rejected.
    const res = (await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: bob.cookie,
        body: { userId: alice.userId, id: alice.userId, displayName: 'Hijacked' },
      }),
    )) as NextResponse;

    expect(res.status).toBe(200);

    const aliceStored = await db.profile.findUniqueOrThrow({ where: { userId: alice.userId } });
    const bobStored = await db.profile.findUniqueOrThrow({ where: { userId: bob.userId } });
    expect(aliceStored.displayName).toBe('Alice');
    expect(bobStored.displayName).toBe('Hijacked');
  });

  it("leaves one account's interests untouched when another edits theirs", async () => {
    const alice = await newAccount();
    const bob = await newAccount();
    await create(alice, { interests: ['Music', 'Art'] });
    await create(bob, { interests: ['Tech'] });

    await updateProfile(
      makeRequest('/api/profile', {
        method: 'PATCH',
        cookie: bob.cookie,
        body: { interests: ['Hiking'] },
      }),
    );

    const aliceInterests = await db.profileInterest.findMany({
      where: { profile: { userId: alice.userId } },
    });
    expect(aliceInterests.map((i) => i.interest).sort()).toEqual(['Art', 'Music']);
  });

  it('creates a profile for the session user, not for a claimed one', async () => {
    const alice = await newAccount();
    const bob = await newAccount();

    await create(bob, { userId: alice.userId, displayName: 'Bob' } as Record<string, unknown>);

    expect(await db.profile.findUnique({ where: { userId: alice.userId } })).toBeNull();
    expect(await db.profile.findUnique({ where: { userId: bob.userId } })).not.toBeNull();
  });
});
