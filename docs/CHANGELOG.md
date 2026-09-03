# Anera V2 — Documentation Changelog

| Field | Value |
|---|---|
| **Document name** | `docs/CHANGELOG.md` |
| **Status** | **REFERENCE** |
| **Purpose** | The history of the Anera V2 documentation system. |
| **Scope** | Documentation only. Code changes belong in git history. |
| **Last updated** | 2026-09-03 |

> This changelog records only events that actually occurred and are verifiable from the repository, its git history, or the decision record. It contains no reconstructed or inferred history.

---

## 2026-09-03 — Phase 1 Milestone 5: real routing

The single-page client shell was replaced with App Router routes and server-resolved sessions, delivering the `Frontend` half of Phase 1: *"Server Components by default. Real routing — retire the single-page tab shell."*

### Scope decision

`ROADMAP.md`'s M5 row — signup, login, logout, protected routes — had already been delivered inside M4, whose gate required exactly those. The product owner scoped M5 instead to the routing requirement, and approved the route structure on 2026-09-03. No document was reinterpreted silently; the roadmap now records both readings.

### What changed

`src/app/page.tsx` was the entire application: a `'use client'` component holding every screen, switching between them with React state, asking the server "who am I?" from a `useEffect`, and showing a spinner while it waited. It is now a Server Component that answers the flow's two questions — session valid, then onboarded (`02-APP-FLOW.md` §2.1) — before anything renders.

Routes: `/`, `/login`, `/signup`, `/onboarding`, `/profile`. The `(auth)` and `(app)` route groups carry the guards, which call the existing `getCurrentSession()` — the same PostgreSQL-backed authority the API routes use. No second authentication authority was introduced, and `src/lib/auth/**` was not modified.

The guards are in layouts rather than in `proxy.ts` deliberately: middleware runs before a Prisma session lookup is possible, so a gate there would mean either a second authority or a weaker cookie-presence check.

### Tests

Eight new routing tests (`tests/e2e/routing.spec.ts`), including `TESTING-STRATEGY.md` §4.2 #8's **redirect branch** — *"401 or redirect, never protected content, never a partial render"* — which was unsatisfiable before M5 because there were no page routes to redirect between. It is written as a differential test: it first proves an authenticated request to the same URL does return the protected markup, so its absence for an anonymous client is meaningful rather than incidental.

§4.2 #6 was also strengthened: a session is now shown to carry across genuinely separate documents and a new tab, where before it only crossed one page's state.

### Not done, deliberately

`/api/profile` remains absent — it is M6. Onboarding was **relocated byte-identically** on the product owner's instruction and still cannot complete. It was equally unable to inside the shell; M5 moved it without fixing or disguising it.

### Documentation

`ROADMAP.md`'s Phase 1 status was stale to the point of being false — it recorded M3 as blocked on an unavailable PostgreSQL and M4–M7 as not started. Corrected. `IG-77` was added during inspection, recording that the auth forms use client `fetch` while `API-SPECIFICATION.md` §2 marks Server Actions as `SELECTED`; the frozen M4 route handlers were kept, per the product owner.

### Milestone 5 frozen — 2026-09-03

