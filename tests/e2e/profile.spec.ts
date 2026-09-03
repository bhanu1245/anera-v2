import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { ROUTES } from '../../src/lib/routes';

/**
 * Anera V2 — M6 profile journey.
 *
 * Authority: docs/02-APP-FLOW.md §2.6/§2.7/§2.9,
 *            docs/TESTING-STRATEGY.md §4.2 #16, #17, #19, #20.
 *
 * The first end-to-end run of the flow a real person takes: sign up, complete
 * onboarding, land in the app, and find the data still there afterwards.
 *
 * Photo upload (§2.6's third step, gate test #18) is absent — the upload
 * surface was removed in M6 pending a media-storage decision (`IG-18`).
 */

try {
  process.loadEnvFile();
} catch {
  // No .env file — CI supplies the environment.
}

const db = new PrismaClient();

const TEST_EMAIL_DOMAIN = 'm6-e2e.invalid';
const PASSWORD = 'correct-horse-battery';

let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `m6-e2e-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

let clientCounter = 0;
async function assignOwnClientAddress(context: BrowserContext): Promise<void> {
  clientCounter += 1;
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': `192.0.2.${clientCounter % 254}` });
}

/** A date of birth for someone of the given age, as the date input expects. */
function birthDateFor(years: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

async function signUp(page: Page, email: string): Promise<void> {
  await assignOwnClientAddress(page.context());
  await page.goto(ROUTES.signup);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Create Account' }).click(),
  ]);
  expect(response.status(), `signup failed: ${await response.text()}`).toBe(201);
  await page.waitForURL((u) => u.pathname !== ROUTES.signup, { timeout: 15_000 });
}

interface OnboardingAnswers {
  displayName?: string;
  birthDate?: string;
  city?: string;
  interests?: string[];
}

/** Walks the three onboarding steps. Returns the response to the final POST. */
async function completeOnboarding(page: Page, answers: OnboardingAnswers = {}) {
  const {
    displayName = 'Ada Lovelace',
    birthDate = birthDateFor(30),
    city = 'London',
    interests = ['Music', 'Tech', 'Art'],
  } = answers;

  await expect(page.getByRole('heading', { name: /What.s your gender\?/ })).toBeVisible();
  await page.getByRole('button', { name: 'Female', exact: true }).click();

  await expect(page.getByRole('heading', { name: /Tell us about yourself/ })).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill(displayName);
  await page.getByLabel('Date of birth').fill(birthDate);
  await page.getByLabel('City').fill(city);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: /Pick your interests/ })).toBeVisible();
  for (const interest of interests) {
    await page.getByRole('button', { name: interest, exact: true }).click();
  }

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/profile') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Finish' }).click(),
  ]);
  return response;
}

test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
  await db.$disconnect();
});

test('a new account can sign up, onboard, and reach the app', async ({ page }) => {
  const email = uniqueEmail();
  await signUp(page, email);

  // Registration lands on onboarding, because there is no profile yet.
  await expect(page).toHaveURL(new RegExp(`${ROUTES.onboarding}$`));

  const response = await completeOnboarding(page);
  expect(response.status(), `profile creation failed: ${await response.text()}`).toBe(201);

  // The server routes an onboarded user into the app.
  await page.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();

  // Persisted, not merely rendered.
  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  const stored = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: { interests: true },
  });
  expect(stored.displayName).toBe('Ada Lovelace');
  expect(stored.city).toBe('London');
  expect(stored.isOnboarded).toBe(true);
  expect(stored.interests.map((i) => i.interest).sort()).toEqual(['Art', 'Music', 'Tech']);
});

test('the profile survives a reload and a new tab', async ({ page, context }) => {
  const email = uniqueEmail();
  await signUp(page, email);
  await completeOnboarding(page, { displayName: 'Grace Hopper', city: 'New York' });
  await page.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Grace Hopper' })).toBeVisible();

  const secondTab = await context.newPage();
  try {
    await secondTab.goto(ROUTES.profile);
    await expect(secondTab.getByRole('heading', { name: 'Grace Hopper' })).toBeVisible();
  } finally {
    await secondTab.close();
  }
});

test('an edit is saved and still there after a reload', async ({ page }) => {
  const email = uniqueEmail();
  await signUp(page, email);
  await completeOnboarding(page);
  await page.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

  await page.getByLabel('Bio').fill('Wrote the first algorithm.');

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/profile') && r.request().method() === 'PATCH'),
    page.getByRole('button', { name: 'Save', exact: true }).click(),
  ]);
  expect(response.status(), `save failed: ${await response.text()}`).toBe(200);

  await page.reload();
  await expect(page.getByLabel('Bio')).toHaveValue('Wrote the first algorithm.');

  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  const stored = await db.profile.findUniqueOrThrow({ where: { userId: user.id } });
  expect(stored.bio).toBe('Wrote the first algorithm.');
});

test('the server refuses an under-age date of birth', async ({ page }) => {
  const email = uniqueEmail();
  await signUp(page, email);

  // Deliberately NOT tolerant of the client blocking this first. The server
  // owns the age floor (APP-FLOW.md §2.6), so the request must reach it and
  // must be refused there — a version of this test that accepted "the button
  // was disabled" would pass even if the server check were deleted.
  const response = await completeOnboarding(page, { birthDate: birthDateFor(15) });
  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.error.code).toBe('VALIDATION_FAILED');
  expect(body.error.details.some((d: { field: string }) => d.field === 'birthDate')).toBe(true);

  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  expect(await db.profile.findUnique({ where: { userId: user.id } })).toBeNull();
  await expect(page).not.toHaveURL(new RegExp(`${ROUTES.profile}$`));
});

test('preferences persist for their owner and nobody else', async ({ page, browser }) => {
  const email = uniqueEmail();
  await signUp(page, email);
  await completeOnboarding(page);
  await page.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

  // Preferences have no UI in M6; the endpoint is exercised from the page so
  // the browser's own session cookie carries the request.
  const saved = await page.evaluate(async () => {
    const res = await fetch('/api/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minAge: 28, maxAge: 42, genderPreference: 'female' }),
      credentials: 'include',
    });
    return { status: res.status, body: await res.json() };
  });
  expect(saved.status).toBe(200);
  expect(saved.body.data.preferences).toEqual({
    minAge: 28,
    maxAge: 42,
    genderPreference: 'female',
  });

  await page.reload();
  const readBack = await page.evaluate(async () => {
    const res = await fetch('/api/preferences', { credentials: 'include' });
    return res.json();
  });
  expect(readBack.data.preferences.minAge).toBe(28);

  // A different browser, a different account: unaffected, and defaulted.
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  try {
    await signUp(otherPage, uniqueEmail());
    const theirs = await otherPage.evaluate(async () => {
      const res = await fetch('/api/preferences', { credentials: 'include' });
      return res.json();
    });
    expect(theirs.data.preferences.minAge).toBe(18);
  } finally {
    await otherContext.close();
  }
});

test('after logout the profile is refused by the server', async ({ page, context }) => {
  const email = uniqueEmail();
  await signUp(page, email);
  await completeOnboarding(page);
  await page.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });

  // The page route redirects...
  const raw = await context.request.get(ROUTES.profile, { maxRedirects: 0 });
  expect(raw.status()).toBeGreaterThanOrEqual(300);
  expect(raw.headers()['location']).toContain(ROUTES.login);

  // ...and so does the API. This runs through the PAGE, not
  // `context.request`: the latter withholds the Secure cookie over http, so it
  // would be anonymous regardless and the assertion would prove nothing. From
  // the page, whatever cookie the browser still holds is actually sent — and
  // the session behind it is gone, so the answer is 401.
  const apiStatus = await page.evaluate(async () => {
    const res = await fetch('/api/profile', { credentials: 'include' });
    return res.status;
  });
  expect(apiStatus).toBe(401);
});

test('one account cannot read another account through the profile API', async ({ browser }) => {
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();
  const bobPage = await bobContext.newPage();

  try {
    await signUp(alicePage, uniqueEmail());
    await completeOnboarding(alicePage, { displayName: 'Alice Alpha' });
    await alicePage.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

    await signUp(bobPage, uniqueEmail());
    await completeOnboarding(bobPage, { displayName: 'Bob Beta' });
    await bobPage.waitForURL((u) => u.pathname === ROUTES.profile, { timeout: 15_000 });

    const read = (p: Page) =>
      p.evaluate(async () => {
        const res = await fetch('/api/profile', { credentials: 'include' });
        return res.json();
      });

    expect((await read(alicePage)).data.profile.displayName).toBe('Alice Alpha');
    expect((await read(bobPage)).data.profile.displayName).toBe('Bob Beta');

    // Bob names Alice as explicitly as the API allows. The endpoint has no
    // parameter that can address her, so it changes only his own row.
    await bobPage.evaluate(async () => {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'Hijacked' }),
        credentials: 'include',
      });
    });

    expect((await read(alicePage)).data.profile.displayName).toBe('Alice Alpha');
    expect((await read(bobPage)).data.profile.displayName).toBe('Hijacked');
  } finally {
    await aliceContext.close();
    await bobContext.close();
  }
});
