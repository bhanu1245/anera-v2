# Anera V2 — Open Questions & Blockers

| Field | Value |
|---|---|
| **Document name** | `docs/OPEN-QUESTIONS.md` |
| **Status** | **OPEN** — a register of unresolved items. |
| **Authority** | None. This document records what is *not* decided. Resolution happens only through a new approved entry in [`DECISIONS.md`](DECISIONS.md). |
| **Purpose** | Every genuinely unresolved question, in one place, so nothing is silently assumed. |
| **Last updated** | 2026-09-02 — D44 and D45 resolved `IG-62` and `OQ-SCHEMA-01`; Phase 1 Milestones 1–3 in progress |
| **Open items** | 177 (6 blocking) |

---

## 1. Rules for this register

1. **An item here is resolved only by an approved decision** recorded in `DECISIONS.md`. Never by an implementation choice, a default, or an agent's judgement.
2. **Nothing already approved appears here.** Decisions 16–35 are approved; their *parameters* may be open, and only those parameters are listed.
3. **No item here may be answered by inference.** If the answer seems obvious, it is still a decision.
4. **Blocking** means work in that area cannot proceed at all until the item is resolved.
5. Items requiring **legal review** are marked. They must not be answered by engineering or product judgement.

---

## 2. Blocking items — resolve these first

These block all or most downstream work.

| ID | Question | Area | Why blocking |
|---|---|---|---|
| **OQ-B01** | **Principles for Decisions 19 and 21.** ✅ *Partly resolved by D42* — principles supplied for D16, D17, D18, D20, D22, D23. **Still open:** Daily Experience/Retention (19) and Marketplace & Services (21) have no rules. | Product | Blocks Phase 12 (marketplace) and leaves the existing streak/engagement system unratified (`IG-19`). |
| ~~**OQ-B02**~~ | ~~Resolve the authentication conflict~~ | Auth / Security | ✅ **RESOLVED by Decision 37** (2026-09-02). HTTP-only cookie sessions, server-validated; the legacy path is removed in Phase 1. See [`AUTHENTICATION.md`](AUTHENTICATION.md). |
| ~~**OQ-B03**~~ | ~~The phase list~~ | Delivery | ✅ **RESOLVED by Decision 39** (2026-09-02). Thirteen phases, 0–12, with a mandatory gate between each. See [`ROADMAP.md`](ROADMAP.md). |
| **OQ-B04** | **Deployment environment and hosting**, and confirmation that sandbox artefacts are removed. *(Removal is now mandated by D40; the target environment is still unchosen.)* | Infrastructure | Nothing can be deployed. Formerly `OD-12`. |
| **OQ-B05** | **Location data model** — coordinates vs region reference, precision, obfuscation. ✅ *Partly resolved by D36* — PostgreSQL is locked, and foreign keys/normalisation are mandated by `BACKEND-SCHEMA.md`. | Data | Blocks local-first discovery (D35) and distance filtering. Formerly `OD-14`. |
| ~~**OQ-B06**~~ | ~~**Testing tooling, coverage expectations, CI provider**, and whether type errors and lint errors become build-blocking again.~~ *(Question retained for history. Formerly `OD-28`.)* | Testing | ✅ **RESOLVED by Decision 43** (2026-09-02). **Vitest · Playwright · GitHub Actions · `tsc` · ESLint · Next.js production build.** Coverage = critical-path baseline + no-regression ratchet, **no arbitrary percentage**. Type and lint errors become build-blocking in Phase 1. See [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md). **This was the last Phase 0 blocker — Phase 0 is now FROZEN.** |
| **OQ-B07** | **Ratification of existing behaviour.** Which of the 25 implemented behaviours (`R-01`…`R-25` in the master specification) are approved, and which change? | Product | Every existing feature currently has no approval trail. Formerly `OD-05`. |
| **OQ-B08** | **The data classification scheme** — class names, criteria, and field mapping. | Privacy | D28's retention, export, least-privilege and regional controls are all unscopeable without it. |
| **OQ-B09** | **Matching logic** — inputs, scoring, weighting, ranking, thresholds, cold start, fairness, evaluation. D30 approves that a dedicated matching architecture exists; **no decision says what it does.** | Matching | Blocks discovery, matching and ranking work. Formerly `OD-17`. |

