# Anera V2 — Implementation Roadmap

| Field | Value |
|---|---|
| **Purpose** | The approved phase plan for Anera V2. |
| **Status** | **APPROVED** — Phase 0 ❄️ FROZEN 2026-09-02; Phase 1 in progress (M1–M5 done, M4 frozen) |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from [`DECISIONS.md`](DECISIONS.md) Decision 39. |
| **Dependencies** | D39 (phases) · D36 (stack) · D37 (auth) · D30 (gates) · D42 (principles) |
| **Related documents** | [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) · [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) · [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md) |
| **Last updated** | 2026-09-03 — Phase 1 status corrected: M3 and M4 complete (M4 frozen), M5 routing complete |
| **Change history** | 2026-08-30 created as `DRAFT / BLOCKED` recording that no phase plan existed · 2026-09-02 renamed from `IMPLEMENTATION-ROADMAP.md` · **2026-09-02 rewritten as APPROVED from Decision 39, resolving `OD-29`/`OQ-B03`, blocking since the project began** · **2026-09-02 Phase 0 FROZEN following Decision 43 (`OQ-B06` resolved); Phase 1 gate wired to `TESTING-STRATEGY.md` §4** |

---

## 1. The gate

`LOCKED (D39)` — between **every** phase:

```
DOCUMENTATION → DECISION → IMPLEMENTATION → UNIT TESTS →
INTEGRATION TESTS → E2E TESTS → SECURITY REVIEW →
REGRESSION TEST → PHASE FREEZE → NEXT PHASE
```

**No phase may begin until its predecessor has passed every gate.** No gate may be skipped by any contributor, human or AI. Full gate definitions: [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) §2.

---

## 2. Phase summary

| Phase | Goal | Status |
|---|---|---|
| **0** | Documentation & governance | ❄️ **FROZEN 2026-09-02** |
| **1** | V2 foundation — auth, profile, PostgreSQL | **IN PROGRESS** — M1–M5 done; M6–M7 remain |
| **2** | Dating core | Not started |
| **3** | Realtime communication | Not started |
| **4** | Trust, safety & verification | Not started |
| **5** | AI | Not started |
| **6** | Premium & monetization | Not started |
| **7** | Referral & growth | Not started |
| **8** | Social | Not started |
| **9** | Events & live | Not started |
| **10** | Globalization | Not started |
| **11** | Elite | Not started |
| **12** | Advanced ecosystem | Not started |

---

## Phase 0 — Documentation & Governance

**Goal.** A single, internally consistent specification Claude Code can follow without guessing.

**Work.** Decision register · canonical architecture, product, safety and operations documents · gap register · open-questions register · documentation audit.

**Exit criteria**
- [x] `DECISIONS.md` exists and is authoritative
- [x] Authentication architecture decided (D37) — **`OD-09` resolved**
- [x] Technology stack decided (D36)
- [x] Phase plan decided (D39) — **`OD-29` resolved**
- [x] Tier structure decided (D38)
- [x] Legacy policy decided (D40)
- [x] Canonical architecture documents written
- [x] **Test runner, E2E framework and CI selected (D43)** — Vitest · Playwright · GitHub Actions. **`OQ-B06` resolved**
- [x] **Phase 1 verification gate defined** — [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) §4
- [x] **Product owner confirms Phase 0 freeze — 2026-09-02**

> ### ❄️ PHASE 0 IS FROZEN — 2026-09-02
>
> All exit criteria are met. **Phase 1 may begin.** Phase 0 documentation is now change-controlled: further edits require a decision recorded in [`DECISIONS.md`](DECISIONS.md).

---

## Phase 1 — V2 Foundation

**Status: IN PROGRESS.** M1 ✅ · M2 ✅ · M3 ✅ · M4 ✅ frozen · M5 ✅ · M6–M7 not started.

