# Anera V2 — Privacy & Data Protection Guidelines

| Field | Value |
|---|---|
| **Document name** | `docs/PRIVACY-GUIDELINES.md` |
| **Status** | **APPROVED** — principles. Legal requirements, retention periods and processors are `OPEN / UNDECIDED`. |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 28**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved privacy and data-protection requirements for Anera V2, the data categories they apply to, and the gap against current implementation. |
| **Last updated** | 2026-09-01 |

> **This closes `OD-27` in the master specification.** Privacy is now an approved product area governed by explicit principles. What remains open is legal and parameter detail.

> **Legal review required.** This document states approved *product* principles. It does **not** state legal obligations. No jurisdiction-specific requirement appears here, because none has been approved and none may be inferred. See §8.

---

## 1. Governing principle

`APPROVED (D28)` — **Privacy by design.**

Privacy is a design input to every feature, not a compliance step performed afterwards. Combined with `APPROVED (D28)` **data minimization**, the default posture is: collect the least data that makes the feature work, and justify anything beyond that.

---

## 2. The two absolute prohibitions

`APPROVED (D28)`:

| # | Prohibition |
|---|---|
| 1 | **No manipulative personalization.** |
| 2 | **No exploitation of user vulnerability.** |

These bind personalization, AI inference, engagement mechanics (D19) and monetization prompts (D26) alike. Decision 29 reinforces them: the platform optimizes for safe, meaningful connections and sustainable user value, **not vanity engagement alone**.

---

## 3. Data classification

`APPROVED (D28)` — **data classification** is a required capability.

**Classification is a prerequisite, not a refinement.** Retention controls, export scope, least-privilege access and regional configuration all depend on knowing what class a field belongs to. None of them can be specified until classification exists.

`OPEN / UNDECIDED` — **the classification scheme itself**: the class names, their criteria, and the mapping of every field to a class. This must be decided before any retention or deletion rule is written.

### 3.1 Data categories to be classified

The categories below are the **kinds** of data the approved decisions require Anera to distinguish. Their class assignments are `OPEN / UNDECIDED`.

| Category | Description | Approved treatment |
|---|---|---|
| **User-provided data** | What the user deliberately enters: name, age, gender, bio, interests, city, relationship intent, photos. | Subject to minimization, retention, export and deletion. |
| **Observed signals** | Behaviour the platform records: swipes, matches, sessions, activity, engagement actions. | Subject to minimization and retention controls. Not user-provided — the user did not author it. |
| **AI-derived inference** | Conclusions the platform's AI draws about a user. | `APPROVED (D28)` — **AI inference privacy** applies. Inference about a user is subject to privacy controls in the same way as data the user supplied. |
| **Sensitive data** | Data requiring heightened protection. | `APPROVED (D28)` — restricted handling. `OPEN / UNDECIDED` — which fields are sensitive under Anera's scheme, and what heightened handling means. |
| **Safety & identity data** | Verification records, reports, enforcement history. | `APPROVED (D34)` — **restricted**; not general-purpose profile data. Least-privilege access (D28, D32). |
| **Conversation data** | Message content, voice notes, media, calls. | `APPROVED (D28)` — **conversation privacy**. |
| **Location data** | Whatever locality signal the platform holds. | `APPROVED (D28)` — **location privacy**. |
| **Relationship Memory** | An approved named concept (D28). | `APPROVED (D28)` — **Relationship Memory controls** are required. `OPEN / UNDECIDED` — what Relationship Memory is; its definition belongs to Decision 18's scope, which supplies no principles. |
| **Marketplace & Event data** | Participation, transactions, bookings. | `APPROVED (D28)` — **Marketplace/Event data boundaries**. This data does not flow freely into the dating product. |
| **Elite data** | Data relating to Elite members and Concierge interactions. | `APPROVED (D28)` — **Elite privacy** is a distinct, heightened requirement. |
| **Commerce & ledger data** | Purchases, entitlements, referral ledger, earning ledger. | `APPROVED (D30, D32)` — auditable; ledger-based. Interacts with retention: financial records and privacy erasure can conflict. `OPEN / UNDECIDED`. |
| **Device data** | Device tokens, platform. | Subject to minimization and retention. |

