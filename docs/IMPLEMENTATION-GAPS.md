# Anera V2 — Implementation Gap Register

| Field | Value |
|---|---|
| **Document name** | `docs/IMPLEMENTATION-GAPS.md` |
| **Status** | **REFERENCE** — a register of verified findings. It approves nothing and requires nothing on its own. |
| **Authority** | Derived from the repository audit in [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) (2026-08-30) and the approved decisions in [`DECISIONS.md`](DECISIONS.md) (2026-09-01). |
| **Purpose** | The single register of every place where the current implementation conflicts with, or falls short of, an approved decision — or is otherwise technical debt. |
| **Last updated** | 2026-09-03 — Phase 1 M6 profile/preferences (§9.8). `IG-78`, `IG-79`, `IG-80` added during M6 inspection; `IG-18` photo surface contained. |
| **Gaps recorded** | 76 |

---

## 1. How to use this document

> ### **FIX A GAP ONLY INSIDE ITS APPROVED PHASE.**
>
> Remediation happens inside an approved implementation phase. Fixing a gap opportunistically violates the approved phase-by-phase method and Decision 30's stop-and-surface rule.
>
> **Updated 2026-09-02:** Phase 0 is frozen and **Phase 1 is in progress** (D39), so gaps in Phase 1 scope are now actively being closed — see **§9**. The rows in §3–§6 record the **original 2026-08-30 finding** and are not rewritten; §9 carries current status. Gaps outside Phase 1 scope remain untouched.

### 1.1 Gap types

| Type | Meaning |
|---|---|
| **CONFLICT** | The code actively contradicts an approved decision, or two parts of the repository contradict each other. |
| **IMPLEMENTATION GAP** | An approved requirement exists and nothing implements it. |
| **TECHNICAL DEBT** | A quality or maintainability problem that does not contradict an approved decision. |
| **UNRESOLVED** | A conflict that no approved decision resolves — it needs a product-owner decision before it can even be scheduled. |

### 1.2 Risk ratings

`Critical` · `High` · `Medium` · `Low` — engineering risk assessment, **not** an approved priority. Sequencing is the product owner's decision.

### 1.3 Status values

| Status | Meaning |
|---|---|
| `OPEN — BLOCKED` | Cannot be scheduled until a decision is made. |
| `OPEN — AWAITING PHASE` | Requirement is approved; awaits an approved implementation phase. |
| `OPEN — DEBT` | Technical debt; awaits an approved phase. |
| ✅ `CLOSED — <milestone> (<date>)` | Remediated, tested and accepted inside an approved phase. The row keeps its original 2026-08-30 finding text; §9 records what was done. |

### 1.4 Provenance

Gap IDs (`IG-nn`) are new in this document. They map to the master specification's original audit identifiers (`CONF-nn`, `SEC-nn`, `TI-nn`, `AUTH-nn`, `RISK-nn`), which are preserved in the *Origin* column so the 2026-08-30 audit remains traceable.

---

## 2. Summary

| Risk | Count |
|---|---|
| Critical | 12 |
| High | 21 |
| Medium | 25 |
| Low | 18 |
| **Total** | **76** |

| Type | Count |
|---|---|
| CONFLICT | 18 |
| IMPLEMENTATION GAP | 41 |
| TECHNICAL DEBT | 16 |
| UNRESOLVED | 1 |
| **Total** | **76** |

> Gap IDs are labels, not a contiguous sequence. The highest id in use is `IG-80`; some numbers in the range are unused.
>
> `IG-77` (M5 inspection) and `IG-78`, `IG-79`, `IG-80` (M6 inspection) were found on 2026-09-03 and are **not** part of the 2026-08-30 audit, so they are excluded from the counts above, which record that audit.

**`IG-01` was the single blocking item** — the authentication conflict. Decisions 16–35 did **not** resolve it; **Decision 37** did, and Phase 1 Milestone 4 implemented it. Closed 2026-09-03 (§9.6).

> The counts above are the original 2026-08-30 audit totals and are deliberately not decremented as gaps close — the register records what was found, and §9 records what has since been remediated.

---

## 3. Critical

