# Anera V2 — Analytics, Intelligence & Business Operating System

| Field | Value |
|---|---|
| **Document name** | `docs/ANALYTICS.md` |
| **Status** | **APPROVED** — principles and analytics domains. **No metric formula, event schema or platform is approved.** |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 29**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved analytics and business-intelligence requirements for Anera V2. |
| **Last updated** | 2026-09-01 |

> **This closes `OD-25` in the master specification.**

> **No formula appears in this document.** Decision 29 approves no formula. Inventing one — for LTV, CAC, satisfaction, City Health Score, or "meaningful connection" — would silently define the platform's optimisation target.

---

## 1. The core principle

`APPROVED (D29)`:

> ## Optimize for **safe, meaningful connections and sustainable user value** — **NOT vanity engagement alone.**

This is the most consequential analytics decision, because a measurement system defines what a product optimises for.

**It binds beyond analytics.** It constrains:

- **Decision 19** (Daily Experience, Retention & Engagement) — engagement mechanics cannot be optimised as an end in themselves.
- **Decision 28** — no manipulative personalization, no exploitation of user vulnerability.
- **Decision 26** — monetization cannot be tuned against user value.
- **Decision 33** — "meaningful conversation analytics", not message-volume analytics.

`APPROVED (D29)` — analytics must be **privacy-conscious**, and are subordinate to Decision 28.

---

## 2. Approved analytics domains

Each domain below is `APPROVED (D29)` as a requirement. **No event, metric or formula within any of them is approved.**

### 2.1 Product and connection

| Domain | Status | Notes |
|---|---|---|
| **Product analytics** | `APPROVED` | General product measurement. |
| **Meaningful connection funnel** | `APPROVED` | **The definition of "meaningful connection" is `OPEN / UNDECIDED`** and must not be assumed. This is the platform's central funnel — defining it is a product decision, not an analytics implementation detail. |
| **Matching analytics** | `APPROVED` | Depends on a matching engine that does not exist and whose logic is undecided (`OD-17`). |
| **Retention** | `APPROVED` | Bounded by the core principle — retention is not to be pursued at the cost of user value. |
| **User satisfaction** | `APPROVED` | Measurement method `OPEN`. |

### 2.2 Feature domains

| Domain | Status | Blocked by |
|---|---|---|
| **Speed Dating analytics** | `APPROVED` | D16 supplies no principles |
| **Event analytics** | `APPROVED` | D22 supplies no principles |
| **Marketplace analytics** | `APPROVED` | D21 supplies no principles |
| **Elite / Concierge analytics** | `APPROVED` | D23 supplies no principles |

### 2.3 Commercial domains

| Domain | Status | Notes |
|---|---|---|
| **Subscription analytics** | `APPROVED` | D26 — tiers approved, entitlements undecided |
| **Digital economy analytics** | `APPROVED` | D17 — extras approved, mechanics undecided |
| **User earning analytics** | `APPROVED` | D20 — earning approved, mechanics undecided |
| **Referral analytics** | `APPROVED` | D27 — principles approved, parameters undecided |

### 2.4 Integrity domains

| Domain | Status | Notes |
|---|---|---|
| **Safety analytics** | `APPROVED` | First-class, not a by-product of product analytics. D34. |
| **Fraud analytics** | `APPROVED` | Supports referral fraud prevention (D27) and scam prevention (D34). |
| **AI quality / cost / safety analytics** | `APPROVED` | Three distinct dimensions, all required. Connects to the central AI Gateway (D30) and cost governance (D30). |

### 2.5 Geographic

| Domain | Status | Notes |
|---|---|---|
| **Geographic / city health** | `APPROVED` | Paired with D35's **City Health Score** and **data-driven expansion**. **The formula is `OPEN / UNDECIDED` and must not be invented.** |

### 2.6 Capability and delivery

| Capability | Status | Notes |
|---|---|---|
| **Experimentation** | `APPROVED` | A/B and controlled experiments. Framework and statistical standards `OPEN`. |
| **Feature flags** | `APPROVED` | Also approved by D30. Infrastructure for controlled rollout. |
| **Executive / business dashboards** | `APPROVED` | Audiences and contents `OPEN`. |
| **Privacy-conscious analytics** | `APPROVED` | Binding constraint on every domain above. |

---

## 3. Business metrics

`APPROVED (D29)` — executive and business dashboards are required, covering the commercial domains in §2.3.

Metrics commonly expected of such a system — including **LTV**, **CAC**, and **AI cost** — are **within the approved scope of the domains named in Decision 29** (subscription analytics, digital economy analytics, AI cost analytics, executive dashboards).

**However:** `OPEN / UNDECIDED` — **no definition or formula for any of them is approved.** How Anera computes lifetime value, acquisition cost, satisfaction, or city health is a decision the product owner has not made. Contributors must not supply one.

---

## 4. Privacy constraints on analytics

`APPROVED (D29)` — **privacy-conscious analytics**.
`APPROVED (D28)` — data minimization, data classification, AI inference privacy, conversation privacy, location privacy, retention controls, regional privacy configuration.

**Consequences that follow directly:**

- Analytics collection is subject to data minimization — collect what answers an approved question, not everything available.
- Analytics data must be classified like any other data (D28 §3), and classification is itself `OPEN / UNDECIDED`.
- Conversation content is subject to conversation privacy; "meaningful conversation analytics" must be reconciled with it. **How, is `OPEN / UNDECIDED`** — see the parallel tension noted in `PRIVACY-GUIDELINES.md` §4.
- Location analytics are subject to location privacy.
- `OPEN / UNDECIDED`: whether analytics collection is consent-gated, and in which regions.

