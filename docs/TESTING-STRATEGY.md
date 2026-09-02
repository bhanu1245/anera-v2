# Anera V2 — Testing Strategy

| Field | Value |
|---|---|
| **Purpose** | The mandatory testing strategy and phase gates for Anera V2. |
| **Status** | **LOCKED** — gates and tooling |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from **D43** (testing stack, CI, Phase 1 gate), D39 (phase gates) and D30 (multi-layer testing, security gates). |
| **Dependencies** | D43 · D39 · D30 · D37 (auth tests) · D36 (stack) · D28 (privacy tests) |
| **Related documents** | [`ROADMAP.md`](ROADMAP.md) · [`AUTHENTICATION.md`](AUTHENTICATION.md) · [`SECURITY-GUIDELINES.md`](SECURITY-GUIDELINES.md) · [`TECH-STACK.md`](TECH-STACK.md) · [`DEPLOYMENT-OPERATIONS.md`](DEPLOYMENT-OPERATIONS.md) |
| **Last updated** | 2026-09-02 — **D43 locks the testing stack and the Phase 1 gate; `OQ-B06` resolved** |
| **Change history** | 2026-09-02 created from Decision 39 with tooling `OPEN` · 2026-09-02 **updated from Decision 43: Vitest, Playwright, GitHub Actions locked; Phase 1 verification gate defined; `OQ-B06` and `OQ-TEST-01` resolved** |

---

## 1. The verification stack

`LOCKED (D43)`:

| Concern | Technology |
|---|---|
| Unit / integration test runner | **Vitest** |
| E2E / browser | **Playwright** |
| CI provider | **GitHub Actions** |
| Type checking | **TypeScript compiler** (`tsc`) |
| Lint | **Project ESLint configuration** |
| Production build verification | **Next.js production build** |

**Rejected alternatives** (D43): Bun test · Jest · Cypress · a fixed coverage percentage.

> **Current repository state:** zero automated tests, no test script, no CI, no `.github/` directory. Verified 2026-09-02 (`IG-21`). Building this stack is a **Phase 1 requirement**.
>
> **Sequencing constraint:** two lockfiles are committed (`bun.lock` and `package-lock.json`, `IG-62`). **Reproducible CI requires choosing one** — already a Phase 1 item.

---

## 2. The phase gate

`LOCKED (D39)` — **no gate may be skipped by any contributor, human or AI.**

```
DOCUMENTATION → DECISION → IMPLEMENTATION → UNIT TESTS →
INTEGRATION TESTS → E2E TESTS → SECURITY REVIEW →
REGRESSION TEST → PHASE FREEZE → NEXT PHASE
```

| Gate | Requirement |
|---|---|
| G1 | Phase scope written and approved **before** implementation |
| G2 | Implementation complete — no half-finished surfaces |
| G3 | **Unit + integration + E2E tests exist and pass** |
| G4 | Code review complete |
| G5 | **Security review passed** |
| G6 | **Regression suite passes** — earlier phases still work |
| G7 | Documentation updated in the same change |
| G8 | Product owner confirms the freeze |

**A regression outranks new work.** Fix it before continuing.

---

## 3. Test layers

| Layer | Scope | Required from |
|---|---|---|
| **Unit** | Domain services, validation, pure logic | Phase 1 |
| **Integration** | Route handler → domain service → database | Phase 1 |
| **API** | Contract, status codes, error shape | Phase 1 |
| **Database** | Migrations, constraints, cascade deletes | Phase 1 |
| **Authentication** | Every flow in `AUTHENTICATION.md` §4 | Phase 1 |
| **Authorization** | **Isolation between users** | Phase 1 |
| **E2E** | Real browser, real flows. **Playwright** (`LOCKED`, D43) | Phase 1 |
| **Security** | Authz bypass, injection, XSS, CSRF, rate limits | Phase 1 |
| **Regression** | Everything from prior phases | Phase 2+ |
| **Accessibility** | D31 requires "accessible" — level `OPEN` (`OQ-UX02`) | Phase 2 |
| **Performance** | Targets `OPEN` (`OQ-P04`) | Phase 2+ |
| **Mobile responsive** | Mobile-first is locked (D31) | Phase 1 |

---

## 4. The Phase 1 verification gate

`LOCKED (D43)` — **Phase 1 does not freeze until every check below passes in CI.** This is the authoritative gate definition; no other document may define a competing one.

### 4.1 Static checks — all must pass

| # | Check | Tool | Requirement |
|---|---|---|---|
| S1 | **Type check** | `tsc` | Zero type errors. **`typescript.ignoreBuildErrors` removed** |
| S2 | **Lint** | ESLint | Zero errors. The ~27 disabled rules re-enabled, incl. `react-hooks/exhaustive-deps`. Any rule left off needs a documented justification |
| S3 | **Production build** | Next.js build | Completes successfully with type and lint gates active |

### 4.2 Automated tests — all must pass

