import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { GET as getPreferences, PATCH as updatePreferences } from '@/app/api/preferences/route';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { __resetRateLimits } from '@/lib/auth/rate-limit';
import { MAX_AGE_YEARS, MIN_AGE_YEARS } from '@/lib/profile/constants';

/**
 * Anera V2 — M6 preferences API.
 *
 * Authority: docs/API-SPECIFICATION.md §4, docs/02-APP-FLOW.md §2.9,
 *            docs/TESTING-STRATEGY.md §4.2 #19.
 *
 * Real PostgreSQL; persistence is never mocked (D40).
 */

let ipCounter = 0;
interface Init {
  method?: string;
  body?: unknown;
  cookie?: string;
}

function makeRequest(url: string, init: Init = {}): NextRequest {
  ipCounter += 1;
  const headers = new Headers({ 'x-forwarded-for': `198.51.100.${ipCounter % 254}` });
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const TEST_EMAIL_DOMAIN = 'm6-prefs.invalid';
let emailCounter = 0;

interface Account {
  userId: string;
  cookie: string;
}

async function newAccount(): Promise<Account> {
  emailCounter += 1;
  const email = `m6p-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
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

async function patch(account: Account, body: unknown) {
  return (await updatePreferences(
    makeRequest('/api/preferences', { method: 'PATCH', cookie: account.cookie, body }),
  )) as NextResponse;
}

async function get(account: Account) {
  return (await getPreferences(
    makeRequest('/api/preferences', { cookie: account.cookie }),
  )) as NextResponse;
}

async function cleanup() {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
}

beforeAll(cleanup);
afterAll(cleanup);
beforeEach(() => __resetRateLimits());

describe('authentication', () => {
  it('refuses both methods without a session', async () => {
    const read = (await getPreferences(makeRequest('/api/preferences'))) as NextResponse;
    expect(read.status).toBe(401);

    const write = (await updatePreferences(
      makeRequest('/api/preferences', { method: 'PATCH', body: { minAge: 25 } }),
    )) as NextResponse;
    expect(write.status).toBe(401);
  });

  it('refuses a revoked session', async () => {
    const account = await newAccount();
    await db.session.deleteMany({ where: { userId: account.userId } });
    expect((await get(account)).status).toBe(401);
  });
});

describe('reading and writing', () => {
  it('returns defaults before anything is stored, without creating a row', async () => {
    const account = await newAccount();
    const res = await get(account);

    expect(res.status).toBe(200);
    const { preferences } = (await res.json()).data;
    expect(preferences).toEqual({
      minAge: MIN_AGE_YEARS,
      maxAge: MAX_AGE_YEARS,
      genderPreference: '',
    });

    // A read is not a write.
    expect(await db.preferences.findUnique({ where: { userId: account.userId } })).toBeNull();
  });

  it('creates the row on first update and persists it', async () => {
    const account = await newAccount();
    const res = await patch(account, { minAge: 25, maxAge: 40, genderPreference: 'female' });

    expect(res.status).toBe(200);
    const { preferences } = (await res.json()).data;
    expect(preferences).toEqual({ minAge: 25, maxAge: 40, genderPreference: 'female' });

    const stored = await db.preferences.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored.minAge).toBe(25);
    expect(stored.maxAge).toBe(40);
  });

  it('applies a partial update without disturbing the rest', async () => {
    const account = await newAccount();
    await patch(account, { minAge: 25, maxAge: 40, genderPreference: 'female' });

    const res = await patch(account, { maxAge: 45 });
    const { preferences } = (await res.json()).data;

    expect(preferences).toEqual({ minAge: 25, maxAge: 45, genderPreference: 'female' });
  });

  it('reads back what was written', async () => {
    const account = await newAccount();
    await patch(account, { minAge: 30 });

    const { preferences } = (await (await get(account)).json()).data;
    expect(preferences.minAge).toBe(30);
  });

  it('does not expose maxDistanceKm', async () => {
    const account = await newAccount();
    await patch(account, { minAge: 25 });

    const { preferences } = (await (await get(account)).json()).data;
    expect(preferences).not.toHaveProperty('maxDistanceKm');

    // And the column is left null — no distance semantic is invented (OQ-B05).
    const stored = await db.preferences.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored.maxDistanceKm).toBeNull();
  });
});

describe('validation', () => {
  async function expectRejected(body: unknown, field: string) {
    const account = await newAccount();
    const res = await patch(account, body);

    expect(res.status, `expected 400 for ${field}`).toBe(400);
    const parsed = await res.json();
    expect(parsed.error.code).toBe('VALIDATION_FAILED');
    expect(parsed.error.details.some((d: { field: string }) => d.field === field)).toBe(true);
  }

  it(`refuses a minimum age below ${MIN_AGE_YEARS}`, async () => {
    // A safety boundary, not a preference: the platform is 18+.
    await expectRejected({ minAge: 17 }, 'minAge');
    await expectRejected({ minAge: 0 }, 'minAge');
    await expectRejected({ minAge: -5 }, 'minAge');
  });

  it('refuses ages above the upper bound', async () => {
    await expectRejected({ maxAge: MAX_AGE_YEARS + 1 }, 'maxAge');
  });

  it('refuses non-integer and non-numeric ages', async () => {
    await expectRejected({ minAge: 25.5 }, 'minAge');
    await expectRejected({ minAge: '25' }, 'minAge');
    await expectRejected({ minAge: null }, 'minAge');
  });

  it('refuses an inverted range', async () => {
    await expectRejected({ minAge: 40, maxAge: 30 }, 'minAge');
  });

  it('refuses a one-sided change that inverts the stored range', async () => {
    const account = await newAccount();
    await patch(account, { minAge: 25, maxAge: 30 });

    // maxAge is not in this request, so the check must consult the stored value.
    const res = await patch(account, { minAge: 35 });
    expect(res.status).toBe(400);

    const stored = await db.preferences.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(stored.minAge).toBe(25);
  });

  it('refuses a distance preference outright', async () => {
    await expectRejected({ maxDistanceKm: 50 }, 'maxDistanceKm');
  });

  it('does not police the gender preference value set', async () => {
    // OQ-B07 is unresolved; rejecting an unfamiliar value would ratify it.
    const account = await newAccount();
    const res = await patch(account, { genderPreference: 'everyone' });
    expect(res.status).toBe(200);
  });

  it('refuses an empty or non-object body', async () => {
    const account = await newAccount();
    for (const body of [{}, null, [], 'text']) {
      expect((await patch(account, body)).status).toBe(400);
    }
  });

  it('never leaks internals in an error', async () => {
    const account = await newAccount();
    const res = await patch(account, { minAge: 5 });
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toMatch(/prisma|SELECT |INSERT |node_modules|\/src\//i);
  });
});

describe('ownership isolation', () => {
  it('keeps each account to its own preferences', async () => {
    const alice = await newAccount();
    const bob = await newAccount();

    await patch(alice, { minAge: 25, maxAge: 35 });
    await patch(bob, { minAge: 40, maxAge: 50 });

    const aliceView = (await (await get(alice)).json()).data.preferences;
    const bobView = (await (await get(bob)).json()).data.preferences;

    expect(aliceView.minAge).toBe(25);
    expect(bobView.minAge).toBe(40);
  });

  it('ignores a userId claimed in the body', async () => {
    const alice = await newAccount();
    const bob = await newAccount();
    await patch(alice, { minAge: 25 });

    await patch(bob, { userId: alice.userId, minAge: 45 });

    const aliceStored = await db.preferences.findUniqueOrThrow({
      where: { userId: alice.userId },
    });
    const bobStored = await db.preferences.findUniqueOrThrow({ where: { userId: bob.userId } });
    expect(aliceStored.minAge).toBe(25);
    expect(bobStored.minAge).toBe(45);
  });

  it('cascades away with the account', async () => {
    const account = await newAccount();
    await patch(account, { minAge: 25 });

    await db.user.delete({ where: { id: account.userId } });
    expect(await db.preferences.findUnique({ where: { userId: account.userId } })).toBeNull();
  });
});