| ID | Domain | Current state | Approved requirement | Gap / conflict | Type | Resolution required | Decision dependency | Status | Origin |
|---|---|---|---|---|---|---|---|---|---|
| **IG-01** | Authentication | Session token written to `localStorage` and sent as `Authorization: Bearer` | HTTP-only cookie is the **single** auth source of truth; server-side validation; **no localStorage tokens, no Bearer transport, no `authReady`/`waitForAuth`/hydration-as-auth** | Code contradicts the approved architecture | CONFLICT | **Remove the entire legacy auth path** and replace with DB-backed cookie sessions. Scope: `AUTHENTICATION.md` §8 | ✅ **RESOLVED by Decision 37** (2026-09-02) | ✅ `CLOSED — M4 (2026-09-03)` | `CONF-01`, `SEC-02`, `OD-09` |
| **IG-28** | Communication / T&S | No `Block` model; no blocking anywhere | D33 blocking; D34 **immediate blocking** | Approved twice; entirely absent | IMPLEMENTATION GAP | Design and build blocking, incl. block semantics | D33, D34 | `OPEN — AWAITING PHASE` | §22 audit |
| **IG-29** | Communication / T&S | Nothing can be reported — no profile, photo or message reporting | D33 reporting; D34 reporting | Approved twice; entirely absent | IMPLEMENTATION GAP | Design and build reporting, incl. categories and triage | D33, D34 | `OPEN — AWAITING PHASE` | §22 audit |
| **IG-30** | Communication / Security | No rate limiting, lockout, CAPTCHA or anti-spam anywhere in the application | D33 anti-spam; D33 **risk-based rate limiting** | Entirely absent; also a live security exposure (brute force, enumeration, spam) | IMPLEMENTATION GAP | Build risk-based rate limiting and anti-spam | D33, D34 | `OPEN — AWAITING PHASE` | `SEC-03`, `AUTH-06` |
| **IG-32** | Trust & Safety | No moderation queue, review workflow, classification, moderator role, enforcement actions, account status field, ban/suspension or appeals | D34 AI-assisted moderation, human review, risk-based enforcement, false-positive protection, appeals | The entire enforcement capability is absent, including the data model to represent it | IMPLEMENTATION GAP | Design the enforcement model; requires D34 parameters first | D34, D32 | `OPEN — BLOCKED` | §22 audit |
| **IG-12** | Privacy | No account deletion, no data export, no retention policy; only 2 foreign keys in the whole schema | D28 data deletion, retention controls, data export where applicable | Deletion is unimplementable reliably — a user delete would orphan rows across 7 tables | IMPLEMENTATION GAP | Data classification, then FK/cascade decision, then deletion/export | D28, `OD-14` | `OPEN — BLOCKED` | `SEC-12`, §27 audit |
| **IG-26** | Administration | `/api/dev` has **no authentication**; gated only by `NODE_ENV`; exposes `login-as` (impersonate any user) and `reset-database` (delete all data) | D32 RBAC, least privilege, MFA, audit logs, separation of duties, no shared accounts, no raw DB access | Fails all seven approved admin controls simultaneously | CONFLICT | Decide disposition of `/dev`; build the real admin platform | D32 | `OPEN — AWAITING PHASE` | `SEC-04` |
| **IG-67** | Authentication / Security | `POST /api/auth/demo-login`, `/api/seed`, `/api/seed/bulk` create fully authenticated sessions with **no credential** and **no environment gate** | Security posture: no authentication shortcuts | Anyone can obtain a valid session in any environment | CONFLICT | Environment-gate or remove; decide fate of seed endpoints | `OD-15`, D30, D32 | `OPEN — AWAITING PHASE` | `SEC-07`, `AUTH-04`, `AUTH-05` |
| **IG-65** | Security | `SESSION_SECRET` falls back to the literal `'anera-dev-secret-change-in-production'`, committed to the repo and duplicated in the notification mini-service | Security posture: do not expose secrets or credentials | If the env var is unset in production, every session token is forgeable by anyone who reads the repository | CONFLICT | Remove the fallback; fail closed; secret management decision | D30, `OD-12` | ✅ `CLOSED — M4 (2026-09-03)` | `SEC-01`, `AUTH-01`, `RISK-02` |
| **IG-33** | Verification | No identity, photo, phone or email verification of any kind | D34 identity verification, **progressive verification**, profile authenticity, photo authenticity | The entire verification capability is absent | IMPLEMENTATION GAP | Requires D34 parameters (levels, providers) before design | D34 | `OPEN — BLOCKED` | §22 audit |
| **IG-21** | Testing / Delivery | Zero test files; no test script; no CI; `typescript.ignoreBuildErrors: true`; ~25 ESLint rules disabled including `react-hooks/exhaustive-deps` | D30 multi-layer testing, security gates; standing phase-gate requiring per-phase tests | The mandated per-phase verification has no mechanism | IMPLEMENTATION GAP | Choose tooling; establish CI; re-enable type/lint gates | D30, `OD-28` | `OPEN — BLOCKED` | §28 audit, `BL-06` |
| **IG-05** | Privacy / Security | `GET /api/profile?userId=…` is **unauthenticated** and returns any user's full profile: name, age, gender, bio, city, photos | D28 privacy by design, data minimization | Enumerable personal data exposure | CONFLICT | Require authentication; decide what a non-match may see | D28 | `OPEN — AWAITING PHASE` | `SEC-05`, `RISK-09` |

---

## 4. High

