# Anera V2 — AI Architecture

| Field | Value |
|---|---|
| **Purpose** | The AI strategy, its boundaries, and the governance every AI feature must satisfy. |
| **Status** | **APPROVED** for scope and boundaries; **`OPEN`** for provider, models and all parameters |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D42 (principles supplied for D18), D30 (central AI Gateway), D28 (AI privacy), D33 (no impersonation), D29 (AI analytics). |
| **Dependencies** | D18/D42 · D30 · D28 · D33 · D34 · D29 |
| **Related documents** | [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) · [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) · [`ANALYTICS.md`](ANALYTICS.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 42, which supplied principles for D18. Closes `OQ-G07` (the deferred AI document). |

---

## 1. Non-negotiable boundaries

`LOCKED` — every AI feature, without exception:

| # | Rule | Source |
|---|---|---|
| 1 | **AI must not silently impersonate users.** Assistance is disclosed; the user remains the author | D33 |
| 2 | **AI must never expose private user information** to another user, directly or by inference | D28 |
| 3 | **All model access routes through the central AI Gateway.** No ad-hoc provider calls | D30 |
| 4 | **AI inference about a user is that user's data** — subject to the same privacy controls as data they supplied | D28 |
| 5 | **No manipulative personalization; no exploitation of user vulnerability** | D28 |
| 6 | **AI-assisted moderation does not remove human review where human review is appropriate** | D34 |
| 7 | **Every feature has a fallback.** AI failure degrades the experience; it never breaks the product | D30 |
| 8 | **Optimize for meaningful connections, not engagement** | D29 |

---

## 2. The AI Gateway

`LOCKED (D30)` — one component, all access.

| Responsibility | Detail |
|---|---|
| Single egress point | No feature calls a provider directly |
| Consent enforcement | Checked before any call |
| Data minimisation | Only the fields the feature needs (D28) |
| Redaction | PII stripped or tokenised before egress where possible |
| Logging | Requests logged for audit **without** storing sensitive payloads |
| Cost governance | Per-feature budgets and limits (D30) |
| Quality / safety telemetry | Emitted to analytics (D29) |
| Fallback | Timeouts, retries, graceful degradation |

**`OPEN`** — provider, models, hosting posture (`OQ-AI01`). **No provider is approved. Do not select one.**

> The declared `z-ai-web-dev-sdk` dependency is an unused sandbox artefact (`IG-15`) and is **not** an approved provider.

---

## 3. Feature inventory

All are `APPROVED` in scope by D42. **All parameters are `OPEN`.** Phase 5 unless noted.

### 3.1 Profile & presentation

| Feature | Input | Output | Notes |
|---|---|---|---|
| Profile optimization | Own profile | Suggestions | Advisory only |
| Bio suggestions | Own prompts | Draft text | **User edits and owns the result** |
| Photo ranking | Own photos | Suggested order | Never shown to others |

### 3.2 Conversation

| Feature | Input | Output | Notes |
|---|---|---|---|
| Icebreakers | Both public profiles | Openers | **Suggestion only — never auto-sent** |
| Reply suggestions | Own conversation | Draft replies | **Disclosure required** (Rule 1) |
| Conversation coaching | Own conversation | Advice to the user | Private to the user |
| Date planning | Stated preferences | Suggestions | |

> **Rule 1 in practice:** a suggested reply may be offered to the user, who chooses to send it. AI must never send as the user, and the recipient must never be misled about authorship. The exact disclosure model is `OPEN` (`OQ-AI04`).

### 3.3 Matching

| Feature | Notes |
|---|---|
| AI matchmaking | Feeds ranking. **Ranking model itself is `OPEN`** (`OQ-B09`) |
| Compatibility scoring | Inputs and whether a score is shown: `OPEN` |
| Personality analysis | **Sensitive inference** — heightened consent and privacy (D28) |
| Conversation quality signals | Aggregate quality, not surveillance. Must reconcile with conversation privacy |

### 3.4 Safety

| Feature | Notes |
|---|---|
| Content moderation | AI-assisted, **human review where appropriate** (D34) |
| Scam detection | Feeds `FRAUD-PREVENTION.md` |
| Authenticity / catfishing signals | Feeds `VERIFICATION.md` |
| Referral fraud scoring | Phase 7 |

### 3.5 Elite

Concierge matchmaking support — Phase 11, human-in-the-loop. See [`ELITE.md`](ELITE.md).

---

## 4. Per-feature governance record

`LOCKED` — **no AI feature ships without all ten fields documented and approved:**

| Field | Requirement |
|---|---|
| Purpose | What user problem it solves |
| Input | Exact data sent to the model |
| Output | What is returned and how it is used |
| Model / provider | Named — `OPEN` today |
| Privacy | Classification of every input field (D28) |
| Consent | Whether opt-in; how captured and withdrawn |
| Retention | Provider retention and Anera retention |
| Safety | Failure modes and harm mitigations |
| Cost | Per-call and budget ceiling |
| Fallback | Behaviour when AI is unavailable |
| Human review | Where required |

## 5. Privacy

`LOCKED (D28)`:

- **AI personalization controls** are user-facing.
- **AI inference privacy** — derived conclusions are the user's data.
- **Conversation privacy** applies to anything read from conversations.
- **Third-party processing controls** — the provider is a processor with contractual limits.
- Marketplace/Event data boundaries apply.

> **Unresolved tension (`OQ-PR12`):** D28 requires conversation privacy; D34 requires AI-assisted moderation of communications. **The boundary between them is not decided.** It must be resolved before any AI feature reads conversation content. **Do not settle it by implementing one side.**

## 6. Analytics

`APPROVED (D29)` — AI **quality**, **cost** and **safety** analytics are all required, and are three distinct dimensions.

## 7. Phasing

| Phase | Scope |
|---|---|
| **5** | Gateway + a prioritised subset. Which features are in the subset: `OPEN` |
| **4** | Moderation assistance may be sequenced earlier with safety |
| **7** | Referral fraud scoring |
| **11** | Elite concierge support |

**Prerequisites for Phase 5:** provider selected · consent model decided · `OQ-PR12` resolved · cost budgets set · Gateway built.

## 8. Open items

| Item | Tracked as |
|---|---|
| Provider and models | `OQ-AI01` |
| Which features are in the Phase 5 subset | `OQ-AI02` |
| Data permitted to leave for inference | `OQ-AI03` |
| Disclosure model for assistance | `OQ-AI04` |
| Cost budgets | `OQ-AI05` |
| Quality and safety evaluation | `OQ-AI06` |
| Fallback behaviours | `OQ-AI07` |
| Local-context AI meaning | `OQ-AI08` |
| **Conversation privacy vs AI moderation** | **`OQ-PR12`** |
| Consent model | `OQ-PR04` |

---

*Canonical AI architecture. No provider approved; no feature implemented.*
