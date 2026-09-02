# Anera V2 — Feature Inventory

| Field | Value |
|---|---|
| **Document name** | `docs/FEATURE-INVENTORY.md` |
| **Status** | **REFERENCE** — a status register. It approves nothing. |
| **Authority** | Feature *approval* comes from [`DECISIONS.md`](DECISIONS.md). Feature *implementation status* comes from the repository. This document joins the two. |
| **Purpose** | One place to see, per feature: is it approved, is it built, and what is blocking it. |
| **Last updated** | 2026-09-01 |

---

## 1. How to read this inventory

### 1.1 Status values

| Status | Meaning |
|---|---|
| **Existing** | Implemented in the repository and working. **Not evidence of approval** — most existing features predate every decision. |
| **Approved / Not Yet Built** | An approved decision requires it. No implementation exists. |
| **Partial** | Some of it exists; a material part does not. |
| **Missing** | Neither approved nor implemented, but referenced somewhere or expected by an adjacent decision. |
| **Conflict** | The implementation contradicts an approved decision, or contradicts itself. |
| **Open** | Undecided. Must not be built or assumed. |

### 1.2 The three kinds of approval

This distinction is essential and appears throughout:

| Approval level | Meaning |
|---|---|
| `APPROVED` | The owning decision supplies principles. The feature's requirements exist. |
| `APPROVED — SCOPE ONLY` | The owning decision approves the capability's *existence* but supplies **no principles**. **It cannot be built.** |
| `ATTESTED` | The feature is *named inside another decision's approved principles*, so its existence is approved by attestation — but no decision supplies its rules. **It cannot be built.** |

> **`ATTESTED` features are the most dangerous category.** Super Likes, Gifts, Boosts, Spotlight, Speed Dating, Travel Mode, City Health Score and others appear by name in approved text. Their names imply behaviour that has never been decided. Do not infer their rules from their names.

### 1.3 Rule

**No feature marked `Approved / Not Yet Built`, `Missing` or `Open` may be implemented.** No phase has been approved (`OD-29`).

---

## 2. Summary

| Status | Count |
|---|---|
| Existing | 38 |
| Approved / Not Yet Built | 205 |
| Open | 42 |
| Conflict | 16 |
| Partial | 4 |
| Missing | 3 |
| Approved (a rule already in force, not a buildable feature) | 5 |
| **Total rows** | **313** |

> Two status values beyond the legend appear on a handful of rows: **Approved** marks an approved *rule* that binds behaviour rather than a feature to build (for example "Elite cannot bypass safety"), and **Prohibited** marks a structure that is forbidden (pyramid/unlimited multi-level referral). Both are counted in the last row above.

Read together: **38 features exist, and almost none was built against an approved requirement.** **205 approved capabilities are unbuilt**, and most are blocked not by engineering but by undecided parameters. **42 items are undecided outright.**

---

## 3. Authentication

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Email + password registration | Existing | — | Predates decisions | bcrypt, 10 rounds |
| Email + password login | Existing | — | Predates decisions | |
| Session check | Existing | — | Predates decisions | `GET /api/auth/session` |
| Logout with token revocation | Existing | — | Predates decisions | In-memory blocklist, lost on restart (`IG-70`) |
| HTTP-only session cookie | Existing | `APPROVED` | Standing security posture | `anera_session`, 30 days, SameSite=Lax |
| **localStorage token + Bearer fallback** | **Conflict** | **Not approved** | `IG-01` | **The one unresolved blocker.** Decisions 16–35 do not address it |
| Demo login (no credential) | Conflict | Not approved | `IG-67` | Creates a session with no credential; not environment-gated |
| Central authentication / authorization governance | Approved / Not Yet Built | `APPROVED` | D30 | Cannot be established while `IG-01` is open |
| MFA / step-up authentication (admin) | Approved / Not Yet Built | `APPROVED` | D32 | Mechanism `OPEN` |
| Password reset | Approved / Not Yet Built | `ATTESTED` | D34 progressive verification | `IG-71` |
| Email verification | Approved / Not Yet Built | `ATTESTED` | D34 progressive verification | `IG-71` |
| Phone verification | Open | — | D34 mentions identity verification generally | Method `OPEN` |
| Social / OAuth login | Open | — | — | `next-auth` declared and unused (`IG-02`) |
| Rate limiting on auth endpoints | Approved / Not Yet Built | `APPROVED` | D33 risk-based rate limiting | `IG-30` |
| Global account portability | Approved / Not Yet Built | `APPROVED` | D35 | Interacts with regional rules (`GLOBAL-OPERATING-MODEL.md` §4) |