---

## 3. Governance

| ID | Question | Status |
|---|---|---|
| **OQ-G01** | **Decisions 1–15 are absent from this repository.** Their content is unknown. Do they exist elsewhere, do they still apply, and should they be recorded here? | Unresolved |
| **OQ-G02** | **Decision numbering anomaly.** Decisions 24 and 34 share the title *Trust, Safety, Identity & Authenticity*; Decisions 25 and 35 cover globalization. Are 24 and 25 superseded by 34 and 35, or are they distinct decisions? Both are retained verbatim pending an answer. | Unresolved |
| **OQ-G03** | Who approves decisions, and who may edit `docs/`? What review does a documentation change require? | Unresolved. Formerly `OD-30`. Partially touched by D32's admin roles, but documentation ownership is not stated. |
| **OQ-G04** | Where do **Technical Decision Records** live, what is their template and numbering, and who approves them? D30 approves that they exist. | Unresolved |
| **OQ-G05** | Should the existing MVP implementation records (`worklog.md`, `agent-ctx/*.md`) move into `docs/`, stay where they are, or be archived? | Unresolved. Formerly `OD-31`. |
| **OQ-G06** | Does the deferred future-document list (`01-PRODUCT-REQUIREMENTS.md` … `28-CHANGELOG.md`) remain the intended structure, given that several of its entries were created here under unnumbered names? | Unresolved. See `README.md` §5. |
| ~~**OQ-G07**~~ | ~~Should `AI-ARCHITECTURE.md` be created?~~ | ✅ **RESOLVED.** D42 supplied D18 principles on 2026-09-02; [`AI-ARCHITECTURE.md`](AI-ARCHITECTURE.md) created. Provider and parameters remain open under `OQ-AI01`…`OQ-AI08`. |

---

## 4. Product & positioning

| ID | Question | Status |
|---|---|---|
| **OQ-P01** | Is Anera strictly dating, or also friendship and networking? The existing `relationshipIntent` values include `networking` and `friendship`; the platform is described as a dating platform. Do the non-dating values survive? | Unresolved. Formerly `OD-04`. |
| **OQ-P02** | **Launch countries and launch sequence.** D35 approves a global platform with local-first discovery; it names no market. | Unresolved. Partially replaces `OD-03`. |
| **OQ-P03** | Supported languages at launch. | Unresolved |
| **OQ-P04** | **Non-functional requirements** — performance, availability, scalability, latency, capacity, browser support, SLAs. | Unresolved. Formerly `OD-06`. |
| **OQ-P05** | Missing journey stages: landing/marketing entry, email verification, password reset, permission prompts, referral entry flow, paywall/upgrade, verification, reporting, account deletion, re-engagement. | Unresolved. Formerly `OD-08`. |
| **OQ-P06** | Definition of **"meaningful connection"** and the stages of the meaningful connection funnel. D29 approves the funnel; the definition is the platform's central product question. | Unresolved |

---

## 5. Monetization (Decision 26 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-M01** | **Prices** — for every tier and every extra. | Unresolved |
| **OQ-M02** | **Entitlements bundled into Free, Premium, Gold, Platinum and Elite**, and how the five tiers differ. | Unresolved |
| **OQ-M03** | **Allowances and quotas** — how many Super Likes, Boosts, etc., if any, per tier. | Unresolved |
| **OQ-M04** | **Feature rules qualifying extra eligibility** — the "subject to feature rules" qualifier in D26. | Unresolved |
| **OQ-M05** | Which extras exist beyond those named ("other approved digital features"). | Unresolved |
| **OQ-M06** | **Payment providers** and platform-store (app store) handling. | Unresolved |
| **OQ-M07** | Currencies supported; regional price points; regional payment methods. | Unresolved |
| **OQ-M08** | Trials, promotions, discounting, win-back offers. | Unresolved |
| **OQ-M09** | Billing lifecycle — renewal, upgrade, downgrade, proration, dunning, cancellation. | Unresolved |
| **OQ-M10** | Refunds and chargebacks. | Unresolved |
| **OQ-M11** | **Tax treatment and invoicing.** | Unresolved — **requires legal review** |
| **OQ-M12** | Elite eligibility, admission criteria and entitlements. | Unresolved (also `OQ-B01`) |
| **OQ-M13** | **Anera Credits mechanics** — earning, spending, expiry, balance, transferability. | Unresolved |
| **OQ-M14** | **Revenue share** for hosts, providers and creators. No percentage is approved. | Unresolved |
| **OQ-M15** | Do referral rewards confer subscription entitlements, and how do they interact with purchased entitlements? | Unresolved |