Frozen at the tag `phase1-m5-frozen`. CI run [`33749330990`](https://github.com/bhanu1245/anera-v2/actions/runs/33749330990) is green across all three jobs. Local gate: typecheck 0, lint 0, production build 0, Vitest 77/77, Playwright 19/19, executable legacy-auth scan clean across all twelve prohibited patterns.

The M4 freeze tag and the legacy preservation snapshot are unmodified.

---

## 2026-09-03 — Phase 1 Milestone 4: authentication replaced

The legacy authentication architecture was replaced with the D37 architecture. No decision was changed; D37 was implemented as written.

### Gaps closed

`IG-01` · `IG-02` · `IG-63` · `IG-65` · `IG-66` · `IG-70` · `IG-74`. Recorded in [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md) §9.6 with the evidence for each. `IG-01` — the register's single blocking item — is among them.

### What was replaced

The MVP minted an HMAC token server-side, returned it in the response body, and had the client store it and replay it as `Authorization: Bearer`; revocation was an in-memory `Set` emptied by every restart. It is now: credentials verified server-side → session row in PostgreSQL → opaque random id in an HTTP-only cookie → server-side lookup on every protected request → revocation by deleting the row.

`src/lib/auth.ts` was deleted rather than adapted (D40 step 4). The `next-auth` dependency, declared since the MVP and never imported, was removed.

### Documentation changes

Only two source-of-truth statements changed, both in `IMPLEMENTATION-GAPS.md`: the gap statuses above, and a `CLOSED` value added to §1.3. `AUTHENTICATION.md` §10 gained a pointer to where its still-open parameters are provisionally implemented. **No decision, requirement or specification was rewritten** — the implementation matched what was already written, including `§8`'s instruction to replace the origin-reflecting CORS policy with an allowlist.

### Still open

`OQ-AUTH-01` (session lifetime, sliding renewal) · `OQ-AUTH-02` (password policy) · `OQ-AUTH-05` (CSRF synchroniser token) · `OQ-AUTH-06` (cookie name, `__Host-` prefix) · `OQ-C05` (rate-limit thresholds). All five are implemented with provisional values collected in `src/lib/auth/config.ts`, each tagged with its id. None is ratified.

### Milestone 4 frozen — 2026-09-03

Frozen at the tag `phase1-m4-frozen`. CI is green across all three jobs — static checks, unit/integration/security tests against a `postgres:16` service container, and the Playwright end-to-end suite — on both the last code commit, run [`33719629582`](https://github.com/bhanu1245/anera-v2/actions/runs/33719629582), and the freeze commit the tag points at, run [`33719994820`](https://github.com/bhanu1245/anera-v2/actions/runs/33719994820). The E2E and integration suites therefore pass on Linux as well as on the Windows development machine.

The first CI run (`33718539851`) failed at `npm ci` because `actions/setup-node` supplied the npm bundled with Node 22, which resolves optional peer dependencies differently from the npm that wrote `package-lock.json`. CI now installs the version named in `package.json`'s `packageManager` field. No application code, test or requirement changed as a result.

---

## 2026-09-02 — Phase 1 Milestones 1–3: D44, D45, Option A removal

First application code changes of the project. Phase 0 documentation unchanged except for status/decision records.

### Decision 44 — Package manager and lockfile

**npm + `package-lock.json` authoritative. `bun.lock` deleted.** Determined from evidence: `package-lock.json` was added by `495cba7` ("Prepare Anera MVP for V2 development") with 14,239 insertions while that same commit left `bun.lock` untouched; npm performed the last install. **`IG-62` closed.**

### Decision 45 — Removal of incompatible Phase 2/3 implementation (Option A)

Approved by the product owner. `BACKEND-SCHEMA.md` §2 scopes Phase 1 to six tables, but 10 source files and ~13 UI components depended on models Phase 1 does not create — so the schema and the MVP code could not coexist without failing the typecheck and build gates.

**Preserved before deletion:** tag `pre-phase1-legacy-snapshot` → commit `abc1b7d9c62c2d8a9315b5831bda121750f0a53b`. Reference only; per D40 it must not be ported forward.

**Removed:** discovery · swipe · matches · messaging/chat · notifications · engagement · `/api/dev` · seed endpoints · `demo-login` · `/api/premium` and `/api/settings` stubs · API scaffolding route · notification mini-service · websocket examples · dependent UI · `types/swipe.ts` · unused vendored `ui/carousel.tsx`.

**Retained:** authentication routes · profile and photo routes · profile UI · auth/profile stores · shared libraries · shadcn/ui library.

**`OQ-SCHEMA-01` resolved — legacy SQLite data discarded, no migration.** `db/custom.db` is gitignored, untracked, absent from the snapshot, and contains only demo/seed fixtures: all 16 users are `@anera.demo`/`demo@anera.app` and **none has a password**.

### Verification after removal

| Check | Before | After |
|---|---|---|
| Typecheck | 43 errors | **0** |
| Lint | 6 errors | **0** |
| Production build | passed with types **skipped** | **passes with type validation enforced** |
| Tests | 4/4 | **4/4** |
| References to removed Prisma models | 10 files | **0** |

`typescript.ignoreBuildErrors` removed from `next.config.ts` per D43; sandbox coupling (`.space-z.ai` origins, `output: "standalone"`) removed per D40.

Three pre-existing defects fixed to clear the gate: zod v4 API migration in `profile-edit-form.tsx` (`required_error` → `error`, `.default()` removal), `useSyncExternalStore` in `use-mobile.ts`, and render-phase state sync in `photo-manager.tsx`.

### Gaps closed

`IG-62` · `IG-26` · `IG-67` · `IG-11` · `IG-76` · `IG-04`. Partial: `IG-21`, `IG-53`, `IG-58`. Superseded by removal (requirement retained): 15 further gaps — see `IMPLEMENTATION-GAPS.md` §9.

### Still blocked

**PostgreSQL is unavailable** in the environment — `psql` absent, Docker daemon not running, port 5432 refused. M4 onward cannot be verified against a real database and has not been started.

---

## 2026-09-02 — `OQ-B06` resolved; Decision 43; **Phase 0 FROZEN**

The last Phase 0 blocker is closed. **Phase 1 may begin.**

Full reasoning: [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) §10.

### Decision 43 — Testing Stack, CI and the Phase 1 Verification Gate

| Concern | Locked |
|---|---|
| Unit / integration runner | **Vitest** |
| E2E / browser | **Playwright** — promoted from `RECOMMENDED` |
| CI provider | **GitHub Actions** |
| Type checking | **TypeScript compiler** |
| Lint | **Project ESLint configuration** |
| Build verification | **Next.js production build** |
| Coverage | **Critical-path baseline + no-regression ratchet — no arbitrary percentage** |

Supersedes D30's `OPEN` entry for testing tools and CI provider; D30's multi-layer-testing and security-gate principles are unchanged.

**Rejected alternatives:** Bun test · Jest · Cypress · a fixed coverage percentage.

**Evidence check before approving:** no existing test framework, no test config, no `.github/`. `bun-types` and the Bun `start` script were considered — Bun's test runner is an alternative, not a conflict. **No incompatibility found.** Playwright's prior `RECOMMENDED` status was preserved as instructed.

**Sequencing constraint recorded, not suppressed:** two lockfiles are committed (`IG-62`); reproducible CI requires choosing one. Already a Phase 1 exit criterion.

### Phase 1 verification gate defined

`TESTING-STRATEGY.md` §4 — the single authoritative definition:

- **§4.1** — 3 static checks: typecheck · lint · production build
- **§4.2** — 20 automated tests covering signup, login, invalid credentials, logout, session persistence after refresh and across navigation, protected-route enforcement, unauthenticated rejection, multi-account isolation, incognito, session expiry and revocation, server-restart survival, database persistence, authorization isolation, and Phase 1 profile behaviour
- **§4.3** — 8 security-boundary assertions that keep the D37 prohibitions gone

### Open questions

`OQ-B06` **resolved** — question text retained, not deleted. `OQ-TEST-01` **resolved** (E2E runs on every PR *and* before every freeze). `OQ-TEST-02` **added** (numeric coverage threshold, deferred by design).

Totals: 179 → **178**; blocking 7 → **6**.

### Phase 0 frozen

All Phase 0 exit criteria met. `ROADMAP.md` status: **❄️ FROZEN 2026-09-02**. Phase 0 documentation is now change-controlled — further edits require a decision.

**All six original blockers (`BL-01`…`BL-06`) are now resolved or substantially resolved**; `00-MASTER-SPECIFICATION.md` Annex A updated accordingly.

### Documents updated — 11

`DECISIONS.md` · `TESTING-STRATEGY.md` · `TECH-STACK.md` · `ROADMAP.md` · `OPEN-QUESTIONS.md` · `ARCHITECTURE-GOVERNANCE.md` · `DEPLOYMENT-OPERATIONS.md` · `README.md` · `00-MASTER-SPECIFICATION.md` · `DOCUMENTATION-AUDIT.md` · `CHANGELOG.md`

### Constraints observed

- **No application code, schema, migration, configuration, environment, deployment or package file modified. No lockfile touched.**
- No gap closed — `IG-21` and `IG-62` remain Phase 1 items.
- **No coverage percentage invented.**
- No legacy pattern revived; §4.3 actively tests four of them stay absent.

---

## 2026-09-02 — Canonical documentation pass; Decisions 36–42 approved

The largest change in the project's history. **Three blockers standing since 2026-08-30 are resolved.**

Full reasoning: [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) §9.

### Conflicts escalated before work began

Three items in the V2 brief contradicted approved decisions and were **put to the product owner rather than actioned**:

| Conflict | Resolution |
|---|---|
| Brief specified 5 tiers (Free/Premium/**Gold**/**Platinum**/Elite); **D26 approved 4** (Free/**Plus**/Premium/Elite) | Product owner chose 5 tiers → **D38 supersedes D26's tier names**; "Plus" `DEPRECATED` |
| Brief locked **Next.js 15**; `package.json` has **^16.1.1** — a major-version downgrade | Product owner confirmed **16.x**; "15" was an error |
| Brief reversed the same-day taxonomy decision (nested dirs, split master spec, `FEATURE-SPECIFICATION.md`, `REFERRAL-ENGINE.md`) | Product owner chose to **keep the flat structure** → **D41** |

### Decisions approved — 36 to 42

| # | Decision | Effect |
|---|---|---|
| **36** | V2 Technology Stack | Locks Next.js 16, TypeScript, Tailwind, Prisma, **PostgreSQL**, HTTP-only cookies, bcrypt, minimal Zustand. SQLite `DEPRECATED` |
| **37** | V2 Authentication Architecture | **HTTP-only cookie + server-side validation, single source of truth.** Seven prohibitions. **Resolves `OD-09` / `OQ-B02` / `IG-01`** |
| **38** | Subscription Tier Structure | **Free · Premium · Gold · Platinum · Elite.** Supersedes D26 tier names; D26's model and eight prohibitions retained |
| **39** | Phased Implementation Plan | **Thirteen phases (0–12)** with a mandatory gate between each. **Resolves `OD-29` / `OQ-B03`** |
| **40** | Legacy Code Policy | Five-step gate. All MVP auth and infra artefacts classified `DEPRECATED` |
| **41** | Documentation Taxonomy | Flat structure; no duplicate sources of truth; master specification not split |
| **42** | Principles for Decisions 16–23 | D16, D17, D18, D20, D22, D23 upgraded to `APPROVED`. **D19 and D21 remain `SCOPE ONLY`** |

**Revised rule NR-09:** *Free, Premium, Gold, Platinum and Elite users can all purchase eligible individual extras.*
**New rules NR-31…NR-35:** cookie-only auth · server-side authorization · no phase-gate skipping · legacy not auto-approved · no duplicate sources of truth.

### Documents created — 18

`01-PRODUCT-BLUEPRINT` · `02-APP-FLOW` · `TECH-STACK` · `SYSTEM-ARCHITECTURE` · `BACKEND-SCHEMA` · `API-SPECIFICATION` · `AUTHENTICATION` · `REALTIME-ARCHITECTURE` · `DATING-CORE` · `AI-ARCHITECTURE` · `SOCIAL` · `EVENTS` · `ELITE` · `SECURITY-GUIDELINES` · `VERIFICATION` · `FRAUD-PREVENTION` · `TESTING-STRATEGY` · `DEPLOYMENT-OPERATIONS`

`SOCIAL.md` is the **first appearance of social scope** in Anera documentation. `AI-ARCHITECTURE.md` closes `OQ-G07`, deferred earlier the same day.

### Documents not created — 9

`03-FEATURE-SPECIFICATION` · `PREMIUM-MONETIZATION` · `REFERRAL-ENGINE` · `PRIVACY` · `ADMIN-RBAC` · `GLOBALIZATION` · `04-ROADMAP` · `05-DECISIONS` · nested directories — all would have duplicated an existing carrier or reversed D41. Existing carriers were updated instead.

### Documents updated — 10

`DECISIONS.md` · `ROADMAP.md` (**rewritten `DRAFT / BLOCKED` → `APPROVED`**) · `SUBSCRIPTION-MONETIZATION.md` (five tiers) · `FEATURE-INVENTORY.md` · `README.md` (§3.2.2 index of the 18 new documents) · `OPEN-QUESTIONS.md` · `IMPLEMENTATION-GAPS.md` (`IG-01` reclassified) · `00-MASTER-SPECIFICATION.md` (**§13.4 binding rule lifted**) · `DOCUMENTATION-AUDIT.md` · `CHANGELOG.md`.

### Contradiction found and fixed

**`F-13`** — `DECISIONS.md` D30's stack note said the stack's *"future status is `OPEN / UNDECIDED`"*, contradicting D36 which locks it. A supersession note was added; D30's principles are unchanged.

### Register movement

| Register | Before | After |
|---|---|---|
| Approved decisions | 20 | **27** |
| Open questions | 153 (9 blocking) | **179 (7 blocking)** |
| Implementation gaps | 76 | **76** — none closed |
| Non-negotiable rules | 30 | **35** |

### Constraints observed

- **No application code, schema, migration, configuration, environment or package file was modified.**
- No gap fixed — remediation belongs to Phase 1.
- **No price, reward amount, metric formula, provider or legal determination invented.**
- No decision silently overwritten; D26's supersession is explicit and recorded.

---

## 2026-09-02 — Documentation taxonomy review

The product owner proposed a 19-file "authoritative core" taxonomy. All 19 proposed files were cross-referenced against all 19 existing documents. **No approved decision was lost.**

Full reasoning: [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) §8.

### Documents renamed (2)

| From | To | References updated |
|---|---|---|
| `IMPLEMENTATION-ROADMAP.md` | `ROADMAP.md` | 11 across 5 documents |
| `TRUST-SAFETY.md` | `TRUST-AND-SAFETY.md` | 14 across 6 documents |

Content unchanged in both. Historical event records in this changelog and in audit finding `F-04` deliberately **retain the original filenames**, because they record what happened on 2026-09-01.

### Rename rejected (1)

`REFERRAL-ECONOMY.md` → `REFERRAL-ENGINE.md` — **rejected, name kept.** Verified against source: D27's approved title is **"Referral & Growth Economy"**, and the document carries ambassador/community growth, creator/community and partner referrals. "Engine" narrows the scope and drops the growth-economy framing, contrary to the rule requiring Anera terminology to be preserved exactly.

### Creations rejected (3)

| Proposed | Reason |
|---|---|
| `FEATURE-SPECIFICATION.md` | Duplicates `FEATURE-INVENTORY.md` (313 features, 25 domains) |
| `MONETIZATION.md` | Would split D26 across two files |
| `SUBSCRIPTIONS.md` | Would duplicate the extras rule and the eight prohibitions |

### Deferred (1)

`AI-ARCHITECTURE.md` — the only genuinely missing document. **Not created.** Tracked as **`OQ-G07`**, blocked on `OQ-B01` (D18 supplies no principles) and `OQ-AI01`…`OQ-AI08` (no provider, model or boundary approved).

### Structural decision — master specification not split

**`00-MASTER-SPECIFICATION.md` remains a single as-built source of truth.** Eleven proposed documents resolve to sections of it; extracting them was rejected because every candidate section is partial rather than approved, a `TECH-STACK.md` filename would contradict D30 (no technology approved), and §13.4 / §26.1 carry binding rules that must not exist in two drifting copies.

**Revisit only when both conditions hold:** the section's content is fully `APPROVED` (not partial/open), **and** it has grown large enough to be genuinely hard to navigate inside the master document. Neither holds today.

### Documents modified (4)

| Document | Change |
|---|---|
| `README.md` | Added **§3.2.1 Decision-to-document map** — every approved decision mapped to its sole carrier, with what would be lost if dropped. Standing rule added: a taxonomy proposal is incomplete if it does not account for every row. |
| `OPEN-QUESTIONS.md` | Added `OQ-G07`. Totals 152 → **153**; Governance 6 → 7. |
| `DOCUMENTATION-AUDIT.md` | Added **§8 Taxonomy review** with the mapping result, all rejections and their reasons, and the master-specification split rationale. |
| `CHANGELOG.md` | This entry. |

### Correction — `FEATURE-INVENTORY.md` domain count (`F-12`)

Four documents described `FEATURE-INVENTORY.md` as covering **"27 domains"**. Recounted: the file has 29 numbered sections, of which **25 are feature domains** (§3 Authentication … §27 Notifications); §1–§2 are intro/summary and §28–§29 are cross-cutting/rules.

**Corrected to 25** in `README.md` (§3.3), `CHANGELOG.md` (this entry's *Creations rejected* table, and the 2026-09-01 entry's *Documents created* table) and `DOCUMENTATION-AUDIT.md` (§8.2). The figure was a carry-over from the 28-item drafting list that was never recomputed after domains were consolidated during writing. `FEATURE-INVENTORY.md` itself never stated a count.

The occurrence in the 2026-09-01 entry was corrected there too: "27 domains" was never true, so preserving it would propagate an error — unlike the filenames in that entry, which were accurate on that date. Reasoning in `DOCUMENTATION-AUDIT.md` §8.6.

The adjacent "21 analytics domains" figure was cross-checked and is **correct** — no change.

### Finding recorded

The proposed core accounted for only 6 of 19 existing documents. **Six of the thirteen unaccounted-for files are the sole home of an approved decision** — D28, D29, D30, D31, D33, D35. Mitigated by the new `README.md` §3.2.1 map.

### Constraints observed

- **No application code was modified.**
- No document deleted; no approved decision lost, merged away or reworded.
- No new document created.
- No implementation gap closed — all 76 remain open.
- No open question answered — one added.

---

## 2026-09-01 — Decisions 16–35 approved; documentation system established

### Decisions approved

The product owner approved **twenty decisions**, numbered 16–35. **This is the first decision record in the project's history** — before this date, no approved product decision existed in the repository.

| # | Decision | Principles supplied |
|---|---|---|
| 16 | Experiences & Speed Dating | ❌ scope only |
| 17 | Enhanced Interactions & Digital Economy | ❌ scope only |
| 18 | Anera AI Intelligence | ❌ scope only |
| 19 | Daily Experience, Retention & Engagement | ❌ scope only |
| 20 | User Value, Rewards & Earning | ❌ scope only |
| 21 | Marketplace & Services | ❌ scope only |
| 22 | Events, Hosts & Community Economy | ❌ scope only |
| 23 | Anera Elite & Concierge | ❌ scope only |
| 24 | Trust, Safety, Identity & Authenticity | ❌ scope only (detail carried by Decision 34) |
| 25 | Globalization & Local-First Discovery | ❌ scope only (detail carried by Decision 35) |
| 26 | Subscription, Pricing & Monetization | ✅ approved clarification |
| 27 | Referral & Growth Economy | ✅ |
| 28 | Data, Privacy & Personalization | ✅ |
| 29 | Analytics, Intelligence & Business Operating System | ✅ |
| 30 | Platform Architecture & Technical Governance | ✅ |
| 31 | UX, UI & Design System | ✅ |
| 32 | Administration, Operations & Internal Control System | ✅ |
| 33 | Communication & Social Interaction System | ✅ |
| 34 | Trust, Safety, Identity & Authenticity | ✅ |
| 35 | Global Launch, Localization & Regional Operating Model | ✅ |

**Key approved clarification (Decision 26):** *Free, Plus, Premium and Elite users can all purchase eligible individual extras. Subscriptions provide bundled value; extras provide flexibility.*

### Documents created

| Document | Status |
|---|---|
| `DECISIONS.md` | APPROVED — the decision register; Priority 1 authority |
| `README.md` | REFERENCE — documentation index and authority hierarchy |
| `TRUST-SAFETY.md` | APPROVED — from Decisions 34 and 24 |
| `PRIVACY-GUIDELINES.md` | APPROVED — from Decision 28 |
| `SUBSCRIPTION-MONETIZATION.md` | APPROVED — from Decision 26 |
| `REFERRAL-ECONOMY.md` | APPROVED — from Decision 27 |
| `COMMUNICATION.md` | APPROVED — from Decision 33 |
| `ANALYTICS.md` | APPROVED — from Decision 29 |
| `ARCHITECTURE-GOVERNANCE.md` | APPROVED — from Decision 30 |
| `UX-DESIGN-GUIDELINES.md` | APPROVED — from Decision 31 |
| `ADMIN-OPERATIONS.md` | APPROVED — from Decision 32 |
| `GLOBAL-OPERATING-MODEL.md` | APPROVED — from Decisions 35 and 25 |
| `FEATURE-INVENTORY.md` | REFERENCE — 25 domains, feature-by-feature approval and implementation status |
| `IMPLEMENTATION-GAPS.md` | REFERENCE — 76 verified gaps |
| `IMPLEMENTATION-ROADMAP.md` | DRAFT / BLOCKED — records that no phase is approved |
| `OPEN-QUESTIONS.md` | OPEN — 152 unresolved items, 9 blocking |
| `DOCUMENTATION-AUDIT.md` | REFERENCE — cross-document consistency audit |
| `CHANGELOG.md` | REFERENCE — this document |

### Documents modified

| Document | Change |
|---|---|
| `00-MASTER-SPECIFICATION.md` | **Annotated, not rewritten.** Added a prominent notice after the metadata block, a table-of-contents entry, and **Annex A — Post-Decision Update**. Metadata `Status` and `Last updated` revised. **Sections 1–38 are unchanged**, preserving the 2026-08-30 audit's historical accuracy. |

### Open decisions closed by these decisions

Sixteen entries in the master specification's §33.1 register were superseded. The most significant:

- `OD-22` **Trust & Safety** — was recorded as an unresolved product decision; **now APPROVED** through Decision 34. Trust & Safety is a core platform capability.
- `OD-21` **Referral** — was recorded as entirely unspecified; **now APPROVED** through Decision 27.
- `OD-23` **Payments**, `OD-24` **Admin**, `OD-25` **Analytics**, `OD-27` **Privacy**, `OD-13` **Architecture**, `OD-18` **Messaging**, `OD-11` **Design**, `OD-07` **Roles** — all now approved in principle.
- `OD-03` **Market** and `OD-16` **Discovery** — approved in part through Decision 35 (global platform, local-first discovery).

The full mapping is in `00-MASTER-SPECIFICATION.md` Annex A §A.2.

### Open decisions that remain open

- **`OD-09` — the localStorage/Bearer authentication conflict.** **No decision addresses it.** Still blocking.
- **`OD-29` — the phase list.** No decision defines phases. Still blocking.
- Plus `OD-01`, `OD-04`, `OD-05`, `OD-06`, `OD-10`, `OD-12`, `OD-14`, `OD-15`, `OD-17`, `OD-28`, `OD-30`, `OD-31`.

### Governance items raised

| ID | Item |
|---|---|
| `OQ-G01` | **Decisions 1–15 are absent from this repository.** Their content is unknown and nothing may be attributed to them. |
| `OQ-G02` | **Decision numbering anomaly** — Decisions 24 and 34 share a title; 25 and 35 cover the same subject area. Both pairs retained verbatim; neither merged nor renumbered. |

### Corrections made during the consistency audit

The cross-document audit raised eleven findings; six were corrected in place and five were escalated. The corrections were:

| ID | Correction |
|---|---|
| `F-01` | `IMPLEMENTATION-GAPS.md` gap counts recounted — 74 → **76**; Low 16 → 18; type counts corrected. |
| `F-02` | `OPEN-QUESTIONS.md` item count corrected 96 → **152**; legal-review items corrected 16 → **10** and listed by ID. |
| `F-03` | `FEATURE-INVENTORY.md` summary recounted against the actual tables — Existing 34 → **38**, Approved/Not-Yet-Built 71 → **205**, and the full status distribution corrected. |
| `F-04` | Malformed gap identifier `IG-36b` in `TRUST-SAFETY.md` reassigned to `IG-61` and defined in the register. |
| `F-05` | `00-MASTER-SPECIFICATION.md` annotated with a notice, a TOC entry and Annex A rather than rewritten. |
| `F-06` | Numbered/unnumbered document overlap mapped in `README.md` §5.1 to prevent duplicate documents of record. |

Escalated without resolution: `F-07` (Decision 24/34 and 25/35 numbering overlap), `F-08` (Decisions 1–15 absent), `F-09` (conversation privacy vs AI-assisted moderation — **a contradiction between two approved decisions**), `F-10` (global account portability vs country-specific rules — **also between two approved decisions**), `F-11` (`IG-01`, the authentication conflict, unresolved by Decisions 16–35).

### Constraints observed during this change

- **No application code was modified.** No file under `src/`, `prisma/`, `mini-services/`, `public/`, no configuration file, no environment file, and no package file was created, changed or deleted.
- **No dependency was added or removed.**
- **No gap was fixed.** All 76 recorded gaps remain open by design.
- **No requirement was invented.** Every undecided parameter is marked `OPEN / UNDECIDED`.
- **No conflict was silently resolved.** All conflicts are recorded with both sources named.

---

## 2026-08-30 — Master specification created

### Document created

| Document | Status |
|---|---|
| `00-MASTER-SPECIFICATION.md` | BASELINE — 38 sections, produced from a full repository audit |

### Context

`docs/` did not exist before this date. The audit established, and git history across all commits confirmed, that **no product specification, vision document, architecture document, or decision log had ever existed in this repository**.

### What the audit recorded

| Finding | Count |
|---|---|
| Open decisions (`OD-01`…`OD-31`) | 31 |
| Conflicts (`CONF-01`…`CONF-10`) | 10 |
| Security findings (`SEC-01`…`SEC-12`) | 12 |
| Security controls to preserve (`SEC-P1`…`SEC-P11`) | 11 |
| Known technical issues (`TI-01`…`TI-14`) | 14 |
| Authentication gaps (`AUTH-01`…`AUTH-07`) | 7 |
| Risks (`RISK-01`…`RISK-18`) | 18 |
| Blockers (`BL-01`…`BL-06`) | 6 |
| Implemented behavioural rules (`R-01`…`R-25`) | 25 |

### Principal findings

1. **No approved specification existed.** Recorded as the audit's most important finding (§2.4).
2. **The authentication conflict (`CONF-01`)** — the session token is stored in `localStorage` and sent as a Bearer header, contradicting the standing security posture, with no approval record.
3. **The verification badge conflict (`CONF-06`)** — the UI renders a verified badge while the API hardcodes `isVerified: false` and no verification system exists.
4. **No referral system, AI functionality, admin platform, moderation capability, payment system or automated test existed.**

### Sources reviewed

`worklog.md`; `agent-ctx/*.md` (3 files); `prisma/schema.prisma` and its migration; all 24 API route files; `src/lib/*`; `src/proxy.ts`; the application shell, stores, types and component tree; `mini-services/notification-service/*`; and all build, runtime and environment configuration.

---

## Earlier — before documentation existed

| Date | Event |
|---|---|
| 2026-08-30 | Commit `495cba7` "Prepare Anera MVP for V2 development" — the MVP was prepared for V2 work. No documentation accompanied it. |
| Earlier | MVP development in a hosted sandbox environment. Recorded only in `worklog.md` and `agent-ctx/*.md`, which are implementation records, not specifications. Commit messages in this period are UUIDs and carry no description. |

> No further history is recorded, because none is verifiable from the repository.

---

## Changelog rules

1. Record documentation events only. Code changes belong in git history.
2. Record what actually happened. **Never reconstruct or infer history.**
3. Every decision approval, document creation, document modification, gap closure and open-question resolution is recorded here.
4. New entries go at the top, dated.
5. Update this file **in the same change** that alters the documentation system.

---

*Documentation history for Anera V2. Approved decisions live in `docs/DECISIONS.md`.*
