# Anera V2 — Subscription, Pricing & Monetization

| Field | Value |
|---|---|
| **Document name** | `docs/SUBSCRIPTION-MONETIZATION.md` |
| **Status** | **APPROVED** — principles and tier names. **All pricing, entitlements and allowances are `OPEN / UNDECIDED`.** |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 26** (model, prohibitions) and **Decision 38** (five-tier ladder, superseding D26 tier names), with **Decision 17** (digital economy), **Decision 23** (Elite), **Decision 20** (user value) and **Decision 35** (regional commerce). Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved monetization model for Anera V2, the boundary of what is decided, and the prohibitions that bind every paid feature. |
| **Last updated** | 2026-09-02 — D38 supersedes the D26 tier names; "Plus" deprecated |

> **No price appears in this document.** No price has been approved. Any number here would be invention with commercial consequences.

---

## 1. The monetization model

`APPROVED (D26)` — Anera V2 monetizes through **two complementary mechanisms**:

| Mechanism | Approved purpose |
|---|---|
| **Subscriptions** | Provide **bundled value**. |
| **One-time extras** | Provide **flexibility**. |

They are complementary, not substitutes. A user is not required to choose one path.

---

## 2. Subscription tiers

`APPROVED (D38, superseding D26)` — five tiers are approved **by name**:

| Tier | Status | Entitlements |
|---|---|---|
| **Free** | `APPROVED` — the tier exists | `OPEN / UNDECIDED` |
| **Premium** | `APPROVED` — the tier exists | `OPEN / UNDECIDED` |
| **Gold** | `APPROVED` — the tier exists | `OPEN / UNDECIDED` |
| **Platinum** | `APPROVED` — the tier exists | `OPEN / UNDECIDED` |
| **Elite** | `APPROVED` — the tier exists (also D23) | `OPEN / UNDECIDED` |

> **`DEPRECATED`: "Plus".** D26 originally approved a **Plus** tier. **D38 supersedes those tier names**; Plus is removed from the ladder and **must not appear in any forward-looking specification**. Where it appears in a dated historical record, it stays.

**Only the names and the existence of five tiers are approved.** What each tier includes, what it costs, and how the tiers differ from one another is entirely `OPEN / UNDECIDED`.

`APPROVED (D23)` — Elite is paired with a **Concierge** capability. Elite's eligibility, admission and entitlements are `OPEN / UNDECIDED` because Decision 23 supplies no principles.

`APPROVED (D34)` — **Elite cannot bypass safety.** Elite is a premium experience, never a reduced-safety or reduced-consent one.

---

## 3. One-time extras

### 3.1 The approved extras rule

`APPROVED (D26)` — **verbatim in substance:**

> **Free, Premium, Gold, Platinum and Elite users can all purchase eligible individual extras.**

This is the single most consequential monetization rule approved so far. It means:

- **Extras are not gated behind a subscription.** A Free user can buy an eligible extra.
- **There is no forced upgrade** to access an individual extra.
- **Entitlement checks cannot be a tier comparison.** Access must be evaluated against a user's *entitlements*, not against their tier level. A design that asks "is this user Premium or above?" will violate this rule.

### 3.2 Approved extras

`APPROVED (D26)` — eligible extras **may include, subject to feature rules**:

| Extra | Owning decision | Rules status |
|---|---|---|
| **Super Likes** | D17 | `OPEN / UNDECIDED` |
| **Gifts** | D17, D33 | `OPEN / UNDECIDED` |
| **Boosts** | D17 | `OPEN / UNDECIDED` |
| **Spotlight** | D17 | `OPEN / UNDECIDED` |
| **Other approved digital features** | D17 | `OPEN / UNDECIDED` |
| **Events** | D22 | `OPEN / UNDECIDED` |
| **Experiences** | D16 | `OPEN / UNDECIDED` |
| **Marketplace services** | D21 | `OPEN / UNDECIDED` |

### 3.3 The "subject to feature rules" qualifier

The approved text says extras are eligible **"subject to feature rules"**. This is a real limitation, not filler:

- Being *able to purchase* an extra is not the same as *unconditional access* to the underlying feature.
- A feature may impose its own eligibility conditions — for example safety, verification, regional availability, or age.
- **Those feature rules are `OPEN / UNDECIDED`** for every extra listed above, because the decisions that own the features (D16, D17, D21, D22) supply no principles.

**Consequence:** no extra can be implemented yet, because its feature rules do not exist.

---

## 4. The eight prohibitions

