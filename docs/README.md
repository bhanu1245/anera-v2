# Anera V2 — Documentation Index

| Field | Value |
|---|---|
| **Document name** | `docs/README.md` |
| **Status** | **REFERENCE** — the index. It approves nothing. |
| **Purpose** | Explain what the Anera V2 documentation system is, which documents have authority, and how to use them. |
| **Last updated** | 2026-09-02 |

---

## 1. What this is

`docs/` is Anera V2's **specification system**. It is treated as an engineering control system, not as notes.

The governing rule of the project:

```
APPROVED DECISION
      ↓
DOCUMENTED REQUIREMENT
      ↓
TECHNICAL DESIGN
      ↓
IMPLEMENTATION PLAN
      ↓
CODE
      ↓
TEST
      ↓
SECURITY REVIEW
      ↓
ACCEPTANCE
      ↓
RELEASE
```

**No step may be skipped. Nothing goes from a conversation directly to code.**

When something is unclear: **STOP. DOCUMENT. ASK. DECIDE. THEN IMPLEMENT.**

---

## 2. Source-of-truth hierarchy

When two sources disagree, the higher authority wins. This order is binding.

| Priority | Source | Document |
|---|---|---|
| **1** | **Explicitly approved decisions** | [`DECISIONS.md`](DECISIONS.md) |
| **2** | **Approved product / specification documents** | The subsystem specifications in §3.2 |
| **3** | **Approved architecture / technical documents** | [`ARCHITECTURE-GOVERNANCE.md`](ARCHITECTURE-GOVERNANCE.md) |
| **4** | **Existing implementation** — as evidence of *current status only* | [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §1–§38, [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md), [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md) |
| **5** | **General technical inference** — only to explain, always labelled | Anywhere marked `RECOMMENDATION` |

### 2.1 Three rules that follow from this

1. **Existing code is never an approved product requirement.** Most of what is built predates every decision.
2. **If code conflicts with an approved decision:** the decision stands, and the code is recorded as an implementation gap for a future remediation phase. Neither is silently changed.
3. **If a requirement is missing:** it is `OPEN / UNDECIDED`. Record it and escalate. Do not invent it.

---

## 3. Document status table

Status values: `APPROVED` · `BASELINE` · `DRAFT` · `OPEN` · `BLOCKED` · `IMPLEMENTATION GAP` · `REFERENCE`

### 3.1 Authoritative

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`DECISIONS.md`](DECISIONS.md) | **APPROVED** | **Priority 1 — highest** | The append-only register of approved decisions (16–43). Governance rules, non-negotiable rules, dependency map, conflicts requiring remediation. **Read this before anything else.** |

### 3.2 Approved subsystem specifications

Each restates the approved principles of its decision, marks every undecided parameter `OPEN / UNDECIDED`, and records the gap against current implementation.

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) | **APPROVED** | Priority 2 — D34, D24 | Trust, safety, identity and authenticity. The five absolute safety rules. |
| [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) | **APPROVED** | Priority 2 — D28 | Privacy by design, data classification, controls, retention, deletion, export. |
| [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md) | **APPROVED** | Priority 2 — D26 | Five tiers, one-time extras, the eight prohibitions. **No price is approved.** |
| [`REFERRAL-ECONOMY.md`](REFERRAL-ECONOMY.md) | **APPROVED** | Priority 2 — D27 | Referral types, qualification, rewards, ledger, fraud prevention. **No amount is approved.** |
| [`COMMUNICATION.md`](COMMUNICATION.md) | **APPROVED** | Priority 2 — D33 | Messaging, media, voice, video, translation, AI assistance, blocking, reporting. |
| [`ANALYTICS.md`](ANALYTICS.md) | **APPROVED** | Priority 2 — D29 | 21 analytics domains. **No formula is approved.** |
| [`UX-DESIGN-GUIDELINES.md`](UX-DESIGN-GUIDELINES.md) | **APPROVED** | Priority 2 — D31 | Design principles; shadcn foundational, Magic UI selective. **No visual token is approved.** |
| [`ADMIN-OPERATIONS.md`](ADMIN-OPERATIONS.md) | **APPROVED** | Priority 2 — D32 | Admin platform, 14 roles, 7 absolute controls. **No permission matrix is approved.** |
| [`GLOBAL-OPERATING-MODEL.md`](GLOBAL-OPERATING-MODEL.md) | **APPROVED** | Priority 2 — D35, D25 | Local-first discovery, expansion ladder, localization, regional commerce. |
| [`ARCHITECTURE-GOVERNANCE.md`](ARCHITECTURE-GOVERNANCE.md) | **APPROVED** | Priority 3 — D30 | Architectural principles and technical governance. **No technology is approved.** |

