import { defineConfig, devices } from '@playwright/test';

// Anera V2 — end-to-end test configuration.
// Authority: docs/DECISIONS.md D43 (Playwright locked), docs/TESTING-STRATEGY.md §4.
//
// D43: the E2E suite runs on every pull request AND before every phase freeze.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Phase 1 E2E asserts session/auth state; keep deterministic.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    // TESTING-STRATEGY.md §4.3 N1: tests assert no session token is written to
    // client storage, so storage state must never be pre-seeded here.
    storageState: undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // The app requires a reachable PostgreSQL instance (D36). CI provisions one
  // as a service container; locally, DATABASE_URL must point at a live database.
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
