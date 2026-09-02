# Anera V2 — Trust, Safety, Identity & Authenticity

| Field | Value |
|---|---|
| **Document name** | `docs/TRUST-AND-SAFETY.md` |
| **Status** | **APPROVED** — principles. Parameters are `OPEN / UNDECIDED`. |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 34** (full principle set) and **Decision 24** (subject area). Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved Trust & Safety requirements for Anera V2, the boundary of what is decided, and the gap between them and the current implementation. |
| **Last updated** | 2026-09-02 — renamed from `TRUST-SAFETY.md`; content unchanged |

> **This closes `OD-22` in the master specification.** Trust & Safety is no longer an unresolved product decision — it is an **approved core platform capability**. What remains open is parameter detail (providers, thresholds, SLAs, jurisdictions), not whether the capability exists.

---

## 1. Position of Trust & Safety in the platform

`APPROVED (D34)` — **Trust and Safety is a core platform capability.** It is not a feature, not a moderation add-on, and not something bolted on before launch.

`APPROVED (D30)` — A **central Trust & Safety architecture** is required. Safety cannot be implemented as scattered checks inside individual feature code.

**Consequence:** every product surface — Discovery, Matching, Communication, Speed Dating, Experiences, Events, Marketplace, Elite, Concierge — is designed against Trust & Safety from the start, not retrofitted.

---

## 2. The five absolute rules

`APPROVED (D34)` — these are non-negotiable and override all other product considerations, including revenue.

| # | Rule |
|---|---|
| 1 | **Safety cannot be pay-to-win.** |
| 2 | **Elite cannot bypass safety.** |
| 3 | **Paid features cannot bypass blocking or consent.** |
| 4 | **Verified does not mean automatically safe.** |
| 5 | **Unverified does not automatically mean unsafe.** |

Rules 4 and 5 carry a direct design consequence that must not be lost: **a verification badge is a signal, never a safety guarantee.** Product copy, UX and ranking must not imply otherwise.

Reinforcing rules from adjacent decisions: no paid feature may bypass safety, consent, blocking, or hard eligibility controls (D26, D33); enforcement is risk-based with false-positive protection and appeals (D34); blocking is immediate (D34).

---

## 3. Approved capability areas

Each entry below is `APPROVED (D34)` as a principle. The implementation detail beneath each is `OPEN / UNDECIDED` unless stated.

### 3.1 Identity verification

`APPROVED` — **Identity verification** and **progressive verification** are approved.

**Progressive verification** means verification is a **spectrum with levels**, not a binary flag. This is architecturally significant: a single boolean cannot express it.

`OPEN / UNDECIDED`:
- Verification providers and methods. **No provider is approved. Do not select one.**
- The verification levels themselves, and what each level unlocks.
- Whether any level is mandatory, and at what point in the journey.
- Re-verification triggers and expiry.

`APPROVED (D35)` — **regional verification**: verification requirements vary by region and must be configurable.

### 3.2 Profile authenticity

`APPROVED` — **profile authenticity** is a required capability.

`OPEN / UNDECIDED`: authenticity signals, detection methods, thresholds, and what happens when a profile fails an authenticity check.

### 3.3 Photo authenticity

`APPROVED` — **photo authenticity** is a required capability.

`CURRENT IMPLEMENTATION` — partial and unrelated controls exist: the photo upload endpoint validates MIME type, file size, **magic-byte signatures** (defeating MIME spoofing) and sanitises the file extension. These are **file-integrity** controls, not **authenticity** controls — they say nothing about whether the photo depicts the account holder.

`OPEN / UNDECIDED`: authenticity method (selfie comparison, liveness, reverse-image checks), thresholds, and consequences.

### 3.4 Scam prevention

`APPROVED` — **scam prevention**, **catfishing protection** and **financial scam protection** are all required capabilities.

`OPEN / UNDECIDED`: detection signals, intervention points, user warnings, and the enforcement ladder.

> Financial scam protection interacts with Decision 20 (user earning), Decision 21 (Marketplace) and Decision 27 (referral rewards): wherever money can move, scam vectors follow.

### 3.5 Harassment protection

`APPROVED` — **harassment protection** is a required capability.

`OPEN / UNDECIDED`: definitions, detection, thresholds and response.

### 3.6 Consent architecture

`APPROVED` — a **consent architecture** is required.

**Consent is a platform-level architecture, not a per-feature checkbox.** Decisions 26, 33 and 34 all independently prohibit paid features from bypassing consent, which means consent must be enforceable at a level features cannot route around.

`OPEN / UNDECIDED`: what consent covers, how it is captured, how it is withdrawn, and how it is represented in data.

### 3.7 Blocking