| # | Test | Layer | Asserts |
|---|---|---|---|
| 1 | **Signup** | E2E + integration | User created, session established, cookie `HttpOnly` + `Secure` + `SameSite=Lax` |
| 2 | **Login** | E2E + integration | Valid credentials establish a session |
| 3 | **Invalid credentials** | Integration | 401, **generic message**, no user enumeration |
| 4 | **Logout** | E2E + integration | **Session row deleted**; cookie cleared; subsequent requests 401 |
| 5 | **Session persistence after refresh** | E2E | Session survives page refresh |
| 6 | **Session persistence across navigation / new tab** | E2E | Session survives both |
| 7 | **Protected-route enforcement** | E2E + integration | Authenticated access succeeds |
| 8 | **Unauthenticated access rejection** | E2E + integration | 401 or redirect — **never protected content, never a partial render** |
| 9 | **Multi-account isolation** | Integration | Two concurrent users; no data bleed in either direction |
| 10 | **Fresh / incognito session** | E2E | A clean browser context is unauthenticated |
| 11 | **Session invalidation — expiry** | Integration | Expired session rejected; cookie cleared |
| 12 | **Session invalidation — revocation** | Integration | Deleted/revoked session rejected **immediately** |
| 13 | **Session survives server restart** | Integration | Proves sessions live in PostgreSQL, not memory |
| 14 | **Database persistence** | Integration | Written data survives restart |
| 15 | **Authorization isolation** | Integration | **User A cannot read or mutate user B's profile, photos or preferences** |
| 16 | **Profile creation** | E2E + integration | Onboarding creates a profile; server-side validation authoritative |
| 17 | **Profile editing** | Integration | Updates apply; **userId taken from session, never from the request body** |
| 18 | **Photo upload** | Integration | MIME allowlist, size cap, **magic-byte validation**, ownership verified |
| 19 | **Preferences** | Integration | Create and update; ownership verified |
| 20 | **Age floor** | Integration | Under-18 rejected server-side |

### 4.3 Security-boundary tests — all must pass

`LOCKED (D37, D43)` — these assert the **prohibitions stay gone**. Without them the legacy pattern can silently return.

| # | Negative assertion |
|---|---|
| N1 | **No session token in `localStorage`** or any client storage |
| N2 | **No `Authorization: Bearer` header is required or honoured** for authentication |
| N3 | **No token appears in any response body** — login, signup, session-check included |
| N4 | **No `authReady` / `waitForAuth` / hydration state gates authentication** |
| N5 | **No authentication state, session id, token, password or email in logs** |
| N6 | **Rate limiting active** on signup, login and password reset |
| N7 | **No unauthenticated session-granting endpoint** reachable (`demo-login`, `seed`, `seed/bulk`, `/api/dev`) |
| N8 | **Security headers present** — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options` |

> Tests 13, 15 and N1–N4 are the ones that would have caught the MVP's worst defects: the in-memory blocklist (`IG-70`), the unauthenticated public profile endpoint (`IG-05`), and the localStorage/Bearer path (`IG-01`).

### 4.4 Gate outcome

**All of §4.1, §4.2 and §4.3 pass in CI, plus security review (G5) and product-owner confirmation (G8) → Phase 1 freezes.** Any failure blocks the freeze. A test may not be weakened, skipped or deleted to pass.

---

## 5. Standards

`LOCKED (D43)`:

| Item | Value |
|---|---|
| Test runner | **Vitest** |
| E2E framework | **Playwright** |
| CI provider | **GitHub Actions** |
| CI triggers | **Every push and every pull request.** A failing run **blocks merge** |
| E2E frequency | **Every pull request and before every phase freeze** — not pre-freeze only *(resolves `OQ-TEST-01`)* |
| **Coverage** | **Critical-path baseline + no-regression ratchet.** No arbitrary percentage — see §5.1 |
| **`typescript.ignoreBuildErrors` removed** | Phase 1 |
| **ESLint rules re-enabled** (~27 currently off) | Phase 1 |
| Type errors block the build | Phase 1 |

### 5.1 Coverage model

`LOCKED (D43)` — **no percentage target is set.** A number chosen for its own sake measures nothing.

1. **Critical-path coverage is mandatory** — every item in §4.2 and §4.3 has an automated test. Pass/fail, not a ratio.
2. **Domain services and authorization logic must be unit-tested** — they hold the invariants most costly to break.
3. **Coverage is reported on every CI run**, so the number stays visible.
4. **No-regression ratchet** — Phase 1's measured coverage becomes the floor. A change that lowers it fails CI.
5. A numeric threshold may be set by a **later decision once a real baseline exists**. Setting one now would be invention.

**Test data:** the seed endpoints are `DEPRECATED` as fixtures (`IG-67`, D40). Tests provision their own data through factories.

---

## 6. Rules

1. **No phase advances until its required tests pass.**
2. **A regression is fixed before new work.**
3. **Security review is a gate, not a follow-up.**
4. **Tests are written in the same phase as the code**, not deferred.
5. **Do not weaken a test to make a gate pass.**

---

## 7. Open items

| Item | Tracked as |
|---|---|
| ~~Test runner, CI provider, coverage threshold~~ | ✅ **RESOLVED by D43** |
| ~~Whether E2E runs on every PR or pre-freeze only~~ | ✅ **RESOLVED by D43** — every PR **and** before every freeze |
| Accessibility conformance level | `OQ-UX02` |
| Performance targets | `OQ-P04` |
| Numeric coverage threshold, once a baseline exists | `OQ-TEST-02` |

---

*Canonical testing strategy. Gates are locked by Decision 39.*