### 3.2.1 Decision-to-document map — do not drop these

> **Read this before proposing any documentation taxonomy.** Each document below is the **sole home of an approved decision**. Renaming one is fine. Deleting, merging away, or omitting one from a proposed file list silently drops approved product decisions.
>
> A taxonomy proposal that does not account for every row here is incomplete by definition.

| Decision | Approved title | Sole carrier | Key content that would be lost |
|---|---|---|---|
| **D26** | Subscription, Pricing & Monetization | `SUBSCRIPTION-MONETIZATION.md` | Five tiers (D38); the extras rule; the **eight prohibitions** |
| **D27** | Referral & Growth Economy | `REFERRAL-ECONOMY.md` | Six referrer types; qualification; ledger; no-pyramid rule |
| **D28** | Data, Privacy & Personalization | `PRIVACY-GUIDELINES.md` | Data classification; deletion; retention; AI inference privacy; the two absolute prohibitions |
| **D29** | Analytics, Intelligence & Business Operating System | `ANALYTICS.md` | 21 analytics domains; the **anti-vanity-engagement core principle** |
| **D30** | Platform Architecture & Technical Governance | `ARCHITECTURE-GOVERNANCE.md` | Stop-and-surface rule; modular monolith; AI Gateway; ledgers; TDRs |
| **D31** | UX, UI & Design System | `UX-DESIGN-GUIDELINES.md` | shadcn/Magic UI direction; accessibility; RTL; progressive disclosure |
| **D32** | Administration, Operations & Internal Control System | `ADMIN-OPERATIONS.md` | 14 admin roles; the **seven absolute controls** |
| **D33** | Communication & Social Interaction System | `COMMUNICATION.md` | "Communication must remain fundamentally accessible"; "AI must not silently impersonate users" |
| **D34 + D24** | Trust, Safety, Identity & Authenticity | `TRUST-AND-SAFETY.md` | The **five absolute safety rules**; progressive verification; blocking; reporting |
| **D35 + D25** | Global Launch, Localization & Regional Operating Model | `GLOBAL-OPERATING-MODEL.md` | Local-first; the expansion ladder; Travel/Relocation Mode; regional commerce |
| **D16–D23** | Eight `APPROVED — SCOPE ONLY` decisions | `DECISIONS.md` only | No subsystem document exists, because none supplies principles (`OQ-B01`) |

**Six of these carriers — D28, D29, D30, D31, D33, D35 — were omitted from the taxonomy proposed on 2026-09-02.** That is recorded in `DOCUMENTATION-AUDIT.md` §8 so it is not repeated.

### 3.2.2 Canonical V2 specifications

Created 2026-09-02 from Decisions 36–42. These describe **V2 target state**; `00-MASTER-SPECIFICATION.md` remains the **as-built** baseline. Both are valid and cross-reference each other.

**Product & flows**

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`01-PRODUCT-BLUEPRINT.md`](01-PRODUCT-BLUEPRINT.md) | **APPROVED** scope | D42 + all product decisions | What Anera is, who it serves, the ten ecosystems, MVP/POST-MVP/LONG-TERM/EXPERIMENTAL classification. |
| [`02-APP-FLOW.md`](02-APP-FLOW.md) | **SELECTED** (P1) | D37, D39, D42 | End-to-end user journeys by phase. |
| [`DATING-CORE.md`](DATING-CORE.md) | **APPROVED** | D42, D30, D35 | Profiles, preferences, discovery, ranking, swipe, matching. |
| [`AI-ARCHITECTURE.md`](AI-ARCHITECTURE.md) | **APPROVED** scope | D42 (D18), D30 | AI features, the Gateway, and the eight AI boundaries. **No provider approved.** |
| [`SOCIAL.md`](SOCIAL.md) | **APPROVED** scope — P8 | D42 | Stories, posts, feeds, groups. **New scope.** |
| [`EVENTS.md`](EVENTS.md) | **APPROVED** scope — P9 | D42 (D16, D22) | Events, speed dating, live formats, hosts. |
| [`ELITE.md`](ELITE.md) | **APPROVED** scope — P11 | D42 (D23), D38 | Invitation-only ecosystem and concierge. |

