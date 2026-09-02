# Anera V2 — Communication & Social Interaction System

| Field | Value |
|---|---|
| **Document name** | `docs/COMMUNICATION.md` |
| **Status** | **APPROVED** — principles. Mechanics, providers and thresholds are `OPEN / UNDECIDED`. |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 33**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved communication requirements for Anera V2 and their gap against current implementation. |
| **Last updated** | 2026-09-01 |

---

## 1. The four critical rules

`APPROVED (D33)` — these bind every communication feature and every monetization decision that touches communication.

| # | Rule |
|---|---|
| 1 | **Basic human communication must remain fundamentally accessible.** |
| 2 | **AI must not silently impersonate users.** |
| 3 | **Paid features cannot bypass blocking, consent, safety or eligibility.** |
| 4 | **No paid feature guarantees a response, a date, or a romantic outcome.** |

Rule 1 is a **direct constraint on Decision 26**: messaging cannot be turned into a pure paywall. What "fundamentally accessible" permits in terms of limits, message requests or anti-spam throttling is `OPEN / UNDECIDED` — but the direction is fixed.

Rule 2 constrains every AI communication feature (§4): assistance may be offered, but the user must not be impersonated without their knowledge.

---

## 2. Approved capabilities

Each is `APPROVED (D33)` as a capability. Mechanics are `OPEN / UNDECIDED` unless noted.

### 2.1 Core messaging

| Capability | Status | Notes |
|---|---|---|
| **1-to-1 messaging** | `APPROVED` | `CURRENT IMPLEMENTATION` exists — per-match chat. |
| **Message requests where appropriate** | `APPROVED` | "Where appropriate" is a qualifier: message requests do not apply universally. When they apply, and their accept/decline semantics, are `OPEN / UNDECIDED`. |
| **Reactions** | `APPROVED` | Not implemented. Mechanics `OPEN`. |
| **Media** | `APPROVED` | Not implemented. Types, limits and moderation `OPEN`. |
| **Voice notes** | `APPROVED` | Not implemented. |
| **Voice** | `APPROVED` | Real-time voice. Not implemented. Provider `OPEN`. |
| **Video** | `APPROVED` | Real-time video. Not implemented. Provider `OPEN`. |
| **Translation** | `APPROVED` | Not implemented. Provider `OPEN`; whether automatic or opt-in `OPEN`. Interacts with D35 localization. |

### 2.2 Assisted communication

| Capability | Status | Notes |
|---|---|---|
| **Conversation starters** | `APPROVED` | Not implemented. |
| **AI conversation assistance** | `APPROVED` | Not implemented. **Bounded by Rule 2** — no silent impersonation. Disclosure model `OPEN`. Must route through the central AI Gateway (D30). |

### 2.3 Social and economic interaction

| Capability | Status | Notes |
|---|---|---|
| **Gifts** | `APPROVED` | Also an eligible purchasable extra for all tiers (D26). Not implemented. |
| **Event / group communication** | `APPROVED` | Not implemented. Depends on D22, which supplies no principles. |
| **Concierge communication** | `APPROVED` | Not implemented. Depends on D23, which supplies no principles. |

### 2.4 Protective capabilities

| Capability | Status | Notes |
|---|---|---|
| **Blocking** | `APPROVED` | Also `APPROVED (D34)` as **immediate blocking**. **Not implemented — `IG-28`.** |
| **Reporting** | `APPROVED` | Also `APPROVED (D34)`. **Not implemented — `IG-29`.** |
| **Anti-spam** | `APPROVED` | **Not implemented — `IG-30`.** |
| **Risk-based rate limiting** | `APPROVED` | Rate limiting is **proportionate to assessed risk**, not a blunt universal cap. **Not implemented — `IG-30`.** |

### 2.5 Privacy and control

| Capability | Status | Notes |
|---|---|---|
| **Communication privacy** | `APPROVED` | Also `APPROVED (D28)` as conversation privacy. See the unresolved tension with AI-assisted moderation in `PRIVACY-GUIDELINES.md` §4. |
| **Notification controls** | `APPROVED` | User-configurable. **Not implemented** — the settings endpoint is a stub. |

### 2.6 Measurement

| Capability | Status | Notes |
|---|---|---|
| **Meaningful conversation analytics** | `APPROVED` | Inherits D29's core principle: measure meaningful connection, **not vanity engagement**. The definition of "meaningful" is `OPEN / UNDECIDED`. |

---

## 3. Architectural obligations

`APPROVED (D30)` — the communication system inherits these approved architectural requirements:

| Requirement | Relevance |
|---|---|
| **Real-time architecture** | Voice, video, and live messaging. |
| **Media architecture** | Media messages, voice notes, gifts with assets. |
| **Notification architecture** | Communication generates notifications; notification controls are approved (§2.5). |
| **Central Trust & Safety architecture** | Blocking, reporting, anti-spam and rate limiting are Trust & Safety concerns and must not be scattered per-feature. |
| **Central AI Gateway** | AI conversation assistance, conversation starters, translation. |
| **Event-driven architecture where appropriate** | `OPEN` whether messaging qualifies. |