---

## 6. Referral (Decision 27 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-R01** | **Reward amounts and values** — for every referrer type and reward form. | Unresolved |
| **OQ-R02** | **What qualifies a referral**, for each of the six referrer types. | Unresolved |
| **OQ-R03** | Which rewards are Credits and which are eligible monetary rewards, in which countries. | Unresolved |
| **OQ-R04** | **Limits and caps** — per user, per referrer type, per period, per campaign. | Unresolved |
| **OQ-R05** | **Attribution model** — first-touch vs last-touch vs multi-touch; attribution window; deferred deep links; cross-device. | Unresolved |
| **OQ-R06** | Referral lifecycle states and transitions. | Unresolved |
| **OQ-R07** | Specific fraud controls and thresholds. | Unresolved |
| **OQ-R08** | **Country eligibility and per-country referral rules.** | Unresolved — **requires legal review** |
| **OQ-R09** | Is any *bounded* multi-level structure permitted? D27 prohibits *unlimited* multi-level recruitment; it does not state whether a bounded form is allowed. | Unresolved |
| **OQ-R10** | Edge cases: account deletion by either party, refund clawback, pre-existing users, country change, post-spend fraud discovery. | Unresolved |
| **OQ-R11** | Referral instrument format, lifetime and revocability. | Unresolved |

---

## 7. Trust & Safety (Decision 34 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-TS01** | **Verification providers and methods.** None is approved. | Unresolved |
| **OQ-TS02** | **Verification levels** and what each unlocks (progressive verification). | Unresolved |
| **OQ-TS03** | Whether any verification level is mandatory, and at what point in the journey. | Unresolved |
| **OQ-TS04** | Report categories, triage SLAs, reporter feedback, and handling of reporting abuse. | Unresolved |
| **OQ-TS05** | **Block semantics** — visibility, existing matches, existing conversations, mutual effects, limits, and behaviour on Events/Speed Dating/Marketplace surfaces. | Unresolved |
| **OQ-TS06** | **Unmatch semantics**, and whether conversations survive an unmatch. | Unresolved |
| **OQ-TS07** | The **risk model** behind risk-based enforcement, and the enforcement ladder. | Unresolved |
| **OQ-TS08** | Account status model — ban, suspension, restriction, duration. | Unresolved |
| **OQ-TS09** | Appeals process — who adjudicates, timelines, evidence handling, outcomes. | Unresolved |
| **OQ-TS10** | Trusted-contact mechanics, and the scope of "where supported". | Unresolved |
| **OQ-TS11** | **Do Trust & Safety capabilities gate the V2 release?** | Unresolved |
| **OQ-TS12** | Age-verification method beyond self-declaration; what "hard eligibility controls" consist of. | Unresolved |
| **OQ-TS13** | Which safety parameters vary by region. | Unresolved |
| **OQ-TS14** | **Jurisdiction-specific safety and content obligations.** | Unresolved — **requires legal review** |
| **OQ-TS15** | Which moderation cases require human review, and which may be resolved by AI assistance alone. | Unresolved |
| **OQ-TS16** | Surface-specific safety controls for Speed Dating, Events, Marketplace and Concierge. | Unresolved — blocked by `OQ-B01` |

---

