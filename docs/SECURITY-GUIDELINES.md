# Anera V2 — Security Guidelines

| Field | Value |
|---|---|
| **Purpose** | Secure-by-default engineering requirements for Anera V2. |
| **Status** | **LOCKED** for the principles; `OPEN` for tooling and thresholds |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D37 (auth), D30 (security gates), D32 (admin controls), D28 (privacy), and the standing security posture in [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §26.3. |
| **Dependencies** | D37 · D36 · D30 · D32 · D34 · D28 |
| **Related documents** | [`AUTHENTICATION.md`](AUTHENTICATION.md) · [`API-SPECIFICATION.md`](API-SPECIFICATION.md) · [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) · [`FRAUD-PREVENTION.md`](FRAUD-PREVENTION.md) · [`DEPLOYMENT-OPERATIONS.md`](DEPLOYMENT-OPERATIONS.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decisions 36/37/40. |

---

## 1. Principle

**Secure by default.** A feature is not complete until its security properties are as deliberate as its behaviour. Security review is a **phase gate** (D39 G5), not a follow-up.

---

## 2. Authentication & session security

`LOCKED` — full detail in [`AUTHENTICATION.md`](AUTHENTICATION.md).

- HTTP-only, `Secure`, `SameSite=Lax` cookie. **Single source of truth.**
- Server-side session records; immediate revocation.
- bcrypt password hashing; hashes never leave the server.
- **No localStorage tokens. No Bearer transport. No `authReady`/`waitForAuth`/hydration-as-auth.**
- Generic authentication failure messages — no user enumeration.
- **Secrets from the environment. No hard-coded fallback. Fail closed.** (`IG-65`)

## 3. Authorization

`LOCKED`:

1. **Server-side, always.** Client-side checks are UX, never enforcement.
2. **User identity from the session only** — never from body, query, header or form.
3. **Ownership checks** on every mutation of a user-owned resource.
4. **Relationship checks** — match participation for messaging; block-awareness from Phase 2.
5. **Deny by default.** A route without an explicit authorization decision is a defect.
6. **Mask existence** where existence is itself sensitive — 404 rather than 403.

> **Required test:** user A cannot read or mutate user B's data (`TESTING-STRATEGY.md` §4 #13).

## 4. CSRF

`SELECTED` — layered:

1. `SameSite=Lax` cookies — primary control
2. Origin/Referer validation on state-changing requests
3. **No CORS credential reflection** — the MVP's origin-reflecting CORS with `Allow-Credentials` (`IG-66`) is `DEPRECATED`
4. No state change on `GET`

`OPEN` — whether a synchroniser token is additionally required (`OQ-AUTH-05`). Confirm at Phase 1 security review.

## 5. XSS

`LOCKED`:

- React escaping by default; **`dangerouslySetInnerHTML` is prohibited** without documented sanitisation
- User content is data, never markup
- **Content-Security-Policy** configured (`IG-69`)
- HTTP-only cookies mean XSS cannot steal the session — **this is the main reason D37 forbids localStorage tokens**

## 6. Injection

`LOCKED`:

- Prisma parameterised queries only
- **No raw SQL with interpolated user input**
- Filter/sort parameters validated against **allowlists**, never passed through to the ORM
- Schema validation at every boundary

## 7. Rate limiting & abuse

`LOCKED` requirement (D33 risk-based), `OPEN` thresholds (`OQ-C05`).

Required on: signup · login · password reset · messaging · reporting · uploads · referral redemption.

> **Nothing is rate limited today** (`IG-30`) — brute force, enumeration and spam are all currently unmitigated.

## 8. Secrets

`LOCKED`:

- **Never in source control.** Environment only.
- **No hard-coded fallback values.** The application fails closed when a secret is absent.
- Rotation possible without a code change.
- Secrets never logged, never in error messages, never returned by an API.

> The MVP ships `SESSION_SECRET` with a committed fallback literal, duplicated in the notification service (`IG-65`). Removing it is a Phase 1 requirement.

## 9. Uploads

`LOCKED` — preserve and extend the existing controls (D40):

- MIME allowlist **and magic-byte signature validation** (already implemented — `SEC-P7`)
- Size cap; extension sanitised to an allowlist
- **Stored outside the web root**, served via signed URLs — replaces public-filesystem serving (`IG-18`)
- Content scanning `OPEN`

## 10. Transport & headers

`LOCKED` — Phase 1:

HTTPS enforced · HSTS · CSP · `X-Content-Type-Options: nosniff` · `X-Frame-Options`/`frame-ancestors` · `Referrer-Policy`. **None is configured today** (`IG-69`).

## 11. Logging & audit

`LOCKED`:

- **No authentication state, session identifier, token, password or email in logs** (`IG-17`)
- Structured logging; errors captured by a monitoring service (`OPEN` vendor)
- **Audit log** for admin and value-moving actions (D32) — Phase 4+
- Errors returned to clients are generic; details stay server-side

## 12. Dependencies

`LOCKED`:

- **One package manager.** Two lockfiles present today (`IG-62`) — resolve in Phase 1
- Automated vulnerability scanning in CI
- Remove unused dependencies (`TECH-STACK.md` §5)
- Pin and review before upgrading

## 13. Admin security

`LOCKED (D32)` — see [`ADMIN-OPERATIONS.md`](ADMIN-OPERATIONS.md):

No shared accounts · no unrestricted raw database access · least privilege for every role including Super Admin · MFA / step-up · separation of duties · audit logs · controlled exports.

> `/api/dev` currently has **no authentication at all** and exposes impersonation and full database deletion, gated only by `NODE_ENV` (`IG-26`). It must be removed or hard-restricted before any deployment.

## 14. Phase 1 security checklist

Phase 1 does not pass G5 until all of these hold:

| # | Requirement |
|---|---|
| 1 | Cookie-only auth; no token in localStorage or any response body |
| 2 | Secrets from environment; fail closed; no committed fallback |
| 3 | All protected routes enforce auth **and** authorization server-side |
| 4 | Authorization isolation test passes |
| 5 | Rate limiting on auth endpoints |
| 6 | Security headers configured |
| 7 | No auth state or PII in logs |
| 8 | No unauthenticated session-granting endpoint in any deployed environment |
| 9 | `/api/dev` removed or hard-restricted |
| 10 | CORS same-origin or strict allowlist |
| 11 | Type and lint gates re-enabled |
| 12 | Dependency scan clean |

---

## 15. Open items

| Item | Tracked as |
|---|---|
| Rate-limit thresholds and risk model | `OQ-C05` |
| CSRF synchroniser token requirement | `OQ-AUTH-05` |
| Secret management tooling | `OQ-A07` |
| Error monitoring vendor | `OQ-A04` |
| Upload content scanning | `OQ-SEC-01` |
| Penetration testing cadence | `OQ-SEC-02` |

---

*Canonical security guidelines. Security review is a phase gate (D39).*
