import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── Configuration ───────────────────────────────────────────────────────────

const SESSION_COOKIE_NAME = 'anera_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'anera-dev-secret-change-in-production';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// ─── Token Blocklist (in-memory, for logout invalidation) ────────────────────
// When a user logs out, their token is added to this set so it can no longer
// be used for authentication. This prevents the bug where a Bearer token
// continues to work after logout (since HMAC tokens are stateless by default).
//
// NOTE: This is an in-memory blocklist — it resets on server restart.
// For production, use Redis or a database-backed blocklist.
const revokedTokens = new Set<string>();
const MAX_BLOCKLIST_SIZE = 10_000; // Prevent unbounded memory growth

/** Revoke a session token (called during logout) */
export function revokeToken(token: string): void {
  revokedTokens.add(token);
  // Evict oldest entries if blocklist grows too large
  if (revokedTokens.size > MAX_BLOCKLIST_SIZE) {
    const iter = revokedTokens.values();
    for (let i = 0; i < MAX_BLOCKLIST_SIZE / 2; i++) {
      iter.next();
    }
    // Delete the first half (oldest entries)
    const toDelete: string[] = [];
    const iter2 = revokedTokens.values();
    for (let i = 0; i < MAX_BLOCKLIST_SIZE / 2; i++) {
      const val = iter2.next().value;
      if (val) toDelete.push(val);
    }
    toDelete.forEach((t) => revokedTokens.delete(t));
  }
}

/** Check if a token has been revoked */
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  userId: string;
}

export interface AuthError {
  error: string;
  status: number;
}

// ─── Session Token Management ────────────────────────────────────────────────

/**
 * Create a signed session token from a userId.
 * Format: base64(userId):hex(hmac)
 */
export function createSessionToken(userId: string): string {
  const payload = Buffer.from(userId, 'utf-8').toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Validate a session token and extract the userId.
 * Returns null if the token is invalid or tampered with.
 */
export function validateSessionToken(token: string): string | null {
  try {
    const [payload, signature] = token.split(':');
    if (!payload || !signature) return null;

    // Verify signature (timing-safe comparison to prevent timing attacks)
    const expectedSignature = createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return null;

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    // Decode userId
    const userId = Buffer.from(payload, 'base64url').toString('utf-8');
    return userId;
  } catch {
    return null;
  }
}

// ─── Cookie Management ───────────────────────────────────────────────────────

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear the session cookie on a response
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Get the session token from a request.
 * Checks BOTH the cookie AND the Authorization header.
 *
 * Why both: In cross-origin preview/sandbox environments, the browser may
 * silently drop cookies. The client-side apiFetch() sends the token as an
 * Authorization header as a fallback, ensuring auth works in all contexts.
 */
export function getSessionToken(request: NextRequest): string | undefined {
  // 1. Try cookie first (standard flow)
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // 2. Fallback: Authorization header (cross-origin / sandbox)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

// ─── Auth Helpers (for API routes) ──────────────────────────────────────────

/**
 * Get the current authenticated user from the request.
 * Returns the userId if authenticated, or null if not.
 */
export function getCurrentUser(request: NextRequest): string | null {
  const token = getSessionToken(request);
  if (!token) return null;
  // Check if token was revoked (e.g., after logout)
  if (isTokenRevoked(token)) return null;
  return validateSessionToken(token);
}

/**
 * Require authentication. Returns the userId if authenticated,
 * or a NextResponse with 401 if not.
 * 
 * Usage in API routes:
 * ```
 * const auth = requireAuth(request);
 * if (auth instanceof NextResponse) return auth; // Return 401
 * const userId = auth; // userId string
 * ```
 */
export function requireAuth(request: NextRequest): string | NextResponse {
  const userId = getCurrentUser(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }
  return userId;
}

/**
 * Require that the authenticated user owns a resource.
 * Returns the userId if ownership is confirmed,
 * or a NextResponse with 403 if the user doesn't own the resource.
 * 
 * Usage:
 * ```
 * const auth = requireOwnership(request, resourceUserId);
 * if (auth instanceof NextResponse) return auth; // Return 401 or 403
 * const userId = auth; // userId string
 * ```
 */
export function requireOwnership(
  request: NextRequest,
  resourceUserId: string
): string | NextResponse {
  // First check authentication
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult; // 401

  // Then check ownership
  if (authResult !== resourceUserId) {
    return NextResponse.json(
      { error: 'You do not have permission to access this resource.' },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Type guard to check if the auth result is an error response
 */
export function isAuthError(result: string | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Require authentication and return typed result.
 * Throws a formatted response that can be returned from API routes.
 * 
 * Usage:
 * ```
 * const userId = await authenticate(request);
 * if (typeof userId !== 'string') return userId;
 * ```
 */
export function authenticate(request: NextRequest): string | NextResponse {
  return requireAuth(request);
}

/**
 * Authenticate and verify ownership in one call.
 */
export function authenticateOwner(
  request: NextRequest,
  resourceUserId: string
): string | NextResponse {
  return requireOwnership(request, resourceUserId);
}