**Architecture**

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`TECH-STACK.md`](TECH-STACK.md) | **LOCKED** core | **D36** | Next.js 16, TypeScript, Tailwind, Prisma, PostgreSQL, cookies, bcrypt, minimal Zustand. Peripherals `OPEN`. |
| [`AUTHENTICATION.md`](AUTHENTICATION.md) | **LOCKED** | **D37** | **HTTP-only cookie + server validation. The seven prohibitions.** |
| [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) | **SELECTED** | D36, D37, D30 | Layers, boundaries, domain modules, request path. |
| [`BACKEND-SCHEMA.md`](BACKEND-SCHEMA.md) | **SELECTED** | D36, D28 | Foundation / Phase 2 / future tables. FKs everywhere. |
| [`API-SPECIFICATION.md`](API-SPECIFICATION.md) | **SELECTED** | D36, D37 | Conventions and the Phase 1 endpoint surface. |
| [`REALTIME-ARCHITECTURE.md`](REALTIME-ARCHITECTURE.md) | **FUTURE** — P3 | D30, D33 | Chat, presence, notifications. Transport `OPEN`. |

**Safety**

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`SECURITY-GUIDELINES.md`](SECURITY-GUIDELINES.md) | **LOCKED** principles | D37, D30, D32 | Secure-by-default requirements + the Phase 1 security checklist. |
| [`VERIFICATION.md`](VERIFICATION.md) | **APPROVED** model | D34, D35 | Progressive verification levels and methods. **No provider approved.** |
| [`FRAUD-PREVENTION.md`](FRAUD-PREVENTION.md) | **APPROVED** scope | D27, D34, D29 | Account, referral, payment and promo fraud. |

**Operations**

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) | **LOCKED** | **D43**, D39, D30 | **Vitest · Playwright · GitHub Actions.** The phase gate and the full Phase 1 verification gate (3 static checks · 20 tests · 8 security assertions). |
| [`DEPLOYMENT-OPERATIONS.md`](DEPLOYMENT-OPERATIONS.md) | **OPEN** hosting | D36, D30, D32 | Environments, secrets, migrations, backups, incidents. |

### 3.3 Baseline and reference

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) | **BASELINE** | Priority 4 for status; **Annex A supersedes §1–§38 where they disagree** | The 2026-08-30 repository audit: 38 sections covering implementation state, security findings, risks and the original open-decision register. **Annex A records what changed after Decisions 16–35.** |
| [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) | **REFERENCE** | Approval from `DECISIONS.md`; status from the repository | Every feature across 25 domains: approved or not, built or not, blocked by what. |
| [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md) | **REFERENCE** | Findings register | 76 verified gaps between code and approved decisions, with risk, dependency and status. **None is to be fixed now.** |
| [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) | **REFERENCE** | Audit record | Cross-document consistency audit: findings, contradictions, resolutions, and what was deliberately left unresolved. |
| [`CHANGELOG.md`](CHANGELOG.md) | **REFERENCE** | History | Documentation history. |

### 3.4 Open and blocked

| Document | Status | Authority | Purpose |
|---|---|---|---|
| [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) | **OPEN** | None — records what is *not* decided | 178 unresolved questions, 6 of them blocking, 10+ requiring legal review. |
| [`ROADMAP.md`](ROADMAP.md) | **APPROVED** — Phase 0 ❄️ FROZEN | **Canonical — Decision 39** | The thirteen-phase plan (0–12): goals, dependencies, database/API/frontend/security/testing work, and exit criteria per phase. |

### 3.5 Not part of the specification system

| Location | What it is | Status |
|---|---|---|
| `worklog.md` | Two MVP task records (auth rebuild, auth-readiness fix) | `REFERENCE` — implementation history, Priority 4. Best explanation of *why* the auth-readiness gate exists. |
| `agent-ctx/*.md` | Three MVP implementation records (messaging, notification service, notification/engagement UI) | `REFERENCE` — Priority 4. Paths reflect an older sandbox layout. |
| `examples/websocket/*` | Reference examples, not wired into the app | Not production code |
| `.agents/skills/**` | AI tooling skills | Not Anera documentation |
| `download/README.md` | A one-line placeholder | Ignore |

> Whether `worklog.md` and `agent-ctx/*` move into `docs/` is `OQ-G05`.

---

## 4. How Claude Code (and any agent) must use these documents

