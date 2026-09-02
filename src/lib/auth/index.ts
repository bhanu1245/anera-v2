/**
 * Anera V2 — authentication module.
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md.
 *
 * HTTP-only cookie + server-side validation. The cookie is the single
 * source of truth; there is no second authentication authority anywhere.
 */

export {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  RATE_LIMITS,
} from './config';

export { checkPasswordPolicy, hashPassword, verifyPassword } from './password';

export {
  clearSessionCookie,
  createSession,
  getCurrentSession,
  readSessionIdFromCookies,
  readSessionIdFromRequest,
  revokeAllSessions,
  revokeSession,
  setSessionCookie,
  validateSession,
  type SessionUser,
} from './session';

export { apiError, requireAuth, requireOwnership } from './guard';

export { clientKey, rateLimit } from './rate-limit';