## 8. Privacy (Decision 28 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-PR01** | **Target jurisdictions** and applicable legal regimes. | Unresolved — **requires legal review** |
| **OQ-PR02** | Lawful basis for each processing purpose. | Unresolved — **requires legal review** |
| **OQ-PR03** | **Concrete retention periods** per data class. | Unresolved — depends on `OQ-B08` |
| **OQ-PR04** | Consent model and consent UX. | Unresolved |
| **OQ-PR05** | Privacy policy and terms of service content. | Unresolved — **requires legal review** |
| **OQ-PR06** | **Hard vs soft deletion semantics**, and what survives when one party to a conversation deletes their account. | Unresolved |
| **OQ-PR07** | Export scope ("where applicable") and format. | Unresolved |
| **OQ-PR08** | **Third-party AI providers and data processors.** None is approved. | Unresolved |
| **OQ-PR09** | Breach notification process and timelines. | Unresolved — **requires legal review** |
| **OQ-PR10** | Cross-border data transfer rules; data residency. | Unresolved — **requires legal review** |
| **OQ-PR11** | Minimum age by jurisdiction. | Unresolved — **requires legal review** |
| **OQ-PR12** | **How conversation privacy (D28) reconciles with AI-assisted moderation of communications (D34).** Both are approved; the boundary is not. | Unresolved |
| **OQ-PR13** | What "Relationship Memory" is. D28 requires user controls for it; no decision defines it. | Unresolved — blocked by `OQ-B01` (D18) |
| **OQ-PR14** | Location data precision, obfuscation, and user controls — versus the locality that local-first discovery requires. | Unresolved |
| **OQ-PR15** | Which fields are "sensitive" under Anera's classification, and what heightened handling means. | Unresolved — depends on `OQ-B08` |
| **OQ-PR16** | How financial and ledger record retention reconciles with privacy erasure. | Unresolved — **requires legal review** |
| **OQ-PR17** | Whether analytics collection is consent-gated, and in which regions. | Unresolved |

---

## 9. AI (Decision 18 / Decision 30)

| ID | Question | Status |
|---|---|---|
| **OQ-AI01** | **AI providers and models.** None is approved. The declared `z-ai-web-dev-sdk` is an unused sandbox artefact, not a choice. | Unresolved |
| **OQ-AI02** | Which AI features exist, and what each does. | Unresolved — blocked by `OQ-B01` (D18) |
| **OQ-AI03** | What data may be sent to an AI provider, and what may not. | Unresolved |
| **OQ-AI04** | The disclosure model for AI conversation assistance, given the no-silent-impersonation rule. | Unresolved |
| **OQ-AI05** | AI cost governance thresholds and budgets. | Unresolved |
| **OQ-AI06** | AI quality and safety evaluation method. | Unresolved |
| **OQ-AI07** | AI failure and fallback behaviour. | Unresolved |
| **OQ-AI08** | What "local-context AI" (D35) means in practice. | Unresolved |

---

## 10. Architecture (Decision 30 — no technology is approved)

| ID | Question | Status |
|---|---|---|
| **OQ-A01** | Application framework, ORM, cache, queue/job system for V2. | Unresolved |
| **OQ-A02** | Real-time transport; whether the notification mini-service remains separate. | Unresolved |
| **OQ-A03** | Media storage and CDN. | Unresolved |
| **OQ-A04** | Observability and error-monitoring tooling. | Unresolved |
| **OQ-A05** | Feature flag system. | Unresolved |
| **OQ-A06** | Analytics platform, pipeline and warehouse. | Unresolved |
| **OQ-A07** | Secret management. | Unresolved |
| **OQ-A08** | **Domain module boundaries** and their names. | Unresolved |
| **OQ-A09** | Which services, if any, are extracted — and on what evidence. | Unresolved |
| **OQ-A10** | API versioning; shared validation layer; standard error envelope and error codes; idempotency; pagination consistency; whether an OpenAPI contract is required. | Unresolved. Formerly `OD-15`. |
| **OQ-A11** | Fate of the seed and dev endpoints in a deployed environment. | Unresolved |
| **OQ-A12** | Cost governance thresholds and budgets. | Unresolved |
| **OQ-A13** | Native app strategy. | Unresolved |
| **OQ-A14** | Environment topology (how many environments, and what each is for). | Unresolved |

---

## 11. Discovery, matching & globalization