| ID | Domain | Current state | Approved requirement | Gap / conflict | Type | Resolution required | Decision dependency | Status | Origin |
|---|---|---|---|---|---|---|---|---|---|
| **IG-06** | Verification | `swipe-card.tsx` renders a verified badge from `profile.isVerified`; `api/discover/route.ts` hardcodes `isVerified: false`; no verification system exists | D34 identity verification, progressive verification, profile authenticity | A UI promise with no backing capability; the badge can never appear | CONFLICT | Do **not** simply make the flag return true — progressive verification needs a design, not a boolean | D34 | `OPEN — BLOCKED` | `CONF-06` |
| **IG-16** | Discovery / Global | `GET /api/discover` returns every onboarded, unswiped profile ordered by creation date, capped at 20 — no locality, no filters, no ranking | D35 **local discovery first**; expansion ladder Nearby → City → Region → Country → Global; user-controlled expansion | The exact inverse of local-first | CONFLICT | Requires a location data model decision first | D35, D25, `OD-14`, `OD-16` | `OPEN — BLOCKED` | §16 audit, `RISK-15` |
| **IG-44** | Discovery / Data | `Profile.city` is a free-text string; no coordinates, no geo data, no region/country model | D35 expansion ladder; local-first | The ladder is unimplementable on the current schema | IMPLEMENTATION GAP | Location data model decision (precision, obfuscation, privacy) | D35, D28, `OD-14` | `OPEN — BLOCKED` | §14 audit |
| **IG-11** | Subscriptions | `/api/premium` is a stub returning hardcoded `isPremium: false`; `POST` persists nothing; no `Subscription` model; no tier concept | D26 four tiers; extras purchasable by all tiers; D30 commerce/entitlement architecture | Monetization is entirely unimplemented | IMPLEMENTATION GAP | Requires D26 entitlements and pricing (both undecided) | D26, D23, D30 | `OPEN — BLOCKED` | §23 audit |
| **IG-43** | Commerce | No ledger, no entitlement model, no commerce architecture | D30 commerce/entitlement architecture, **auditable ledgers**; D32 ledger-based adjustments | Absent | IMPLEMENTATION GAP | Design commerce architecture with ledgers from the start | D30, D26, D27, D32 | `OPEN — BLOCKED` | new |
| **IG-14** | Analytics | `EngagementAction` rows written for `swipe`/`match`/`login` and **never read**; no platform, pipeline, telemetry, dashboard or error monitoring | D29 — 21 approved analytics domains | No analytics capability exists | IMPLEMENTATION GAP | Requires event taxonomy and platform decisions | D29 | `OPEN — BLOCKED` | §25 audit |
| **IG-20** | Referrals | Zero referral code, schema, instrument, ledger, fraud control or analytics | D27 six referrer types, qualification-based rewards, referral ledger, fraud prevention | Greenfield — nothing exists | IMPLEMENTATION GAP | Requires D27 parameters (amounts, qualification, limits) | D27 | `OPEN — BLOCKED` | §21 audit |
| **IG-27** | Administration | No `role` field, no permission table, no role checks, no audit log table | D32 RBAC, least privilege, audit logs | The admin control model is unrepresentable | IMPLEMENTATION GAP | Requires the D32 permission matrix (undecided) | D32, D28 | `OPEN — BLOCKED` | §7 audit |
| **IG-56** | Trust & Safety | No central Trust & Safety module; safety-adjacent checks are inline in feature code | D30 **central Trust & Safety architecture** | Safety is not architecturally central | IMPLEMENTATION GAP | Design the central T&S module | D30, D34 | `OPEN — BLOCKED` | new |
| **IG-09** | Architecture | No domain modules, no service layer; route handlers call Prisma directly | D30 modular / domain-oriented architecture; **modular monolith** | It is a monolith but not a modular one | IMPLEMENTATION GAP | Define domain boundaries (undecided) | D30 | `OPEN — BLOCKED` | §12 audit |
| **IG-54** | Architecture | Discovery, matching and ranking are one endpoint; ranking does not exist | D30 **separate discovery / matching / ranking responsibilities**; dedicated matching architecture | Responsibilities collapsed | IMPLEMENTATION GAP | Requires matching logic decision (`OD-17`, undecided) | D30, `OD-17` | `OPEN — BLOCKED` | §16, §17 audit |
| **IG-58** | Infrastructure | SQLite database file (gitignored) plus local-disk photo uploads under `public/uploads` | D30 evidence-based architecture evolution | Cannot support multi-instance deployment; no reproducible database state | TECHNICAL DEBT | Database and storage decisions (`OD-14`, `OD-12`) | D30, `OD-12`, `OD-14` | `OPEN — BLOCKED` | `RISK-05`, `TI-08` |
| **IG-70** | Authentication | Token revocation blocklist is an in-memory `Set`, capped at 10 000, cleared on restart; its eviction deletes the first half of insertion order | Security posture: sessions must be revocable | Revocations lost on restart; not shared across instances; eviction can drop live revocations | TECHNICAL DEBT | Durable revocation store; depends on `IG-01` resolution | `OD-09`, `OD-13` | ✅ `CLOSED — M4 (2026-09-03)` | `AUTH-03`, `RISK-07` |
| **IG-63** | Authentication | Cookie expires after 30 days; the token itself carries **no expiry claim**, so the Bearer path is effectively unlimited | Security posture: server-side session handling | The two transports disagree about session lifetime | CONFLICT | Token expiry decision; depends on `IG-01` | `OD-09` | ✅ `CLOSED — M4 (2026-09-03)` | `CONF-09`, `AUTH-02` |
| **IG-66** | Security | `src/proxy.ts` reflects any request `Origin` and sets `Access-Control-Allow-Credentials: true`, with no allowlist | Security posture: preserve security boundaries | Any origin can make credentialed API calls | CONFLICT | Origin allowlist; depends on deployment decision | `OD-12`, D30 | ✅ `CLOSED — M4 (2026-09-03)` | `SEC-06`, `RISK-10` |
| **IG-18** | Privacy / Media | Photos written to `public/uploads` and served directly; no access control, no signed URLs, no CDN, no content scanning | D28 data classification, media privacy; D30 media architecture | Unmoderated, publicly addressable personal media | IMPLEMENTATION GAP | Media architecture decision | D28, D30, D34 | `OPEN — BLOCKED` | `SEC-10` |
| **IG-37** | Privacy | No consent capture, no privacy policy, no terms of service anywhere in the product | D28 privacy by design, regional privacy configuration | Absent | IMPLEMENTATION GAP | Requires legal review and consent model decision | D28 | `OPEN — BLOCKED` | §27 audit |
| **IG-38** | Privacy | No data classification exists | D28 **data classification** | Every downstream privacy control (retention, export, least-privilege access) is unscopeable without it | IMPLEMENTATION GAP | Classification scheme decision — a prerequisite, not a refinement | D28 | `OPEN — BLOCKED` | new |
| **IG-49** | Administration | No MFA, no step-up authentication, no approval workflows, no separation of duties | D32 controls 5 and 6 | Unrepresentable in the current system | IMPLEMENTATION GAP | Identity provider and workflow decisions | D32 | `OPEN — BLOCKED` | new |
| **IG-10** | Architecture | No observability, no error monitoring, no queues, no background jobs, no feature flags; engagement prompts computed synchronously inside a request | D30 observability, background jobs/queues, feature flags; D29 feature flags | Absent | IMPLEMENTATION GAP | Tooling decisions | D30, D29 | `OPEN — BLOCKED` | §12, §25 audit |
| **IG-35** | Trust & Safety | Age is a self-declared integer with an 18–120 range check; no verification | D34 age / eligibility protection | No actual age assurance | IMPLEMENTATION GAP | Age-verification method decision; requires legal review | D34 | `OPEN — BLOCKED` | §22 audit |

---

## 5. Medium