`APPROVED (D34, D33)` — **immediate blocking**.

The word *immediate* is part of the approved principle: a block takes effect at once, not on next refresh, not after review.

`OPEN / UNDECIDED`:
- Block semantics: does a block hide both parties from each other, remove existing matches, close existing conversations, or all three?
- Whether blocks are visible to the blocked party.
- Block limits, if any.
- Interaction with Events, Speed Dating, Marketplace and Concierge surfaces.

### 3.8 Reporting

`APPROVED (D34, D33)` — **reporting** is a required capability.

`OPEN / UNDECIDED`: report categories, what can be reported (profile, photo, message, event, listing, host, provider), triage SLAs, feedback to the reporter, and abuse of the reporting system itself.

### 3.9 Moderation

`APPROVED` — **AI-assisted moderation** with **human review where appropriate**.

The two are approved together. AI assistance does **not** remove the requirement for human review where human review is appropriate. Which cases require human review is `OPEN / UNDECIDED`.

`APPROVED (D18, D30)` — AI used for moderation flows through the **central AI Gateway**, and is subject to AI quality/cost/safety analytics (D29) and AI inference privacy (D28).

### 3.10 Enforcement

`APPROVED` — **risk-based enforcement** with **false-positive protection**.

Enforcement is proportionate to assessed risk. Blunt uniform enforcement is not the approved model.

`OPEN / UNDECIDED`: the risk model, the enforcement ladder (warning → restriction → suspension → ban), account status model, and duration rules.

`CURRENT IMPLEMENTATION` — there is **no account status field at all**, so no enforcement action is representable in the data model today.

### 3.11 Appeals

`APPROVED` — an **appeals** path is required.

`OPEN / UNDECIDED`: who adjudicates, timelines, evidence handling, and outcomes.

`APPROVED (D32)` — Trust & Safety is an admin function with its own role; appeals adjudication is subject to separation of duties, audit logging and least privilege.

### 3.12 Date safety

`APPROVED` — **date safety** and **trusted contacts where supported**.

"Where supported" is a qualifier in the approved text: trusted contacts are not universally available. Where they are supported is `OPEN / UNDECIDED`.

`OPEN / UNDECIDED`: date safety features, what a trusted contact receives, consent for sharing with a trusted contact (interacts with D28 location privacy), and regional availability.

### 3.13 Surface-specific safety

`APPROVED` — each of these is named as a distinct safety requirement:

| Surface | Approved requirement | Owning decision |
|---|---|---|
| Speed Dating | Speed Dating safety | D16 · D34 |
| Events | Event safety | D22 · D34 |
| Marketplace | Marketplace safety | D21 · D34 |
| Concierge | Concierge safety | D23 · D34 |

`OPEN / UNDECIDED`: the specific controls for each, because the underlying features themselves have no approved principles (D16, D21, D22, D23 are `APPROVED — SCOPE ONLY`).

### 3.14 Age and eligibility protection

`APPROVED` — **age / eligibility protection** is required.

`CURRENT IMPLEMENTATION` — the only control is a self-declared integer with an 18–120 range check, enforced in `src/app/api/profile/route.ts` and the onboarding form. There is **no verification of any kind**.

`OPEN / UNDECIDED`: age-verification method, what "hard eligibility controls" (referenced in D26 and D33) consist of, and regional age requirements.

### 3.15 Safety and identity data handling

`APPROVED (D34)` — safety and identity data is **restricted**. It is not general-purpose profile data.

`APPROVED (D28)` — least-privilege internal access, auditability, and controlled exports apply.

`APPROVED (D32)` — no unrestricted raw database access; no shared admin accounts; audit logs mandatory.

`OPEN / UNDECIDED`: the data classification scheme itself (D28), retention periods for safety data, and who may access what.

### 3.16 Global and regional safety configuration

`APPROVED (D34, D35)` — safety is **globally and regionally configurable**.

`APPROVED (D32)` — country/city configuration is an admin capability.

`OPEN / UNDECIDED`: which safety parameters vary by region, and the legal obligations in each jurisdiction. **Jurisdiction-specific legal requirements require legal review and must not be inferred.**

---

## 4. What is deliberately NOT specified here

This document does **not** state, because nothing approved supports it:

- Any specific verification provider, vendor, or technology.
- Any specific legal or regulatory obligation in any jurisdiction.
- Report categories, SLAs, or enforcement durations.
- Detection thresholds or risk scores.
- The moderation queue design.
- Whether Trust & Safety capabilities gate the V2 release.

Each of these is `OPEN / UNDECIDED` and listed in [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md).

---

## 5. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository. See [`IMPLEMENTATION-GAPS.md`](IMPLEMENTATION-GAPS.md) for the full register.