**No transport, provider or technology is approved.** The existing Socket.IO notification mini-service is `CURRENT IMPLEMENTATION`, not an approved architecture (see `ARCHITECTURE-GOVERNANCE.md`).

---

## 4. What is deliberately NOT specified here

Because nothing approved supports it:

- Voice/video provider, codec, quality targets, or recording policy.
- Translation provider, or whether translation is on by default.
- Media types, size limits, or media moderation approach.
- Rate-limit thresholds, or the risk model that drives them.
- Block semantics — what a block does to visibility, existing matches and existing conversations.
- Unmatch semantics, and whether conversations survive an unmatch.
- Message retention periods.
- The disclosure model for AI conversation assistance.
- Whether message requests apply to all first contacts or only some.

All are `OPEN / UNDECIDED` and tracked in [`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md).

---

## 5. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 5.1 What exists

| Aspect | Detail | File |
|---|---|---|
| Scope | One conversation per `Match`; messages carry `matchId`, `senderId`, `content`, `isRead` | `prisma/schema.prisma` |
| Access control | Both read and write verify match participation; **403** for non-participants | `src/app/api/messages/route.ts` |
| Read | Cursor pagination, default 50, max 100, ascending by `createdAt`; sender name and primary photo joined in | `src/app/api/messages/route.ts` |
| Read marking | Opening a conversation marks the other party's unread messages as read | `src/app/api/messages/route.ts` |
| Write | 1–2000 characters, trimmed; creates a `new_message` notification for the recipient | `src/app/api/messages/route.ts` |
| Transport | **HTTP polling every 5 seconds** | `src/components/chat/chat-page.tsx` |
| UI | Full-screen chat overlay, date separators, bubbles, avatars, empty state, Enter-to-send, auto-scroll | `src/components/chat/chat-page.tsx` |
| State | `chat-store.ts` — fetch, send, mark read, clear, prepend older | `src/stores/chat-store.ts` |

### 5.2 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved requirement violated |
|---|---|---|
| `IG-28` | **No blocking capability.** No `Block` model; no exclusion from discovery or chat. | §2.4 blocking; D34 immediate blocking |
| `IG-29` | **No reporting capability.** Nothing in a conversation can be reported. | §2.4 reporting |
| `IG-30` | **No anti-spam and no rate limiting anywhere** in the application. | §2.4 anti-spam, risk-based rate limiting |
| `IG-31` | **Chat uses 5-second HTTP polling** rather than the real-time infrastructure that already exists and is already authenticated for notifications. | §3 real-time architecture |
| `IG-40` | **No notification controls.** The settings endpoint returns hardcoded values and persists nothing. | §2.5 notification controls |
| `IG-34` | **No unmatch capability.** | Related to §2.4 |
| `IG-41` | **Not implemented and approved:** reactions, media, voice notes, voice, video, translation, conversation starters, AI conversation assistance, gifts, event/group communication, Concierge communication. | §2.1, §2.2, §2.3 |

### 5.3 Existing controls worth preserving

- Match-participation verification on both read and write (403 for non-participants) — the only consent-adjacent control in the communication system today.
- Session-derived sender identity: `senderId` always comes from the session, never from the request body.
- Message length bounds and trimming.

---

## 6. Dependencies

| Decision | Relationship |
|---|---|
| D17 Digital Economy | Gifts are economy items |
| D18 Anera AI | Conversation assistance, conversation starters, translation |
| D22 Events & Hosts | Event / group communication |
| D23 Elite & Concierge | Concierge communication |
| D26 Monetization | Gifts as extras; the four prohibitions; **communication must remain accessible** |
| D28 Privacy | Conversation privacy; notification controls |
| D29 Analytics | Meaningful conversation analytics; anti-vanity-engagement principle |
| D30 Architecture | Real-time, media, notification, Trust & Safety and AI Gateway architecture |
| D31 UX | Communication UX; clear primary action; meaningful states |
| D34 Trust & Safety | Blocking, reporting, harassment protection, scam prevention |
| D35 Global | Translation, localization, timezone awareness |

---

## 7. Rules for anyone implementing in this area

1. **Do not implement any communication feature yet.** No phase is approved.
2. **Blocking and reporting are the largest gaps** and are approved twice over (D33 and D34). They are not enhancements.
3. **Do not paywall core messaging.** Rule 1 is absolute in direction even though its parameters are open.
4. **Do not build AI assistance that writes as the user without disclosure.** Rule 2.
5. **Do not select a voice, video or translation provider.** None is approved.
6. **Do not invent rate-limit numbers.** Rate limiting is approved as *risk-based*; the risk model is undecided.
7. **Do not settle the conversation-privacy vs. AI-moderation question by implementing one side of it.** Escalate.

---

*Derived from `docs/DECISIONS.md` Decision 33. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