| ID | Question | Status |
|---|---|---|
| **OQ-D01** | **Discovery filters and preferences** — age, gender, intent, distance — and **whether gender preference gates the deck.** Today everyone sees everyone. | Unresolved. Formerly part of `OD-16`. |
| **OQ-D02** | Distance definitions for "Nearby" and "Region" in the approved expansion ladder. | Unresolved |
| **OQ-D03** | What "insufficient local pool" means quantitatively. | Unresolved |
| **OQ-D04** | Deck size, refill behaviour, daily limits, and whether passed profiles are ever re-shown. | Unresolved |
| **OQ-D05** | How discovery expansion is presented and controlled in the UI. | Unresolved |
| **OQ-D06** | Whether international discovery is entitlement-gated. | Unresolved |
| **OQ-D07** | **Travel Mode rules** — activation, duration, discovery effects, entitlement gating. | Unresolved |
| **OQ-D08** | **Relocation Mode rules**, and how it differs from Travel Mode. | Unresolved |
| **OQ-D09** | **City Health Score formula**, inputs, weighting, thresholds and what a score triggers. | Unresolved |
| **OQ-D10** | How **global account portability** reconciles with country-specific pricing, referral eligibility, verification and privacy configuration. | Unresolved |
| **OQ-D11** | The regional configuration schema — which parameters are configurable, at what granularity. | Unresolved |
| **OQ-D12** | Undo-last-swipe; match expiry; match limits. | Unresolved |

---

## 12. Communication (Decision 33 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-C01** | When **message requests** apply, and their accept/decline semantics. | Unresolved |
| **OQ-C02** | Media types, size limits, and moderation of media in conversation. | Unresolved |
| **OQ-C03** | Voice and video provider, quality targets, and recording policy. | Unresolved |
| **OQ-C04** | Translation provider; automatic or opt-in. | Unresolved |
| **OQ-C05** | **Rate-limit thresholds** and the risk model that drives risk-based rate limiting. | Unresolved |
| **OQ-C06** | Message retention. | Unresolved — depends on `OQ-B08` |
| **OQ-C07** | Typing indicators, presence, delivery receipts — in scope or not. | Unresolved |
| **OQ-C08** | Message editing and deletion. | Unresolved |
| **OQ-C09** | Notification preference granularity and channels; whether email notifications are in scope. | Unresolved |
| **OQ-C10** | Push notification provider and whether push is in V2 scope. Tokens are currently collected and never used. | Unresolved |
| **OQ-C11** | Quiet hours, digesting, and notification retention/cleanup. | Unresolved |

---

## 13. Analytics (Decision 29 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-AN01** | **Any metric formula** — LTV, CAC, satisfaction, retention definition, City Health Score. None is approved. | Unresolved |
| **OQ-AN02** | Event taxonomy and schema. | Unresolved |
| **OQ-AN03** | Dashboard inventory and audiences. | Unresolved |
| **OQ-AN04** | Experimentation framework and statistical standards. | Unresolved |
| **OQ-AN05** | Analytics data retention. | Unresolved — depends on `OQ-B08` |
| **OQ-AN06** | Success criteria or targets for any metric. | Unresolved |

---

## 14. Administration (Decision 32 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-AD01** | **The permission matrix** — which admin role may perform which action on which data class. **Do not assume any role has unrestricted access.** | Unresolved |
| **OQ-AD02** | Which actions require approval workflows, and who approves. | Unresolved |
| **OQ-AD03** | Admin authentication — identity provider, MFA mechanism, and which actions trigger step-up. | Unresolved |
| **OQ-AD04** | Audit log schema, retention, access, and whether logs are tamper-evident. | Unresolved |
| **OQ-AD05** | Which controls are kill switches, what they disable, who may trigger them, and the restoration process. | Unresolved |
| **OQ-AD06** | Admin platform delivery — same application, separate application, or separate deployment. | Unresolved |
| **OQ-AD07** | **Disposition of the existing `/dev` panel** — removed, replaced, or hard-restricted to local development. | Unresolved |
| **OQ-AD08** | Whether admin roles are regionally scoped. | Unresolved |
| **OQ-AD09** | Which role combinations separation of duties forbids. | Unresolved |
| **OQ-AD10** | Ledger schema, adjustment types, and who may post an adjustment. | Unresolved |
| **OQ-AD11** | Which exports are permitted, with what approval, logging and watermarking. | Unresolved |

---

## 15. UX & design (Decision 31 parameters)

