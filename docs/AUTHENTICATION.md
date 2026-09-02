# Anera V2 — Authentication Architecture

| Field | Value |
|---|---|
| **Purpose** | The canonical authentication and session architecture for Anera V2. |
| **Status** | **LOCKED** |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from [`DECISIONS.md`](DECISIONS.md) Decision 37. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Dependencies** | D37 (this architecture) · D36 (stack) · D30 (central auth governance) · D32 (admin MFA) · D34 (identity) · D28 (privacy) |
| **Related documents** | [`TECH-STACK.md`](TECH-STACK.md) · [`SECURITY-GUIDELINES.md`](SECURITY-GUIDELINES.md) · [`API-SPECIFICATION.md`](API-SPECIFICATION.md) · [`BACKEND-SCHEMA.md`](BACKEND-SCHEMA.md) · [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) · [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §13 (as-built legacy) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 37, which resolved `OD-09`/`OQ-B02`/`IG-01`, blocking since 2026-08-30. |

---

## 1. The canonical rule

> ## **HTTP-only cookie + server-side validation.**
> ### The cookie is the single source of truth for authentication.

Everything in this document follows from that sentence.

---

## 2. The seven prohibitions

`LOCKED (D37)` — these are absolute. Violating any one is a Phase gate failure.

| # | Prohibition | Why |
|---|---|---|
| 1 | **No localStorage authentication tokens** | Readable by any script on the origin; XSS-exfiltratable |
| 2 | **No parallel Bearer-token authentication** | Two transports drift; the weaker one becomes the attack surface |
| 3 | **No `authReady` architecture** | Client-side readiness is not an authorization decision |
| 4 | **No `waitForAuth` architecture** | Racing a timeout is not authentication |
| 5 | **No hydration state as authentication truth** | `hasHydrated` describes React, not identity |
| 6 | **No client-side authorization as enforcement** | The client is untrusted, always |
| 7 | **No NextAuth / Auth.js** | Not approved; authentication is hand-rolled per this document |

---

## 3. Session model

### 3.1 Approach

`LOCKED` — **server-side sessions**, not stateless tokens.

| Property | Value | Status |
|---|---|---|
| Transport | HTTP-only cookie | `LOCKED` |
| Storage | Database `Session` table (PostgreSQL) | `LOCKED` |
| Session identifier | Cryptographically random, high entropy | `LOCKED` |
| Validation | Server looks up the session on every protected request | `LOCKED` |
| Revocation | Delete/invalidate the row — takes effect immediately | `LOCKED` |
| Expiry | Absolute expiry stored server-side | `LOCKED` |
| Session lifetime (exact duration) | — | **`OPEN`** |
| Sliding expiry / renewal policy | — | **`OPEN`** |

> **Why server-side, not a signed stateless token:** revocation. The legacy HMAC token could not be revoked reliably (`IG-70` — an in-memory blocklist lost on every restart). A database session makes logout, "sign out everywhere", and admin-forced revocation real rather than best-effort.

### 3.2 Cookie attributes

`LOCKED` — all of the following, in production:

| Attribute | Value | Rationale |
|---|---|---|
| `HttpOnly` | `true` | JavaScript cannot read it — defeats XSS token theft |
| `Secure` | `true` | HTTPS only |
| `SameSite` | `Lax` | CSRF mitigation while preserving normal navigation |
| `Path` | `/` | |
| `Max-Age` / `Expires` | Matches server-side session expiry | Client and server agree on lifetime |
| Name | Non-descriptive; does not leak stack details | |

`OPEN` — cookie name, `__Host-` prefix adoption, and exact `Max-Age`.

---

## 4. Flows

For each: entry → steps → validation → server interaction → success → failure → authorization → edge cases.

### 4.1 Signup

| | |
|---|---|
| **Entry** | Signup form (unauthenticated) |
| **Validation** | Email format + uniqueness; password policy; required profile fields |
| **Server** | Hash password with **bcrypt**; create `User`; create `Session`; set cookie |
| **Success** | Authenticated session; redirect to onboarding |
| **Failure** | 400 validation; **409 email exists** |
| **Authorization** | None required |
| **Edge cases** | Duplicate submit (idempotency); email casing normalised to lowercase; signup while already authenticated |

`OPEN` — password policy (length, complexity, breach-list check); whether email verification gates signup or follows it.

### 4.2 Login

| | |
|---|---|
| **Entry** | Login form (unauthenticated) |
| **Validation** | Email + password present |
| **Server** | Look up user; `bcrypt.compare`; on success create `Session`; set cookie |
| **Success** | Session established; redirect by onboarding state |
| **Failure** | **401 with a generic message** — never distinguish unknown-user from wrong-password |
| **Authorization** | None required |
| **Edge cases** | Rate limiting (`OPEN` thresholds); account locked/suspended; login while already authenticated |

> The generic-failure behaviour already exists in the MVP (`SEC-P8`) and **must be preserved** (D40).

### 4.3 Logout

| | |
|---|---|
| **Entry** | Authenticated user |
| **Server** | **Delete the session row**; clear the cookie |
| **Success** | Session gone; subsequent requests are unauthenticated |
| **Failure** | Idempotent — logging out twice succeeds |
| **Edge cases** | Concurrent logout; logout with an already-expired session; **"sign out everywhere"** deletes all sessions for the user |

### 4.4 Session validation (every protected request)

```
Request → read cookie → look up Session → valid & unexpired?
   ├─ yes → attach userId → authorize → handle
   └─ no  → 401, clear cookie
```

`LOCKED` — **the userId always comes from the server-side session, never from request body, query, header or form data.** This is the strongest control the MVP already has (`SEC-P4`) and it carries forward unchanged.

### 4.5 Session restoration

`LOCKED` — restoration is a **server** concern. The browser sends the cookie; the server validates it and renders accordingly. There is no client-side "am I logged in yet?" state to wait on.

With Server Components (D36), authenticated content is resolved on the server before render — which is what structurally eliminates the entire class of hydration/readiness bugs recorded in `worklog.md`.

### 4.6 Password reset

`OPEN` — flow approved as required; mechanics undecided.

Requirements that are `LOCKED`: single-use token, short expiry, **all sessions revoked on reset**, no user enumeration in the request-reset response.

### 4.7 Email verification

`OPEN` — required (D34 progressive verification). Token mechanics, expiry and whether it gates any capability are undecided. See [`VERIFICATION.md`](VERIFICATION.md).

### 4.8 OAuth / social login

**`FUTURE` / `OPEN`** — not in Phase 1. If ever adopted it must issue the *same* server-side session and cookie. It must not introduce a second identity system.

---

## 5. Authorization

`LOCKED` — server-side, always. Three layers, all enforced on the server:

| Layer | Rule |
|---|---|
| **Authentication** | Valid session required for every protected route and endpoint |
| **Ownership** | The caller must own the resource being mutated |
| **Relationship** | Match-participation for messaging; block-awareness once blocking exists (D34) |

`OPEN` — the role model. D32 defines fourteen admin functions but the **permission matrix is undecided** (`OQ-AD01`). Phase 1 has no roles beyond authenticated user.

---

## 6. CSRF strategy

`SELECTED` — **defence in depth**, not a single control:

1. **`SameSite=Lax` cookies** — blocks cross-site POST by default. Primary control.
2. **Origin / Referer validation** on state-changing requests.
3. **No CORS credential reflection.** The legacy origin-reflecting CORS with `Allow-Credentials: true` (`IG-66`) is `DEPRECATED` and removed in Phase 1. Replace with a strict allowlist, or same-origin only.
4. **Server Actions / POST-only mutations** — no state change on `GET`.

`OPEN` — whether a synchroniser token is additionally required. `SameSite=Lax` plus origin validation is generally sufficient for a same-origin app; this must be confirmed at security review before Phase 1 freeze.

---

## 7. Production requirements

`LOCKED` — Phase 1 cannot pass its gate without all of these:

| # | Requirement |
|---|---|
| 1 | **Session secret / signing material comes from the environment. No hard-coded fallback. The application fails closed if it is missing.** (`IG-65`) |
| 2 | `Secure` cookies; HTTPS enforced |
| 3 | Rate limiting on signup, login and password reset (`IG-30`) |
| 4 | No authentication state, user id, email or token in logs (`IG-17`) |
| 5 | Generic authentication failure messages |
| 6 | Session revocation works across restarts and instances |
| 7 | No unauthenticated session-granting endpoint exists in any deployed environment (`IG-67`) |
| 8 | Security headers configured — CSP, HSTS, X-Content-Type-Options, X-Frame-Options (`IG-69`) |

---

## 8. Legacy — what is being replaced

`DEPRECATED (D37, D40)`. Documented so the migration is explicit. **Not to be extended, not to be preserved because it works.**

| Legacy artefact | Location | Action |
|---|---|---|
| HMAC session tokens | `src/lib/auth.ts` | **Replace** with DB sessions |
| localStorage token storage | `src/lib/api-client.ts` | **Remove** |
| `Authorization: Bearer` fallback | `src/lib/auth.ts`, `api-client.ts` | **Remove** |
| `markAuthReady` / `clearAuthReady` / `isAuthReady` / `waitForAuth` | `src/lib/api-client.ts` | **Remove** |
| `hasHydrated` as auth gate | `src/stores/auth-store.ts`, `src/app/page.tsx` | **Remove** as auth truth |
| In-memory revocation blocklist | `src/lib/auth.ts` | **Replace** with DB revocation |
| `SESSION_SECRET` fallback literal | `src/lib/auth.ts`, notification service | **Remove**; fail closed |
| Token returned in response bodies | login/register/session/demo-login | **Remove** |
| `demo-login`, `seed`, `seed/bulk` session grants | `src/app/api/**` | **Environment-gate or remove** |
| Origin-reflecting CORS with credentials | `src/proxy.ts` | **Replace** with allowlist |

### 8.1 What is preserved

These MVP controls are V2-compatible and **must survive** the rewrite (D40):

- Session-derived user identity — userId never from client input
- `requireAuth` / `requireOwnership` primitives (re-implemented against DB sessions)
- Match-participation checks on messaging
- bcrypt password hashing; hashes never returned by the API
- Generic login failure messages
- Photo upload magic-byte validation

---

## 9. Required Phase 1 tests

`LOCKED` — from [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md). Phase 1 does not freeze until all pass:

signup · login · logout · session persistence across refresh · session persistence across **server restart** · protected route rejects unauthenticated · wrong password rejected · multiple accounts isolated · incognito session isolation · expired session rejected · **database persistence verified** · **authorization isolation — user A cannot read or mutate user B's data**.

---

## 10. Open items

| Item | Tracked as |
|---|---|
| Session lifetime and renewal policy | `OQ-AUTH-01` |
| Password policy | `OQ-AUTH-02` |
| Whether email verification gates any capability | `OQ-AUTH-03` |
| Password reset token mechanics | `OQ-AUTH-04` |
| Whether a CSRF synchroniser token is required in addition to `SameSite` | `OQ-AUTH-05` |
| Cookie name and `__Host-` prefix | `OQ-AUTH-06` |
| Device/session management UI ("your active sessions") | `OQ-AUTH-07` |
| Rate-limit thresholds | `OQ-C05` |
| Admin MFA / step-up mechanism | `OQ-AD03` |
| Future OAuth providers | `OQ-AUTH-08` |

---

*Canonical authentication architecture. Derived from `DECISIONS.md` Decision 37.*
