# Anera V2 — Social

| Field | Value |
|---|---|
| **Purpose** | The social layer: stories, posts, feeds and communities. |
| **Status** | **APPROVED** scope — **Phase 8, LONG-TERM.** All mechanics `OPEN` |
| **Owner** | Product owner |
| **Authority** | **Canonical for social scope.** New scope approved by D42; not covered by Decisions 16–35. |
| **Dependencies** | D42 (new scope) · D34 (moderation) · D28 (privacy) · D33 (reactions, comments) · D29 (analytics) |
| **Related documents** | [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) · [`COMMUNICATION.md`](COMMUNICATION.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 42. **First appearance of social scope in Anera documentation.** |

---

## 1. Status

**Phase 8. Nothing here is implemented, and nothing should be built before Phase 7 freezes.**

This is the **newest scope in the product** — no decision before D42 mentioned a social feed. It therefore carries the least specification and the most risk of scope drift.

## 2. Capabilities

All `APPROVED` in scope by D42. **All mechanics `OPEN`.**

| Capability | Notes |
|---|---|
| **Stories** | Ephemeral. Duration `OPEN` |
| **Posts** | Persistent user content |
| **Reels** | Short video. Heaviest infrastructure cost |
| **Voice status** | Short audio |
| **Reactions** | Also approved for messaging (D33) |
| **Comments** | Highest moderation burden |
| **Interest groups** | Community spaces |
| **Feeds** | Composition and ranking `OPEN` |
| **Dating content** | Editorial/advice. Authorship `OPEN` |
| **Local communities** | Ties to D35 local-first |

## 3. Constraints

`LOCKED` — inherited, non-negotiable:

| Constraint | Source |
|---|---|
| **Every social surface is moderated and reportable** | D34 |
| **Blocked users never see each other's content, anywhere** | D34 |
| **Privacy controls govern visibility** | D28 |
| **Optimize for meaningful connection, not vanity engagement** | D29 — binds feed ranking |
| **No manipulative personalization** | D28 |
| **Content moderation is AI-assisted with human review where appropriate** | D34 |

> **The feed-ranking constraint is the important one.** D29 explicitly forbids optimising for vanity engagement. A social feed is the easiest place in the product to violate that, and the ranking objective must be decided before anything is built.

## 4. Prerequisites

Phase 8 cannot start until:

1. **Phase 4 moderation exists and has capacity** — a feed multiplies moderation load by orders of magnitude.
2. **Media architecture exists** (`OQ-A03`) — reels and stories need storage, transcoding and CDN.
3. **Feed ranking objective is decided** — bounded by D29.
4. **Privacy model for social content is decided** — who sees what, and how it interacts with dating profile visibility (D28).

## 5. Open items

| Item | Tracked as |
|---|---|
| Which capabilities are actually in scope for Phase 8 | `OQ-SOC-01` |
| Feed composition and ranking objective | `OQ-SOC-02` |
| Content visibility and privacy model | `OQ-SOC-03` |
| Moderation capacity and tooling for scale | `OQ-SOC-04` |
| Media storage, transcoding, CDN | `OQ-A03` |
| Retention for ephemeral content | `OQ-PR03` |
| Relationship between social identity and dating profile | `OQ-SOC-05` |

---

*Approved scope, Phase 8. Mechanics undecided. Do not build ahead of the phase.*
