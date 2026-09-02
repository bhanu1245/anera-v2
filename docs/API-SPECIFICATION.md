# Anera V2 — API Specification

| Field | Value |
|---|---|
| **Purpose** | Canonical API conventions and the Phase 1 endpoint surface. |
| **Status** | **SELECTED** — conventions chosen; validation library and versioning not yet locked |
| **Owner** | Product owner |
| **Authority** | **Canonical for V2 target API.** [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §15 remains canonical for the **as-built** API. |
| **Dependencies** | D36 (stack) · D37 (auth) · D30 (architecture) |
| **Related documents** | [`AUTHENTICATION.md`](AUTHENTICATION.md) · [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) · [`BACKEND-SCHEMA.md`](BACKEND-SCHEMA.md) · [`SECURITY-GUIDELINES.md`](SECURITY-GUIDELINES.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decisions 36/37. |

---

## 1. Conventions

| Concern | Rule | Status |
|---|---|---|
| **Style** | REST-ish JSON over App Router route handlers; Server Actions for form mutations | `SELECTED` |
| **URLs** | `/api/<resource>` plural nouns; nesting only for true ownership | `SELECTED` |
| **Methods** | `GET` read (never mutates) · `POST` create · `PUT`/`PATCH` update · `DELETE` remove | `LOCKED` |
| **Auth** | Cookie session, server-validated, on every protected route | `LOCKED` (D37) |
| **User identity** | **Always from the session. Never from body, query, header or form data.** | `LOCKED` |
| **Validation** | Schema-validated at the boundary. `zod` `RECOMMENDED` (already a dependency) | `OPEN` (`OQ-A10`) |
| **Versioning** | — | `OPEN` (`OQ-A10`) |

---

## 2. Response format

`SELECTED` — one shape, everywhere.

**Success**
```json
{ "data": { }, "meta": { } }
```

**Error**
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Human-readable summary", "details": [] } }
```

`LOCKED` — error messages **never** leak whether an account exists, internal paths, stack traces, or SQL.

| Status | Use |
|---|---|
| 200 / 201 / 204 | Success |
| 400 | Validation failed |
| 401 | Not authenticated |
| 403 | Authenticated, not permitted |
| 404 | Not found — **also used to mask forbidden resources where existence itself is sensitive** |
| 409 | Conflict (e.g. email exists) |
| 429 | Rate limited |
| 500 | Server error — generic message only |

`OPEN` — the error code taxonomy.

---

## 3. Cross-cutting

| Concern | Rule | Status |
|---|---|---|
| **Pagination** | Cursor-based on a stable sort key. `limit` capped server-side | `SELECTED` |
| **Filtering / sorting** | Explicit allowlists. Never pass client input to the ORM unchecked | `LOCKED` |
| **Idempotency** | Required for payments and any value-moving operation | `SELECTED` — Phase 6 |
| **Rate limiting** | Required on auth, messaging, reporting, uploads. **Risk-based** (D33) | `LOCKED` requirement, `OPEN` thresholds |
| **Audit logging** | All admin and value-moving actions (D32) | `LOCKED` — Phase 4+ |
| **CORS** | Same-origin by default. **No origin reflection with credentials** (`IG-66`) | `LOCKED` |

---

## 4. Phase 1 endpoints

Only these are built in Phase 1. Everything else is `FUTURE`.

### Authentication

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/signup` | POST | — | Create user + session; set cookie |
| `/api/auth/login` | POST | — | Generic failure message |
| `/api/auth/logout` | POST | ✅ | **Deletes the session row**; clears cookie |
| `/api/auth/session` | GET | optional | Returns auth state. **Never returns a token** |
| `/api/auth/password-reset/request` | POST | — | No user enumeration. `OPEN` mechanics |
| `/api/auth/password-reset/confirm` | POST | — | Revokes all sessions. `OPEN` mechanics |

### Profile

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/profile` | GET | ✅ | **Own** profile |
| `/api/profile` | POST / PATCH | ✅ | userId from session only |
| `/api/profile/photos` | POST / DELETE | ✅ | Ownership verified; magic-byte validated |
| `/api/profile/photos/order` | PATCH | ✅ | Verifies **every** photo id |
| `/api/profiles/[id]` | GET | ✅ | **Authenticated only.** Returns a limited public view |
| `/api/preferences` | GET / PATCH | ✅ | New in V2 |

> **`GET /api/profiles/[id]` requires authentication in V2.** The MVP's unauthenticated `GET /api/profile?userId=` (`IG-05`) is `DEPRECATED` — it exposed any user's full profile to anyone.

---

## 5. Deprecated endpoints

`DEPRECATED (D37, D40)` — removed or gated in Phase 1:

| Endpoint | Reason |
|---|---|
| `/api/auth/demo-login` | Session with no credential, not env-gated (`IG-67`) |
| `/api/seed`, `/api/seed/bulk` | Same |
| `/api/dev` | No authentication; impersonation + database wipe (`IG-26`) |
| `/api` | Scaffolding leftover |
| `/api/premium`, `/api/settings` | Stubs persisting nothing (`IG-11`) — replaced in their own phases |

Endpoints returning session tokens in the response body are `DEPRECATED` (D37).

---

## 6. Future endpoints

Named for planning only. **Do not build ahead of the phase.**

Phase 2 discovery/swipe/match/block · Phase 3 conversations/messages/notifications · Phase 4 reports/verification · Phase 5 AI · Phase 6 subscriptions/entitlements · Phase 7 referrals · Phase 8 social · Phase 9 events · Phase 11 Elite.

---

## 7. Open items

| Item | Tracked as |
|---|---|
| Validation library (adopt `zod`?) | `OQ-A10` |
| Error code taxonomy | `OQ-A10` |
| API versioning | `OQ-A10` |
| Whether OpenAPI is required | `OQ-A10` |
| Rate-limit thresholds | `OQ-C05` |
| Public profile field set | `OQ-API-01` |

---

*Canonical V2 target API. As-built API is `00-MASTER-SPECIFICATION.md` §15.*