### 4.1 Before doing anything

1. Read [`DECISIONS.md`](DECISIONS.md).
2. Read the subsystem document for your area (§3.2).
3. Check [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) — is the feature approved, and is it built?
4. Check [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) — is anything you need undecided?
5. Check [`ROADMAP.md`](ROADMAP.md) — **is there an approved phase?**

### 4.2 The current answer to step 5

> **Yes. ❄️ Phase 0 is FROZEN (2026-09-02). Phase 1 — V2 Foundation — is the active phase and may begin.**
>
> Scope: [`ROADMAP.md`](ROADMAP.md) Phase 1. Gate: [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) §4.

### 4.3 Binding rules

1. **Do not invent product requirements.** Missing means `OPEN / UNDECIDED`.
2. **Do not silently reconcile a conflict.** Record it, name both sources, escalate. *(D30)*
3. **Do not resolve an `OPEN / UNDECIDED` item by implementing one answer.**
4. **Do not treat existing code as approved.**
5. **Do not treat an `APPROVED — SCOPE ONLY` decision as buildable.** Decisions 16–23 name capabilities and supply no rules.
6. **Do not infer an `ATTESTED` feature's rules from its name.** Super Like, Boost, Spotlight, Travel Mode, City Health Score all sound obvious and none is specified.
7. **Do not fix anything in the gap register** outside an approved phase.
8. **Do not touch `IG-01`** — the localStorage/Bearer authentication conflict is unresolved and blocking.
9. **Do not select a technology, provider, or vendor.** None is approved.
10. **Do not state a legal requirement.** 10 open items require legal review.
11. **Record every significant decision** in `DECISIONS.md`, including rejected alternatives.
12. **Keep documentation and implementation synchronised** — in the same change.

### 4.4 Platform-wide non-negotiable rules

