# Anera V2 — Global Operating Model

| Field | Value |
|---|---|
| **Document name** | `docs/GLOBAL-OPERATING-MODEL.md` |
| **Status** | **APPROVED** — principles. Launch markets, distances, formulas and legal requirements are `OPEN / UNDECIDED`. |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 35** (full principle set) and **Decision 25** (subject area). Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved globalization, localization and regional operating model for Anera V2. |
| **Last updated** | 2026-09-01 |

> **This closes `OD-03` in the master specification in part.** Anera V2 is a **global platform**, not a single-market product. Launch markets and sequence remain `OPEN / UNDECIDED`.

---

## 1. The governing principle

`APPROVED (D35)`:

> ## **START LOCAL. EXPAND INTELLIGENTLY. LET THE USER CHOOSE.**

Three obligations follow, and all three are binding:

| Obligation | Meaning |
|---|---|
| **Start local** | The default experience is the user's local one. Global is not the starting point. |
| **Expand intelligently** | Expansion beyond the local pool happens when the local pool is insufficient, and is **data-driven** — not arbitrary and not permanent. |
| **Let the user choose** | Expansion is **user-controlled**. It is not imposed silently. |

---

## 2. Local-first discovery

`APPROVED (D35)` — **local discovery first**, with **intelligent expansion when the local pool is insufficient**.

### 2.1 The approved expansion ladder

`APPROVED (D35)` — the order is approved:

```
Nearby  →  City  →  Region  →  Country  →  Global
```

`OPEN / UNDECIDED`:
- The distance or boundary that defines **Nearby** and **Region**.
- What "insufficient local pool" means quantitatively.
- How expansion is presented to the user, and how they control it.
- Whether expansion is sticky, session-scoped, or per-query.
- Whether a user may skip levels.

### 2.2 User control

`APPROVED (D35)` — **user-controlled discovery expansion**.

The user decides how far their discovery reaches. This is not a silent system behaviour.

### 2.3 International discovery

`APPROVED (D35)` — **international discovery** is supported as a capability, distinct from the automatic expansion ladder.

`OPEN / UNDECIDED`: how international discovery is entered, whether it is entitlement-gated (interacts with `SUBSCRIPTION-MONETIZATION.md`), and its relationship to Travel Mode.

---

## 3. Travel Mode and Relocation Mode

`APPROVED (D35)` — both are approved as **named capabilities**.

| Mode | Status | Rules |
|---|---|---|
| **Travel Mode** | `APPROVED` — the capability exists | `OPEN / UNDECIDED` |
| **Relocation Mode** | `APPROVED` — the capability exists | `OPEN / UNDECIDED` |

`OPEN / UNDECIDED` for both: activation, duration, effect on discovery and on being discovered, effect on existing matches and conversations, whether they are entitlement-gated, interaction with location privacy (D28), and how they differ from each other.

**Nothing about either mode's behaviour may be assumed.** Their names describe an intent, not a specification.

---

## 4. Global account portability

`APPROVED (D35)` — **global account portability**.

A user moving between regions retains their account. Identity, history and value do not reset at a border.

`OPEN / UNDECIDED`: what happens to region-scoped entitlements, prices, Credits, referral eligibility (D27 country-specific rules), verification status (D34 regional verification), and privacy configuration (D28 regional privacy) when a user changes country.

> This is a real design tension: portability (this section) versus country-specific rules (D27), regional pricing (§6), regional verification and regional safety (D34). It must be resolved by decision, not by whichever constraint is implemented first.

---

## 5. Localization

`APPROVED (D35)`:

| Capability | Status |
|---|---|
| **Language localization** | `APPROVED` |
| **RTL** | `APPROVED` |
| **Timezone awareness** | `APPROVED` |
| **Local-context AI** | `APPROVED` — subject to D18 (no principles) and D30 (central AI Gateway) |

`APPROVED (D31)` — the design system is **localization-ready** and **RTL-ready**.

`OPEN / UNDECIDED`: supported languages at launch, translation workflow, locale fallback behaviour, and what "local-context AI" means in practice.

---

## 6. Regional commerce

`APPROVED (D35)`:

| Capability | Status |
|---|---|
| **Local currency** | `APPROVED` |
| **Regional payment methods** | `APPROVED` |
| **Localized pricing** | `APPROVED` |
| **Tax-aware commerce** | `APPROVED` |

`OPEN / UNDECIDED`, and **requiring legal review** for tax:

- Currencies supported.
- Payment providers and methods per country.
- Price points per market — **no price is approved** (see `SUBSCRIPTION-MONETIZATION.md`).
- Tax rules, invoicing and reporting obligations per jurisdiction.

---

## 7. Regional trust, safety and privacy

| Capability | Status | Source |
|---|---|---|
| **Regional verification** | `APPROVED` | D35, D34 |
| **Regional safety** | `APPROVED` | D35, D34 |
| **Regional privacy** | `APPROVED` | D35, D28 |
| **Country-specific referral rules** | `APPROVED` | D27 |

`OPEN / UNDECIDED`, and **requiring legal review**: every jurisdiction-specific requirement — minimum age, verification obligations, content and safety obligations, data residency, privacy regime, referral and promotion law.

