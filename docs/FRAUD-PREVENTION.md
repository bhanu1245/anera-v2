# Anera V2 — Fraud Prevention

| Field | Value |
|---|---|
| **Purpose** | Fraud and abuse controls across accounts, referrals, payments and promotions. |
| **Status** | **APPROVED** for scope; **`OPEN`** for every signal, threshold and model |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D27 (fraud prevention required), D34 (scam prevention), D29 (fraud analytics). |
| **Dependencies** | D27 · D34 · D29 · D28 (privacy limits on signals) · D32 (review tooling) |
| **Related documents** | [`REFERRAL-ECONOMY.md`](REFERRAL-ECONOMY.md) · [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`VERIFICATION.md`](VERIFICATION.md) · [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decisions 27/34. |

---

## 1. Principle

`LOCKED (D27)` — **fraud prevention is a required component, not a later enhancement.** A referral or payment system built first and protected afterwards is not the approved model.

`LOCKED (D34)` — enforcement is **risk-based**, with **false-positive protection** and an **appeals** path. Fraud controls are not exempt from either.

## 2. Fraud domains

| Domain | Risk | Phase |
|---|---|---|
| **Fake accounts** | Catfishing, scams, referral farming | 4 |
| **Bot / automation** | Scale abuse | 4 |
| **Referral fraud** | Self-referral, farming, collusion | 7 |
| **Payment fraud** | Stolen instruments, chargebacks | 6 |
| **Subscription abuse** | Refund cycling, trial abuse | 6 |
| **Promo abuse** | Code sharing, stacking | 6–7 |
| **Spam** | Mass messaging | 3 |
| **Scam patterns** | Romance and financial scams | 4 |
| **Account farming** | Bulk creation for resale | 4 |

> **Financial scam protection is explicitly approved (D34)** and matters most wherever money moves: referral rewards (D27), user earning (D20), marketplace (D21), events (D22).

## 3. Signals

`APPROVED` in scope. **All specifics `OPEN` (`OQ-R07`).**

| Class | Examples | Privacy constraint |
|---|---|---|
| **Device** | Fingerprint, platform | **Subject to D28** — minimisation, classification, retention |
| **Velocity** | Signups, swipes, messages, redemptions per period | Aggregate preferred |
| **Network** | IP reputation, shared infrastructure | Retention bounded |
| **Behavioural** | Interaction patterns | Must not become surveillance |
| **Content** | Scam language, contact-detail solicitation | Conversation privacy applies (`OQ-PR12`) |
| **Graph** | Referrer/referee relationships, clusters | Core referral control |
| **Payment** | Instrument reuse, chargeback history | PCI scope `OPEN` |

`LOCKED (D28)` — **fraud prevention does not exempt a signal from privacy review.** Device fingerprinting and identifier retention are subject to data minimisation, classification and retention limits.

## 4. Referral fraud — the priority case

`LOCKED (D27)`:

- Rewards are **qualification-based** — a referral does not pay merely for existing.
- **No unlimited multi-level recruitment. No pyramid or passive-income structure.**
- All referral value movement is recorded in the **append-only referral ledger**.
- Country-specific rules apply.

`OPEN` — self-referral detection, duplicate-account detection, velocity limits, collusion detection, reward **clawback** on later-discovered fraud (`OQ-R07`, `OQ-R10`).

> **Controls must exist before rewards are payable** (Phase 7 exit criterion). Clawback is harder than prevention once value has been spent.

## 5. AI fraud scoring

`APPROVED (D18/D42, D29)` — AI-assisted scoring is in scope, Phase 7.

`LOCKED` — routes through the **AI Gateway**; scores are **advisory, not automatic enforcement**; **human review where appropriate** (D34); false-positive protection applies.

## 6. Enforcement

`LOCKED (D34)` — proportionate and reversible:

| Tier | Example |
|---|---|
| Monitor | Flag, no user impact |
| Friction | Additional verification |
| Limit | Rate or capability restriction |
| Withhold | Reward held pending review |
| Suspend | Temporary |
| Ban | Permanent, appealable |
| Clawback | Reverse fraudulently obtained value |

**Every tier is appealable.** Automated action without a review path is prohibited.

## 7. Operations

`APPROVED (D32)` — review queues sit with **Trust & Safety**; financial reversals with **Finance**, **ledger-based only**, under separation of duties and audit logging.

## 8. Analytics

`APPROVED (D29)` — fraud analytics are first-class, not a by-product. Formulas and thresholds: `OPEN`.

## 9. Phasing

| Phase | Scope |
|---|---|
| **3** | Message rate limiting and anti-spam (D33) |
| **4** | Fake account and scam detection; enforcement ladder; appeals |
| **6** | Payment and subscription abuse |
| **7** | Referral fraud — **before rewards are payable** |

## 10. Open items

| Item | Tracked as |
|---|---|
| Signals, thresholds, risk model | `OQ-R07`, `OQ-TS07` |
| Referral edge cases and clawback | `OQ-R10` |
| Rate-limit thresholds | `OQ-C05` |
| Device-signal retention | `OQ-PR03` |
| Content scanning vs conversation privacy | `OQ-PR12` |
| PCI scope | `OQ-M06` |

---

*Canonical fraud prevention scope. All thresholds and models remain undecided.*
