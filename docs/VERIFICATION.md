# Anera V2 — Verification

| Field | Value |
|---|---|
| **Purpose** | Progressive verification: levels, methods and their governance. |
| **Status** | **APPROVED** for the model; **`OPEN`** for every provider and threshold |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D34 (progressive verification, authenticity), D35 (regional verification), D28 (restricted data). |
| **Dependencies** | D34 · D35 · D28 · D32 (review tooling) |
| **Related documents** | [`TRUST-AND-SAFETY.md`](TRUST-AND-SAFETY.md) · [`FRAUD-PREVENTION.md`](FRAUD-PREVENTION.md) · [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 34's progressive verification principle. |

---

## 1. The two rules that shape everything

`LOCKED (D34)`:

> **Verified does not mean automatically safe.**
> **Unverified does not automatically mean unsafe.**

**Consequence:** a verification badge is a **signal, never a guarantee**. Product copy, UX and ranking must not imply safety. Anyone designing a badge reads this first.

## 2. Progressive verification

`LOCKED (D34)` — verification is a **spectrum with levels**, not a boolean.

> **A single `isVerified` flag cannot express this.** The MVP renders a verified badge while the API hardcodes `false` and no verification system exists (`IG-06`). The fix is a data model, not flipping a flag.

**`OPEN` (`OQ-TS02`)** — the levels themselves, what each unlocks, and whether any is mandatory.

## 3. Methods

All `APPROVED` in scope. **No provider is approved for any of them** (`OQ-TS01`).

| Method | Phase | Notes |
|---|---|---|
| **Email verification** | 1–4 | Lowest friction. Whether it gates anything: `OPEN` |
| **Phone verification** | 4 | Regional formats vary (D35) |
| **Selfie / liveness** | 4 | Proves a live person; **not identity** |
| **Identity document** | 4+ | Highest assurance, highest privacy burden |
| **Photo authenticity** | 4 | Does the photo depict the account holder? |
| **Social verification** | `FUTURE` | Method `OPEN` |
| **Premium verification** | 6 | Must not imply safety (Rule 1) |
| **Elite verification** | 11 | Executive/celebrity handling — see `ELITE.md` |

> **Existing controls are file-integrity, not authenticity.** Photo upload validates MIME, size and **magic bytes** — this defeats file spoofing, not catfishing. Preserve it (D40); do not mistake it for verification.

## 4. Per-method governance

`LOCKED` — no method ships without all seven documented:

| Field | Requirement |
|---|---|
| **Provider** | Named — `OPEN` for all |
| **Data collected** | Exact fields |
| **Retention** | How long evidence is kept, and why — `OPEN` (`OQ-PR03`) |
| **Consent** | How captured; what the user is told |
| **Failure** | What happens; how many attempts |
| **Appeal** | Route when verification wrongly fails (D34) |
| **Privacy** | Classification and access controls (D28) |

## 5. Data handling

`LOCKED (D34, D28)`:

- Verification evidence is **restricted data** — not general profile data.
- **Least-privilege access.** Only authorised Trust & Safety roles, audited (D32).
- Store the **verification result and level**, not raw evidence, wherever the method allows.
- Never expose evidence to other users.
- Retention is bounded — `OPEN`, requires legal review.

## 6. Regional

`APPROVED (D34, D35)` — verification requirements vary by region and are **configurable, not hard-coded** (D32 country/city configuration).

`OPEN` — which requirements vary, and per-jurisdiction obligations (**legal review**, `OQ-TS14`).

## 7. Age and eligibility

`LOCKED (D34)` — age/eligibility protection is required.

**Current state:** a self-declared integer with an 18–120 range check. **No verification of any kind** (`IG-35`).

`OPEN` — age-verification method, and what "hard eligibility controls" (D26, D33) consist of (`OQ-TS12`). Minimum age by jurisdiction requires **legal review** (`OQ-PR11`).

## 8. Phasing

| Phase | Scope |
|---|---|
| **1** | Email verification plumbing (may not gate anything yet) |
| **4** | Verification levels, phone, selfie, photo authenticity, review tooling, appeals |
| **6** | Premium verification |
| **11** | Elite verification |

## 9. Open items

| Item | Tracked as |
|---|---|
| Providers and methods | `OQ-TS01` |
| Levels and what each unlocks | `OQ-TS02` |
| Whether any level is mandatory | `OQ-TS03` |
| Age verification method | `OQ-TS12` |
| Regional requirements | `OQ-TS13`, `OQ-TS14` — **legal review** |
| Evidence retention | `OQ-PR03` — **legal review** |
| Appeals process | `OQ-TS09` |

---

*Canonical verification model. No provider approved.*