### 5.1 Controls that exist and support this decision — preserve them

| Control | Location |
|---|---|
| Photo upload: MIME allowlist, size cap, **magic-byte validation**, extension sanitisation | `src/app/api/profile/photos/route.ts` |
| Match-participation checks on message read and write (403 for non-participants) | `src/app/api/messages/route.ts` |
| Self-swipe prevention | `src/app/api/swipe/route.ts` |
| 18+ age floor (self-declared) | `src/app/api/profile/route.ts` |
| Session-derived user identity — the userId always comes from the session, never from client input | `src/lib/auth.ts` and every protected route |
| Ownership verification on all photo mutations | `src/app/api/profile/photos/**` |

### 5.2 Gaps against approved requirements

**None of these is to be fixed now.** They are remediation items for a future approved phase.

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-06` | **Verification badge conflict.** `swipe-card.tsx` renders a verified badge from `profile.isVerified`; `api/discover/route.ts` hardcodes `isVerified: false`; **no verification system, data or process exists.** The badge can never appear, and the field promises a capability that does not exist. | §3.1 identity verification, progressive verification, profile authenticity |
| `IG-28` | **No blocking capability.** No `Block` model, no exclusion from discovery or chat. | §3.7 immediate blocking |
| `IG-29` | **No reporting capability.** Nothing can be reported. | §3.8 reporting |
| `IG-32` | **No moderation capability.** No queue, no review workflow, no classification, no moderator role, no enforcement actions, no account status field, no ban/suspension, no appeals. | §3.9, §3.10, §3.11 |
| `IG-33` | **No verification of any kind** — no identity, photo, phone or email verification. | §3.1, §3.3 |
| `IG-34` | **No unmatch capability.** | §3.7 (related) |
| `IG-35` | **Age is self-declared only.** | §3.14 |
| `IG-30` | **No anti-spam, no rate limiting anywhere** in the application. | D33 anti-spam, risk-based rate limiting |
| `IG-61` | **No regional safety configuration** exists. | §3.16 |

### 5.3 A note on `IG-06`

The verification badge is the clearest example of the pattern this documentation system exists to prevent: **a UI promise with no backing capability**.

Its correct treatment, per Decision 24 and this document:

- **Approved product requirement** — identity verification and progressive verification are approved (§3.1).
- **Existing implementation gap** — the badge renders a capability that does not exist.
- **Future implementation / remediation item** — to be addressed in an approved phase.

**Do not implement verification now.** Progressive verification (§3.1) means the eventual solution is not simply "make `isVerified` return true" — a boolean cannot express a verification spectrum, so the fix is a design task, not a one-line change.

---

## 6. Dependencies

| Decision | Relationship |
|---|---|
| D16 Experiences & Speed Dating | Speed Dating safety is mandatory |
| D18 Anera AI | AI-assisted moderation; central AI Gateway |
| D21 Marketplace | Marketplace safety; financial scam exposure |
| D22 Events & Hosts | Event safety; hosts are a non-user participant type requiring trust treatment |
| D23 Elite & Concierge | Concierge safety; **Elite cannot bypass safety** |
| D26 Monetization | No paid safety, blocking, consent or eligibility bypass; safety not pay-to-win |
| D27 Referral | Fraud prevention overlaps with scam prevention and identity |
| D28 Privacy | Restricted safety/identity data; least privilege; auditability |
| D29 Analytics | Safety analytics and fraud analytics are first-class |
| D30 Architecture | **Central Trust & Safety architecture** |
| D31 UX | Safety UX must be reachable, clear and trustworthy |
| D32 Admin | Trust & Safety admin role, enforcement tooling, emergency controls, kill switches, audit logs, separation of duties |
| D33 Communication | Blocking, reporting, anti-spam, risk-based rate limiting, harassment protection |
| D35 Global | Regional verification and regional safety configuration |

---

## 7. Rules for anyone implementing in this area

1. **Do not implement any Trust & Safety capability yet.** No phase has been approved (`OD-29` remains open).
2. **Do not select a verification provider.** None is approved.
3. **Do not invent report categories, thresholds, SLAs, or enforcement durations.**
4. **Do not infer legal obligations.** Jurisdiction-specific requirements need legal review.
5. **Do not "fix" `isVerified` by making it return a value.** Progressive verification requires a design, not a patch.
6. **Never let a paid feature bypass safety, consent, blocking or eligibility** — this is checked at design review, not discovered in code review.
7. **Preserve the existing controls in §5.1.** They are the only safety-supporting controls the product has.

---

*Derived from `docs/DECISIONS.md` Decisions 24 and 34. Parameters marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
