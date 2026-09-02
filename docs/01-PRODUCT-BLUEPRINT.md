# Anera V2 — Product Blueprint

| Field | Value |
|---|---|
| **Purpose** | What Anera is, who it serves, and the complete product ecosystem. |
| **Status** | **APPROVED** for scope; **`OPEN`** for positioning detail and success metrics |
| **Owner** | Product owner |
| **Authority** | **Canonical for product scope.** Derived from Decisions 16–42. |
| **Dependencies** | D42 (principles) · D26/D38 (monetization) · D34 (safety) · D35 (global) · D29 (measurement) |
| **Related documents** | [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) · [`DATING-CORE.md`](DATING-CORE.md) · [`ROADMAP.md`](ROADMAP.md) · [`02-APP-FLOW.md`](02-APP-FLOW.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created. Fills the vision gap recorded as `OD-02` since 2026-08-30. |

---

## 1. What Anera is

**Anera is a global dating platform with a local-first experience**, built around safe, meaningful connections rather than engagement volume.

`APPROVED` foundations:

| Principle | Source |
|---|---|
| A **serious global dating platform** | V2 brief |
| **Local-first, expanding intelligently, user-controlled** | D35 — *START LOCAL. EXPAND INTELLIGENTLY. LET THE USER CHOOSE.* |
| **Safety is a core platform capability**, not a feature | D34 |
| **Optimize for meaningful connections and sustainable user value — not vanity engagement** | D29 core principle |
| **Simple on the surface, powerful underneath** | D31 |
| **India-first, global-ready** | V2 brief |

## 2. Positioning

`APPROVED` — Anera differentiates on **trust and depth**, not volume. Safety, authenticity and meaningful connection are the product, not compliance overhead.

`OPEN` — competitive positioning statement, brand voice, and the marketing claim set (`OQ-P01`).

## 3. Target users

`APPROVED` — adults seeking connection, **India-first with a globally portable account** (D35).

`OPEN` — segments, personas, age bands, and acquisition strategy (`OQ-P02`).

> **Constraint (D35):** India-first is a **launch strategy, not a data model**. No India-specific assumption may be hard-coded into the core domain — currency, phone format, region, language and legal rules are all configuration.

## 4. Core value proposition

1. **Meet people near you** — local-first discovery, expanding on your terms.
2. **Trust what you see** — progressive verification, authenticity, scam protection.
3. **Be safe** — immediate blocking, reporting, moderation; safety is never pay-to-win.
4. **Get help connecting** — AI assistance that never impersonates you.
5. **Pay for what you want** — five tiers plus à la carte extras; core communication stays accessible.

## 5. Ecosystems

| Ecosystem | Scope | Phase | Status |
|---|---|---|---|
| **Dating core** | Profiles, discovery, swipe, match, chat | 1–3 | **MVP** |
| **Trust & safety** | Verification, reporting, blocking, moderation | 4 | **MVP** — launch-blocking |
| **AI** | Profile help, icebreakers, matchmaking, moderation | 5 | **POST-MVP** |
| **Premium** | Free / Premium / Gold / Platinum / Elite + extras | 6 | **POST-MVP** |
| **Referral & growth** | Codes, rewards, ambassadors, ledger | 7 | **POST-MVP** |
| **Social** | Stories, posts, feeds, groups | 8 | **LONG-TERM** |
| **Events** | Local events, speed dating, live formats | 9 | **LONG-TERM** |
| **Globalization** | Expansion ladder, localization, regional ops | 10 | **LONG-TERM** |
| **Elite** | Invitation-only, concierge matchmaking | 11 | **LONG-TERM** |
| **Marketplace** | Services | 12 | **EXPERIMENTAL** — D21 has no principles |

### 5.1 Scope classification

| Class | Meaning | Contents |
|---|---|---|
| **MVP** | Required to launch credibly | Dating core · trust & safety |
| **POST-MVP** | Planned, sequenced, approved | AI · premium · referral |
| **LONG-TERM** | Approved scope, distant | Social · events · globalization · Elite |
| **EXPERIMENTAL** | Scope approved, rules absent | Marketplace (D21) · daily-experience mechanics (D19) |

> **Trust & safety is MVP, not post-launch.** D34 makes it a core platform capability, and a dating product without blocking or reporting is not shippable.

## 6. Monetization

`APPROVED (D38)` — five tiers: **Free · Premium · Gold · Platinum · Elite**, plus one-time extras (Super Likes, Gifts, Boosts, Spotlight, Events, Experiences, Marketplace services).

**All five tiers can purchase eligible extras** (NR-09). **No paid feature may guarantee a match, romantic interest, a response or a date, or bypass blocking, consent, safety or eligibility** (D26, eight prohibitions).

All pricing, entitlements and allowances are **`OPEN`**. See [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md).

## 7. Long-term expansion

`APPROVED` scope, unscheduled beyond Phase 12: marketplace services · creator and ambassador economy · deeper AI matchmaking · additional live formats · further markets.

`OPEN` — everything about timing and detail.

## 8. What Anera is not

Stated to prevent scope drift:

- **Not an engagement-maximisation product.** D29 forbids optimising for vanity engagement.
- **Not pay-to-win on safety.** D34.
- **Not a platform where payment buys access to a person.** D26 prohibitions.
- **Not a single-market product.** D35 — global with local-first experience.
- **Not AI-mediated identity.** AI assists; it never impersonates (D33).

## 9. Open items

| Item | Tracked as |
|---|---|
| Positioning statement, brand voice | `OQ-P01` |
| Target segments and personas | `OQ-P02` |
| Launch markets and sequence | `OQ-P02` |
| Definition of "meaningful connection" | `OQ-P06` |
| Success metrics and targets | `OQ-AN01`, `OQ-AN06` |
| Dating-only vs friendship/networking intents | `OQ-P01` |
| Marketplace principles | `OQ-B01` |
| Daily-experience mechanics | `OQ-B01` |

---

*Canonical product scope. Positioning detail remains open.*
