import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie, readSessionIdFromRequest, revokeSession } from '@/lib/auth';

/**
 * POST /api/auth/logout — revoke the server session and clear the cookie.
 *
 * Authority: docs/AUTHENTICATION.md §4.3, docs/DECISIONS.md D37.
 *
 * Rebuilt for V2. Logout is a SERVER-SIDE revocation: the session row is
 * deleted, so the session cannot be used again even if the cookie is
 * replayed. Clearing browser state alone would not be logout.
 *
 * Idempotent — logging out twice succeeds.
 */
export async function POST(request: NextRequest) {
  const sessionId = readSessionIdFromRequest(request);
  if (sessionId) {
    await revokeSession(sessionId);
  }

  const response = NextResponse.json({ data: { success: true } });
  clearSessionCookie(response);
  return response;
}