Thirty rules bind every feature. They are listed in full in [`DECISIONS.md` §9](DECISIONS.md#9-platform-wide-non-negotiable-rules). The ones most often violated by accident:

- No paid feature may **guarantee a match, romantic interest, a response, or a date**.
- No paid feature may **bypass blocking, consent, safety, or hard eligibility controls**.
- **Safety cannot be pay-to-win. Elite cannot bypass safety.**
- **Free, Premium, Gold, Platinum and Elite users can all purchase eligible individual extras.**
- **Basic human communication must remain fundamentally accessible.**
- **AI must not silently impersonate users.**
- **Optimize for safe, meaningful connections and sustainable user value, not vanity engagement alone.**
- **START LOCAL. EXPAND INTELLIGENTLY. LET THE USER CHOOSE.**

---

## 5. Future documents

A numbered document set was proposed for future creation. Most of it is **deliberately not created**, because creating a specification from undecided material would be invention.

### 5.1 Created under unnumbered names

These proposed documents were created during the 2026-09-01 consolidation, under the names the product owner directed:

| Proposed | Created as |
|---|---|
| `11-TRUST-SAFETY.md` | [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) |
| `13-PRIVACY-GUIDELINES.md` | [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) |
| `15-SUBSCRIPTION-MONETIZATION.md` | [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md) |
| `16-REFERRAL-ECONOMY.md` | [`REFERRAL-ECONOMY.md`](REFERRAL-ECONOMY.md) |
| `21-ANALYTICS.md` | [`ANALYTICS.md`](ANALYTICS.md) |
| `22-ADMIN-MODERATION.md` | [`ADMIN-OPERATIONS.md`](ADMIN-OPERATIONS.md) (admin) + [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) (moderation) |
| `25-IMPLEMENTATION-PLAN.md` | [`ROADMAP.md`](ROADMAP.md) — now **APPROVED** (D39) |
| `26-UX-CONTENT-GUIDELINES.md` | [`UX-DESIGN-GUIDELINES.md`](UX-DESIGN-GUIDELINES.md) (UX; content guidelines not yet written) |
| `28-CHANGELOG.md` | [`CHANGELOG.md`](CHANGELOG.md) |

> **Duplicate numbered versions must not be created.** Doing so would produce two documents of record for the same subject — the exact contradiction this system exists to prevent. Whether to renumber the existing files is `OQ-G06`.

### 5.2 Deferred — and why

| Document | Why deferred |
|---|---|
| `01-PRODUCT-REQUIREMENTS.md` | Requires ratification of existing behaviour (`OQ-B07`) and principles for Decisions 16–23 (`OQ-B01`). Writing it now would invent requirements. |
| `02-APP-FLOW.md` | Flows depend on undecided features (message requests, verification, paywall, expansion UX). |
| `03-TECH-STACK.md` | **No technology is approved.** D30 approves principles only. A stack document would present the existing MVP stack as approved. |
| `04-SYSTEM-ARCHITECTURE.md` | Requires domain boundaries (`OQ-A08`) and technology (`OQ-A01`). `ARCHITECTURE-GOVERNANCE.md` carries the approved principles instead. |
| `05-FRONTEND-ARCHITECTURE.md` | Requires the stack decision. |
| `06-BACKEND-ARCHITECTURE.md` | Requires the stack and domain boundaries. |
| `07-DATABASE-SCHEMA.md` | Requires `OQ-B05` (engine, FKs, location model). **Inventing schema is explicitly prohibited.** |
| `08-API-SPECIFICATION.md` | Requires `OQ-A10` (versioning, validation, error envelope). |
| `09-AI-ARCHITECTURE.md` | D18 supplies **no principles**; no provider or model is approved. |
| `10-MATCHING-ENGINE.md` | **No decision defines matching logic** (`OQ-B09`). D30 approves only that the architecture exists. |
| `12-SECURITY-GUIDELINES.md` | The approved security posture is recorded in `00-MASTER-SPECIFICATION.md` §26.3 and `DECISIONS.md`; a standalone document requires the deployment and stack decisions. |
| `14-COMMERCE-ARCHITECTURE.md` | Requires entitlements, pricing and provider decisions. `SUBSCRIPTION-MONETIZATION.md` carries the approved principles. |
| `17-MARKETPLACE.md` | D21 supplies **no principles**. |
| `18-EVENTS-SPEED-DATING.md` | D16 and D22 supply **no principles**. |
| `19-ELITE-CONCIERGE.md` | D23 supplies **no principles**. |
| `20-NOTIFICATION-ARCHITECTURE.md` | Requires push provider and real-time transport decisions. |
| `23-TESTING-STRATEGY.md` | ✅ **Created** as [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md); tooling locked by D43. |
| `24-DEPLOYMENT-INFRASTRUCTURE.md` | Requires `OQ-B04` (deployment environment). |
| `GLOBAL-OPERATING-MODEL.md` equivalent | Already created. |

**The pattern:** a document can be written when its decision supplies principles. Eight decisions (16–23) supply none, and no technology decision has been made. Those two facts account for nearly every deferral.

---

## 6. Where to start

| You are | Start here |
|---|---|
| **The product owner** | [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) §2 — the 9 blocking items. Nothing can proceed until those are answered. |
| **A new developer** | This file → [`DECISIONS.md`](DECISIONS.md) → [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) → your subsystem document. |
| **A new Claude Code session** | This file → [`DECISIONS.md`](DECISIONS.md) → §4 above (binding on you) → [`ROADMAP.md`](ROADMAP.md) (confirms no phase is approved). |
| **A new ChatGPT account or external collaborator** | [`DECISIONS.md`](DECISIONS.md) plus this index is the complete authoritative context. Nothing remembered from an earlier session is authoritative. |
| **Looking for what is built** | [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) and [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §30. |
| **Looking for what is broken** | [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md). |

---

## 7. Maintaining this system

| Situation | Required action |
|---|---|
| A decision is approved | Append to `DECISIONS.md`. Update the affected subsystem document, `FEATURE-INVENTORY.md`, `OPEN-QUESTIONS.md` and `CHANGELOG.md` **in the same change**. |
| A decision changes | **Never edit the original.** Add a superseding decision; mark the old one `SUPERSEDED BY Decision NN`. |
| A conflict is found | Record it in `IMPLEMENTATION-GAPS.md` with all nine fields. Escalate. Do not resolve it. |
| A gap is remediated | Only inside an approved phase. Close it in `IMPLEMENTATION-GAPS.md`, update `FEATURE-INVENTORY.md`, record it in `CHANGELOG.md`. |
| An open question is answered | Only by an approved decision. Remove it from `OPEN-QUESTIONS.md`, record the decision, update the subsystem document. |
| A phase is approved | Record it in `DECISIONS.md` first, then rewrite `ROADMAP.md` and change its status. |
| Any document is edited | Update its `Last updated` field. |

---

*`docs/DECISIONS.md` is the highest authority in this project. Everything else, including this index, is subordinate to it.*
