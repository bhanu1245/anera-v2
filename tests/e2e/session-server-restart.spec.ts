import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// D44 locks npm, so dependencies are flat under the project root.
const NEXT_CLI = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

/**
 * Anera V2 — session persistence across a server restart.
 *
 * Authority: docs/AUTHENTICATION.md §9 (required Phase 1 test),
 *            docs/DECISIONS.md D37, D40.
 *
 * This is the test the legacy architecture could not pass. The MVP kept its
 * revocation list — and therefore part of its session truth — in process
 * memory, so restarting the server silently changed who was signed in and
 * who was signed out (IG-70).
 *
 * The property under test is that the application server holds NO session
 * state: kill it, start a new process, replay the same cookie, and the
 * session is still valid because PostgreSQL is where it lives. A second
 * account is revoked while the server is down to show the reverse — the
 * new process honours a revocation it never witnessed.
 *
 * It runs its own server on a spare port so the shared Playwright server is
 * left alone.
 */

const PORT = 3411;
const BASE = `http://127.0.0.1:${PORT}`;
const TEST_EMAIL_DOMAIN = 'm4-restart.invalid';
const PASSWORD = 'correct-horse-battery';

const db = new PrismaClient();

let server: ChildProcess | null = null;

async function waitForServer(timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/auth/session`);
      if (res.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not start on ${BASE} within ${timeoutMs}ms`);
}

async function startServer(): Promise<void> {
  // Run the Next CLI with this process's own Node binary. Going through `npx`
  // would need a shell on Windows (Node refuses to spawn a .cmd without one),
  // and a shell concatenates arguments unescaped.
  server = spawn(process.execPath, [NEXT_CLI, 'start', '-p', String(PORT)], {
    stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT) },
  });
  await waitForServer();
}

async function stopServer(): Promise<void> {
  if (!server) return;
  const child = server;
  server = null;

  await new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    if (process.platform === 'win32') {
      // The npx wrapper spawns next as a grandchild; kill the whole tree.
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
    setTimeout(resolve, 15_000);
  });

  // Wait for the port to actually free up.
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/api/auth/session`);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

/** Registers over HTTP and returns the raw session cookie header. */
async function register(email: string, clientIp: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': clientIp },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(res.status, await res.text()).toBe(201);

  const setCookie = res.headers.get('set-cookie');
  expect(setCookie, 'no session cookie was issued').toBeTruthy();
  return setCookie!.split(';')[0]!; // "anera_sid=<id>"
}

async function authenticatedAs(cookie: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/auth/session`, { headers: { cookie } });
  const body = await res.json();
  return body.data.authenticated ? body.data.user.email : null;
}

test.describe.configure({ mode: 'serial' });

test.afterAll(async () => {
  await stopServer();
  await db.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });
  await db.$disconnect();
});

test('a session outlives the server process that created it', async () => {
  test.setTimeout(240_000);

  await startServer();

  const survivor = `restart-survivor-${Date.now()}@${TEST_EMAIL_DOMAIN}`;
  const revoked = `restart-revoked-${Date.now()}@${TEST_EMAIL_DOMAIN}`;

  const survivorCookie = await register(survivor, '203.0.113.201');
  const revokedCookie = await register(revoked, '203.0.113.202');

  expect(await authenticatedAs(survivorCookie)).toBe(survivor.toLowerCase());
  expect(await authenticatedAs(revokedCookie)).toBe(revoked.toLowerCase());

  // Stop the server completely. Any session state held in memory is now gone.
  await stopServer();

  // Revoke one account while nothing is running to observe it.
  const revokedUser = await db.user.findUniqueOrThrow({
    where: { email: revoked.toLowerCase() },
  });
  await db.session.deleteMany({ where: { userId: revokedUser.id } });

  // A brand-new process, with no knowledge of anything that happened above.
  await startServer();

  // The surviving session still works: nothing about it was in memory.
  expect(await authenticatedAs(survivorCookie)).toBe(survivor.toLowerCase());

  // And the revocation holds, even though this process never saw it happen —
  // the failure mode of an in-memory blocklist, which a restart would have
  // silently reset back to "signed in".
  expect(await authenticatedAs(revokedCookie)).toBeNull();
});
