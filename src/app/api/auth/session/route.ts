import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { readSessionIdFromRequest, validateSession } from '@/lib/auth';

/**
 * GET /api/auth/session — report the current authentication state.
 *
 * Authority: docs/AUTHENTICATION.md §4.4, docs/API-SPECIFICATION.md §4,
 *            docs/DECISIONS.md D37.
 *
 * Rebuilt for V2. The state is derived entirely from the server-side
 * session. **Never returns a token** — the legacy implementation returned
 * the raw session token in the body so the client could store it, which
 * D37 prohibition 3 forbids.
 */
export async function GET(request: NextRequest) {
  const session = await validateSession(readSessionIdFromRequest(request));

  if (!session) {
    return NextResponse.json({ data: { authenticated: false } });
  }

  const [user, profile] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true } }),
    db.profile.findUnique({ where: { userId: session.userId }, select: { id: true } }),
  ]);

  if (!user) {
    // Session row outlived its user — treat as unauthenticated.
    return NextResponse.json({ data: { authenticated: false } });
  }

  return NextResponse.json({
    data: {
      authenticated: true,
      user: { id: user.id, email: user.email },
      needsOnboarding: profile === null,
    },
  });
}