---

## 4. User privacy controls

`APPROVED (D28)` — the following controls are required:

| Control | Approved requirement | Detail status |
|---|---|---|
| **User privacy controls** | Users can control their privacy. | `OPEN / UNDECIDED` — which controls, and their granularity. |
| **AI personalization controls** | Users can control AI personalization. | `OPEN / UNDECIDED` — scope, defaults, and whether opt-in or opt-out. |
| **Location privacy** | Location is privacy-controlled. | `OPEN / UNDECIDED` — precision, obfuscation, and user-facing controls. Interacts with D35's local-first discovery, which needs locality to function. |
| **Conversation privacy** | Conversations are private. | `OPEN / UNDECIDED` — what this permits and forbids for moderation (D34 requires AI-assisted moderation, which must be reconciled with conversation privacy). |
| **Relationship Memory controls** | Users control Relationship Memory. | `OPEN / UNDECIDED` — the feature itself is undefined. |
| **Notification controls** | `APPROVED (D33)` — users control notifications. | `OPEN / UNDECIDED` — granularity and channels. |

> **Tension to resolve, not to assume:** conversation privacy (D28) and AI-assisted moderation of communications (D34) both approved. How they reconcile — what may be scanned, when, and with what disclosure — is `OPEN / UNDECIDED` and must be decided explicitly rather than settled by whichever gets implemented first.

---

## 5. Retention, deletion and export

| Requirement | Status |
|---|---|
| **Retention controls** | `APPROVED (D28)` — required. |
| **Data deletion** | `APPROVED (D28)` — required. Not optional. |
| **Data export where applicable** | `APPROVED (D28)` — required where applicable. |
| Concrete retention periods | `OPEN / UNDECIDED` — per data class. Requires classification (§3) first, and legal review. |
| Hard vs soft deletion semantics | `OPEN / UNDECIDED` |
| What survives when one party to a conversation deletes their account | `OPEN / UNDECIDED` |
| The scope of "where applicable" for export | `OPEN / UNDECIDED` |
| Export format | `OPEN / UNDECIDED` |
| Deletion vs. financial/ledger record retention conflict | `OPEN / UNDECIDED` — requires legal review |

**Architectural blocker:** deletion cannot be made reliable on the current data model. Only two foreign keys exist in the entire schema (`Profile`→`User`, `Photo`→`Profile`). Deleting a user today would leave orphaned rows in `swipes`, `matches`, `messages`, `notifications`, `user_streaks`, `device_tokens` and `engagement_actions`. Recorded as `IG-12`.

---

## 6. Internal access and auditability

`APPROVED (D28)` — **least-privilege internal access** and **auditability**.

`APPROVED (D32)`, reinforcing:

- **No unrestricted raw database access.**
- **No shared admin accounts.**
- Audit logs are mandatory.
- Exports are controlled.
- Separation of duties.
- MFA / step-up authentication for admin access.

`OPEN / UNDECIDED`: the permission matrix (which admin role may see which data class), audit log schema and retention, and the approval workflows required before sensitive data access.

---

## 7. Third-party and AI processing

`APPROVED (D28)` — **third-party AI / data-processing controls** are required.

`APPROVED (D30)` — all AI access flows through the **central AI Gateway**. This is a privacy control as well as an architectural one: it creates a single place where data sent to AI providers can be governed, logged and limited.

`APPROVED (D29)` — AI quality, cost and safety analytics.

`OPEN / UNDECIDED`:
- The identity of any third-party AI provider or data processor. **None is approved.**
- What data may be sent to a third party, and what may not.
- Processor retention terms and contractual requirements.
- The processor inventory / register.

---

## 8. Regional privacy and legal review

