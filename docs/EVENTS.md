# Anera V2 — Events & Live

| Field | Value |
|---|---|
| **Purpose** | Events, speed dating and live formats. |
| **Status** | **APPROVED** scope — **Phase 9, LONG-TERM.** Mechanics `OPEN` |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D42 (principles for D16 and D22), D34 (event safety), D26/D38 (events as extras), D35 (local events). |
| **Dependencies** | D16/D22 via D42 · D34 · D26/D38 · D35 · D33 (group communication) · D32 (Events Ops, Host Management) |
| **Related documents** | [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md) · [`REALTIME-ARCHITECTURE.md`](REALTIME-ARCHITECTURE.md) · [`GLOBAL-OPERATING-MODEL.md`](GLOBAL-OPERATING-MODEL.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 42, which supplied principles for D16 and D22. |

---

## 1. Status

**Phase 9.** Requires realtime (Phase 3), safety (Phase 4) and payments (Phase 6) first.

## 2. Formats

All `APPROVED` in scope. Mechanics `OPEN`.

| Format | Type | Notes |
|---|---|---|
| **Local singles events** | In person | Highest safety burden — real-world meeting |
| **Speed dating** | Either | D16. **Speed Dating safety is explicitly required** (D34) |
| **Premium events** | Either | Entitlement-gated (D38) |
| **Live events** | Virtual | Realtime infrastructure |
| **Video events** | Virtual | Provider `OPEN` |
| **Audio lounges** | Virtual | Realtime audio |

## 3. Lifecycle

`APPROVED` in scope, all mechanics `OPEN`:

Discovery (local-first, D35) → ticketing → attendance → moderation → post-event.

| Concern | Status |
|---|---|
| Event creation and approval | `OPEN` |
| Capacity and waitlists | `OPEN` |
| Ticketing and pricing | `OPEN` — events are purchasable extras (D38) |
| **Refunds and cancellation** | `OPEN` — required by D26 billing scope |
| Attendance and check-in | `OPEN` |
| No-show handling | `OPEN` |

## 4. Hosts

`APPROVED (D22, D42)` — hosts exist as a **participant type that is not a plain user**.

**Consequences that must be designed deliberately, not discovered:**

| Consequence | Source |
|---|---|
| Hosts need a role in the permission model | D32 — **permission matrix is `OPEN`** (`OQ-AD01`) |
| Hosts need heightened trust treatment | D34 |
| **Host Management** is an admin function | D32 |
| Host referrals exist | D27 |
| Hosts may earn — ledger-recorded | D20, D30 |
| Revenue share | **`OPEN` — no percentage approved** (`OQ-M14`) |

## 5. Safety

`LOCKED (D34)` — non-negotiable:

- **Event safety** and **Speed Dating safety** are named, mandatory requirements.
- **Safety cannot be pay-to-win.** A paid event does not get reduced safety controls.
- Blocking applies — **blocked users must not be placed in the same session or space**.
- Reporting works from every event surface.
- Real-world events raise date-safety concerns (D34): trusted contacts, check-ins, emergency handling — all `OPEN`.

> **Blocking inside Speed Dating is a real design problem**, not a checkbox: rotation algorithms must exclude blocked pairs without revealing why. Solve it at design time.

## 6. Constraints

| Constraint | Source |
|---|---|
| No paid event feature guarantees a match, interest, a response or a date | D26 |
| Events purchasable by **all five tiers** | D38, NR-09 |
| **Event data boundaries** — event participation does not flow freely into the dating product | D28 |
| Local events first | D35 |
| Event analytics required | D29 |
| Group communication per D33 | D33 |

## 7. Open items

| Item | Tracked as |
|---|---|
| Event creation, approval, capacity, waitlists | `OQ-EV-01` |
| Ticketing, pricing, refunds, cancellation | `OQ-EV-02` |
| Host eligibility, onboarding, payouts | `OQ-EV-03` |
| Host revenue share | `OQ-M14` |
| Speed dating format and rotation | `OQ-EV-04` |
| Real-world event safety protocol | `OQ-TS10` |
| Video/audio provider | `OQ-C03` |
| Host role permissions | `OQ-AD01` |

---

*Approved scope, Phase 9. Do not build ahead of the phase.*