---

## 4. Profile

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Create profile (3-step onboarding) | Existing | — | Predates decisions | gender → details → interests |
| Edit profile | Existing | — | Predates decisions | |
| Photo upload | Existing | — | Predates decisions | Max 6, ≤10 MB, magic-byte validated |
| Photo reorder (drag & drop) | Existing | — | Predates decisions | `@dnd-kit` |
| Set primary photo | Existing | — | Predates decisions | |
| Delete photo | Existing | — | Predates decisions | |
| Profile completion scoring | Existing | — | Predates decisions | Under review against D29 (`IG-19`) |
| View another user's profile | Conflict | — | `IG-05` | **Unauthenticated** — any user's full profile is publicly readable |
| Relationship intent (5 values incl. networking, friendship) | Existing | Open | `OD-04` | Whether non-dating intents survive is undecided |
| Interests (25 fixed values, JSON string) | Existing | Open | — | Unqueryable storage; taxonomy never approved |
| Location beyond free-text city | Open | — | D35 needs it; `OD-14` | `IG-44` — blocks local-first discovery |
| Relationship Memory | Approved / Not Yet Built | `ATTESTED` | D28 (controls required) | **What it is has never been defined.** Owned by D18, which supplies no principles |

---

## 5. Verification

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| **Verified badge in UI** | **Conflict** | `APPROVED` (the capability) | D34; `IG-06` | UI renders it; API hardcodes `isVerified: false`; **no verification system exists** |
| Progressive verification | Approved / Not Yet Built | `APPROVED` | D34 | A spectrum, not a boolean — the current field cannot express it |
| Identity verification | Approved / Not Yet Built | `APPROVED` | D34 | Provider `OPEN` |
| Profile authenticity | Approved / Not Yet Built | `APPROVED` | D34 | Method `OPEN` |
| Photo authenticity | Approved / Not Yet Built | `APPROVED` | D34 | File-integrity checks exist; authenticity does not |
| Regional verification | Approved / Not Yet Built | `APPROVED` | D34, D35 | `IG-61` |
| Age / eligibility verification | Approved / Not Yet Built | `APPROVED` | D34 | Currently self-declared only (`IG-35`) |
| Verification levels and what each unlocks | Open | — | D34 | `OPEN / UNDECIDED` |

---

