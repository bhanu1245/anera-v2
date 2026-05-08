import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getSessionToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/auth/session - Check current session status
export async function GET(request: NextRequest) {
  const userId = getCurrentUser(request);

  if (!userId) {
    return NextResponse.json({ authenticated: false });
  }

  // Also return the session token so the client can store it for
  // Authorization header fallback (cross-origin sandbox environments)
  const token = getSessionToken(request);

  // Check if user needs onboarding (has no profile)
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return NextResponse.json({
    authenticated: true,
    userId,
    token: token || undefined,
    needsOnboarding: !profile,
  });
}