| Milestone | State |
|---|---|
| M1 — Audit + package manager | ✅ **Done** (D44) — npm authoritative, `IG-62` closed |
| M2 — Vitest · Playwright · CI · static verification | ✅ **Done** (D43) — 4/4 tests, typecheck 0, lint 0, build passes with types enforced |
| M3 — Prisma/PostgreSQL | ✅ **Done** — PostgreSQL 16.15; migration `20260902143350_phase1_foundation`; the six foundation tables with foreign keys on every relation |
| M4 — Authentication/session | ✅ **Done and frozen** 2026-09-03, tag `phase1-m4-frozen` — D37 cookie sessions; `IG-01`, `IG-02`, `IG-63`, `IG-65`, `IG-66`, `IG-70`, `IG-74` closed; CI green on Linux + PostgreSQL 16 |
| M5 — Signup/login/logout/protected routes | ✅ **Done** 2026-09-03 — see the note below |
| M6 — Profile/photos/preferences | Not started — owns `/api/profile`, which onboarding needs before it can complete |
| M7 — Full Phase 1 gate | Not started |

> **Note on the M4/M5 boundary.** This table's M5 row — signup, login, logout and protected API routes — was delivered inside M4, whose completion gate required exactly those four things. Rather than leave M5 empty, the product owner scoped it on 2026-09-03 to the other half of this phase's `Frontend` requirement below: **real routing and Server Components**, replacing the single-page client shell. Both readings of the row are now satisfied.

**Goal.** A secure, tested foundation: PostgreSQL, cookie-session auth, profile creation. **Everything else depends on this being right.**

**Dependencies.** Phase 0 freeze.

**Features.** Signup · login · logout · session validation & restoration · password reset · profile creation · profile editing · photo upload · preferences.

**Database.** Stand up PostgreSQL. Foundation tables (`BACKEND-SCHEMA.md` §2): `users`, `sessions`, `profiles`, `photos`, `profile_interests`, `preferences`. **Foreign keys on every relation.** Track `prisma/migrations/` in git.

**API.** `AUTHENTICATION.md` §4 flows; `API-SPECIFICATION.md` §4 endpoints. Response and error envelope established.

**Frontend.** Server Components by default. Real routing — retire the single-page tab shell. Auth screens, onboarding, profile editor.

> ✅ **Delivered in M5** (2026-09-03). Routes: `/` (landing), `/login`, `/signup`, `/onboarding`, `/profile`, with `(auth)` and `(app)` route groups carrying server-side session guards. The session is resolved by `getCurrentSession()` before render, so an unauthenticated request is redirected without protected markup ever reaching the browser. `src/app/page.tsx` is no longer a Client Component.

**Security.** Every item in `SECURITY-GUIDELINES.md` §14.

**Testing.** Stand up **Vitest**, **Playwright** and a **GitHub Actions** workflow (D43), then satisfy the full **Phase 1 verification gate**: [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) §4 — 3 static checks (§4.1), 20 automated tests (§4.2), 8 security-boundary assertions (§4.3).

**Legacy removal (D37, D40).** localStorage tokens · Bearer transport · `authReady`/`waitForAuth` · `hasHydrated` as auth truth · in-memory blocklist · `SESSION_SECRET` fallback · `demo-login`/`seed`/`seed/bulk` · `/api/dev` · `next-auth` dependency · one lockfile removed.

**Exit criteria**
- [ ] **The full Phase 1 verification gate passes in CI** — `TESTING-STRATEGY.md` §4.1 + §4.2 + §4.3
- [ ] GitHub Actions runs on every push and PR; a failing run blocks merge
- [ ] `typescript.ignoreBuildErrors` removed; ESLint rules re-enabled; build fails on error
- [ ] Single package manager and lockfile (`IG-62`) — required for reproducible CI
- [ ] Coverage reported; Phase 1 baseline recorded as the ratchet floor
- [ ] Security review passed (G5)
- [ ] **No legacy auth artefact remains** — `AUTHENTICATION.md` §8
- [ ] Gaps closed: `IG-01`, `IG-05`, `IG-21`, `IG-26`, `IG-58`, `IG-62`, `IG-65`, `IG-67`, `IG-70`
- [ ] Product owner confirms Phase 1 freeze (G8)

---

## Phase 2 — Dating Core

**Goal.** Discovery, swipe and matching — with preferences and blocking from day one.

