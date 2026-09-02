# Anera V2 — Elite

| Field | Value |
|---|---|
| **Purpose** | The invitation-only Elite ecosystem and concierge service. |
| **Status** | **APPROVED** scope — **Phase 11, LONG-TERM.** Mechanics `OPEN` |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D42 (principles for D23), D38 (Elite is a tier), D34 (Elite cannot bypass safety), D28 (Elite privacy). |
| **Dependencies** | D23 via D42 · D38 · D34 · D28 · D32 (Concierge Ops) · D33 (Concierge communication) |
| **Related documents** | [`SUBSCRIPTION-MONETIZATION.md`](SUBSCRIPTION-MONETIZATION.md) · [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`VERIFICATION.md`](VERIFICATION.md) · [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 42. |

---

## 1. The rule that governs everything here

> ## **Elite cannot bypass safety.**
> `LOCKED (D34)` — absolute, no exception.

Elite is a **premium experience**, never a **privileged-with-respect-to-consent-or-safety** experience. Every Elite capability that grants reach, visibility or contact is checked against D26's eight prohibitions and D34's five rules **before** it is designed.

`LOCKED (D28)` — **Elite privacy is a heightened requirement, not a reduced one.**

## 2. Status

**Phase 11.** Requires verification (4), payments (6), events (9). Elite is the top tier of the five-tier ladder (D38).

## 3. Membership

`APPROVED` in scope. **All criteria `OPEN`.**

| Element | Status |
|---|---|
| Invitation-only | `APPROVED` |
| Eligibility criteria | **`OPEN`** (`OQ-M12`) |
| Application process | `OPEN` |
| **Manual approval** | `APPROVED` — human decision, not automated |
| Rejection and re-application | `OPEN` |
| Removal from Elite | `OPEN` |

> **Manual approval implies an admin capability** — Concierge Operations (D32) — with least privilege, audit logging and separation of duties. Eligibility criteria carry discrimination risk and need legal review before they are set.

## 4. Capabilities

All `APPROVED` in scope; all mechanics `OPEN`.

| Capability | Constraint |
|---|---|
| **Luxury dating experience** | Presentation only — no safety or consent difference |
| **Concierge matchmaking** | Human-led, AI-supported (`AI-ARCHITECTURE.md` §3.5) |
| **Human advisor** | Access model `OPEN` |
| **Privacy / celebrity mode** | D28 Elite privacy. Visibility controls `OPEN` |
| **Executive verification** | Highest assurance level (`VERIFICATION.md` §3) |
| **Networking** | Non-dating intent — interacts with `OQ-P01` |
| **Travel matching** | Ties to Travel Mode (D35) |
| **Exclusive events** | Event safety still applies (D34) |

## 5. Concierge

`APPROVED (D23/D42, D33)` — a human service with its own communication channel.

`LOCKED`:
- **Concierge safety** is required (D34).
- Concierge staff are **admin users** under D32 — RBAC, least privilege, MFA, audit logging, separation of duties.
- Concierge access to member data is **restricted and audited** (D28).
- **A concierge may not bypass another user's blocking or consent** to make an introduction.

`OPEN` — service scope, SLAs, staffing, escalation, and how a concierge introduction is consented to by **both** parties.

> **The consent question is the hard one:** matchmaking by a human on behalf of a member must not become a route around another user's preferences or blocks. It must be designed explicitly.

## 6. Privacy

`LOCKED (D28)` — Elite privacy is called out as a distinct requirement. Implications, all `OPEN` in detail: reduced discoverability, restricted profile visibility, tighter internal access controls, and possible separate retention rules.

## 7. Open items

| Item | Tracked as |
|---|---|
| Eligibility criteria | `OQ-M12` — **legal review** for discrimination risk |
| Application and approval workflow | `OQ-EL-01` |
| Entitlements and pricing | `OQ-M01`, `OQ-M02` |
| Concierge scope, SLA, staffing | `OQ-EL-02` |
| **Consent model for concierge introductions** | `OQ-EL-03` |
| Privacy/celebrity mode mechanics | `OQ-EL-04` |
| Executive verification method | `OQ-TS01` |
| Concierge role permissions | `OQ-AD01` |

---

*Approved scope, Phase 11. Elite cannot bypass safety.*
