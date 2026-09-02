import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

/**
 * Anera V2 — M4 authentication end-to-end tests.
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md,
 *            docs/TESTING-STRATEGY.md §4.
 *
 * These run a real browser against a real server and a real PostgreSQL
 * database. Their purpose is not to re-check the route logic the Vitest
 * suite covers, but to prove the property that only a browser can show:
 * that authentication survives because the SERVER remembers the session,
 * not because the page kept a token.
 */

try {
  process.loadEnvFile();
} catch {
  // No .env file — CI supplies the environment.
}

const db = new PrismaClient();

const TEST_EMAIL_DOMAIN = 'm4-e2e.invalid';
const PASSWORD = 'correct-horse-battery';

let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `m4-e2e-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

const SESSION_COOKIE = 'anera_sid';

/**
 * Gives a browser context its own client address.
 *
 * The authentication endpoints are rate limited per client (SECURITY-
 * GUIDELINES.md §7). A browser sends no forwarding header, so every test
 * would otherwise share one bucket and the suite would throttle itself after
 * a handful of registrations. Assigning an address per context models what
 * the limiter is actually for — distinct clients — instead of raising the
 * limit, which would weaken the thing under test.
 */
let clientCounter = 0;
async function assignOwnClientAddress(context: BrowserContext): Promise<void> {
  clientCounter += 1;
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${clientCounter % 254}` });
}

/** The authenticated shell: onboarding for a new account, the app for a complete one. */
function authenticatedView(page: Page) {
  return page
    .getByRole('heading', { name: /What.s your gender\?/ })
    .or(page.getByRole('button', { name: /logout/i }));
}

function signInButton(page: Page) {
  return page.getByRole('button', { name: 'Sign In' });
}

/** Registers through the real UI and waits for the authenticated view. */
async function registerThroughUi(page: Page, email: string): Promise<void> {
  await assignOwnClientAddress(page.context());
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  // Wait for the request itself, not for the button caption to change: the
  // caption flips to "Creating account..." the instant it is clicked, so a
  // negative assertion would pass while the request was still in flight.
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Create Account' }).click(),
  ]);
  expect(response.status(), `registration failed: ${await response.text()}`).toBe(201);

  await expect(authenticatedView(page)).toBeVisible({ timeout: 15_000 });
}

async function loginThroughUi(page: Page, email: string): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
    signInButton(page).click(),
  ]);
  expect(response.status(), `login failed: ${await response.text()}`).toBe(200);

  await expect(authenticatedView(page)).toBeVisible({ timeout: 15_000 });
}

/** True when the server — not the page — says this browser is authenticated. */
async function serverSaysAuthenticated(page: Page): Promise<boolean> {
  const body = await page.evaluate(async () => {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    return res.json();
  });
  return body.data.authenticated === true;
}

/** Gives a user a profile so the app renders past onboarding. */
async function seedProfile(email: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  await db.profile.create({
    data: {
      userId: user.id,
      displayName: 'M4 E2E',
      birthDate: new Date('1995-01-01'),
      gender: 'unspecified',
    },
  });
}

test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
  await db.$disconnect();
});

test('registration signs the new account in', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  expect(await serverSaysAuthenticated(page)).toBe(true);
  const stored = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  expect(stored).not.toBeNull();
});

test('login signs an existing account in', async ({ page, context }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  // Start from a genuinely clean browser state.
  await context.clearCookies();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  await loginThroughUi(page, email);
  expect(await serverSaysAuthenticated(page)).toBe(true);
});

test('login with a wrong password is refused and grants no session', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);
  await page.context().clearCookies();

  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('not-the-password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Next.js adds its own role="alert" route announcer, so scope to the form's.
  await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText(
    'Invalid email or password',
  );
  expect(await serverSaysAuthenticated(page)).toBe(false);
  expect((await page.context().cookies()).find((c) => c.name === SESSION_COOKIE)).toBeUndefined();
});

test('the session cookie is HttpOnly and no token is written to client storage', async ({
  page,
  context,
}) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
  expect(cookie, 'no session cookie was set').toBeDefined();
  expect(cookie!.httpOnly).toBe(true);
  expect(cookie!.sameSite).toBe('Lax');
  expect(cookie!.path).toBe('/');

  // Script cannot see the cookie...
  expect(await page.evaluate(() => document.cookie)).not.toContain(SESSION_COOKIE);

  // ...and nothing token-shaped was stashed anywhere script CAN see.
  const clientState = await page.evaluate(() => ({
    local: Object.entries({ ...localStorage }),
    session: Object.entries({ ...sessionStorage }),
  }));

  const serialised = JSON.stringify(clientState);
  expect(serialised).not.toContain(cookie!.value);
  expect(serialised).not.toMatch(/token|bearer|jwt|passwordHash/i);
});