`APPROVED (D26)` — **no paid feature may:**

| # | Prohibition |
|---|---|
| 1 | guarantee a match |
| 2 | guarantee romantic interest |
| 3 | guarantee a response |
| 4 | guarantee a date |
| 5 | bypass blocking |
| 6 | bypass consent |
| 7 | bypass safety |
| 8 | bypass hard eligibility controls |

Reinforced by:

- `APPROVED (D34)` — **safety cannot be pay-to-win**; **Elite cannot bypass safety**; **paid features cannot bypass blocking or consent**.
- `APPROVED (D33)` — **no paid feature guarantees a response, a date, or a romantic outcome**; **paid features cannot bypass blocking, consent, safety or eligibility**; **basic human communication must remain fundamentally accessible**.

**These eight prohibitions are a design-review gate.** Every paid feature must be explicitly checked against all eight before it is designed, not discovered to violate one during code review.

### 4.1 What the prohibitions imply for feature design

Stated only where it follows directly from the approved text:

- A Boost or Spotlight may increase **visibility**. It may not promise an outcome (prohibitions 1–4).
- A Super Like may signal **stronger interest**. It may not compel or guarantee a response (prohibition 3).
- No purchase may make a user visible to, or contactable by, someone who has blocked them (prohibition 5) or who has not consented (prohibition 6).
- No purchase may reduce, defer or skip a safety control (prohibition 7, D34).
- No purchase may unlock a surface a user is not eligible for — for example by age or region (prohibition 8).

---

## 5. User value principles

`APPROVED` — drawn from the approved decisions:

| Principle | Source |
|---|---|
| Subscriptions provide **bundled value**; extras provide **flexibility**. | D26 |
| **No forced upgrade for individual extras** — all five tiers may purchase eligible extras. | D26 |
| **No guaranteed romantic outcome** from any paid feature. | D26, D33 |
| **No paid safety bypass.** | D26, D34 |
| **Basic human communication remains fundamentally accessible.** | D33 |
| Optimize for **sustainable user value**, not vanity engagement alone. | D29 |
| **No manipulative personalization**; **no exploitation of user vulnerability** — this binds upgrade prompts and paywall UX. | D28 |
| Users can also **receive value and earn** through the platform. | D20 |

### 5.1 Transparent pricing

`APPROVED (D35)` — commerce must support **local currency**, **regional payment methods**, **localized pricing** and be **tax-aware**.

`APPROVED (D31)` — the design system is **trustworthy**, with **clear primary action** and **meaningful states**. Applied to monetization UX, this means pricing and what a purchase delivers must be clear at the point of purchase.

`OPEN / UNDECIDED` — the specific transparency requirements (price display rules, renewal disclosure, cancellation clarity) have not been decided beyond these principles.

---

## 6. Architectural obligations

`APPROVED (D30)`:

| Requirement | Relevance |
|---|---|
| **Commerce / entitlement architecture** | Required. Entitlements must be modelled explicitly. |
| **Auditable ledgers** | Required. Purchases, consumption and balances are ledger-recorded. |
| **Cost governance** | Applies to the economics of features that carry variable cost (e.g. AI). |

`APPROVED (D32)`:

- A **Finance** admin function exists.
- **Financial adjustments are ledger-based** — never direct data edits.
- **Promotions** are an admin capability.
- Controlled exports; audit logs; separation of duties.

`APPROVED (D29)` — **subscription analytics** and **digital economy analytics** are required.

---

## 7. `OPEN / UNDECIDED` — the full list

Nothing in this section may be assumed, defaulted, or inferred.

| Item | Status |
|---|---|
| **Prices** — any tier, any extra, any currency | `OPEN / UNDECIDED` |
| **Entitlements bundled into Free / Premium / Gold / Platinum / Elite** | `OPEN / UNDECIDED` |
| **Allowances and quotas** (how many Super Likes, Boosts, etc., if any, per tier) | `OPEN / UNDECIDED` |
| **How the five tiers differ** from one another | `OPEN / UNDECIDED` |
| **Feature rules qualifying extra eligibility** | `OPEN / UNDECIDED` |
| **Which extras exist beyond those named** ("other approved digital features") | `OPEN / UNDECIDED` |
| **Payment providers**; platform-store (app store) handling | `OPEN / UNDECIDED` |
| **Regional payment methods and price points** | `OPEN / UNDECIDED` — D35 requires them; specifics undecided |
| **Currencies supported** | `OPEN / UNDECIDED` |
| **Trials, promotions, discounting, win-back offers** | `OPEN / UNDECIDED` |
| **Billing lifecycle** — renewal, upgrade, downgrade, proration, dunning, cancellation | `OPEN / UNDECIDED` |
| **Refunds and chargebacks** | `OPEN / UNDECIDED` |
| **Tax treatment and invoicing** | `OPEN / UNDECIDED` — **requires legal review** |
| **Whether referral rewards confer entitlements**, and how they interact with paid entitlements | `OPEN / UNDECIDED` — see `REFERRAL-ECONOMY.md` |
| **Anera Credits mechanics** — earning, spending, expiry, balance | `OPEN / UNDECIDED` — D17/D27 supply no mechanics |
| **Elite eligibility and admission** | `OPEN / UNDECIDED` — D23 supplies no principles |
| **Revenue share for Hosts, providers and creators** | `OPEN / UNDECIDED` — no percentage is approved |