| ID | Domain | Current state | Approved requirement | Gap / conflict | Type | Resolution required | Decision dependency | Status | Origin |
|---|---|---|---|---|---|---|---|---|---|
| **IG-02** | Authentication | `next-auth@^4.24.11` declared in `package.json` and **never imported**; auth is hand-rolled HMAC | D30 central authentication governance | The intended auth approach is ambiguous to any reader | CONFLICT | Decide the auth approach; remove or adopt the dependency | D30, `OD-09` | ✅ `CLOSED — M4 (2026-09-03)` | `CONF-02` |
| **IG-03** | Design system | Two Tailwind configs: v3-style `tailwind.config.ts` (content globs pointing at non-existent `./app`, `./components`, `./pages`) and effective v4 `@theme` in `globals.css` | D31 **consistent design system** | Conflicting configuration; only one is effective | CONFLICT | Remove the dead config | D31 | `OPEN — AWAITING PHASE` | `CONF-03`, `TI-05` |
| **IG-31** | Communication | Chat polls `GET /api/messages` every 5 seconds; the authenticated Socket.IO service carries notifications only | D30 real-time architecture; D33 messaging | Real-time infrastructure exists and is unused for chat | IMPLEMENTATION GAP | Real-time transport decision | D30, D33 | `OPEN — BLOCKED` | §18 audit |
| **IG-25** | Globalization / UX | No localization, no RTL; `next-intl` declared and never imported | D31 localization-ready, RTL-ready; D35 language localization, RTL | Absent | IMPLEMENTATION GAP | Language and i18n approach decisions | D31, D35 | `OPEN — BLOCKED` | §9 audit |
| **IG-13** | Engagement / Global | Streak dates computed via `new Date().toISOString().split('T')[0]` — UTC only | D35 **timezone awareness** | Streaks break for users far from UTC | CONFLICT | Timezone handling decision | D35, D19 | `OPEN — AWAITING PHASE` | `TI-13`, `RISK-17` |
| **IG-19** | Engagement / Analytics | Daily streaks, profile-completion scoring and engagement prompts exist, built before any approved decision | D29 core principle: optimize for meaningful connections and sustainable user value, **not vanity engagement alone** | Never reviewed against the approved principle; not ratified | CONFLICT | Product review of the engagement layer against D29 | D29, D19 | `OPEN — BLOCKED` | §9 audit |
| **IG-23** | UX / Accessibility | Viewport locked: `maximumScale: 1`, `userScalable: false` — pinch-zoom blocked | D31 **accessible** | Blocks a standard accessibility affordance | CONFLICT | Accessibility target decision, then remove the lock | D31 | `OPEN — BLOCKED` | §10 audit |
| **IG-46** | UX / Accessibility | Heavy Framer Motion use with no `prefers-reduced-motion` handling | D31 accessible; **purposeful motion** | No reduced-motion path | IMPLEMENTATION GAP | Motion specification decision | D31 | `OPEN — AWAITING PHASE` | new |
| **IG-22** | Delivery | `prisma/migrations/` is untracked in git | D30 **migration governance** | Schema history is not version-controlled and can be lost | TECHNICAL DEBT | Track migrations; establish migration process | D30 | `OPEN — AWAITING PHASE` | `TI-07`, `RISK-14` |
| **IG-53** | Infrastructure | Sandbox coupling: Caddy `XTransformPort` routing, `allowedDevOrigins: ['.space-z.ai']`, `start-dev.sh` hard-coding `/home/z/my-project`, hard-coded `http://localhost:3003`, external `z-cdn.chatglm.cn` favicon | D30 evidence-based architecture | Blocks clean deployment anywhere else | TECHNICAL DEBT | Deployment environment decision (`OD-12`) | D30, `OD-12` | `OPEN — BLOCKED` | `RISK-13`, `TI-09`, `TI-10` |
| **IG-60** | Data access | `src/lib/db.ts` constructs a new `PrismaClient` on every module instantiation (singleton deliberately removed to work around a stale-client bug) | D30 observability, evidence-based evolution | Connection and memory growth risk; the workaround was never replaced with a fix | TECHNICAL DEBT | Diagnose the original stale-client bug; restore a managed client | D30 | `OPEN — AWAITING PHASE` | `TI-01`, `TI-02`, `RISK-04` |
| **IG-73** | Discovery | `POST /api/swipe/reset` deletes all of the caller's swipes **and all their matches**; message rows are left orphaned (no FK) | D28 data integrity; D30 backward compatibility | User-triggered data loss with orphaned records | TECHNICAL DEBT | Review whether reset should exist and what it removes | D28, `OD-16` | `OPEN — AWAITING PHASE` | `TI-14`, `RISK-16` |
| **IG-34** | Communication / T&S | No unmatch capability | D33/D34 (related to blocking and consent) | Users cannot end a match | IMPLEMENTATION GAP | Unmatch semantics decision | D33, D34 | `OPEN — BLOCKED` | §9 audit |
| **IG-40** | Notifications | `/api/settings` returns hardcoded values; `PUT` persists nothing; no notification preferences | D33 **notification controls** | Absent | IMPLEMENTATION GAP | Notification preference model | D33, D28 | `OPEN — AWAITING PHASE` | §19 audit |
| **IG-76** | Settings | `/api/settings` is a stub with `TODO` comments; no settings are persisted for anything | D28 user privacy controls; D33 notification controls | No user-configurable setting works | IMPLEMENTATION GAP | Settings model decision | D28, D33 | `OPEN — AWAITING PHASE` | §15 audit |
| **IG-39** | Privacy | No user-facing privacy controls of any kind | D28 user privacy controls, AI personalization controls, location privacy, Relationship Memory controls | Absent | IMPLEMENTATION GAP | Requires data classification and control decisions | D28 | `OPEN — BLOCKED` | §27 audit |
| **IG-61** | Trust & Safety / Global | No regional safety configuration | D34 global/regional safety configuration; D35 regional safety | Absent | IMPLEMENTATION GAP | Requires regional configuration model | D34, D35, D32 | `OPEN — BLOCKED` | new |
| **IG-36** | Globalization | No country or city configuration capability | D35 regional configuration; D32 country/city configuration admin function | Absent | IMPLEMENTATION GAP | Configuration schema decision | D35, D32 | `OPEN — BLOCKED` | new |
| **IG-45** | Commerce / Global | No currency, pricing, payment method or tax handling | D35 local currency, regional payment methods, localized pricing, tax-aware commerce | Absent | IMPLEMENTATION GAP | Requires D26 pricing and provider decisions | D35, D26 | `OPEN — BLOCKED` | new |
| **IG-55** | AI | No AI Gateway; no AI code paths at all | D30 **central AI Gateway** | Absent | IMPLEMENTATION GAP | Requires D18 principles and provider decision | D30, D18 | `OPEN — BLOCKED` | §20 audit |
| **IG-52** | Analytics | No experimentation capability | D29 experimentation | Absent | IMPLEMENTATION GAP | Framework decision | D29 | `OPEN — BLOCKED` | new |
| **IG-50** | Administration | No emergency controls, kill switches or feature flags | D32 emergency controls, kill switches; D30/D29 feature flags | Absent | IMPLEMENTATION GAP | Decide what is killable and who may trigger | D32, D30 | `OPEN — BLOCKED` | new |
| **IG-51** | Administration | No controlled export capability | D32/D28 controlled exports | Absent | IMPLEMENTATION GAP | Export governance decision | D32, D28 | `OPEN — BLOCKED` | new |
| **IG-75** | Notifications | `DeviceToken` model and `POST /api/notifications/register-token` exist and validate platform; **nothing ever sends a push** | D33 notification architecture (D30) | Tokens are collected and never used — data collected without purpose, contrary to D28 minimization | IMPLEMENTATION GAP | Push provider and scope decision | D30, D33, D28 | `OPEN — BLOCKED` | §19 audit |
| **IG-74** | Authentication | The auth-readiness gate waits up to 5 s, then **proceeds anyway** with a console warning | Security posture: reliable session handling | The original race can still occur after timeout | TECHNICAL DEBT | Review once `IG-01` is resolved | `OD-09` | ✅ `CLOSED — M4 (2026-09-03)` | `RISK-18` |