## 6. Discovery

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Swipe deck / card stack | Existing | — | Predates decisions | Framer Motion, drag gestures |
| Photo carousel on card | Existing | — | Predates decisions | |
| Like / Pass / Superlike actions | Existing | — | Predates decisions | See §12 for Super Like as an extra |
| Reset swipes | Existing | Conflict | `IG-73` | Deletes all swipes **and matches**; orphans messages |
| **Local discovery first** | **Approved / Not Yet Built** | `APPROVED` | D35, D25 | `IG-16` — discovery is currently globally unfiltered |
| Expansion ladder (Nearby → City → Region → Country → Global) | Approved / Not Yet Built | `APPROVED` | D35 | Distances `OPEN`; blocked by `IG-44` |
| User-controlled discovery expansion | Approved / Not Yet Built | `APPROVED` | D35 | |
| International discovery | Approved / Not Yet Built | `APPROVED` | D35 | Entitlement gating `OPEN` |
| Discovery filters (age, gender, intent, distance) | Open | — | `OD-16` | **None exists — everyone currently sees everyone** |
| Preference model | Open | — | `OD-16` | No `Preferences` entity |
| Ranking | Approved / Not Yet Built | `APPROVED` | D30 (separate discovery/matching/**ranking**) | `IG-54` — no ranking exists at all |
| Undo last swipe | Open | — | — | |
| "Who liked me" list | Partial | Open | — | Count only (`pendingLikes`); no list surface |

---

## 7. Matching

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Mutual-like detection | Existing | — | Predates decisions | With race handling and idempotent repeat swipes |
| Match creation | Existing | — | Predates decisions | Sorted user ids, unique constraint |
| Match animation | Existing | — | Predates decisions | |
| Matches list | Existing | — | Predates decisions | |
| **Dedicated matching architecture** | Approved / Not Yet Built | `APPROVED` | D30 | The architecture is approved |
| **Matching logic / compatibility scoring** | **Open** | — | `OD-17` | **No decision defines what the matching engine does.** Do not build it |
| Matching analytics | Approved / Not Yet Built | `APPROVED` | D29 | Blocked by the above |
| Unmatch | Approved / Not Yet Built | `ATTESTED` | D33/D34 | `IG-34` |
| Match expiry / limits | Open | — | — | |

---

## 8. Communication

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| 1-to-1 messaging | Existing | `APPROVED` | D33 | Per-match chat, cursor pagination, ≤2000 chars |
| Match-participation access control | Existing | `APPROVED` | D33, D34 consent | 403 for non-participants — preserve |
| Read marking | Existing | — | Predates decisions | Server-side flag; no per-message UI indicator |
| Real-time chat | Conflict | `APPROVED` | D30 real-time architecture; `IG-31` | Chat polls every 5 s while an authenticated socket service exists |
| Message requests where appropriate | Approved / Not Yet Built | `APPROVED` | D33 | When they apply is `OPEN` |
| Reactions | Approved / Not Yet Built | `APPROVED` | D33 | |
| Media messages | Approved / Not Yet Built | `APPROVED` | D33 | Types and limits `OPEN` |
| Voice notes | Approved / Not Yet Built | `APPROVED` | D33 | |
| Voice calls | Approved / Not Yet Built | `APPROVED` | D33 | Provider `OPEN` |
| Video calls | Approved / Not Yet Built | `APPROVED` | D33 | Provider `OPEN` |
| Translation | Approved / Not Yet Built | `APPROVED` | D33, D35 | Provider `OPEN`; automatic vs opt-in `OPEN` |
| Conversation starters | Approved / Not Yet Built | `APPROVED` | D33 | |
| AI conversation assistance | Approved / Not Yet Built | `APPROVED` | D33 | **Bounded: no silent impersonation** |
| Event / group communication | Approved / Not Yet Built | `APPROVED` | D33 | Blocked by D22 (no principles) |
| Concierge communication | Approved / Not Yet Built | `APPROVED` | D33 | Blocked by D23 (no principles) |
| Typing indicators / presence | Open | — | — | |
| Message editing / deletion | Open | — | — | |
| Message retention | Open | — | D28 | `OPEN / UNDECIDED` |
| Meaningful conversation analytics | Approved / Not Yet Built | `APPROVED` | D29, D33 | "Meaningful" is undefined |

---

## 9. Speed Dating

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Speed Dating | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D16 | **No principles supplied. Cannot be built.** |
| Speed Dating safety | Approved / Not Yet Built | `APPROVED` | D34 | Mandatory when the feature is designed |
| Speed Dating analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Session formats, scheduling, capacity, matching within a session | Open | — | D16 | `OPEN / UNDECIDED` |

---

## 10. Experiences

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Experiences | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D16 | **No principles supplied. Cannot be built.** |
| Experiences purchasable as an extra | Approved / Not Yet Built | `APPROVED` | D26 | Purchasable by all four tiers |
| Experience rules, formats, pricing, cancellation | Open | — | D16 | `OPEN / UNDECIDED` |

---

## 11. AI

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Anera AI Intelligence | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D18 | **No principles supplied. Cannot be built.** |
| **Central AI Gateway** | Approved / Not Yet Built | `APPROVED` | D30 | The architecture requirement *is* approved (`IG-55`) |
| AI conversation assistance | Approved / Not Yet Built | `APPROVED` | D33 | No silent impersonation |
| Conversation starters | Approved / Not Yet Built | `APPROVED` | D33 | |
| AI-assisted moderation | Approved / Not Yet Built | `APPROVED` | D34 | With human review where appropriate |
| Local-context AI | Approved / Not Yet Built | `APPROVED` | D35 | |
| AI personalization controls | Approved / Not Yet Built | `APPROVED` | D28 | User-controllable |
| AI inference privacy | Approved / Not Yet Built | `APPROVED` | D28 | Inference is the user's data |
| AI quality / cost / safety analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| AI Operations (admin) | Approved / Not Yet Built | `APPROVED` | D32 | |
| **AI provider / model selection** | **Open** | — | — | **None approved. Do not select one.** `IG-15` is an unused sandbox SDK, not a choice |
| Third-party AI data-processing controls | Approved / Not Yet Built | `APPROVED` | D28 | |

---

## 12. Gifts, Boosts, Spotlight, Super Likes

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| **Super Likes** (as a purchasable extra) | Approved / Not Yet Built | `ATTESTED` (D26) | D17 owns it — no principles | `IG-42` — a free, unmetered `superlike` swipe action exists and is **not** the approved model |
| **Gifts** | Approved / Not Yet Built | `ATTESTED` (D26, D33) | D17 owns it — no principles | Both an extra and a communication feature |
| **Boosts** | Approved / Not Yet Built | `ATTESTED` (D26) | D17 owns it — no principles | `IG-07` — a `boost_expired` notification type exists with no feature |
| **Spotlight** | Approved / Not Yet Built | `ATTESTED` (D26) | D17 owns it — no principles | |
| Other approved digital features | Open | — | D26 | Which ones exist is `OPEN` |
| Digital economy mechanics (balances, expiry, consumption) | Open | — | D17 | `OPEN / UNDECIDED` |
| Digital economy analytics | Approved / Not Yet Built | `APPROVED` | D29 | |

> **All four named extras may be purchased by Free, Premium, Gold, Platinum and Elite users (D26), subject to feature rules — and those feature rules do not exist yet.**

---

## 13. Subscriptions & Extras

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Free tier | Approved / Not Yet Built | `APPROVED` (name only) | D26 | Entitlements `OPEN` |
| Plus tier | Approved / Not Yet Built | `APPROVED` (name only) | D26 | Entitlements `OPEN` |
| Premium tier | Approved / Not Yet Built | `APPROVED` (name only) | D26 | Entitlements `OPEN` |
| Elite tier | Approved / Not Yet Built | `APPROVED` (name only) | D26, D23 | Entitlements `OPEN` |
| **All tiers may purchase eligible extras** | Approved / Not Yet Built | `APPROVED` | D26 | The single most consequential monetization rule |
| Commerce / entitlement architecture | Approved / Not Yet Built | `APPROVED` | D30 | `IG-43` |
| Auditable ledgers | Approved / Not Yet Built | `APPROVED` | D30, D32 | `IG-43` |
| `/api/premium` endpoint | Conflict | — | `IG-11` | A stub returning hardcoded `isPremium: false` |
| Pricing | Open | — | D26 | **No price is approved** |
| Tier entitlements and allowances | Open | — | D26 | `OPEN / UNDECIDED` |
| Payment providers | Open | — | D26, D35 | **None approved** |
| Billing lifecycle, refunds, tax | Open | — | D26 | Tax requires legal review |
| Localized pricing / local currency / regional payment methods | Approved / Not Yet Built | `APPROVED` | D35 | `IG-45` |
| Subscription analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Promotions | Approved / Not Yet Built | `APPROVED` | D32 | Admin capability |

---

## 14. Rewards & User Earning

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| User value, rewards & earning | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D20 | **No principles supplied. Cannot be built.** |
| **Anera Credits** | Approved / Not Yet Built | `ATTESTED` (D27) | D17/D20 own it — no principles | Mechanics entirely `OPEN` |
| Non-cash rewards | Approved / Not Yet Built | `APPROVED` | D27 | |
| Eligible monetary rewards | Approved / Not Yet Built | `APPROVED` | D27 | Country-specific eligibility `OPEN` |
| User earning analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Finance operations; ledger-based adjustments | Approved / Not Yet Built | `APPROVED` | D32, D30 | |
| Revenue share for hosts / providers / creators | Open | — | — | **No percentage is approved** |
| Payout mechanism, tax treatment | Open | — | D20, D35 | Requires legal review |

---

## 15. Referrals

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| User referrals | Approved / Not Yet Built | `APPROVED` | D27 | `IG-20` — nothing exists |
| Host referrals | Approved / Not Yet Built | `APPROVED` | D27 | |
| Expert / provider referrals | Approved / Not Yet Built | `APPROVED` | D27 | |
| Creator / community referrals | Approved / Not Yet Built | `APPROVED` | D27 | |
| Partner referrals | Approved / Not Yet Built | `APPROVED` | D27 | |
| Ambassador / community growth | Approved / Not Yet Built | `APPROVED` | D27, D35 | |
| Referral links / codes / QR | Approved / Not Yet Built | `APPROVED` | D27 | |
| Qualification-based rewards | Approved / Not Yet Built | `APPROVED` | D27 | What qualifies is `OPEN` |
| Two-sided rewards where appropriate | Approved / Not Yet Built | `APPROVED` | D27 | Conditional — conditions `OPEN` |
| Referral ledger | Approved / Not Yet Built | `APPROVED` | D27, D30 | |
| Fraud prevention | Approved / Not Yet Built | `APPROVED` | D27, D34 | Controls `OPEN` |
| Country-specific rules | Approved / Not Yet Built | `APPROVED` | D27, D35 | Requires legal review |
| Referral analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Reward amounts, limits, attribution model | Open | — | D27 | **No amount is approved** |
| Multi-level / pyramid structures | **Prohibited** | `APPROVED` | D27 | No unlimited MLM; no pyramid or passive-income structure |

---

## 16. Marketplace

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Marketplace & services | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D21 | **No principles supplied. Cannot be built.** |
| Marketplace services as purchasable extras | Approved / Not Yet Built | `APPROVED` | D26 | All four tiers |
| Marketplace safety | Approved / Not Yet Built | `APPROVED` | D34 | |
| **Marketplace data boundaries** | Approved / Not Yet Built | `APPROVED` | D28 | Binding architectural constraint — does not merge into the dating product |
| Marketplace analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Marketplace Operations (admin) | Approved / Not Yet Built | `APPROVED` | D32 | |
| Local Marketplace | Approved / Not Yet Built | `APPROVED` | D35 | |
| Provider onboarding, categories, commission, disputes | Open | — | D21 | `OPEN / UNDECIDED` |

---

## 17. Events & Hosts

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Events, Hosts & community economy | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D22 | **No principles supplied. Cannot be built.** |
| Events as purchasable extras | Approved / Not Yet Built | `APPROVED` | D26 | All four tiers |
| Event safety | Approved / Not Yet Built | `APPROVED` | D34 | |
| **Event data boundaries** | Approved / Not Yet Built | `APPROVED` | D28 | |
| Event / group communication | Approved / Not Yet Built | `APPROVED` | D33 | |
| Event analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Events Operations (admin) | Approved / Not Yet Built | `APPROVED` | D32 | |
| Host Management (admin) | Approved / Not Yet Built | `APPROVED` | D32 | |
| Host referrals | Approved / Not Yet Built | `APPROVED` | D27 | |
| Local events | Approved / Not Yet Built | `APPROVED` | D35 | |
| Local ambassadors / community | Approved / Not Yet Built | `APPROVED` | D35, D27 | |
| Host eligibility, ticketing, payouts, cancellation | Open | — | D22 | `OPEN / UNDECIDED` |

> **Hosts are a participant type that is not a plain user.** This has consequences for the role model (D32) and the trust model (D34) that must be designed deliberately.

---

## 18. Elite & Concierge

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Anera Elite | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D23; tier name approved by D26 | **No principles supplied. Cannot be built.** |
| Concierge | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D23 | **No principles supplied.** |
| **Elite cannot bypass safety** | Approved | `APPROVED` | D34 | Absolute |
| Elite privacy | Approved / Not Yet Built | `APPROVED` | D28 | A heightened requirement |
| Concierge safety | Approved / Not Yet Built | `APPROVED` | D34 | |
| Concierge communication | Approved / Not Yet Built | `APPROVED` | D33 | |
| Elite / Concierge analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Concierge Operations (admin) | Approved / Not Yet Built | `APPROVED` | D32 | |
| Premium UX where appropriate | Approved / Not Yet Built | `APPROVED` | D31 | |
| Elite eligibility, admission, entitlements | Open | — | D23, D26 | `OPEN / UNDECIDED` |

---

## 19. Trust & Safety

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Trust & Safety as a core platform capability | Approved / Not Yet Built | `APPROVED` | D34 | |
| Central Trust & Safety architecture | Approved / Not Yet Built | `APPROVED` | D30 | `IG-56` |
| **Blocking (immediate)** | Approved / Not Yet Built | `APPROVED` | D33, D34 | `IG-28` — **nothing exists** |
| **Reporting** | Approved / Not Yet Built | `APPROVED` | D33, D34 | `IG-29` — **nothing exists** |
| Consent architecture | Approved / Not Yet Built | `APPROVED` | D34 | |
| Scam prevention | Approved / Not Yet Built | `APPROVED` | D34 | |
| Catfishing protection | Approved / Not Yet Built | `APPROVED` | D34 | |
| Financial scam protection | Approved / Not Yet Built | `APPROVED` | D34 | |
| Harassment protection | Approved / Not Yet Built | `APPROVED` | D34 | |
| AI-assisted moderation | Approved / Not Yet Built | `APPROVED` | D34 | With human review |
| Human review where appropriate | Approved / Not Yet Built | `APPROVED` | D34 | |
| Risk-based enforcement | Approved / Not Yet Built | `APPROVED` | D34 | `IG-32` |
| False-positive protection | Approved / Not Yet Built | `APPROVED` | D34 | |
| Appeals | Approved / Not Yet Built | `APPROVED` | D34 | |
| Date safety | Approved / Not Yet Built | `APPROVED` | D34 | |
| Trusted contacts where supported | Approved / Not Yet Built | `APPROVED` | D34 | "Where supported" is a qualifier |
| Anti-spam | Approved / Not Yet Built | `APPROVED` | D33 | `IG-30` |
| Risk-based rate limiting | Approved / Not Yet Built | `APPROVED` | D33 | `IG-30` |
| Restricted safety / identity data | Approved / Not Yet Built | `APPROVED` | D34, D28 | |
| Global / regional safety configuration | Approved / Not Yet Built | `APPROVED` | D34, D35 | `IG-61` |
| Photo file-integrity validation (magic bytes) | Existing | — | Predates decisions | **Preserve** — supports D34 |
| Self-swipe prevention | Existing | — | Predates decisions | **Preserve** |
| 18+ age floor (self-declared) | Existing | Partial | D34 | `IG-35` — no verification |
| Account status / ban / suspension | Missing | `ATTESTED` | D34 enforcement | No field exists to represent it |

---

## 20. Privacy

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Privacy by design | Approved / Not Yet Built | `APPROVED` | D28 | |
| Data minimization | Approved / Not Yet Built | `APPROVED` | D28 | |
| **Data classification** | Approved / Not Yet Built | `APPROVED` | D28 | `IG-38` — **a prerequisite for every other privacy control** |
| User privacy controls | Approved / Not Yet Built | `APPROVED` | D28 | `IG-39` |
| AI personalization controls | Approved / Not Yet Built | `APPROVED` | D28 | |
| AI inference privacy | Approved / Not Yet Built | `APPROVED` | D28 | |
| Conversation privacy | Approved / Not Yet Built | `APPROVED` | D28 | Tension with AI moderation — unresolved |
| Relationship Memory controls | Approved / Not Yet Built | `APPROVED` | D28 | The feature itself is undefined |
| Location privacy | Approved / Not Yet Built | `APPROVED` | D28 | |
| Elite privacy | Approved / Not Yet Built | `APPROVED` | D28 | |
| Marketplace / Event data boundaries | Approved / Not Yet Built | `APPROVED` | D28 | |
| Least-privilege internal access | Approved / Not Yet Built | `APPROVED` | D28, D32 | |
| Auditability | Approved / Not Yet Built | `APPROVED` | D28, D32 | |
| **Data deletion** | Approved / Not Yet Built | `APPROVED` | D28 | `IG-12` — no deletion exists; missing FKs make it unreliable |
| Data export where applicable | Approved / Not Yet Built | `APPROVED` | D28 | |
| Retention controls | Approved / Not Yet Built | `APPROVED` | D28 | Periods `OPEN` |
| Regional privacy configuration | Approved / Not Yet Built | `APPROVED` | D28, D35 | |
| Third-party AI / data-processing controls | Approved / Not Yet Built | `APPROVED` | D28 | |
| Consent capture / privacy policy / ToS | Approved / Not Yet Built | `ATTESTED` | D28 | `IG-37` — requires legal review |
| No manipulative personalization | Approved | `APPROVED` | D28 | Binding prohibition |
| No exploitation of user vulnerability | Approved | `APPROVED` | D28 | Binding prohibition |

---

## 21. Analytics

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Product analytics | Approved / Not Yet Built | `APPROVED` | D29 | `IG-14` |
| **Meaningful connection funnel** | Approved / Not Yet Built | `APPROVED` | D29 | **"Meaningful connection" is undefined** |
| Matching analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Speed Dating / Event / Marketplace analytics | Approved / Not Yet Built | `APPROVED` | D29 | Blocked by D16/D21/D22 |
| Subscription / digital economy / earning / referral analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Elite / Concierge analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| AI quality / cost / safety analytics | Approved / Not Yet Built | `APPROVED` | D29 | |
| Retention | Approved / Not Yet Built | `APPROVED` | D29 | Bounded by the anti-vanity principle |
| User satisfaction | Approved / Not Yet Built | `APPROVED` | D29 | |
| Safety analytics | Approved / Not Yet Built | `APPROVED` | D29, D34 | First-class |
| Fraud analytics | Approved / Not Yet Built | `APPROVED` | D29, D27 | |
| Geographic / city health | Approved / Not Yet Built | `APPROVED` | D29, D35 | **Formula `OPEN`** |
| Experimentation | Approved / Not Yet Built | `APPROVED` | D29 | `IG-52` |
| Feature flags | Approved / Not Yet Built | `APPROVED` | D29, D30 | `IG-50` |
| Executive / business dashboards | Approved / Not Yet Built | `APPROVED` | D29 | |
| Privacy-conscious analytics | Approved / Not Yet Built | `APPROVED` | D29, D28 | Binding constraint |
| `EngagementAction` writes | Conflict | — | `IG-14`, `IG-08` | Write-only; taxonomy inconsistent |
| Error / performance monitoring | Approved / Not Yet Built | `APPROVED` | D30 observability | `IG-10` |
| Metric formulas (LTV, CAC, satisfaction, City Health) | Open | — | D29 | **None approved. Do not invent.** |

---

## 22. Administration

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Dedicated Admin platform | Approved / Not Yet Built | `APPROVED` | D32 | |
| Super Admin / Admin roles | Approved / Not Yet Built | `APPROVED` | D32 | **Permissions `OPEN`** |
| Trust & Safety role | Approved / Not Yet Built | `APPROVED` | D32 | |
| Customer Support role | Approved / Not Yet Built | `APPROVED` | D32 | |
| Finance role | Approved / Not Yet Built | `APPROVED` | D32 | |
| Events Operations / Host Management | Approved / Not Yet Built | `APPROVED` | D32 | |
| Marketplace Operations | Approved / Not Yet Built | `APPROVED` | D32 | |
| Concierge Operations | Approved / Not Yet Built | `APPROVED` | D32 | |
| AI Operations | Approved / Not Yet Built | `APPROVED` | D32 | |
| Analytics role | Approved / Not Yet Built | `APPROVED` | D32 | |
| CMS / content | Approved / Not Yet Built | `APPROVED` | D32 | |
| Promotions | Approved / Not Yet Built | `APPROVED` | D32 | |
| Country / city configuration | Approved / Not Yet Built | `APPROVED` | D32, D35 | `IG-36` |
| RBAC | Approved / Not Yet Built | `APPROVED` | D32 | `IG-27` |
| Least privilege | Approved / Not Yet Built | `APPROVED` | D32, D28 | |
| Approval workflows | Approved / Not Yet Built | `APPROVED` | D32 | `IG-49` |
| Audit logs | Approved / Not Yet Built | `APPROVED` | D32, D28 | `IG-27` |
| Ledger-based financial adjustments | Approved / Not Yet Built | `APPROVED` | D32, D30 | `IG-43` |
| Emergency controls / kill switches | Approved / Not Yet Built | `APPROVED` | D32 | `IG-50` |
| MFA / step-up authentication | Approved / Not Yet Built | `APPROVED` | D32 | `IG-49` |
| Separation of duties | Approved / Not Yet Built | `APPROVED` | D32 | `IG-49` |
| Controlled exports | Approved / Not Yet Built | `APPROVED` | D32, D28 | `IG-51` |
| **`/dev` debug panel** | **Conflict** | Not approved | `IG-26` | No authentication; exposes impersonation and total data deletion. **Fails all seven approved admin controls** |
| Permission matrix | Open | — | D32 | **Do not assume any role's permissions** |

---

## 23. Globalization

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Global platform | Approved / Not Yet Built | `APPROVED` | D35, D25 | |
| Local-first user experience | Approved / Not Yet Built | `APPROVED` | D35 | `IG-16` |
| Language localization | Approved / Not Yet Built | `APPROVED` | D35, D31 | `IG-25` — `next-intl` declared and unused |
| RTL | Approved / Not Yet Built | `APPROVED` | D35, D31 | `IG-25` |
| Timezone awareness | Approved / Not Yet Built | `APPROVED` | D35 | `IG-13` — streaks are UTC-only |
| Local currency / regional payment methods / localized pricing | Approved / Not Yet Built | `APPROVED` | D35, D26 | `IG-45` |
| Tax-aware commerce | Approved / Not Yet Built | `APPROVED` | D35 | Requires legal review |
| Regional verification / safety / privacy | Approved / Not Yet Built | `APPROVED` | D35, D34, D28 | `IG-61` |
| City Health Score | Approved / Not Yet Built | `APPROVED` (name) | D35, D29 | **Formula `OPEN`. Do not invent it** |
| Data-driven expansion | Approved / Not Yet Built | `APPROVED` | D35 | |
| Global account portability | Approved / Not Yet Built | `APPROVED` | D35 | Tension with regional rules — unresolved |
| Launch countries and sequence | Open | — | D35 | `OPEN / UNDECIDED` |
| Supported languages | Open | — | D35 | `OPEN / UNDECIDED` |

---

## 24. Travel Mode

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Travel Mode | Approved / Not Yet Built | `APPROVED` (name only) | D35 | The capability is approved; **every rule is `OPEN`** |
| Activation, duration, discovery effects | Open | — | D35 | `OPEN / UNDECIDED` |
| Entitlement gating | Open | — | D35, D26 | `OPEN / UNDECIDED` |
| Interaction with location privacy | Open | — | D28 | `OPEN / UNDECIDED` |

---

## 25. Relocation Mode

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Relocation Mode | Approved / Not Yet Built | `APPROVED` (name only) | D35 | The capability is approved; **every rule is `OPEN`** |
| How it differs from Travel Mode | Open | — | D35 | `OPEN / UNDECIDED` |
| Effect on existing matches and conversations | Open | — | D35 | `OPEN / UNDECIDED` |

---

## 26. Daily Experience, Retention & Engagement

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Daily experience / retention system | Approved / Not Yet Built | `APPROVED — SCOPE ONLY` | D19 | **No principles supplied** |
| Daily streaks | Existing | Conflict | `IG-19`, `IG-13` | Predates D29; not reviewed against the anti-vanity principle; UTC-only |
| Profile completion card | Existing | Conflict | `IG-19` | Same |
| Engagement prompt cards | Existing | Conflict | `IG-19` | Same; dismissal is local state only |
| Anti-vanity-engagement constraint | Approved | `APPROVED` | D29 core principle | Binding on this whole domain |

---

## 27. Notifications

| Feature | Status | Approval | Decision / source | Notes |
|---|---|---|---|---|
| Persisted in-app notifications (9 types) | Existing | — | Predates decisions | |
| Notification centre with swipe-to-dismiss | Existing | — | Predates decisions | |
| Real-time delivery (Socket.IO) | Existing | — | Predates decisions | Notifications only, not chat |
| 30-second polling fallback | Existing | — | Predates decisions | |
| Notification grouping (same type, 1 h) | Existing | — | Predates decisions | |
| Mark read / mark all read / delete | Existing | — | Predates decisions | |
| Notification architecture | Approved / Not Yet Built | `APPROVED` | D30 | Existing implementation is not an approved architecture |
| **Notification controls (user preferences)** | Approved / Not Yet Built | `APPROVED` | D33 | `IG-40` — settings endpoint is a stub |
| Device token registration | Partial | — | Predates decisions | Tokens stored |
| **Push notification sending** | Missing | — | `IG-75` | **Nothing ever sends a push.** Tokens collected without purpose — contrary to D28 minimization |
| Email notifications | Open | — | — | |
| `profile_viewed` / `boost_expired` types | Conflict | — | `IG-07` | Types exist; the features behind them do not |

---

## 28. Cross-cutting: what exists but was never approved

This is the inventory's most important observation.

**38 features are "Existing". Almost none was built against an approved requirement** — the first decisions were recorded on 2026-09-01, and the implementation predates them.

Existing features are therefore **candidates for ratification, not evidence of approval**. The product owner has not ratified any of the 25 behavioural rules recorded in the master specification (`R-01`…`R-25`, `OD-05`).

Three existing features are already known to conflict with an approved decision:

| Feature | Conflict |
|---|---|
| Discovery (globally unfiltered) | D35 local-first (`IG-16`) |
| Engagement/streak system | D29 anti-vanity-engagement (`IG-19`) |
| Verified badge | D34 verification (`IG-06`) |

And one existing feature — the localStorage/Bearer token path (`IG-01`) — conflicts with the standing security posture and is **still unresolved**.

---

## 29. Rules for using this inventory

1. **"Existing" never means "approved."** Check the Approval column.
2. **Do not build anything marked `Approved / Not Yet Built`.** No phase is approved.
3. **Do not infer an `ATTESTED` feature's rules from its name.** Super Like, Boost, Spotlight, Travel Mode and City Health Score all sound self-explanatory and none is specified.
4. **Do not treat an existing implementation as the approved design** for a feature that shares its name — see `IG-42` (`superlike`).
5. **Update this inventory** whenever a decision is added or an implementation status changes, in the same change.

---

*Feature approval comes from `docs/DECISIONS.md`. Implementation status comes from the repository as verified on 2026-08-30 and re-checked 2026-09-01. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