**No country-specific law is stated anywhere in Anera's documentation, and none may be inferred by a contributor.**

---

## 8. Local product surfaces

`APPROVED (D35)`:

| Surface | Status | Blocked by |
|---|---|---|
| **Local events** | `APPROVED` | D22 supplies no principles |
| **Local Marketplace** | `APPROVED` | D21 supplies no principles |
| **Local ambassadors / community** | `APPROVED` | D27 approves ambassadors; mechanics `OPEN` |

Each is approved as a **local-first** surface: events and marketplace services are scoped to a locality before being scoped globally.

---

## 9. City Health Score and data-driven expansion

`APPROVED (D35)` — **City Health Score**, **geographic / city health** (D29) and **data-driven expansion**.

Anera measures the health of individual cities and uses that data to drive expansion decisions.

`OPEN / UNDECIDED`:
- **The City Health Score formula.** No formula is approved. **It must not be invented.**
- Its inputs, weighting, thresholds, and refresh cadence.
- What a score triggers — market entry, marketing spend, expansion ladder behaviour, or operational intervention.

`APPROVED (D29)` — city health is part of the analytics programme; `APPROVED (D32)` — country/city configuration is an admin function.

---

## 10. Regional configuration

`APPROVED (D32)` — **country / city configuration** is an approved admin function, subject to RBAC, least privilege, approval workflows and audit logs.

**Consequence:** regional behaviour is **configuration, not code**. Pricing, payment methods, verification requirements, safety parameters, referral eligibility and language must be adjustable per country/city by an authorised operator, not hard-coded per market.

`OPEN / UNDECIDED`: the configuration schema — which parameters are configurable, at what granularity (country vs city), and which admin role may change them.

---

## 11. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 11.1 What exists

- `Profile.city` — a **free-text string**, capped at 100 characters, entered by the user during onboarding. It is displayed but never used for filtering.
- Seed and demo data uses Indian cities (Mumbai, Delhi, Bangalore, Pune, Chennai, Hyderabad, Kolkata, Goa, Jaipur). **These are test fixtures and are not an approved market strategy.**

### 11.2 What does not exist

- **No coordinates, no geo data, no distance calculation.**
- **No locality filtering in discovery.** `GET /api/discover` returns every onboarded profile the user has not swiped on, ordered by profile creation date, capped at 20.
- No region, country, or market concept in the data model.
- No localization: `next-intl` is declared in `package.json` and **never imported**. No translation files, no locale routing.
- No RTL support.
- No currency handling, no pricing, no payment methods.
- No timezone handling — dates are computed in UTC.
- No Travel Mode, Relocation Mode, or account portability concepts.
- No City Health Score or any geographic analytics.
- No country/city configuration capability.

### 11.3 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-16` | **Discovery is globally unfiltered with no locality model.** This is the direct inverse of local-first discovery, and the largest gap against this decision. | §1, §2 |
| `IG-44` | **No location data model.** `city` is free text with no coordinates, so the expansion ladder (Nearby → City → Region → Country → Global) cannot be implemented at all on the current schema. | §2.1 |
| `IG-25` | **No localization and no RTL.** `next-intl` declared and unused. | §5; D31 |
| `IG-13` | **Streak dates computed UTC-only** with no timezone handling. | §5 timezone awareness |
| `IG-36` | **No country/city configuration capability.** | §10 |
| `IG-45` | **No regional commerce** — no currency, pricing, payment method or tax handling. | §6 |

---

## 12. Dependencies

| Decision | Relationship |
|---|---|
| D16 Experiences & Speed Dating | Local experiences; timezone-aware scheduling |
| D21 Marketplace | Local Marketplace |
| D22 Events & Hosts | Local events; local ambassadors |
| D18 Anera AI | Local-context AI |
| D26 Monetization | Local currency, regional payment methods, localized pricing, tax-aware commerce |
| D27 Referral | Country-specific referral rules |
| D28 Privacy | Regional privacy configuration; location privacy |
| D29 Analytics | City Health Score; geographic health; data-driven expansion |
| D30 Architecture | The data model required for locality is undecided; no technology approved |
| D31 UX | Localization-ready, RTL-ready |
| D32 Admin | Country / city configuration function |
| D34 Trust & Safety | Regional verification; regional safety configuration |

---

## 13. Rules for anyone implementing in this area

1. **Do not implement local-first discovery yet.** It requires a location data model that has not been decided (`OD-14`, `IG-44`).
2. **Do not invent distances.** "Nearby" and "Region" have no approved definition.
3. **Do not invent the City Health Score formula.** None is approved.
4. **Do not treat the Indian demo data as a market decision.** It is test fixture data.
5. **Do not hard-code regional behaviour.** Country/city configuration is an approved admin capability — regional behaviour is configuration.
6. **Do not state a country's legal, tax or privacy requirements.** That requires legal review.
7. **Do not make expansion automatic and silent.** Expansion is user-controlled by approved principle.
8. **Escalate the portability-versus-regional-rules tension** (§4) rather than resolving it in code.

---

*Derived from `docs/DECISIONS.md` Decisions 25 and 35. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