---

## 6. Low

| ID | Domain | Current state | Approved requirement | Gap / conflict | Type | Resolution required | Decision dependency | Status | Origin |
|---|---|---|---|---|---|---|---|---|---|
| **IG-04** | Brand / UX | `public/logo.svg` exists unused; the favicon points at `https://z-cdn.chatglm.cn/z-ai/static/logo.svg` | D31 **trustworthy**, consistent design system | An external sandbox-vendor asset in the product's identity | CONFLICT | Brand asset decision | D31 | `OPEN — AWAITING PHASE` | `CONF-04` |
| **IG-07** | Digital economy | `boost_expired` notification type exists in code and schema; produced only by dev tooling; no boost feature exists | D17 (Boosts are an approved extra) | A type with no feature behind it | CONFLICT | Remove or implement, once D17 principles exist | D17, D26 | `OPEN — BLOCKED` | `CONF-07` |
| **IG-08** | Analytics | Schema comment lists `message` and `profile_view` as `EngagementAction` values; neither is ever written | D29 analytics integrity | Documentation contradicts behaviour in the same file | CONFLICT | Align once the event taxonomy is decided | D29 | `OPEN — BLOCKED` | `CONF-08` |
| **IG-15** | AI | `z-ai-web-dev-sdk@0.0.17` declared and never imported | D18/D30 — no AI provider is approved | A sandbox-vendor SDK that could be mistaken for an approved AI choice | TECHNICAL DEBT | Remove; it is not an approved provider | D18, D30 | `OPEN — AWAITING PHASE` | §20 audit |
| **IG-17** | Privacy | Extensive `console.log` of authentication state and user ids in `api-client.ts`, `auth-store.ts`, `page.tsx` | D28 privacy by design (log hygiene) | Personal data and auth state in logs | CONFLICT | Log hygiene decision and cleanup | D28 | `OPEN — AWAITING PHASE` | `TI-12` |
| **IG-24** | Design system | Dark theme hard-coded via `<html className="dark">`; a complete `.light` token set exists but is unreachable | Theming is `OPEN` under D31 | Dead code path; not a conflict with an approved decision | TECHNICAL DEBT | Theming decision | D31 | `OPEN — BLOCKED` | §10 audit |
| **IG-47** | Design system | Two toast systems coexist: Radix Toast (`ui/toast.tsx`, `ui/toaster.tsx`) and `sonner` | D31 consistent design system; **reuse before creating** | Duplicate capability | TECHNICAL DEBT | Pick one | D31 | `OPEN — AWAITING PHASE` | new |
| **IG-48** | Design system | Visual tokens exist only in `globals.css`; no design source of truth; no token was ever approved | D31 consistent design system | The de facto design has no approval trail | TECHNICAL DEBT | Design system decision | D31 | `OPEN — BLOCKED` | §10 audit |
| **IG-42** | Digital economy | `superlike` exists as a free, unmetered swipe action differing from `like` only in notification copy | D26 Super Likes are an approved **purchasable extra** | Existing behaviour is not the approved model and must not be assumed to be it | CONFLICT | Requires D17/D26 mechanics | D17, D26 | `OPEN — BLOCKED` | new |
| **IG-41** | Communication | Not implemented: reactions, media, voice notes, voice, video, translation, conversation starters, AI assistance, gifts, event/group communication, Concierge communication | D33 — all approved | Absent | IMPLEMENTATION GAP | Each requires its own approved phase | D33 | `OPEN — AWAITING PHASE` | §9 audit |
| **IG-57** | Governance | No Technical Decision Records; no TDR process | D30 **Technical Decision Records** | Absent | IMPLEMENTATION GAP | Decide TDR location, template and approval | D30 | `OPEN — BLOCKED` | new |
| **IG-59** | Governance | No cost governance of any kind | D30 cost governance | Absent | IMPLEMENTATION GAP | Requires AI and infrastructure decisions first | D30, D18 | `OPEN — BLOCKED` | new |
| ~~**IG-62**~~ | Delivery | ~~Both `bun.lock` and `package-lock.json` committed~~ | D30 migration governance; D43 reproducible CI | — | TECHNICAL DEBT | — | **D44** | ✅ **CLOSED 2026-09-02 (Phase 1 Step 2)** — npm + `package-lock.json` authoritative; `bun.lock` deleted; `packageManager` declared. `mini-services/` retains its own lockfile and stays out of scope pending `OQ-A02` | `CONF-05`, `TI-06` |
| **IG-64** | Delivery | `package.json` `name` is `nextjs_tailwind_shadcn_ts`, version `0.2.0` — the scaffold default | Project identity | The package does not identify Anera or any versioning scheme | TECHNICAL DEBT | Naming and versioning decision | D30 | `OPEN — AWAITING PHASE` | `CONF-10` |
| **IG-68** | Security | Notification mini-service socket CORS is `origin: true` (all origins), commented "allow all for dev" | Security posture | Unrestricted socket origins | TECHNICAL DEBT | Origin allowlist; depends on deployment decision | `OD-12`, D30 | `OPEN — AWAITING PHASE` | `SEC-09` |
| **IG-69** | Security | No security headers configured — no CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Security posture; D30 security gates | Standard hardening absent | TECHNICAL DEBT | Header policy decision | D30 | `OPEN — AWAITING PHASE` | `SEC-11` |
| **IG-71** | Authentication | No password reset, no email verification, no session listing or revocation UI | D34 progressive verification (email); standing security posture | Absent | IMPLEMENTATION GAP | Account recovery decisions | D34, `OD-08` | `OPEN — BLOCKED` | `AUTH-07` |
| **IG-72** | Repository hygiene | `public/` contains a duplicated nested `public/public/` directory with `logo.svg` and `robots.txt` | — | Duplicated assets | TECHNICAL DEBT | Clean up | — | `OPEN — AWAITING PHASE` | `TI-11` |
| **IG-78** | API / Privacy | `API-SPECIFICATION.md` §4 lists `GET /api/profiles/[id]` as a **Phase 1** endpoint returning "a limited public view" | Two authoritative documents must not disagree | `OPEN-QUESTIONS.md` **`OQ-API-01`** — "what fields are in the public profile view returned to another authenticated user?" — is **Unresolved** and annotated "needed for **Phase 2**". `PRIVACY-GUIDELINES.md` §3 compounds it: the data-classification scheme itself is `OPEN`, so no field can be classified public. The endpoint cannot be built without inventing the field list, which is `IG-05` in new clothing | CONFLICT | Resolve `OQ-API-01`, or move the endpoint to Phase 2 in `API-SPECIFICATION.md` | `OQ-API-01`, `IG-05`, `IG-38`, D28 | `OPEN — BLOCKED` | Found during M6 inspection, 2026-09-03 |
| **IG-79** | API | Photo routes do not match their specification: implemented `PUT /api/profile/photos/reorder` and `PUT /api/profile/photos/primary` | `API-SPECIFICATION.md` §4 documents `PATCH /api/profile/photos/order`, and does not list a `primary` endpoint at all | Wrong path, wrong method, plus an undocumented endpoint | CONFLICT | Reconcile when photo work is unblocked — deferred out of M6 with the rest of photos, so the routes were removed rather than corrected (see §9.8) | `IG-18` | `OPEN — BLOCKED` | Found during M6 inspection, 2026-09-03 |
| **IG-80** | API | The registration endpoint is implemented at `POST /api/auth/register` | `API-SPECIFICATION.md` §4 documents `POST /api/auth/signup` | The documented path does not exist; the implemented one is not documented | CONFLICT | Rename the route or amend the specification. **Not actionable inside M6** — the endpoint is part of the frozen M4 surface (`phase1-m4-frozen`) and its rename would touch frozen authentication | D37 | `OPEN — AWAITING PHASE` | Found during M6 inspection, 2026-09-03 |
| **IG-77** | API / Architecture | The authentication forms submit with a client `fetch` to the `/api/auth/*` route handlers | [`API-SPECIFICATION.md`](API-SPECIFICATION.md) §2 marks **"Server Actions for form mutations"** as `SELECTED` | The implemented form-mutation style is not the selected one | TECHNICAL DEBT | Either adopt Server Actions for form mutations or record a decision superseding the `SELECTED` style. The route handlers themselves are frozen, tested and CI-verified (M4), so this is a question of what the *forms* call, not of the endpoints' correctness | D37 (auth transport, unaffected either way) | `OPEN — AWAITING PHASE` | Found during M5 inspection, 2026-09-03 |

