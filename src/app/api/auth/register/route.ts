import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  RATE_LIMITS,
  apiError,
  checkPasswordPolicy,
  clientKey,
  createSession,
  hashPassword,
  rateLimit,
  setSessionCookie,
} from '@/lib/auth';

/**
 * POST /api/auth/register — create an account and establish a session.
 *
 * Authority: docs/AUTHENTICATION.md §4.1, docs/API-SPECIFICATION.md §4,
 *            docs/DECISIONS.md D37.
 *
 * Rebuilt for V2 — not adapted from the legacy implementation.
 * No token is returned in the body; the session travels only in the
 * HTTP-only cookie.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const { limit, windowMs } = RATE_LIMITS.register;
  const rl = rateLimit(clientKey(request, 'register'), limit, windowMs);
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

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return apiError(400, 'VALIDATION_FAILED', 'A valid email address is required.');
  }
  const normalizedEmail = email.trim().toLowerCase();

  const policy = checkPasswordPolicy(password);
  if (!policy.valid) {
    return apiError(400, 'VALIDATION_FAILED', policy.message!);
  }

  const passwordHash = await hashPassword(password as string);

  let user;
  try {
    user = await db.user.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true },
    });
  } catch {
    // Unique constraint on email. Registration necessarily reveals whether
    // an address is taken; the login endpoint does not (AUTHENTICATION.md §4.2).
    return apiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const sessionId = await createSession(user.id);

  // The body carries no session material — only the identity the client
  // may safely display (D37 prohibition 3).
  const response = NextResponse.json(
    { data: { user: { id: user.id, email: user.email }, needsOnboarding: true } },
    { status: 201 },
  );
  setSessionCookie(response, sessionId);
  return response;
}
