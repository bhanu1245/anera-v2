/**
 * Anera V2 — authentication parameters.
 *
 * Authority: docs/AUTHENTICATION.md, docs/DECISIONS.md D37.
 *
 * The authentication ARCHITECTURE is LOCKED (cookie transport, PostgreSQL
 * sessions, server-side validation, delete-to-revoke, absolute expiry).
 * The VALUES below are still `OPEN` in AUTHENTICATION.md §10 and are
 * therefore PROVISIONAL: conservative defaults chosen so Phase 1 can be
 * implemented and tested, gathered here so ratifying them is a one-file
 * change. Each carries its open-question id.
 *
 * None of these values changes the architecture.
 */

/** Session lifetime. PROVISIONAL — `OQ-AUTH-01`. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Sliding renewal: how much of the remaining lifetime must have elapsed
 * before a still-valid session's expiry is extended on use.
 * PROVISIONAL — `OQ-AUTH-01`.
 */
export const SESSION_RENEW_AFTER_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Cookie name. Deliberately non-descriptive — it must not leak stack
 * details (AUTHENTICATION.md §3.2). PROVISIONAL — `OQ-AUTH-06`.
 *
 * The `__Host-` prefix is NOT used: it requires `Secure`, which is disabled
 * over plain-HTTP local development. Adopting it in production is part of
 * `OQ-AUTH-06`.
 */
export const SESSION_COOKIE_NAME = 'anera_sid';

/** Session identifier entropy in bytes. LOCKED requirement ("cryptographically random, high entropy"). */
export const SESSION_ID_BYTES = 32; // 256 bits

/** bcrypt cost factor. D36 locks bcrypt; the factor is an implementation detail. */
export const BCRYPT_COST = 12;

/** Password policy. PROVISIONAL — `OQ-AUTH-02`. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Rate limits. PROVISIONAL — `OQ-C05`.
 * D33 requires limits to be risk-based; the risk model is undecided, so
 * these are flat per-endpoint limits for Phase 1.
 */
export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;