---

## 7. Gaps that are NOT conflicts

Recorded to prevent misreading. These are **absences against approved requirements**, not contradictions:

- **`IG-20` Referrals** — nothing exists; there is no code to conflict with. Greenfield.
- **`IG-55` AI** — nothing exists. The only AI-adjacent artefact (`IG-15`) is an unused sandbox dependency.
- **Speed Dating, Experiences, Marketplace, Events, Hosts, Elite, Concierge** — no code exists for any of them, and their owning decisions (D16, D21, D22, D23) supply no principles. They cannot be gaps against requirements that have not been written.

---

## 8. Existing controls that must be preserved

These support approved decisions and must **not** be removed during any remediation. They are the only decision-supporting controls the product currently has.

| Control | Location | Supports |
|---|---|---|
| Session-derived user identity — the userId always comes from the session, never from request body or form data | `src/lib/auth.ts` + every protected route | D30 central auth governance; D34 |
| `requireAuth` / `requireOwnership` primitives | `src/lib/auth.ts` | D30, D32 |
| Match-participation checks on message read and write (403) | `src/app/api/messages/route.ts` | D33, D34 consent |
| Ownership verification on all photo mutations, including every id in a reorder request | `src/app/api/profile/photos/**` | D28, D34 |
| Photo upload: MIME allowlist, size cap, **magic-byte signature validation**, extension sanitisation | `src/app/api/profile/photos/route.ts` | D34 |
| bcrypt password hashing (10 rounds); hashes never returned by the API | `src/app/api/auth/register/route.ts` | Security posture |
| HMAC-SHA256 session tokens verified with `timingSafeEqual` | `src/lib/auth.ts` | Security posture |
| HTTP-only, SameSite=Lax, `secure`-in-production session cookie | `src/lib/auth.ts` | Approved security posture |
| Generic login failure message (no user enumeration) | `src/app/api/auth/login/route.ts` | Security posture |
| Self-swipe prevention | `src/app/api/swipe/route.ts` | D34 |
| 18+ age floor | `src/app/api/profile/route.ts` | D34 age/eligibility |
| Parameterised queries via Prisma; the only raw SQL is a fixed `PRAGMA` | throughout | Security posture |

---

## 9. Phase 1 remediation log

Gaps closed or changed by Phase 1 implementation. **This section is the current status; the rows in §3–§6 record the original finding.**

### 9.1 Closed — Milestone 1 (D44)

| Gap | Closed by |
|---|---|
| `IG-62` | npm + `package-lock.json` made authoritative; `bun.lock` deleted; `packageManager` declared |

### 9.2 Closed — Milestone 3, Option A removal (D45)

| Gap | Closed by |
|---|---|
| `IG-26` | `/api/dev` deleted — the unauthenticated impersonation and database-wipe surface no longer exists |
| `IG-67` | `demo-login`, `seed` and `seed/bulk` deleted; `loginDemo` removed from the auth store. **No unauthenticated session-granting endpoint remains** |
| `IG-11` | `/api/premium` stub deleted. Commerce is rebuilt in Phase 6 |
| `IG-76` | `/api/settings` stub deleted |
| `IG-04` | External `z-cdn.chatglm.cn` favicon reference removed with the sandbox cleanup |