| ID | Question | Status |
|---|---|---|
| **OQ-UX01** | **Visual design tokens** — colours, typography, spacing, radii, elevation. None is approved; the current values predate every decision. | Unresolved |
| **OQ-UX02** | **Accessibility conformance target**, and whether it gates release. | Unresolved. Formerly `OD-10`. |
| **OQ-UX03** | Light mode and theme switching. | Unresolved |
| **OQ-UX04** | Brand identity and logo of record. | Unresolved |
| **OQ-UX05** | Responsive breakpoints beyond "mobile-first". | Unresolved |
| **OQ-UX06** | Motion specification — durations, easing, and reduced-motion handling. | Unresolved |
| **OQ-UX07** | Whether a design source of truth exists, and where. | Unresolved |
| **OQ-UX08** | When Magic UI is used — the boundary of "selectively, for premium/high-impact interactions". | Unresolved |
| **OQ-UX09** | Paywall and upgrade-prompt design, frequency and placement, within D28's no-manipulation constraint. | Unresolved |
| **OQ-UX10** | What "premium" looks like for Elite. | Unresolved |

---

## 15b. Raised by the 2026-09-02 canonical documentation pass

New questions surfaced while writing the architecture, safety and product documents. None was answerable from an approved decision.

### Authentication (`AUTHENTICATION.md`)

| ID | Question | Status |
|---|---|---|
| **OQ-AUTH-01** | Session lifetime, and whether expiry slides on activity. | Unresolved — needed for Phase 1 |
| **OQ-AUTH-02** | Password policy — length, complexity, breach-list checking. | Unresolved — needed for Phase 1 |
| **OQ-AUTH-03** | Does email verification gate any capability, or is it advisory? | Unresolved |
| **OQ-AUTH-04** | Password reset token mechanics — lifetime, single-use, delivery. | Unresolved — needed for Phase 1 |
| **OQ-AUTH-05** | Is a CSRF synchroniser token required in addition to `SameSite=Lax` + origin validation? | Unresolved — **confirm at Phase 1 security review** |
| **OQ-AUTH-06** | Cookie name and whether the `__Host-` prefix is adopted. | Unresolved |
| **OQ-AUTH-07** | Is a device/session management UI ("your active sessions") in scope? | Unresolved |
| **OQ-AUTH-08** | Future OAuth providers, if any. | Unresolved — `FUTURE` |

### Architecture & operations

| ID | Question | Status |
|---|---|---|
| **OQ-API-01** | What fields are in the public profile view returned to another authenticated user? | Unresolved — needed for Phase 2 |
| ~~**OQ-SCHEMA-01**~~ | ~~Is existing MVP SQLite data migrated to PostgreSQL, or discarded?~~ | ✅ **RESOLVED by Decision 45** (2026-09-02) — **discarded, no migration.** `db/custom.db` is gitignored and untracked, was removed from version control by `495cba7`, and contains only demo/seed fixtures: all 16 users are `@anera.demo`/`demo@anera.app` and **none has a password**, so no account was created by real registration. |
| **OQ-SEC-01** | Is upload content scanning (malware/CSAM) required, and by which provider? | Unresolved — **legal review likely** |
| **OQ-SEC-02** | Penetration testing cadence and scope. | Unresolved |
| **OQ-OPS-01** | Backup frequency, retention, and RPO/RTO targets. | Unresolved |
| **OQ-OPS-02** | Is multi-region deployment required? | Unresolved |
| ~~**OQ-TEST-01**~~ | ~~Does the E2E suite run on every change, or only before a phase freeze?~~ | ✅ **RESOLVED by Decision 43** — **every pull request and before every phase freeze.** |
| **OQ-TEST-02** | Should a **numeric coverage threshold** be set, and at what level? D43 deliberately set none, using critical-path coverage plus a no-regression ratchet instead. Revisit once Phase 1 produces a real baseline. | Unresolved — **non-blocking, by design** |

### Product

