import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionToken, revokeToken } from '@/lib/auth';

// POST /api/auth/logout - Clear the session and revoke the token
export async function POST(request: NextRequest) {
  // Revoke the Bearer token so it can no longer be used after logout
  // This fixes the bug where the Authorization header continued to work after logout
  const token = getSessionToken(request);
  if (token) {
    revokeToken(token);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out' });
  clearSessionCookie(response);
  return response;
}