### 9.3 Superseded by removal — requirement returns with the feature

The code carrying these gaps no longer exists. The **approved requirement stands**; it is satisfied when the feature is rebuilt in its owning phase.

`IG-05` (unauthenticated profile read) · `IG-07` · `IG-08` · `IG-14` · `IG-16` · `IG-19` · `IG-28` · `IG-29` · `IG-30` · `IG-31` · `IG-34` · `IG-40` · `IG-42` · `IG-54` · `IG-75`

> These are **not** fixed. Phase 2 must build discovery *with* preferences and blocking; Phase 3 must build messaging on real-time transport; and so on. The gap register entry is retained so the requirement is not lost.

### 9.4 Partially closed

| Gap | Progress | Remaining |
|---|---|---|
| `IG-21` | Vitest + Playwright + GitHub Actions established; `typescript.ignoreBuildErrors` **removed**; typecheck **0 errors**; lint **0 errors**; build passes with type validation enforced | ~27 ESLint rules remain disabled in `eslint.config.mjs`; CI not yet observed green on a real run; application test coverage is still 0 |
| `IG-53` | `next.config.ts` sandbox origins and `output: "standalone"` removed; `mini-services/` and `examples/` deleted; hard-coded `localhost:3003` gone with `src/lib/notifications.ts` | `Caddyfile`, `start-dev.sh` and `.zscripts/` remain at the repository root |
| `IG-58` | SQLite is formally discarded — `OQ-SCHEMA-01` resolved by D45, no data migration | PostgreSQL not yet provisioned; `DATABASE_URL` still points at the legacy file |

### 9.5 Milestone 3 — PostgreSQL foundation (2026-09-02)

| Gap | Status |
|---|---|
| `IG-58` | ✅ **CLOSED** — PostgreSQL 16.15 provisioned; Prisma provider `postgresql`; migration `20260902143350_phase1_foundation` applied; SQLite fully retired |
| `IG-12` | ✅ **CLOSED at the schema level** — all five relations carry foreign keys with `CASCADE`, verified by an automated cascade-deletion test. Erasure *policy* (hard vs soft, `OQ-PR06`) remains open |
| `IG-22` | ✅ **CLOSED** — `prisma/migrations/` is tracked in git; `migration_lock.toml` provider is `postgresql` |
| `IG-16` | Partially addressed — a `preferences` table now exists, so Phase 2 discovery *can* be preference-filtered. The behaviour itself is Phase 2 |
| `IG-60` / `TI-01` | ✅ **CLOSED** — the Prisma singleton is restored in `src/lib/db.ts`. It had been removed to work around a stale-client bug that no longer applies now the client is generated from the PostgreSQL schema |
| **New — fixed on discovery** | `src/lib/db.ts` ran a SQLite `PRAGMA foreign_keys = ON` on every client construction. Against PostgreSQL this failed with `42601 syntax error at or near "PRAGMA"`, swallowed by a `.catch()`. Removed; PostgreSQL enforces foreign keys natively |

**Legacy Phase 1 routes removed (Option A, 2026-09-02).** `api/profile/route.ts`, `api/auth/login/route.ts` and `api/auth/register/route.ts` were built on the MVP field shapes (`User.name`, `Profile.age`, interests-as-JSON-string) and could not compile against the approved Phase 1 schema. Per D40 they classify *incompatible → replace*. **The Phase 1 requirements for registration, login, profile creation and profile editing are unchanged** and are rebuilt in M4/M5/M6 against D37 authentication. Client callers (`page.tsx`, `profile-editor`, `profile-edit-form`, `auth-store`) were deliberately retained — they are dead at runtime until those milestones, but compile cleanly and are rewritten there.

### 9.6 Milestone 4 — authentication (2026-09-03)

The legacy authentication architecture was **replaced**, not refactored (D40 step 4). `src/lib/auth.ts` was deleted; `src/lib/auth/` implements D37.

| Gap | Status |
|---|---|
| `IG-01` | ✅ **CLOSED** — no localStorage token, no Bearer transport, no `authReady`/`waitForAuth`/hydration-as-auth anywhere in `src/`. The HTTP-only cookie is the single source of truth; `src/stores/auth-store.ts` is a render cache that cannot grant access. Enforced by `tests/unit/legacy-auth-scan.test.ts`, which fails the build if any pattern returns |
| `IG-02` | ✅ **CLOSED** — `next-auth` was declared but never imported. D37 settles the approach (hand-rolled DB-backed cookie sessions, no auth library), so the dependency was removed from `package.json` and `package-lock.json` |
| `IG-63` | ✅ **CLOSED** — there is only one transport now, so the two can no longer disagree about lifetime. Expiry is the `sessions.expiresAt` column, checked server-side on every request. The *value* remains provisional under `OQ-AUTH-01` |
| `IG-65` | ✅ **CLOSED** — `SESSION_SECRET` is gone rather than fixed. D37 sessions are opaque random identifiers looked up in PostgreSQL, so there is no signing material: nothing to leak and nothing to forge. Removed from `.env.example` and the CI workflow. The literal survives only in the mini-service, which is not Phase 1 code |
| `IG-66` | ✅ **CLOSED** — `src/proxy.ts` no longer reflects arbitrary origins. Cross-origin credentialed access is refused unless `ANERA_ALLOWED_ORIGINS` names an exact origin, and `Authorization` is no longer advertised as an allowed request header |
| `IG-70` | ✅ **CLOSED** — revocation is `DELETE FROM sessions`. It is durable, shared by every instance, and cannot evict a live revocation. Verified by an end-to-end test that stops the server, revokes while it is down, and restarts |
| `IG-74` | ✅ **CLOSED** — the readiness gate it describes no longer exists. There is nothing to wait for: the browser sends the cookie and the server answers |
| `IG-71` | **Still open** — password reset, email verification and session-management UI are unimplemented. `OQ-AUTH-03`, `OQ-AUTH-04`, `OQ-AUTH-07` |
| `IG-68` | **Still open** — the notification mini-service's socket CORS is outside Phase 1 scope |

