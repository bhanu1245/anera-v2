# Anera V2 — Referral & Growth Economy

| Field | Value |
|---|---|
| **Document name** | `docs/REFERRAL-ECONOMY.md` |
| **Status** | **APPROVED** — principles. **All reward amounts, qualification thresholds and limits are `OPEN / UNDECIDED`.** |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 27**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved referral and growth economy requirements for Anera V2. |
| **Last updated** | 2026-09-01 |

> **This closes `OD-21` in the master specification.** The referral system is no longer entirely unspecified — its **principles** are approved. Its **parameters** are not.

> **No reward amount appears in this document.** None has been approved.

---

## 1. The two absolute prohibitions

`APPROVED (D27)`:

| # | Prohibition |
|---|---|
| 1 | **No unlimited multi-level recruitment.** |
| 2 | **No pyramid or passive-income referral structure.** |

These define the shape of the entire system. Any design in which a referrer earns indefinitely from referrals-of-referrals, or earns passively without qualification, is prohibited by approved decision — regardless of how it is labelled.

**"No *unlimited*" multi-level recruitment** does not automatically mean multi-level is entirely forbidden; it means it cannot be unlimited. Whether any bounded multi-level structure is permitted, and what bound applies, is `OPEN / UNDECIDED` and must be decided explicitly rather than inferred in either direction.

---

## 2. Referral types

`APPROVED (D27)` — the following referrer types are approved. The system cannot assume "referrer = user".

| Referrer type | Status | Rules |
|---|---|---|
| **User referrals** | `APPROVED` | `OPEN / UNDECIDED` |
| **Host referrals** | `APPROVED` | `OPEN / UNDECIDED` — Hosts are defined by D22, which supplies no principles |
| **Expert / provider referrals** | `APPROVED` | `OPEN / UNDECIDED` — providers are defined by D21, which supplies no principles |
| **Creator / community referrals** | `APPROVED` | `OPEN / UNDECIDED` |
| **Partner referrals** | `APPROVED` | `OPEN / UNDECIDED` |
| **Ambassador / community growth** | `APPROVED` | `OPEN / UNDECIDED` — D35 also approves **local ambassadors / community** |

**Consequence for design:** the referral model must accommodate at least six referrer types with potentially different qualification criteria and reward structures. A single `referredBy` user field would not satisfy this.

---

## 3. Referral mechanics

### 3.1 Referral instruments

`APPROVED (D27)` — **referral links / codes / QR**.

All three instruments are approved. `OPEN / UNDECIDED`: format, lifetime, revocability, personalisation, and whether one user may hold several.

### 3.2 Attribution

`APPROVED` — attribution is implied by the existence of referral instruments and qualification-based rewards.

`OPEN / UNDECIDED` — **the entire attribution model**:
- First-touch vs last-touch vs multi-touch.
- Attribution window length.
- Deferred deep-link handling (a referral clicked before install/registration).
- What happens when several referrers touch the same referee.
- Cross-device attribution.

### 3.3 Qualification

`APPROVED (D27)` — **qualification-based rewards**.

A referral does **not** pay out merely for existing. Something must qualify it.

`OPEN / UNDECIDED` — **what qualifies a referral**, for each of the six referrer types. Candidate criteria (registration, onboarding completion, verification, subscription purchase, sustained activity) are **not** approved and must not be assumed.

### 3.4 Lifecycle

`OPEN / UNDECIDED` — the referral lifecycle states and their transitions. The master specification's `REF-03` question (invited → signed up → qualified → rewarded → expired/void) remains an open question, not an approved model.

---

## 4. Rewards

### 4.1 Approved reward forms

`APPROVED (D27)`:

| Reward form | Status | Notes |
|---|---|---|
| **Anera Credits / non-cash rewards** | `APPROVED` | Credits exist as an approved concept. Their mechanics — earning, spending, expiry, balance, transferability — are `OPEN / UNDECIDED` (D17 supplies no digital-economy principles). |
| **Eligible monetary rewards** | `APPROVED` | Monetary rewards are permitted **where eligible**. Eligibility is country-specific (§6) and `OPEN / UNDECIDED`. |
| **Two-sided rewards where appropriate** | `APPROVED` | "Where appropriate" is a qualifier — two-sidedness is **conditional, not universal**. The conditions are `OPEN / UNDECIDED`. |

### 4.2 What is not decided

`OPEN / UNDECIDED`, and must not be invented:

- **Reward amounts.** No value, in Credits or currency, is approved.
- Which referrer types receive which reward form.
- When two-sided rewards apply and when they do not.
- Whether rewards confer subscription entitlements (interacts with `SUBSCRIPTION-MONETIZATION.md`).
- Reward expiry.
- Payout mechanism and timing for monetary rewards.
- Tax treatment of rewards — **requires legal review**.

---

## 5. Referral ledger

`APPROVED (D27)` — a **referral ledger** is required.

`APPROVED (D30)` — **auditable ledgers** are an approved architectural principle.
`APPROVED (D32)` — **financial adjustments are ledger-based**, never direct data edits, and are performed under the Finance admin function with audit logging and separation of duties.

**Consequence:** referral value movement is recorded in an auditable ledger from the first implementation. It is not a counter on a user row, and corrections are ledger entries, not updates.

`OPEN / UNDECIDED`: ledger schema, entry types, reconciliation process, and retention (interacts with `PRIVACY-GUIDELINES.md` §5 — financial record retention and privacy erasure can conflict).

