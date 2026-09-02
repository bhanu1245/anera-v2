import { NextResponse, type NextRequest } from 'next/server';
import { readSessionIdFromRequest, validateSession, type SessionUser } from './session';

/**
 * Anera V2 — route-handler authorization guards.
 *
 * Authority: docs/DECISIONS.md D37, docs/SECURITY-GUIDELINES.md §3,
 *            docs/API-SPECIFICATION.md §2.
 *
 * This is the ONE authoritative server-side authentication check. There is
 * no second authority: the client cannot assert identity, and no header,
 * body or query parameter is consulted.
 */

/** Standard error envelope (API-SPECIFICATION.md §2). */
export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Requires an authenticated session.
 *
 * Returns the session on success, or a 401 response to return directly:
 *
 *   const auth = await requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId } = auth;
 *
 * The userId ALWAYS comes from the server session — never from the request
 * body, query, header or form data.
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await validateSession(readSessionIdFromRequest(request));
  if (!session) {
    // Generic: never reveals whether the session existed, expired or was revoked.
    return apiError(401, 'UNAUTHENTICATED', 'Authentication required.');
  }
  return session;
}

/**
 * Requires an authenticated session that owns the given resource.
 * Returns 401 when unauthenticated, 403 when authenticated but not the owner.
 */
export async function requireOwnership(
  request: NextRequest,
  resourceUserId: string,
): Promise<SessionUser | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.userId !== resourceUserId) {
    return apiError(403, 'FORBIDDEN', 'You do not have permission to access this resource.');
  }
  return auth;
}
