import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { ROUTES } from '../../src/lib/routes';

/**
 * Anera V2 — M5 routing and server-side route protection.
 *
 * Authority: docs/02-APP-FLOW.md §2 (`LOCKED (D37)` — the session check is a
 *            server concern), docs/TESTING-STRATEGY.md §4.2 #6 and #8,
 *            docs/ROADMAP.md Phase 1 §Frontend.
 *
 * The M4 suite proved the session mechanism. This one proves the routing built
 * on it: that the SERVER decides which route a request may see, that an
 * unauthenticated deep link never receives protected markup, and that a session
 * carries across genuinely separate URLs rather than across one page's state.
 *
 * Helpers are duplicated from authentication.spec.ts rather than extracted,
 * deliberately: that suite is part of the frozen M4 gate and is not worth
 * refactoring for tidiness.
 */

try {
  process.loadEnvFile();
} catch {
  // No .env file — CI supplies the environment.
}

const db = new PrismaClient();

const TEST_EMAIL_DOMAIN = 'm5-routing.invalid';
const PASSWORD = 'correct-horse-battery';

let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `m5-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

let clientCounter = 0;
async function assignOwnClientAddress(context: BrowserContext): Promise<void> {
  clientCounter += 1;
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': `198.51.100.${clientCounter % 254}` });
}

/** Markers that must never appear in a response an unauthenticated client gets. */
const PROTECTED_MARKERS = [/What.s your gender\?/, /Logout/, /ProfileEditor/];

async function registerThroughUi(page: Page, email: string): Promise<void> {
  await assignOwnClientAddress(page.context());
  await page.goto(ROUTES.signup);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Create Account' }).click(),
  ]);
  expect(response.status(), `registration failed: ${await response.text()}`).toBe(201);
  await page.waitForURL((url) => url.pathname !== ROUTES.signup, { timeout: 15_000 });
}

async function seedProfile(email: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  await db.profile.create({
    data: {
      userId: user.id,
      displayName: 'M5 Routing',
      birthDate: new Date('1995-01-01'),
      gender: 'unspecified',
    },
  });
}

test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
  await db.$disconnect();
});

test('protected routes exist and are server-rendered on demand', async ({ request }) => {
  // A guard that only ran in the browser would let the route be cached, and a
  // cached protected page is a leaked one.
  for (const path of [ROUTES.landing, ROUTES.profile, ROUTES.onboarding]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), `${path} did not redirect an anonymous request`).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
  }
});

test('an unauthenticated deep link never receives protected content', async ({ page, context }) => {
  // TESTING-STRATEGY.md §4.2 #8: "401 or redirect — never protected content,
  // never a partial render."
  //
  // This is a differential test. Asserting only that a redirect body lacks
  // protected markup would prove nothing — a 307 body is empty whatever the
  // server does. So it first establishes that an AUTHENTICATED request to the
  // same URL really does return that markup, which makes its absence
  // meaningful rather than incidental.

  // Positive control: signed in, /profile really does serve that markup.
  //
  // The response of a page navigation is used rather than `context.request`,
  // which cannot carry the session: the cookie is `Secure` and Playwright's
  // APIRequestContext treats http://127.0.0.1 as insecure, so it withholds it
  // and every such call would be silently anonymous. The browser has no such
  // problem. This is a harness detail, not an application one.
  const email = uniqueEmail();
  await registerThroughUi(page, email);
  await seedProfile(email);

  const authed = await page.goto(ROUTES.profile);
  expect(authed!.status()).toBe(200);
  expect(
    await authed!.text(),
    'positive control failed — the marker does not discriminate',
  ).toMatch(/Logout/);

  // Now the same URLs from a browser that has never signed in.
  const anonContext = await context.browser()!.newContext();
  const anonPage = await anonContext.newPage();
  try {
    for (const path of [ROUTES.profile, ROUTES.onboarding]) {
      // What actually arrives is the login document, and no protected markup
      // appears in it. A client-side guard would have shipped the page.
      const landed = await anonPage.goto(path);
      expect(anonPage.url(), `${path} did not land on login`).toContain(ROUTES.login);

      const body = await landed!.text();
      for (const marker of PROTECTED_MARKERS) {
        expect(body, `${path} leaked protected content to an anonymous client`).not.toMatch(marker);
      }

      // And the hop itself is a server redirect, not a rendered page.
      const raw = await anonContext.request.get(path, { maxRedirects: 0 });
      expect(raw.status(), `${path} should redirect`).toBeGreaterThanOrEqual(300);
      expect(raw.status()).toBeLessThan(400);
      expect(raw.headers()['location'], `${path} should redirect to login`).toContain(ROUTES.login);
    }
  } finally {
    await anonContext.close();
  }
});

test('the landing route sends an unauthenticated visitor to login', async ({ page }) => {
  await page.goto(ROUTES.landing);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`));
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('the landing route sends a signed-in visitor to onboarding, then to the app', async ({
  page,
}) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  // APP-FLOW §2.1, "onboarded?" — no profile yet.
  await page.goto(ROUTES.landing);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.onboarding}$`));

  await seedProfile(email);

  // Same URL, different answer, because the server re-reads the database.
  await page.goto(ROUTES.landing);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.profile}$`));
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
});

test('an authenticated visitor cannot sit on the auth routes', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  for (const path of [ROUTES.login, ROUTES.signup]) {
    await page.goto(path);
    await expect(page, `${path} should not render for a signed-in user`).not.toHaveURL(
      new RegExp(`${path}$`),
    );
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeHidden();
  }
});

test('an onboarded user is kept out of onboarding, and vice versa', async ({ page }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);

  // No profile: the app route sends them back to finish setting up.
  await page.goto(ROUTES.profile);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.onboarding}$`));

  await seedProfile(email);

  // With a profile: onboarding sends them on to the app.
  await page.goto(ROUTES.onboarding);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.profile}$`));
});

test('a session carries across separate routes and a new tab', async ({ page, context }) => {
  // TESTING-STRATEGY.md §4.2 #6. Before M5 these were one URL and one
  // component's state; now they are genuinely separate documents.
  const email = uniqueEmail();
  await registerThroughUi(page, email);
  await seedProfile(email);

  await page.goto(ROUTES.profile);
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

  await page.goto(ROUTES.landing);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.profile}$`));

  await page.reload();
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

  const secondTab = await context.newPage();
  try {
    await secondTab.goto(ROUTES.profile);
    await expect(secondTab.getByRole('button', { name: /logout/i })).toBeVisible();
  } finally {
    await secondTab.close();
  }
});

test('after logout a protected deep link is refused by the server', async ({ page, context }) => {
  const email = uniqueEmail();
  await registerThroughUi(page, email);
  await seedProfile(email);

  await page.goto(ROUTES.profile);
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15_000 });

  // The session row is gone, so the route is refused at the server — not
  // merely unrendered by a client that has forgotten who it was.
  const res = await context.request.get(ROUTES.profile, { maxRedirects: 0 });
  expect(res.status()).toBeGreaterThanOrEqual(300);
  expect(res.headers()['location']).toContain(ROUTES.login);

  const body = await res.text();
  for (const marker of PROTECTED_MARKERS) {
    expect(body).not.toMatch(marker);
  }
});