**Dependencies.** Phase 1 freeze.

**Features.** Discovery with **filters and preferences** · ranking · swipe (Like / Nope / Super Like) · mutual-like matching · matches list · unmatch · **block**.

**Database.** `swipes`, `matches`, `blocks` (`BACKEND-SCHEMA.md` §3). Location representation resolved (`OQ-B05`).

**Security.** Blocked users excluded from discovery, matching and any future messaging. Rate limiting on swipes.

**Exit criteria**
- [ ] Discovery respects preferences — **no unfiltered global deck** (`IG-16`)
- [ ] Discovery, matching and ranking are separate modules (D30)
- [ ] Blocking works end to end and is immediate
- [ ] Regression: all Phase 1 tests still pass
- [ ] Gaps closed: `IG-16`, `IG-28`, `IG-34`, `IG-44`, `IG-54`

> **Why blocking is here and not Phase 4:** D34 requires immediate blocking. Shipping discovery without block-awareness would knowingly ship a safety gap and force a rewrite of the discovery query later.

---

## Phase 3 — Realtime Communication

**Goal.** Real messaging between matches.

**Dependencies.** Phase 2 freeze. Transport decided (`OQ-A02`).

**Features.** Conversations · messages · read receipts · realtime delivery · notifications · notification preferences · push (`OPEN` provider).

**Database.** `conversations`, `messages`, `notifications`, `notification_preferences`, `device_tokens`.

**Security.** Match-participation enforced. Blocked users cannot reach each other. Message rate limiting. Connection auth per `REALTIME-ARCHITECTURE.md` §4.

**Exit criteria**
- [ ] Messaging works without polling (`IG-31`)
- [ ] Notification preferences persist (`IG-40`)
- [ ] Push sends or is explicitly deferred (`IG-75`)
- [ ] Message retention decided (`OQ-C06`)
- [ ] Regression passes

---

## Phase 4 — Trust, Safety & Verification

**Goal.** The safety capability the product currently lacks entirely.

**Dependencies.** Phase 3 freeze.

**Features.** Reporting · moderation queue · enforcement ladder · account status · appeals · email verification · phone verification · progressive verification levels · trusted contacts · admin RBAC foundation.

**Database.** `reports`, `moderation_actions`, `verifications`, `user_status_history`, `trusted_contacts`, `audit_log`.

**Security.** Restricted access to safety and identity data. Audit logging. Admin MFA.

**Exit criteria**
- [ ] Report → triage → action → appeal works end to end
- [ ] Verification is a **level, not a boolean** (`IG-06`)
- [ ] Verified badge reflects real verification state
- [ ] Admin actions are audited
- [ ] Gaps closed: `IG-06`, `IG-29`, `IG-32`, `IG-33`, `IG-35`, `IG-27`, `IG-49`

---

## Phase 5 — AI

**Goal.** AI features behind a single governed gateway.

**Dependencies.** Phase 4 freeze. **AI provider selected (`OQ-AI01`)**. Consent model decided.

**Features.** Per [`AI-ARCHITECTURE.md`](AI-ARCHITECTURE.md) — prioritised subset only.

**Security & privacy.** All access via the AI Gateway. Consent captured. AI inference treated as user data (D28). **No silent impersonation** (D33).

**Exit criteria**
- [ ] Central AI Gateway is the only path to a model (`IG-55`)
- [ ] Consent, retention and cost controls in place
- [ ] AI quality/cost/safety analytics emitting

---

## Phase 6 — Premium & Monetization

**Goal.** Five-tier subscriptions plus one-time extras.

**Dependencies.** Phase 5 freeze. **Pricing, entitlements and payment provider decided** (`OQ-M01`, `OQ-M02`, `OQ-M06`).

**Features.** Free / Premium / Gold / Platinum / Elite (D38) · entitlements · extras (Super Likes, Boosts, Spotlight, Gifts) · billing lifecycle · refunds.

**Database.** `subscriptions`, `entitlements`, `purchases`, `ledger_entries`, `boosts`, `super_like_grants`.