---

## 6. Country-specific rules

`APPROVED (D27)` — **country-specific rules** apply to referrals.
`APPROVED (D35)` — regional configuration is a platform capability; **country/city configuration** is an admin function (D32).

**Consequence:** referral eligibility, reward form and reward value must be **regionally configurable**, not hard-coded.

`OPEN / UNDECIDED`, and **requiring legal review**:

- Which countries permit monetary referral rewards.
- Per-country caps, disclosure requirements, and promotion rules.
- Tax and reporting obligations.
- Any jurisdiction where referral rewards are restricted or prohibited.

**No country-specific rule is stated anywhere in Anera's documentation, and none may be inferred.**

---

## 7. Fraud prevention

`APPROVED (D27)` — **fraud prevention** is a required component of the referral system, not an optional enhancement.

`APPROVED (D29)` — **fraud analytics** are required.
`APPROVED (D34)` — scam prevention, identity verification and profile authenticity are approved capabilities that the referral system depends on.

**Consequence:** fraud prevention is designed in from the start. A referral system built first and protected later is not the approved model.

`OPEN / UNDECIDED` — the specific controls and thresholds. Candidate vectors identified in the master specification's `REF-07` (self-referral, duplicate accounts, disposable email, device fingerprinting, velocity limits, manual review, reward clawback) remain **open questions**, not approved controls.

> Note the privacy interaction: fraud controls that fingerprint devices or retain identifiers are subject to Decision 28 (data minimization, classification, retention). Fraud prevention does not exempt a control from privacy review.

---

## 8. Limits

`OPEN / UNDECIDED` — no limit is approved. This includes:

- Maximum referrals per user, per referrer type, per period.
- Caps on total reward value per user or per campaign.
- Whether limits differ by country or subscription tier.

The only approved constraint on scale is prohibition 1: **no unlimited multi-level recruitment**.

---

## 9. Administration

`APPROVED (D32)` — the admin platform includes **Finance**, **Promotions**, and **Country / city configuration** functions, with RBAC, least privilege, approval workflows, audit logs, ledger-based financial adjustments and separation of duties.

`OPEN / UNDECIDED`: which admin role may view, adjust, void, or manually grant referrals; which of those actions require an approval workflow; and the referral administration UI.

---

## 10. Analytics

`APPROVED (D29)` — **referral analytics** are required, alongside fraud analytics and privacy-conscious analytics.

`OPEN / UNDECIDED`: the referral event taxonomy, funnel definition, and success metrics. Decision 29 approves no formula.

---

## 11. Edge cases

`OPEN / UNDECIDED` — none of the following has an approved answer. They are listed so they are not forgotten, **not** because a treatment is proposed:

- The referee deletes their account after a reward is granted.
- The referrer deletes their account with unclaimed or pending rewards.
- The referee was already an Anera user.
- A reward is granted, then the qualifying subscription is refunded or charged back.
- A referral occurs during an outage or is attributed after a delay.
- An expired or revoked code is used.
- A referee registers in a country where rewards are not eligible.
- A referrer changes country (interacts with D35 global account portability).
- A referral is later determined to be fraudulent after the reward is spent.

---

## 12. Current implementation state

`CURRENT IMPLEMENTATION` — **nothing exists.**

The master specification's audit searched the entire repository — source, schema, migrations, all markdown, all configuration — for `referr*`, `invite`, `invitation`, `reward`, `redeem` and `promo`, and found **zero** application matches.

| Gap | Description |
|---|---|
| `IG-20` | **No referral capability of any kind exists**: no model, no endpoint, no instrument, no ledger, no fraud control, no analytics. This is a greenfield gap against an approved decision, not a conflict. |

---

## 13. Dependencies

| Decision | Relationship |
|---|---|
| D17 Digital Economy | Anera Credits |
| D20 Rewards & Earning | Rewards, earning, ledgers |
| D21 Marketplace | Expert / provider referrals |
| D22 Events & Hosts | Host referrals; ambassadors |
| D26 Monetization | Rewards may confer entitlements; no guaranteed outcomes |
| D28 Privacy | Referral tracking is personal data; fraud controls are subject to privacy review |
| D29 Analytics | Referral analytics; fraud analytics |
| D30 Architecture | Auditable ledgers; commerce architecture |
| D32 Admin | Finance, Promotions, country/city configuration; ledger-based adjustments |
| D34 Trust & Safety | Identity, authenticity and scam prevention underpin fraud controls |
| D35 Global | Country-specific rules; local ambassadors; global account portability |

---

## 14. Rules for anyone implementing in this area

1. **Do not implement, scaffold, or "prepare" a referral system.** No phase is approved and no parameter is decided.
2. **Do not invent a reward amount, a qualification criterion, or a limit.** All are `OPEN / UNDECIDED`.
3. **Do not design for a single referrer type.** Six are approved.
4. **Do not build a counter — build toward a ledger.** Ledger-based recording is an approved architectural constraint.
5. **Do not assume two-sided rewards.** They apply "where appropriate", and the conditions are undecided.
6. **Do not state a country's referral or tax rules.** That requires legal review.
7. **Do not defer fraud prevention.** It is approved as part of the system, not as a follow-up.
8. **Never design anything resembling a pyramid, passive-income, or unlimited multi-level structure.**

---

*Derived from `docs/DECISIONS.md` Decision 27. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