`APPROVED (D28)` — **regional privacy configuration** is required.
`APPROVED (D35)` — regional privacy is part of the regional operating model; country/city configuration is an admin capability (D32).

**`OPEN / UNDECIDED` — and explicitly requiring legal review:**

| Item | Status |
|---|---|
| Target jurisdictions | `OPEN / UNDECIDED` — **requires legal review** |
| Applicable legal regimes in each jurisdiction | `OPEN / UNDECIDED` — **requires legal review** |
| Lawful basis for each processing purpose | `OPEN / UNDECIDED` — **requires legal review** |
| Consent model and consent UX | `OPEN / UNDECIDED` |
| Privacy policy and terms of service content | `OPEN / UNDECIDED` — **requires legal review** |
| Breach notification process and timelines | `OPEN / UNDECIDED` — **requires legal review** |
| Data protection officer / records obligations | `OPEN / UNDECIDED` — **requires legal review** |
| Cross-border transfer rules | `OPEN / UNDECIDED` — **requires legal review** |
| Minimum age by jurisdiction | `OPEN / UNDECIDED` — **requires legal review** |

**No jurisdiction-specific legal requirement is stated anywhere in Anera's documentation, and none may be inferred by any contributor.** Naming a regulation and asserting what it requires would be invention with legal consequences.

---

## 9. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 9.1 Personal data processed today

| Category | Fields | Storage |
|---|---|---|
| Identity | email, name, password hash (bcrypt) | `User` |
| Profile | name, age, gender, bio, interests, city, relationship intent | `profiles` |
| Media | uploaded photos | `photos` + public filesystem at `public/uploads` |
| Behaviour | swipes (who liked/passed whom), matches, engagement actions, streaks | `swipes`, `matches`, `engagement_actions`, `user_streaks` |
| Communications | full message content | `messages` |
| Notifications | titles, bodies, image URLs, related user ids | `notifications` |
| Device | device tokens and platform | `device_tokens` |

### 9.2 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-12` | **No account deletion, no data export, no retention policy.** Missing foreign keys make erasure unreliable across seven tables. | §5 data deletion, retention controls, export |
| `IG-05` | **`GET /api/profile?userId=…` is unauthenticated** and returns any user's full profile including name, age, gender, bio, city and photos. | §1 privacy by design, data minimization |
| `IG-17` | **Extensive `console.log` of authentication state** in production code paths (`api-client.ts`, `auth-store.ts`, `page.tsx`). | §1 privacy by design (log hygiene) |
| `IG-18` | **Photos written to a public filesystem path and served directly** with no access control, no signed URLs, no CDN. | §3 data classification, media privacy |
| `IG-37` | **No consent capture, no privacy policy, no terms of service** anywhere in the product. | §8 |
| `IG-38` | **No data classification exists**, so no other privacy control can be correctly scoped. | §3 |
| `IG-39` | **No privacy controls of any kind** are exposed to users. The settings endpoint is a stub that persists nothing. | §4 |
| `IG-27` | **No role model and no audit log**, so least-privilege internal access and auditability are unimplementable today. | §6 |

---

## 10. Rules for anyone implementing in this area

1. **Classify before you retain, delete or export.** Every downstream privacy control depends on §3, which is undecided.
2. **Do not name a legal regime or assert what it requires.** That is legal review, not engineering judgement.
3. **Do not invent retention periods.** "90 days" is a decision, not a default.
4. **Do not send data to a third-party AI provider.** None is approved, and all AI access must route through the central AI Gateway (D30) which does not exist.
5. **Do not resolve the conversation-privacy vs. AI-moderation tension by implementation.** Escalate it (§4).
6. **Treat AI inference about a user as the user's data** (D28, AI inference privacy).
7. **Keep Marketplace and Event data behind their approved boundaries** (D28) — do not merge them into the dating profile.
8. **Do not log personal data or authentication state.**

---

*Derived from `docs/DECISIONS.md` Decision 28. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