**Exit criteria**
- [ ] **All five tiers can purchase eligible extras** (NR-09)
- [ ] Entitlement checks evaluate entitlements, **not tier rank**
- [ ] **All eight D26 prohibitions verified by test**
- [ ] All value movement is ledger-recorded
- [ ] Gaps closed: `IG-11`, `IG-42`, `IG-43`

---

## Phase 7 — Referral & Growth

**Goal.** The referral economy per D27.

**Dependencies.** Phase 6 freeze (rewards may confer entitlements). Reward amounts and qualification decided (`OQ-R01`, `OQ-R02`).

**Features.** Codes / links / QR · attribution · qualification · rewards · wallet · **referral ledger** · campaigns · ambassadors · fraud detection.

**Exit criteria**
- [ ] Fraud controls active **before** rewards are payable
- [ ] Referral ledger append-only and reconcilable
- [ ] **No pyramid or unlimited multi-level structure** (NR-18, NR-19)
- [ ] Gap closed: `IG-20`

---

## Phase 8 — Social

**Goal.** Social layer per [`SOCIAL.md`](SOCIAL.md). **New scope approved by D42.**

**Dependencies.** Phase 7 freeze. Moderation capacity from Phase 4.

**Exit criteria**
- [ ] Every social surface is moderated and reportable
- [ ] Privacy controls per D28

---

## Phase 9 — Events & Live

**Goal.** Events, speed dating and live formats per [`EVENTS.md`](EVENTS.md).

**Dependencies.** Phase 8 freeze. Realtime from Phase 3; payments from Phase 6.

**Exit criteria**
- [ ] Event safety controls active (D34)
- [ ] Ticketing, refunds and attendance work
- [ ] Host management operational

---

## Phase 10 — Globalization

**Goal.** Local-first discovery and regional operations per D35.

**Dependencies.** Phase 9 freeze. Launch markets decided (`OQ-P02`).

**Features.** Expansion ladder Nearby → City → Region → Country → Global · localization · RTL · currencies · regional pricing · regional safety and privacy · timezone correctness · City Health Score.

**Exit criteria**
- [ ] Discovery is local-first with **user-controlled** expansion (NR-25)
- [ ] Timezone handling correct (`IG-13`)
- [ ] Regional configuration is data, not code (`IG-36`)
- [ ] Gaps closed: `IG-13`, `IG-25`, `IG-36`, `IG-45`, `IG-61`

---

## Phase 11 — Elite

**Goal.** Invitation-only Elite ecosystem per [`ELITE.md`](ELITE.md).

**Dependencies.** Phase 10 freeze. Verification (4), payments (6), events (9).

**Exit criteria**
- [ ] **Elite cannot bypass safety** — verified by test (NR-11)
- [ ] Elite privacy controls active (D28)
- [ ] Concierge operations tooling exists

---

## Phase 12 — Advanced Ecosystem

**Goal.** Marketplace (D21) and remaining ecosystem scope.

**Dependencies.** Phase 11 freeze. **D21 principles supplied** (`OQ-B01` — still outstanding).

> **Cannot be planned in detail.** D21 remains `APPROVED — SCOPE ONLY`.

---

## 3. Cross-phase requirements

| Requirement | From |
|---|---|
| Every phase updates documentation in the same change | D30, D39 |
| Every phase adds tests; regression suite grows | D39 |
| Every phase passes security review | D39 G5 |
| Analytics events defined with each feature | D29 |
| No feature violates the eight monetization prohibitions | D26 |
| No feature bypasses safety, consent or blocking | D34 |
| Optimize for meaningful connections, not vanity engagement | D29 |

---

## 4. What is deliberately not scheduled

| Item | Why |
|---|---|
| **Marketplace detail** (D21) | Principles not supplied (`OQ-B01`) |
| **Daily experience / streak mechanics** (D19) | Principles not supplied. Existing engagement system remains unratified (`IG-19`) |
| Native mobile apps | `OQ-A13` |
| Voice / video calls | Provider `OPEN` (`OQ-C03`); Phase 9+ |

---

*Approved phase plan. Decision 39. No phase may begin before its predecessor freezes.*