`APPROVED (D32)` — analytics access is governed: an **Analytics** admin role exists, under RBAC, least privilege, audit logging and controlled exports.

---

## 5. `OPEN / UNDECIDED`

| Item | Status |
|---|---|
| **Definition of "meaningful connection"** and the funnel stages | `OPEN / UNDECIDED` |
| **Any metric formula** — LTV, CAC, satisfaction, City Health Score, retention definition | `OPEN / UNDECIDED` |
| **Event taxonomy and schema** | `OPEN / UNDECIDED` |
| **Analytics platform / vendor** | `OPEN / UNDECIDED` — none approved |
| **Data pipeline and warehouse** | `OPEN / UNDECIDED` |
| **Dashboard inventory and audiences** | `OPEN / UNDECIDED` |
| **Experimentation framework and statistical standards** | `OPEN / UNDECIDED` |
| **Feature flag system** | `OPEN / UNDECIDED` — approved as a capability, no technology chosen |
| **Consent gating of analytics** | `OPEN / UNDECIDED` — depends on D28 |
| **Analytics data retention** | `OPEN / UNDECIDED` — depends on D28 classification |
| **Error and performance monitoring** | `OPEN / UNDECIDED` — D30 approves observability; no tool chosen |
| **Success criteria / targets for any metric** | `OPEN / UNDECIDED` |

---

## 6. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 6.1 What exists

| Item | State |
|---|---|
| `EngagementAction` table | Rows written for `swipe`, `match` and `login` only. |
| Reads of that table | **None.** No query, no aggregation, no dashboard reads `engagement_actions`. **It is write-only.** |
| `UserStreak` | Read by `/api/engagement` for the streak badge — a product feature, not analytics. |
| `/api/dev` counts | Raw totals (users, profiles, matches, messages, notifications, swipes) for debugging only. |
| Third-party analytics | **None.** No SDK, no event pipeline, no telemetry. |
| Error monitoring | **None.** Errors go to `console.error`. |
| `recharts` | A declared dependency, used only by the unused `src/components/ui/chart.tsx`. |

### 6.2 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-14` | **No analytics capability exists.** `EngagementAction` is write-only; there is no platform, pipeline, telemetry, dashboard or reporting. | §2 — every domain |
| `IG-08` | **Engagement action taxonomy is inconsistent with itself.** The schema comment lists `message` and `profile_view` as values that are **never written**. | §2.1 |
| `IG-10` | **No observability, no error monitoring, no feature flags.** | §2.6; D30 |
| `IG-52` | **No experimentation capability.** | §2.6 |
| `IG-19` | The existing streak, profile-completion and engagement-prompt system was built **before** the anti-vanity-engagement principle existed and has **not been reviewed against it**. | §1 core principle |

### 6.3 A note on `IG-19`

The existing engagement layer (daily streaks, streak-at-risk prompts, profile-completion nudges, "people are waiting for you" prompts) is a conventional engagement-maximising design. It predates Decision 29.

It is **not ratified** by any approved decision, and Decision 29's core principle — optimize for meaningful connections and sustainable user value, **not vanity engagement alone** — is the standard it must now be reviewed against.

**Do not extend it, and do not remove it.** Both are changes requiring an approved phase. Record it and move on.

---

## 7. Dependencies

Every product decision generates analytics obligations. The direct ones:

| Decision | Relationship |
|---|---|
| D16 Experiences & Speed Dating | Speed Dating analytics |
| D17 Digital Economy | Digital economy analytics |
| D18 Anera AI | AI quality / cost / safety analytics |
| D19 Daily Experience & Retention | Retention — bounded by the core principle |
| D20 Rewards & Earning | User earning analytics |
| D21 Marketplace | Marketplace analytics |
| D22 Events & Hosts | Event analytics |
| D23 Elite & Concierge | Elite / Concierge analytics |
| D26 Monetization | Subscription analytics |
| D27 Referral | Referral analytics; fraud analytics |
| D28 Privacy | **Privacy-conscious analytics** — binding constraint |
| D30 Architecture | Observability; feature flags; cost governance |
| D32 Admin | Analytics role; executive dashboards; controlled exports |
| D33 Communication | Meaningful conversation analytics |
| D34 Trust & Safety | Safety analytics |
| D35 Global | City Health Score; geographic health; data-driven expansion |

---

## 8. Rules for anyone implementing in this area

1. **Do not implement analytics yet.** No phase is approved and no event schema exists.
2. **Do not invent a formula.** Not for LTV, CAC, satisfaction, City Health Score, retention, or "meaningful connection". Each defines what the product optimises for.
3. **Do not define "meaningful connection" in code.** It is the platform's central product question and is undecided.
4. **Do not select an analytics platform.** None is approved.
5. **Do not collect data because it might be useful.** Data minimization applies (D28).
6. **Treat safety and fraud analytics as first-class**, not as by-products of product analytics.
7. **Do not optimise for engagement.** The approved target is safe, meaningful connections and sustainable user value.
8. **Do not extend or remove the existing engagement system** (§6.3) without an approved phase.

---

*Derived from `docs/DECISIONS.md` Decision 29. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