test('authentication survives a refresh because the server session survives', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  // Destroy every piece of state the page could have been relying on, short
  // of the HTTP-only cookie the script cannot touch. If the app still comes
  // back authenticated, the server is what remembered.
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload();
  await expect(authenticatedView(page)).toBeVisible({ timeout: 15_000 });
  expect(await serverSaysAuthenticated(page)).toBe(true);
});

test('authentication survives navigation away and back', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  await page.goto('/does-not-exist');
  await page.goto('/');

  await expect(authenticatedView(page)).toBeVisible({ timeout: 15_000 });
  expect(await serverSaysAuthenticated(page)).toBe(true);
});

test('deleting the session row signs the browser out, cookie unchanged', async ({
  page,
  context,
}) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  const before = (await context.cookies()).find((c) => c.name === SESSION_COOKIE)!;

  // Revoke server-side only. The browser is never told.
  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  await db.session.deleteMany({ where: { userId: user.id } });

  expect(await serverSaysAuthenticated(page)).toBe(false);

  // The cookie the browser holds is byte-for-byte the one that worked a
  // moment ago — it simply no longer means anything.
  const after = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
  expect(after?.value).toBe(before.value);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });
});

test('logout ends the session and access is refused afterwards', async ({ page, context }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);
  await seedProfile(email);

  // Reload so the app renders the authenticated shell rather than onboarding.
  await page.reload();
  const logout = page.getByRole('button', { name: /logout/i });
  await expect(logout).toBeVisible({ timeout: 15_000 });

  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  expect(await db.session.count({ where: { userId: user.id } })).toBeGreaterThan(0);

  await logout.click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });

  // Logout is a server-side revocation, not a cleared client flag.
  expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
  expect(await serverSaysAuthenticated(page)).toBe(false);

  // And it stays that way across a reload and a new tab in the same browser.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });

  const secondTab = await context.newPage();
  await secondTab.goto('/');
  await expect(secondTab.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });
  await secondTab.close();
});

test('an unauthenticated browser is refused by protected endpoints', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  const status = await page.evaluate(async () => {
    const res = await fetch('/api/profile/photos/primary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: 'anything' }),
      credentials: 'include',
    });
    return res.status;
  });

  expect(status).toBe(401);
  expect(await serverSaysAuthenticated(page)).toBe(false);
});

test('two browser contexts hold independent, isolated sessions', async ({ browser }) => {
  const contexts: BrowserContext[] = [await browser.newContext(), await browser.newContext()];
  const [alicePage, bobPage] = await Promise.all(contexts.map((c) => c.newPage()));
  const aliceEmail = uniqueEmail();
  const bobEmail = uniqueEmail();

  try {
    await registerThroughUi(alicePage, aliceEmail);
    await registerThroughUi(bobPage, bobEmail);

    const identityOf = async (page: Page) =>
      (
        await page.evaluate(async () => {
          const res = await fetch('/api/auth/session', { credentials: 'include' });
          return res.json();
        })
      ).data.user.email;

    expect(await identityOf(alicePage)).toBe(aliceEmail.toLowerCase());
    expect(await identityOf(bobPage)).toBe(bobEmail.toLowerCase());

    const aliceCookie = (await contexts[0].cookies()).find((c) => c.name === SESSION_COOKIE)!;
    const bobCookie = (await contexts[1].cookies()).find((c) => c.name === SESSION_COOKIE)!;
    expect(aliceCookie.value).not.toBe(bobCookie.value);

    // Revoking one account's sessions leaves the other signed in.
    const alice = await db.user.findUniqueOrThrow({ where: { email: aliceEmail.toLowerCase() } });
    await db.session.deleteMany({ where: { userId: alice.id } });

    expect(await serverSaysAuthenticated(alicePage)).toBe(false);
    expect(await serverSaysAuthenticated(bobPage)).toBe(true);
    expect(await identityOf(bobPage)).toBe(bobEmail.toLowerCase());
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
