import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  RATE_LIMITS,
  apiError,
  clientKey,
  createSession,
  rateLimit,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';

/**
 * POST /api/auth/login — verify credentials and establish a session.
 *
 * Authority: docs/AUTHENTICATION.md §4.2, docs/API-SPECIFICATION.md §4,
 *            docs/DECISIONS.md D37.
 *
 * Rebuilt for V2 — not adapted from the legacy implementation.
 * Failure is always a single generic message so the endpoint cannot be used
 * to enumerate accounts.
 */

const GENERIC_FAILURE = 'Invalid email or password.';

/**
 * A real bcrypt hash (of a value no account uses) compared against when the
 * email is unknown, so a failed lookup costs the same time as a wrong
 * password. Without it the endpoint answers "no such user" measurably faster
 * than "wrong password", which enumerates accounts by timing even though the
 * response body is identical.
 */
const TIMING_EQUALISER_HASH = '$2b$12$LOTxCUWc46.w2Im39FON/.fgY/EVv77DrbFhd6rl8Tj34r6LgkpVG';

export async function POST(request: NextRequest) {
  const { limit, windowMs } = RATE_LIMITS.login;
  const rl = rateLimit(clientKey(request, 'login'), limit, windowMs);
  if (!rl.allowed) {
    const res = apiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
    res.headers.set('Retry-After', String(rl.retryAfter));
    return res;
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return apiError(400, 'INVALID_BODY', 'A JSON body is required.');
  }

  const { email, password } = body as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || typeof password !== 'string') {
    return apiError(400, 'VALIDATION_FAILED', 'Email and password are required.');
  }

  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, passwordHash: true, status: true },
  });

  // Same response — and the same cost — for unknown email and wrong password
  // (AUTHENTICATION.md §4.2). The comparison always runs.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? TIMING_EQUALISER_HASH);
  if (!user || !passwordMatches) {
    return apiError(401, 'INVALID_CREDENTIALS', GENERIC_FAILURE);
  }

  if (user.status !== 'active') {
    return apiError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
  }

  const sessionId = await createSession(user.id);

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const response = NextResponse.json({
    data: {
      user: { id: user.id, email: user.email },
      needsOnboarding: profile === null,
    },
  });
  setSessionCookie(response, sessionId);
  return response;
}