---

## 8. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 8.1 What exists

`/api/premium` is a **stub**:

- `GET` returns hardcoded `{ isPremium: false, features: [], userId, message: 'Premium endpoint - authenticated' }` with the comment `// TODO: Implement premium status check`.
- `POST` accepts a `plan` string, validates only that it is present, and **persists nothing** (`// TODO: Implement premium subscription logic`).

That is the entirety of monetization in the codebase.

### 8.2 What does not exist

- No `Subscription`, `Entitlement`, `Purchase`, `Ledger`, or `Credit` model.
- No tier concept anywhere — no Free/Premium/Gold/Platinum/Elite in code or schema.
- No entitlement checks in any feature.
- No payment provider dependency (no Stripe, no in-app purchase SDK).
- No pricing, plan definitions, receipts, or webhooks.
- No Super Like, Gift, Boost or Spotlight feature. **`superlike` exists as a swipe action with no quota, no cost and no economy** — it differs from `like` only in the notification copy it produces.
- The `boost_expired` notification type exists as a string with **no boost feature behind it** (`IG-07`).

### 8.3 Gaps

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-11` | `/api/premium` is a stub; no subscription, entitlement, ledger or tier concept exists. | §2, §3, §6 |
| `IG-07` | `boost_expired` notification type with no boost feature. | §3.2 |
| `IG-42` | `superlike` exists as an unmetered, free swipe action, while Super Likes are approved as a **purchasable extra**. The existing behaviour is not the approved model and must not be assumed to be it. | §3.2 |
| `IG-43` | No commerce or entitlement architecture, and no ledger. | D30, §6 |

---

## 9. Dependencies

| Decision | Relationship |
|---|---|
| D16 Experiences | Purchasable as an extra |
| D17 Digital Economy | Super Likes, Gifts, Boosts, Spotlight; Credits |
| D20 Rewards & Earning | Users receive and earn value; ledgers |
| D21 Marketplace | Marketplace services purchasable as extras |
| D22 Events | Events purchasable as extras |
| D23 Elite & Concierge | Elite is a tier; Concierge is its service |
| D27 Referral | Credits and rewards may interact with entitlements |
| D28 Privacy | No manipulative personalization in upgrade prompts |
| D29 Analytics | Subscription and digital-economy analytics |
| D30 Architecture | Commerce/entitlement architecture; auditable ledgers; cost governance |
| D31 UX | Trustworthy, clear monetization UX |
| D32 Admin | Finance operations; ledger-based adjustments; promotions |
| D33 Communication | Communication stays accessible; gifts; no guaranteed response |
| D34 Trust & Safety | Safety is not pay-to-win; Elite cannot bypass safety |
| D35 Global | Local currency, regional payment methods, localized pricing, tax-aware commerce |

---

## 10. Rules for anyone implementing in this area

1. **Do not implement monetization yet.** No phase is approved, and no entitlement is defined.
2. **Do not invent a price, an allowance, or a tier entitlement.** Every one is `OPEN / UNDECIDED`.
3. **Do not gate an extra behind a subscription.** All five tiers may purchase eligible extras (§3.1).
4. **Do not write tier-comparison entitlement checks.** Check entitlements, not tier rank.
5. **Check every paid feature against all eight prohibitions** (§4) at design time.
6. **Do not select a payment provider.** None is approved.
7. **Do not treat the existing `superlike` swipe action as the approved Super Like design.** It predates every decision here.
8. **Record all value movement in ledgers** (D30, D32) when the time comes — this is an approved architectural constraint, not an implementation preference.

---

*Derived from `docs/DECISIONS.md` Decision 26 and its dependencies. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