**Provisional parameters.** Five values are `OPEN` in `AUTHENTICATION.md` §10 and were implemented with conservative defaults so Phase 1 could be built and tested. They are collected in `src/lib/auth/config.ts`, each tagged with its open-question id, so ratifying them is a one-file change: session lifetime and sliding renewal (`OQ-AUTH-01`), password length bounds (`OQ-AUTH-02`), cookie name and the absence of a `__Host-` prefix (`OQ-AUTH-06`), rate-limit thresholds (`OQ-C05`). No CSRF synchroniser token was added (`OQ-AUTH-05`); `SameSite=Lax` is the only cross-site defence at present. **None of these changes the architecture, and none is ratified.**

**Fixed on discovery.** The login endpoint skipped the password comparison entirely when the email was unknown, so it answered "no such account" measurably faster than "wrong password" — enumerating accounts by timing despite an identical response body. It now always performs a bcrypt comparison, against a fixed hash when there is no user.

**Known limitation.** Rate limiting is an in-process fixed-window counter (`src/lib/auth/rate-limit.ts`). It satisfies the Phase 1 requirement on a single instance but does not survive a restart or coordinate across instances, and its client key comes from `x-forwarded-for`, which is only trustworthy behind a proxy that overwrites it. A shared store and trusted-proxy configuration are required before multi-instance deployment (`OQ-A01`, `OQ-B04`).

---

### 9.7 Milestone 5 — routing (2026-09-03)

The single-page client shell was replaced with App Router routes and server-resolved sessions.

| Gap | Status |
|---|---|
| `IG-77` | **Still open** — recorded during M5 inspection. The auth forms use client `fetch` while `API-SPECIFICATION.md` §2 marks Server Actions as `SELECTED`. The product owner directed that the frozen M4 route handlers be kept, so this awaits a later milestone |

**Architectural debt retired, not previously registered.** `00-MASTER-SPECIFICATION.md` §380 recorded that *"the entire authenticated app is a single client-side route (`src/app/page.tsx`)... There is no URL-based routing for these views, and no deep linking."* That is no longer true: there are five routes, each server-rendered on demand, each deep-linkable, with session guards that run before render. `SYSTEM-ARCHITECTURE.md`'s migration row *"Client-side app shell holding everything → Server Components + real routing"* is satisfied.

**Known limitation carried into M6.** Onboarding reads the acting user's id from the client store, which is no longer populated on a hard page load now that nothing calls `checkSession` on mount. The correct fix is to pass the id from the server page, which already holds it — but that means editing a component the product owner instructed be relocated unchanged, so it is **not** being decided here. It is currently unobservable: onboarding cannot submit at all until `/api/profile` exists (M6), and M6 must touch that submit path regardless.

**Still outstanding for the Phase 1 exit criteria.** `IG-21` is only half closed: test tooling, CI and `typescript.ignoreBuildErrors` are done, but **28 ESLint rules remain disabled** in `eslint.config.mjs` — including `react-hooks/exhaustive-deps`, `no-unused-vars`, `no-undef` and `no-unreachable` — while the Phase 1 exit criteria require *"ESLint rules re-enabled"*. Every `lint: PASS` reported so far is accurate but weaker than that criterion. This work is unassigned to a milestone and needs one before Phase 1 can freeze.

---

### 9.8 Milestone 6 — profile, preferences, and photo containment (2026-09-03)

#### `IG-18` — insecure photo surface **CONTAINED** (not resolved)

`SECURITY-GUIDELINES.md` §9 is `LOCKED`: uploads must be *"stored outside the web root, served via signed URLs"*. The implementation wrote to `public/uploads` — inside the web root, world-readable, no access control. That is `IG-18`, already recorded as `DEPRECATED`.

It survived because it was **unreachable**: no profile could be created, so the profile editor could not render and the routes had no caller. M6 makes profile creation work, which would have made that path reachable for the first time — turning a dormant documented defect into a live one.

**Removed** on the product owner's instruction, before profile functionality became usable:

| Removed | Was |
|---|---|
| `src/app/api/profile/photos/route.ts` | `POST` (disk write) + `DELETE` |
| `src/app/api/profile/photos/primary/route.ts` | `PUT` |
| `src/app/api/profile/photos/reorder/route.ts` | `PUT` |
| `src/components/profile/photo-manager.tsx` | the client that called them |

No storage architecture replaced it, deliberately: `TECH-STACK.md` §3 lists media storage as `OPEN` with **no provider approved**, and choosing one was explicitly out of M6 scope. `public/uploads` did not exist and is gitignored, so no previously-uploaded file remains publicly addressable.

**`IG-18` stays `OPEN — BLOCKED`.** The exposure is gone; the requirement is unmet. Photos return when the media decision is made. Gate test #18 (photo upload) is consequently **unmet** and Phase 1 cannot freeze without it.

`IG-79` (photo route contract mismatches) is moot while the routes are absent, but stays open — it describes what must be got right when they return.

#### Tests re-pointed, not weakened

Six M4 tests used `PUT /api/profile/photos/primary` as their protected-endpoint fixture. They assert authentication and authorization boundaries, not photos, so they now target `PATCH /api/profile` with identical assertions.

One changed shape and is called out here rather than buried: M4 test 20 asserted **403** when acting on another account's photo. The profile endpoint has no parameter that can address another user, so there is no 403 branch — the attacker's write lands on their own row and the victim's is untouched. The explicit 401/403/owner assertion still exists, directly against `requireOwnership`, in test 20a. Nothing was lost; the assertion moved to the primitive that owns it.

---

## 11. Rules for handling this register

1. **Do not fix anything here without an approved phase.** Opportunistic fixes violate the approved method.
2. **Do not fix `IG-01`.** It is `UNRESOLVED` — the product owner must decide first.
3. **Do not delete a gap because a decision now approves the requirement.** The gap is the *implementation* shortfall; approval of the requirement is what makes it a gap.
4. **Do not remove anything in §8** during remediation of anything in §3–§6.
5. **Add a gap** whenever a new conflict or shortfall is verified, with all nine fields.
6. **Close a gap** only when the remediation is implemented, tested and accepted in an approved phase — and record that in `CHANGELOG.md`.

---

*Derived from the 2026-08-30 repository audit and `docs/DECISIONS.md`. Original audit identifiers are preserved in the Origin column.*