| ID | Question | Status |
|---|---|---|
| **OQ-DC-01** | Post-date feedback — mechanism, timing, privacy, and whether it feeds ranking or safety. | Unresolved |
| **OQ-SOC-01** | Which social capabilities are actually in Phase 8 scope? | Unresolved |
| **OQ-SOC-02** | **Feed composition and ranking objective** — bounded by D29's anti-vanity-engagement principle. | Unresolved — **decide before building** |
| **OQ-SOC-03** | Social content visibility and privacy model. | Unresolved |
| **OQ-SOC-04** | Moderation capacity and tooling for feed-scale content. | Unresolved |
| **OQ-SOC-05** | Relationship between social identity and dating profile. | Unresolved |
| **OQ-EV-01** | Event creation, approval, capacity and waitlists. | Unresolved |
| **OQ-EV-02** | Event ticketing, pricing, refunds and cancellation. | Unresolved |
| **OQ-EV-03** | Host eligibility, onboarding and payouts. | Unresolved |
| **OQ-EV-04** | Speed dating format and **how blocking is enforced in rotation without revealing why**. | Unresolved |
| **OQ-EL-01** | Elite application and approval workflow. | Unresolved |
| **OQ-EL-02** | Concierge scope, SLA and staffing. | Unresolved |
| **OQ-EL-03** | **Consent model for concierge introductions** — how a concierge match respects the other party's preferences and blocks. | Unresolved — **safety-critical** |
| **OQ-EL-04** | Privacy / celebrity mode mechanics. | Unresolved |

---

## 16. Items that are NOT open

Recorded to prevent regression. These were open in the 2026-08-30 master specification and are **now approved**. They must not be re-listed as open questions.

| Formerly | Now |
|---|---|
| `OD-02` Product vision | Substantially addressed — Anera V2 is a global dating platform with an approved capability set across Decisions 16–35 |
| `OD-07` Roles and permissions | **Approved** — D32 defines fourteen admin roles/functions (the permission matrix remains open: `OQ-AD01`) |
| `OD-11` Design system | **Approved** — D31 principles and tooling direction (tokens remain open: `OQ-UX01`) |
| `OD-13` Architecture | **Approved** — D30 principles (technology remains open: §10) |
| `OD-18` Messaging | **Approved** — D33 (parameters remain open: §12) |
| `OD-19` Notifications | **Approved in part** — D33 notification controls, D30 notification architecture |
| `OD-20` AI | **Approved as scope** — D18 and D30's AI Gateway (principles remain open: `OQ-B01`) |
| `OD-21` Referral | **Approved** — D27 (parameters remain open: §6) |
| `OD-22` Trust & Safety | **Approved** — D34 and D24 (parameters remain open: §7) |
| `OD-23` Payments | **Approved** — D26 (pricing and entitlements remain open: §5) |
| `OD-24` Admin platform | **Approved** — D32 (permission matrix remains open: `OQ-AD01`) |
| `OD-25` Analytics | **Approved** — D29 (formulas remain open: §13) |
| `OD-26` Security scope | **Approved in principle** — D30 security gates; D34; the standing security posture. Which gaps are in scope per phase depends on `OQ-B03` |
| `OD-27` Privacy | **Approved** — D28 (legal detail remains open: §8) |
| `OD-03` Market | **Approved in part** — D35: global platform, local-first (launch markets remain open: `OQ-P02`) |
| `OD-16` Discovery | **Approved in part** — D35 local-first and the expansion ladder (filters remain open: `OQ-D01`) |

---

## 17. Summary by area

| Area | Open items | Blocking |
|---|---|---|
| Blocking prerequisites | 6 | 6 |
| Governance | 6 | 0 |
| Product & positioning | 6 | 0 |
| Monetization | 15 | 0 |
| Referral | 11 | 0 |
| Trust & Safety | 16 | 0 |
| Privacy | 17 | 0 |
| AI | 8 | 0 |
| Architecture | 14 | 0 |
| Discovery & globalization | 12 | 0 |
| Communication | 11 | 0 |
| Analytics | 6 | 0 |
| Administration | 11 | 0 |
| UX & design | 10 | 0 |
| Raised 2026-09-02 (§15b) | 27 | 0 |
| **Total** | **177** | **6** |

> Some questions cut across domains and are cross-referenced rather than duplicated — for example retention appears under Privacy (`OQ-PR03`) and is referenced from Communication (`OQ-C06`) and Analytics (`OQ-AN05`).

**Items requiring legal review: 10** — `OQ-M11`, `OQ-R08`, `OQ-TS14`, `OQ-PR01`, `OQ-PR02`, `OQ-PR05`, `OQ-PR09`, `OQ-PR10`, `OQ-PR11`, `OQ-PR16`. These must not be answered by engineering or product judgement.

---

*Resolution happens only through `docs/DECISIONS.md`. When an item is resolved, remove it from this register, record the decision, and update the affected subsystem document in the same change.*
