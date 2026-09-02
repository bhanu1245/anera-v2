# Anera V2 — Dating Core

| Field | Value |
|---|---|
| **Purpose** | The core dating mechanics: profiles, discovery, swipe, matching. |
| **Status** | **APPROVED** for mechanics; **`OPEN`** for ranking weights and tuning |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D42 (principles supplied for D17), D35 (local-first), D30 (discovery/matching/ranking separation), D34 (safety). |
| **Dependencies** | D42 · D35 · D30 · D34 · D38 (Super Like as an extra) |
| **Related documents** | [`02-APP-FLOW.md`](02-APP-FLOW.md) · [`BACKEND-SCHEMA.md`](BACKEND-SCHEMA.md) · [`GLOBAL-OPERATING-MODEL.md`](GLOBAL-OPERATING-MODEL.md) · [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 42. |

---

## 1. Separation of responsibilities

`LOCKED (D30)` — three distinct modules, never one:

| Module | Answers |
|---|---|
| **Discovery** | *Who is eligible to be shown?* — preferences, locality, blocks, already-swiped |
| **Ranking** | *In what order?* |
| **Matching** | *What happens when two people like each other?* |

> The MVP collapses all three into one endpoint and does no ranking at all (`IG-54`). V2 separates them from the start.

---

## 2. Profiles

**MVP fields** — name, birth date, gender, bio, city, interests, relationship intent, photos.

`LOCKED` changes from the MVP: **birth date replaces stored age**; **interests are normalised**, not a JSON string (`BACKEND-SCHEMA.md` §2.1).

`OPEN` — gender and intent value sets are unratified (`OQ-B07`, `OQ-P01`); prompts and richer profile content are `FUTURE`.

## 3. Preferences

`LOCKED` — **new in V2, required in Phase 1.**

| Preference | Phase |
|---|---|
| Age range | 1 |
| Gender preference | 1 |
| Maximum distance | 2 (needs location model) |
| Relationship intent | 2 |

> **This is a defect fix, not a feature.** The MVP shows every onboarded user to every other user regardless of gender or preference (`IG-16`) — for a dating product that is broken, not merely incomplete.

## 4. Discovery

`LOCKED` — the candidate set **excludes**: self · already-swiped · blocked (either direction) · suspended/banned · outside preferences.

`LOCKED (D35)` — **local-first**, expanding **Nearby → City → Region → Country → Global**, **user-controlled**, expanding only when the local pool is insufficient. Full model in [`GLOBAL-OPERATING-MODEL.md`](GLOBAL-OPERATING-MODEL.md). Distances are `OPEN` (`OQ-D02`).

`OPEN` — deck size, refill behaviour, whether passed profiles ever reappear (`OQ-D04`).

## 5. Ranking

`APPROVED` — ranking exists and is separate from discovery.

**`OPEN` — the entire ranking model** (`OQ-B09`): signals, weights, freshness, reciprocity, diversity, cold start, fairness constraints, and evaluation.

> **Do not invent a ranking algorithm.** D30 approves that ranking is a distinct responsibility; no decision says what it optimises for. D29's core principle binds it: **meaningful connections, not vanity engagement.**

## 6. Swipe actions

| Action | Effect | Status |
|---|---|---|
| **Like** | Records intent; mutual like → match | `APPROVED` |
| **Nope** | Records pass; excluded from future decks | `APPROVED` |
| **Super Like** | Stronger signal, surfaced to the recipient | `APPROVED` — **a purchasable extra (D38)** |
| **Rewind** | Undo the last swipe | `APPROVED` — entitlement-gated, rules `OPEN` |
| **Boost** | Temporary visibility increase | `APPROVED` — extra (D38), mechanics `OPEN` |
| **Spotlight** | Prominent placement | `APPROVED` — extra (D38), mechanics `OPEN` |

`LOCKED` — one swipe per pair (unique constraint); repeats idempotent; self-swipe rejected.

`LOCKED (D26 prohibitions)` — **Super Like, Boost, Rewind and Spotlight may affect visibility or signal. None may guarantee a match, interest, a response or a date, or bypass blocking, consent, safety or eligibility.**

> The MVP's `superlike` is a **free, unmetered swipe action** differing from `like` only in notification copy (`IG-42`). That is **not** the approved Super Like and must not be treated as its design.

## 7. Matching

`LOCKED`:

1. Mutual `Like` or `Super Like` creates a match. `Nope` never matches.
2. Match rows store sorted user ids under a unique constraint — no duplicates.
3. Simultaneous likes are race-safe.
4. Both users are notified.
5. **A block immediately dissolves the relationship** — no discovery, no messaging, no visibility.
6. **Unmatch** ends the match. Conversation survivorship `OPEN` (`OQ-TS06`).

`OPEN` — match expiry, match limits, "who liked me" surfacing.

## 8. Compatibility

`APPROVED` — compatibility is in scope.

**`OPEN` — everything about it** (`OQ-B09`): inputs, scoring, whether a score is shown, and whether it drives ranking. Do not build it before it is specified.

## 9. Post-date feedback

`APPROVED` as scope. **`OPEN`** — mechanism, timing, privacy, and how it feeds ranking or safety. Interacts with D28 (sensitive data) and D34 (safety signals).

## 10. Advanced / future

`FUTURE` — Speed Dating (P9, `EVENTS.md`) · AI matchmaking (P5, `AI-ARCHITECTURE.md`) · Elite concierge matchmaking (P11, `ELITE.md`) · experiments (D29 experimentation).

## 11. Phase mapping

| Phase | Scope |
|---|---|
| **1** | Profiles, preferences |
| **2** | Discovery, filters, ranking v1, swipe, match, unmatch, block |
| **5** | AI matchmaking |
| **6** | Super Like / Boost / Spotlight / Rewind as entitlements |
| **10** | Local-first expansion ladder |

## 12. Open items

| Item | Tracked as |
|---|---|
| Ranking model and compatibility scoring | `OQ-B09` |
| Filter set and defaults | `OQ-D01` |
| Nearby / Region distances | `OQ-D02` |
| Deck size, refill, re-showing passes | `OQ-D04` |
| Rewind / Boost / Spotlight mechanics | `OQ-M03` |
| Unmatch conversation survivorship | `OQ-TS06` |
| Post-date feedback design | `OQ-DC-01` |
| Gender / intent value ratification | `OQ-B07` |

---

*Canonical dating mechanics. Ranking and compatibility remain unspecified by decision.*
