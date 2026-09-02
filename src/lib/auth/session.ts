import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  SESSION_COOKIE_NAME,
  SESSION_ID_BYTES,
  SESSION_RENEW_AFTER_MS,
  SESSION_TTL_MS,
} from './config';

/**
 * Anera V2 — server-side session management.
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md §3.
 *
 * THE COOKIE IS THE SINGLE SOURCE OF TRUTH. It carries only an opaque
 * session id; validity is decided here, against PostgreSQL, on every
 * protected request.
 *
 * PROHIBITED and absent by construction (D37 §2): no localStorage token,
 * no Bearer transport, no JWT, no signed stateless token, no `authReady`,
 * no `waitForAuth`, no hydration gate. The session id is never returned in
 * a response body and never logged.
 */

/** Opaque, cryptographically random session identifier. */
function generateSessionId(): string {
  return randomBytes(SESSION_ID_BYTES).toString('base64url');
}

export interface SessionUser {
  userId: string;
  sessionId: string;
}

/**
 * Creates a session row and returns its id.
 * The caller is responsible for placing it in the cookie — it must never
 * reach a response body.
 */
export async function createSession(userId: string): Promise<string> {
  const id = generateSessionId();
  await db.session.create({
    data: {
      id,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      lastUsedAt: new Date(),
    },
  });
  return id;
}

/**
 * Resolves the session id to a user, or null.
 *
 * An expired session is deleted on sight so revocation and expiry converge
 * on the same mechanism — a missing row.
 */
export async function validateSession(sessionId: string | undefined): Promise<SessionUser | null> {
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, expiresAt: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {
      // Already gone — concurrent logout or cleanup.
    });
    return null;
  }

  // Sliding renewal. PROVISIONAL — OQ-AUTH-01.
  const remaining = session.expiresAt.getTime() - Date.now();
  if (SESSION_TTL_MS - remaining > SESSION_RENEW_AFTER_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS), lastUsedAt: new Date() },
      })
      .catch(() => {
        // Non-fatal: the session is still valid for this request.
      });
  }

  return { userId: session.userId, sessionId: session.id };
}

/** Revokes one session. Takes effect immediately — the row is gone. */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.delete({ where: { id: sessionId } }).catch(() => {
    // Idempotent: logging out twice succeeds.
  });
}

/** Revokes every session for a user ("sign out everywhere"; password reset). */
export async function revokeAllSessions(userId: string): Promise<number> {
  const { count } = await db.session.deleteMany({ where: { userId } });
  return count;
}

// ─── Cookie transport ────────────────────────────────────────────────────
//
// Attributes are LOCKED by AUTHENTICATION.md §3.2. `secure` is enabled
// outside development only because plain-HTTP localhost would otherwise
// drop the cookie; every deployed environment is HTTPS.

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Sets the session cookie on a route-handler response. */
export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, cookieOptions(SESSION_TTL_MS / 1000));
}

/** Clears the session cookie on a route-handler response. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions(0));
}

/** Reads the session id from a request. Cookie only — no header fallback. */
export function readSessionIdFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

/** Reads the session id in a Server Component / Server Action context. */
export async function readSessionIdFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Resolves the current user on the server, for Server Components.
 * This is the server-authoritative read used by protected pages.
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  return validateSession(await readSessionIdFromCookies());
}
