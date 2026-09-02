# Anera V2 — Documentation Consistency Audit

| Field | Value |
|---|---|
| **Document name** | `docs/DOCUMENTATION-AUDIT.md` |
| **Status** | **REFERENCE** — an audit record. It approves nothing. |
| **Purpose** | Record the cross-document consistency audit performed after the 2026-09-01 documentation consolidation: what was checked, what was found, what was fixed, and what was deliberately left unresolved. **§8 records the 2026-09-02 taxonomy review**, including the standing decision not to split the master specification. |
| **Audit date** | 2026-09-01 (consistency audit, §1–§7) · 2026-09-02 (taxonomy review, §8) |
| **Auditor** | Claude Code, on the instruction of the product owner |

---

## 1. Scope

### 1.1 Documents reviewed

All eighteen other documents in `docs/` (this audit document is the nineteenth), plus the repository evidence they cite. Line counts are as at the close of the audit.

| Document | Lines | Reviewed |
|---|---|---|
| `00-MASTER-SPECIFICATION.md` | 1,845 | ✅ read in full before modification |
| `DECISIONS.md` | 1,543 | ✅ |
| `FEATURE-INVENTORY.md` | 567 | ✅ |
| `OPEN-QUESTIONS.md` | 327 | ✅ |
| `TRUST-AND-SAFETY.md` | 283 | ✅ |
| `ARCHITECTURE-GOVERNANCE.md` | 273 | ✅ |
| `SUBSCRIPTION-MONETIZATION.md` | 263 | ✅ |
| `GLOBAL-OPERATING-MODEL.md` | 251 | ✅ |
| `README.md` | 243 | ✅ |
| `REFERRAL-ECONOMY.md` | 241 | ✅ |
| `UX-DESIGN-GUIDELINES.md` | 235 | ✅ |
| `ADMIN-OPERATIONS.md` | 233 | ✅ |
| `IMPLEMENTATION-GAPS.md` | 217 | ✅ |
| `ANALYTICS.md` | 215 | ✅ |
| `PRIVACY-GUIDELINES.md` | 204 | ✅ |
| `COMMUNICATION.md` | 190 | ✅ |
| `ROADMAP.md` | 172 | ✅ |
| `CHANGELOG.md` | 184 | ✅ |

**Repository evidence re-verified during the audit:** `package.json`, `components.json`, `prisma/schema.prisma`, `git status`, and targeted checks described in §3.

### 1.2 Checks performed

| # | Check | Method |
|---|---|---|
| C1 | Contradictions between documents | Manual cross-reading + targeted grep on contested claims |
| C2 | Duplicate requirements | Structural review of overlapping subject areas |
| C3 | Incorrect statuses | Every document's status header against its underlying decision |
| C4 | Missing dependencies | Dependency sections cross-checked against `DECISIONS.md` §8 |
| C5 | Product vs implementation confusion | Every "Existing" claim checked for an approval claim |
| C6 | Security contradictions | Security statements cross-read across master spec, gaps, architecture |
| C7 | Privacy contradictions | Privacy statements cross-read across privacy, analytics, communication, T&S |
| C8 | Monetization contradictions | The extras rule and the eight prohibitions traced through every document |
| C9 | Trust & Safety contradictions | The five absolute rules traced through every document |
| C10 | Globalization contradictions | Local-first and portability traced through discovery, commerce, privacy |
| C11 | Architecture contradictions | "No technology approved" traced against every technology mention |
| C12 | Cross-reference integrity | Automated: every `IG-nn` and `OQ-xxnn` reference resolved against its register |
| C13 | Invented values | Automated: grep for prices, percentages, currencies, and named vendors |
| C14 | No application code modified | `git status` |

---

## 2. Result summary

| Category | Count |
|---|---|
| Findings raised | 11 |
| Findings resolved during the audit | 6 |
| Findings deliberately left unresolved (escalated) | 5 |
| Contradictions between approved decisions | 2 (both escalated, neither reconciled) |
| Dangling cross-references | **0** |
| Invented prices, formulas, or providers | **0** |
| Application files modified | **0** |

---

## 3. Automated verification

### 3.1 Cross-reference integrity — PASS

| Check | Result |
|---|---|
| Gap IDs defined in `IMPLEMENTATION-GAPS.md` | 76 (`IG-01` … `IG-76`) |
| Gap IDs referenced across all documents | 76 |
| **Dangling gap references** | **0** |
| Open-question IDs defined in `OPEN-QUESTIONS.md` | 152 |
| Open-question IDs referenced across all documents | 152 |
| **Dangling open-question references** | **0** |

Every `IG-nn` and `OQ-xxnn` cited anywhere in `docs/` resolves to a defined entry in its register.

### 3.2 Invented-value scan — PASS

| Scan | Result |
|---|---|
| Currency amounts, `$`/`€`/`£`, USD/EUR/INR | **No approved-sounding value found.** The only percentages present are the existing profile-completion scoring weights, correctly labelled `CURRENT IMPLEMENTATION`. |
| Named vendors (Stripe, Twilio, Firebase/FCM, APNs, Auth0, Okta, Onfido, Jumio, Persona, SendGrid, Mixpanel, Amplitude, Segment, Datadog, Sentry, PostHog) | **5 occurrences, all negative statements of absence** — e.g. "no payment provider dependency (no Stripe…)", "no FCM/APNs integration exists". None presents a vendor as selected. `FCM` also appears where the existing Prisma schema comment uses it, which is accurate reporting of the code. |
| Approved metric formulas | **None.** LTV, CAC, satisfaction and City Health Score are all explicitly `OPEN / UNDECIDED`. |
| Approved schema fields | **None invented.** All schema statements describe `prisma/schema.prisma` as it exists. |

### 3.3 No code modified — PASS

`git status` after the consolidation shows only:

```
?? .agents/          (pre-existing, untracked before this task)
?? docs/             (this documentation system)
?? prisma/migrations/ (pre-existing, untracked before this task — gap IG-22)
?? skills-lock.json  (pre-existing, untracked before this task)
```

**No file under `src/`, `prisma/schema.prisma`, `mini-services/`, `public/`, no configuration file, no environment file and no package file was created, modified or deleted.** No dependency was added or removed.

### 3.4 Repository claims spot-checked

| Claim | Where | Verified |
|---|---|---|
| Magic UI is **not** in the repository | `UX-DESIGN-GUIDELINES.md` §4.2 | ✅ Absent from `package.json`; no `magicui` reference in `src/` |
| shadcn style is `new-york`, icons `lucide` | `UX-DESIGN-GUIDELINES.md` §7.1 | ✅ `components.json` |
| 76 gaps, counts by risk and type | `IMPLEMENTATION-GAPS.md` §2 | ✅ recounted (see F-01) |
| 152 open questions, 10 requiring legal review | `OPEN-QUESTIONS.md` | ✅ recounted (see F-02) |

---

## 4. Findings

### 4.1 Resolved during the audit

| ID | Finding | Resolution |
|---|---|---|
| **F-01** | `IMPLEMENTATION-GAPS.md` summary reported 74 gaps with type counts that did not sum to the tables (Critical 12, High 21, Medium 25, **Low 16** — actual Low was 18). | **Fixed.** Recounted: 76 gaps (12/21/25/18); types recounted to CONFLICT 18, IMPLEMENTATION GAP 41, TECHNICAL DEBT 16, UNRESOLVED 1. A note was added that gap IDs are labels, not a contiguous sequence. |
| **F-02** | `OPEN-QUESTIONS.md` header claimed "96 open items" and the summary claimed "152 entries across 96 distinct questions" — the distinct-question figure was unsupported. Legal-review count was stated as 16; actual was 10. | **Fixed.** Corrected to 152 open items (9 blocking) and 10 legal-review items, each now listed by ID. |
| **F-03** | `FEATURE-INVENTORY.md` summary reported Existing 34 / Partial 9 / Conflict 12 / Approved-Not-Built 71 / Open 23 / Missing 4. Recounting the actual status cells gave 38 / 4 / 16 / 205 / 42 / 3, plus 5 rows using two status values outside the legend. | **Fixed.** Summary recounted to 313 rows with accurate figures; the two extra status values (`Approved` for a binding rule, `Prohibited`) are now explained. §28's narrative figure corrected from 34 to 38. |
| **F-04** | `TRUST-SAFETY.md` used a malformed gap identifier `IG-36b` for "no regional safety configuration". | **Fixed.** Reassigned to `IG-61` and defined in the gap register. |
| **F-05** | The master specification's §33.1 lists many items as `OPEN DECISION` that Decisions 16–35 now approve. Leaving it unannotated would mislead any reader who starts there. | **Resolved by annotation, not rewriting.** A prominent notice was added after the metadata block, a TOC entry added, and **Annex A** appended recording exactly what changed. §1–§38 are unchanged, preserving the 2026-08-30 audit's historical accuracy, as the product owner directed. |
| **F-06** | The future-document list proposes numbered files (`11-TRUST-SAFETY.md`, `15-SUBSCRIPTION-MONETIZATION.md`, `21-ANALYTICS.md`, `28-CHANGELOG.md`, …) whose subjects were created here under unnumbered names. Creating both would produce two documents of record for the same subject. | **Resolved by mapping, not duplication.** `README.md` §5.1 maps every proposed numbered document to the file that actually carries it, and states that duplicate numbered versions must not be created. Whether to renumber is escalated as `OQ-G06`. |

### 4.2 Escalated — deliberately left unresolved

Per the governing rule (Decision 30: *stop and surface rather than invent or silently reconcile*), these were **recorded, not resolved**.

| ID | Finding | Why not resolved | Recorded as |
|---|---|---|---|
| **F-07** | **Decisions 24 and 34 share the title *Trust, Safety, Identity & Authenticity*.** Decision 24 carries no principles; Decision 34 carries the full set. Decisions 25 and 35 similarly overlap on globalization. | Merging, renumbering, or marking one superseded would be an act of decision-making. Only the product owner may do that. **Both pairs are retained verbatim.** | `OQ-G02`; `DECISIONS.md` §4 and §11.2 |
| **F-08** | **Decisions 1–15 are absent from this repository.** The approval record begins at 16. | Their content is unknown. Nothing may be attributed to them, and their absence cannot be resolved by inference. | `OQ-G01`; `DECISIONS.md` §4 |
| **F-09** | **Conversation privacy (D28) and AI-assisted moderation of communications (D34) are both approved and are in tension.** D28 requires conversation privacy; D34 requires AI-assisted moderation with human review. The boundary between them is not stated. | This is a genuine contradiction **between two approved decisions**. Resolving it by implementation — or by asserting which wins — would silently make a product decision with privacy and safety consequences. | `OQ-PR12`; `PRIVACY-GUIDELINES.md` §4; `ANALYTICS.md` §4; `COMMUNICATION.md` §2.5 |
| **F-10** | **Global account portability (D35) is in tension with country-specific rules.** D35 approves that accounts are portable globally; D27 approves country-specific referral rules, D35 approves localized pricing and regional verification, and D28 approves regional privacy configuration. What happens to region-scoped entitlements, Credits, referral eligibility, verification status and privacy configuration when a user changes country is not stated. | Both sides are approved. Picking one would decide the product. | `OQ-D10`; `GLOBAL-OPERATING-MODEL.md` §4 |
| **F-11** | **`IG-01` — the localStorage/Bearer authentication conflict — is not resolved by any of Decisions 16–35.** D30 approves *central authentication governance* but does not address the specific conflict. | Explicitly out of bounds: the standing rule is that this path must not be removed or extended without an approved decision. | `OQ-B02`; `IG-01` (the register's only `UNRESOLVED` entry); master spec §13.4 and Annex A §A.3 |

> **F-09 and F-10 are contradictions between approved decisions**, not between a decision and code. They are the most important findings in this audit, because they cannot be resolved by any amount of engineering care — only by a decision.

---

## 5. Check-by-check results

### C1 — Contradictions between documents: **PASS after F-01…F-06**

The only contradictions found were the numeric ones (F-01, F-02, F-03), the malformed identifier (F-04), the stale open-decision register (F-05), and the document-naming overlap (F-06). All are fixed.

The master specification's §33.1 still lists items as `OPEN DECISION` that are now approved. **This is intentional and is not a defect:** §1–§38 are a dated historical audit, the product owner directed that they be preserved rather than rewritten, and Annex A plus the notice at the top of the document make the supersession explicit.

### C2 — Duplicate requirements: **PASS**

Several subjects legitimately appear in more than one document, because approved decisions overlap. The audit confirmed that in each case one document is the **owner** and the others **cross-reference** it rather than restating it as their own requirement:

| Subject | Owner | Cross-referenced by |
|---|---|---|
| Blocking and reporting | `TRUST-AND-SAFETY.md` (D34) | `COMMUNICATION.md` (D33 also approves them, and says so) |
| Conversation privacy | `PRIVACY-GUIDELINES.md` (D28) | `COMMUNICATION.md`, `ANALYTICS.md` |
| Ledgers | `ARCHITECTURE-GOVERNANCE.md` (D30) | `SUBSCRIPTION-MONETIZATION.md`, `REFERRAL-ECONOMY.md`, `ADMIN-OPERATIONS.md` |
| The eight monetization prohibitions | `SUBSCRIPTION-MONETIZATION.md` (D26) | `TRUST-AND-SAFETY.md`, `COMMUNICATION.md`, `UX-DESIGN-GUIDELINES.md` |
| Regional configuration | `GLOBAL-OPERATING-MODEL.md` (D35) | `TRUST-AND-SAFETY.md`, `PRIVACY-GUIDELINES.md`, `ADMIN-OPERATIONS.md`, `REFERRAL-ECONOMY.md` |
| Feature flags | `ARCHITECTURE-GOVERNANCE.md` (D30) | `ANALYTICS.md` (D29 also approves them) |

No requirement is stated twice with different content.

### C3 — Incorrect statuses: **PASS**

Every document's status header was checked against whether its underlying requirements are actually approved.

| Status | Documents | Justification |
|---|---|---|
| `APPROVED` | `DECISIONS.md` + 10 subsystem specifications | Each restates approved principles only, and marks every parameter `OPEN / UNDECIDED`. |
| `BASELINE` | `00-MASTER-SPECIFICATION.md` | Historical audit, not approved requirements. |
| `REFERENCE` | `README.md`, `FEATURE-INVENTORY.md`, `IMPLEMENTATION-GAPS.md`, `CHANGELOG.md`, `DOCUMENTATION-AUDIT.md` | Indexes and registers; approve nothing. |
| `OPEN` | `OPEN-QUESTIONS.md` | Records what is not decided. |
| `DRAFT / BLOCKED` | `ROADMAP.md` | **Contains no approved phase.** Correctly refuses `APPROVED`. |

**No document is marked `APPROVED` whose underlying requirements are not approved.** The roadmap is the clearest test case: its subject (phases) is entirely undecided, and it is marked `DRAFT / BLOCKED` accordingly.

### C4 — Missing dependencies: **PASS**

Every subsystem document carries a dependency table. These were checked against `DECISIONS.md` §8's dependency map. The three most-constraining decisions (30 architecture, 34 safety, 28 privacy) appear as dependencies in every document they constrain.

One structural dependency was added during the audit: `ADMIN-OPERATIONS.md` now records that the admin **permission matrix depends on D28's data classification**, which is itself undecided (`OQ-B08`) — the matrix cannot be written before the data classes exist.

### C5 — Product vs implementation confusion: **PASS**

The highest-risk category, given that 38 features exist and none was built against an approved requirement.

Verified:
- `FEATURE-INVENTORY.md` separates **Status** (built?) from **Approval** (approved?) into two distinct columns, and states explicitly that "Existing" never means "approved".
- Every subsystem document's "current implementation state" section is labelled `CURRENT IMPLEMENTATION` and separated from its approved-principles sections.
- `ARCHITECTURE-GOVERNANCE.md` §5 states in a callout that describing the existing stack is neither approval nor rejection.
- `SUBSCRIPTION-MONETIZATION.md` §8.3 records `IG-42` specifically to prevent the existing free `superlike` action being mistaken for the approved purchasable Super Like.
- `ANALYTICS.md` §6.3 records that the existing engagement system predates D29's core principle and is not ratified by it.

### C6 — Security contradictions: **PASS**

- The approved security posture (server-side auth, HTTP-only cookies, no client-side auth state, no shortcuts, no exposed secrets) is stated identically in the master spec §26.3, `ARCHITECTURE-GOVERNANCE.md` and `README.md`.
- The eleven controls to preserve (master spec §26.1) are reproduced in `IMPLEMENTATION-GAPS.md` §8 with matching content and file locations.
- No document proposes weakening a control.
- `IG-01` is consistently described as unresolved and untouchable in all five places it appears.

### C7 — Privacy contradictions: **ONE TENSION ESCALATED (F-09)**

Otherwise consistent. Data classification is described as a prerequisite (not a refinement) in `PRIVACY-GUIDELINES.md`, `ANALYTICS.md`, `ADMIN-OPERATIONS.md` and `FEATURE-INVENTORY.md` alike. Deletion is consistently described as blocked by the missing foreign keys (`IG-12`).

### C8 — Monetization contradictions: **PASS**

The audit specifically traced the approved extras clarification, because it is the most consequential and most easily violated rule.

| Statement | Documents where it appears | Consistent? |
|---|---|---|
| **All four tiers may purchase eligible extras** | `DECISIONS.md` D26, `SUBSCRIPTION-MONETIZATION.md` §3.1, `FEATURE-INVENTORY.md` §13, `README.md` §4.4, `CHANGELOG.md` | ✅ identical in substance |
| Entitlement checks must not be tier comparisons | `SUBSCRIPTION-MONETIZATION.md` §3.1, §10 | ✅ |
| "Subject to feature rules" is a real qualifier | `SUBSCRIPTION-MONETIZATION.md` §3.3, `FEATURE-INVENTORY.md` §12 | ✅ |
| The eight prohibitions | `DECISIONS.md` D26 + §9 (NR-01…NR-08), `SUBSCRIPTION-MONETIZATION.md` §4, `TRUST-AND-SAFETY.md` §2, `COMMUNICATION.md` §1, `UX-DESIGN-GUIDELINES.md` §5.1 | ✅ |
| No price is approved | Every monetization-touching document | ✅ |

### C9 — Trust & Safety contradictions: **PASS**

The five absolute rules appear identically in `DECISIONS.md` (D34 and §9), `TRUST-AND-SAFETY.md` §2, and are cross-referenced from `SUBSCRIPTION-MONETIZATION.md`, `COMMUNICATION.md`, `ADMIN-OPERATIONS.md` and `README.md`.

**Trust & Safety is no longer described as an unresolved product decision anywhere** except the preserved historical §33 of the master specification, which Annex A explicitly supersedes. Verified by targeted search.

`IG-06` (the verified badge) is described consistently everywhere as: approved product requirement · existing implementation gap · future remediation item — with the additional design note that progressive verification cannot be satisfied by making a boolean return `true`.

### C10 — Globalization contradictions: **ONE TENSION ESCALATED (F-10)**

Otherwise consistent. The expansion ladder is quoted identically everywhere. The observation that local-first is unimplementable on the current data model appears consistently in `GLOBAL-OPERATING-MODEL.md`, `DECISIONS.md` D25/D35, `IMPLEMENTATION-GAPS.md` (`IG-16`, `IG-44`) and `FEATURE-INVENTORY.md` §6.

### C11 — Architecture contradictions: **PASS**

The claim "no technology is approved" was traced against every technology mention in `docs/`. All technology references are either:

- labelled `CURRENT IMPLEMENTATION` (describing the existing stack), or
- labelled `OPEN / UNDECIDED` (future choices), or
- negative statements of absence ("no payment provider dependency").

One nuance was checked and is correct: `UX-DESIGN-GUIDELINES.md` notes that shadcn is **approved by D31 as foundational UI** and *happens* to be what the repository already uses — while `ARCHITECTURE-GOVERNANCE.md` maintains that D30 approves no technology. These are not in conflict: D31 approves a UI tooling direction; D30 approves architectural principles. The documents say so explicitly.

### C12, C13, C14

See §3. All pass.

---

## 6. Items intentionally left unresolved

Restated in one place, because leaving them open is a deliberate act, not an omission:

1. **F-07 / `OQ-G02`** — the Decision 24/34 and 25/35 numbering overlap. Both pairs retained verbatim.
2. **F-08 / `OQ-G01`** — Decisions 1–15 are absent and nothing is attributed to them.
3. **F-09 / `OQ-PR12`** — conversation privacy versus AI-assisted moderation. A contradiction between two approved decisions.
4. **F-10 / `OQ-D10`** — global account portability versus country-specific rules. A contradiction between two approved decisions.
5. **F-11 / `OQ-B02` / `IG-01`** — the authentication conflict, unresolved by Decisions 16–35 and still blocking.
6. **All 76 implementation gaps** — recorded, none fixed. Remediation requires an approved phase, and none exists.
7. **All 152 open questions** — recorded, none answered. Ten require legal review.
8. **The phase list (`OQ-B03`)** — no phase invented, per explicit instruction and per Decision 30.
9. **Principles for Decisions 16–23 (`OQ-B01`)** — eight capability areas left without rules rather than having rules invented for them.

---

## 7. Audit conclusion

### 7.1 The documentation system is internally consistent

After the six corrections in §4.1, no unresolved contradiction remains **within** the documentation. Every cross-reference resolves. No document overstates its authority. No price, formula, provider, schema field, legal requirement or phase was invented.

### 7.2 Two contradictions exist *between approved decisions*

**F-09** (conversation privacy vs AI moderation) and **F-10** (account portability vs regional rules) cannot be resolved by documentation. They require product-owner decisions. They are the audit's most consequential findings.

### 7.3 The project is not ready for implementation

> ## ⚠️ SUPERSEDED 2026-09-02 — see §9 and §10
>
> **§7.3 and §7.4 record the position as at 2026-09-01, before Decisions 36–43.** All three blocking conditions below have since been resolved: the phase plan by **D39**, the authentication conflict by **D37**, capability principles by **D42**, and the testing mechanism by **D43**.
>
> **Current status: Phase 0 is ❄️ FROZEN and Phase 1 is READY.** The "DO NOT IMPLEMENT YET" recommendation in §7.4 **no longer applies.** These sections are retained as the historical audit record.

Three independent conditions each block it:

| Condition | Status |
|---|---|
| An approved phase plan exists | ❌ **No.** `OQ-B03` |
| The blocking authentication conflict is resolved | ❌ **No.** `OQ-B02` / `IG-01` |
| The approved capability areas have rules to implement | ❌ **No.** Decisions 16–23 supply scope only (`OQ-B01`) |

Additionally, phase gate G3 (tests must pass) has no mechanism: there are zero tests and no CI (`IG-21`, `OQ-B06`).

### 7.4 Recommendation

> **DO NOT IMPLEMENT YET.**
>
> The documentation audit does **not** confirm that implementation requirements and phase governance are sufficiently defined. Nine blocking questions remain open, and the approved development method has no phases to iterate over.
>
> The critical path is decision-making, not engineering: resolve `OQ-B01` (principles for Decisions 16–23), `OQ-B02` (the authentication conflict) and `OQ-B03` (the phase list) before any code is written.

---

# 8. Taxonomy review — 2026-09-02

| Field | Value |
|---|---|
| **Review date** | 2026-09-02 |
| **Trigger** | The product owner proposed a 19-file "authoritative core" documentation taxonomy. |
| **Objective** | Align `docs/` with the proposal **without creating duplicates or losing existing decisions**. |
| **Outcome** | 2 renames · 0 new files · 3 rejections · 1 deferral · 1 structural decision (do not split the master specification) |

> **This section exists so the taxonomy question is not re-litigated from scratch.** Anyone proposing a documentation restructure should read §8 in full before starting.

## 8.1 Mapping result

All 19 proposed files were cross-referenced against all 19 existing documents — including coverage that lives as **sections of `00-MASTER-SPECIFICATION.md`** rather than as standalone files.

| Verdict | Count | Proposed files |
|---|---|---|
| **MATCHES** — rename only | 4 | `ROADMAP.md`, `DECISIONS.md`, `TRUST-AND-SAFETY.md`, `REFERRAL-ENGINE.md` |
| **PARTIALLY COVERED** — content exists inside the master specification | 11 | `PRODUCT-BLUEPRINT` (§3, §4, §6) · `APP-FLOW` (§8) · `REQUIREMENTS` (§5) · `TECH-STACK` (§11) · `SYSTEM-ARCHITECTURE` (§12) · `BACKEND-SCHEMA` (§14) · `API-SPECIFICATION` (§15) · `AUTHENTICATION` (§13) · `SECURITY-GUIDELINES` (§26) · `ADMIN-RBAC` (`ADMIN-OPERATIONS.md`) · `TESTING-STRATEGY` (§28) |
| **MISSING** | 1 | `AI-ARCHITECTURE.md` — the only genuine gap |
| **DUPLICATE RISK** | 3 | `FEATURE-SPECIFICATION`, `MONETIZATION`, `SUBSCRIPTIONS` |

## 8.2 Actions taken

### Renames performed (2)

| From | To | Cross-references updated |
|---|---|---|
| `IMPLEMENTATION-ROADMAP.md` | **`ROADMAP.md`** | 11 references across 5 documents |
| `TRUST-SAFETY.md` | **`TRUST-AND-SAFETY.md`** | 14 references across 6 documents |

Historical event records — the `CHANGELOG.md` 2026-09-01 "Documents created" table, and finding `F-04` in both `CHANGELOG.md` and this document — **retain the original filenames**, because they record what happened on that date. Only living pointers were updated.

### Rename rejected (1)

| Proposed | Kept as | Reason |
|---|---|---|
| `REFERRAL-ENGINE.md` | **`REFERRAL-ECONOMY.md`** | The rename **loses approved framing**, verified against source. D27's approved title is **"Referral & Growth Economy"**; the document's stated purpose is *"the approved referral and growth economy requirements"*; and it carries ambassador/community growth, creator/community referrals and partner referrals. "Engine" narrows the scope to mechanics and drops the growth-economy half. Retained under the project rule requiring Anera terminology to be preserved exactly (`00-MASTER-SPECIFICATION.md` §38.16). |

### Creations rejected (3)

| Proposed | Overlaps | Reason |
|---|---|---|
| `FEATURE-SPECIFICATION.md` | `FEATURE-INVENTORY.md` | The inventory already carries 313 features across 25 domains with per-feature approval status, decision provenance and gap links. A second feature document becomes a competing source of truth on the same subject. |
| `MONETIZATION.md` | `SUBSCRIPTION-MONETIZATION.md` | See below. |
| `SUBSCRIPTIONS.md` | `SUBSCRIPTION-MONETIZATION.md` | **D26 is a single decision covering tiers and extras together.** The extras rule and the **eight prohibitions** apply to both halves. Splitting D26 across two files means duplicating safety-critical rules in two places — the exact drift mechanism this documentation system exists to prevent. |

### Deferred (1)

`AI-ARCHITECTURE.md` — the only genuinely missing document. **Not created.** Tracked as **`OQ-G07`** in `OPEN-QUESTIONS.md`, blocked on `OQ-B01` (D18 supplies no principles) and `OQ-AI01`…`OQ-AI08` (no provider, model, feature set, data boundary, disclosure model, cost threshold, evaluation method or local-context definition is approved). Written today it would be ~90 % `OPEN / UNDECIDED`.

## 8.3 Structural decision — the master specification is NOT split

**Decision: `00-MASTER-SPECIFICATION.md` remains a single as-built source of truth. Do not split it into standalone files.**

Eleven of the nineteen proposed documents resolve to *"this already exists as a section of the master specification."* Extracting them was considered and rejected for now.

### Why not

| Reason | Detail |
|---|---|
| **The content is partial, not approved** | Every candidate section is `PARTIALLY COVERED`: §5 requirements are unratified (`OQ-B07`); §11 stack is `CURRENT IMPLEMENTATION` with **no technology approved** (D30); §12 architecture lacks domain boundaries (`OQ-A08`); §14 schema is blocked on `OQ-B05`; §15 API is blocked on `OQ-A10`; §28 testing is blocked on `OQ-B06`. Promoting partial content into a top-level file **implies a completeness that does not exist.** |
| **A file named `TECH-STACK.md` asserts a settled stack** | D30 approves **no technology**. §11 and `ARCHITECTURE-GOVERNANCE.md` §4 both state this explicitly. The filename alone would contradict an approved decision. |
| **Safety-critical rules would be duplicated** | §13.4 carries a **binding rule** that the localStorage/Bearer path must not be removed or extended. §26.1 lists eleven controls that must be preserved. Extracting these creates two copies of rules that must never drift apart. |
| **The audit trail depends on §1–§38 staying whole** | The master specification is a dated, verified 2026-08-30 audit with Annex A layered on top. Splitting it fragments the provenance that makes every claim in it checkable. |
| **Navigation is not yet a problem** | The document has a table of contents, 38 numbered sections and Annex A. Nobody has reported difficulty finding content in it. |

### When to revisit

Split a section out **only when both conditions are met**:

1. **The section's content is fully `APPROVED`** — not `PARTIALLY COVERED`, not `OPEN / UNDECIDED`. A decision must have supplied its principles.
2. **The section has grown large enough that it is genuinely hard to navigate inside the master document.**

Neither condition holds for any section today. **Do not split before both are met.** Splitting on filename aesthetics, taxonomy tidiness, or anticipated future growth is not a sufficient reason.

When a split does happen, the extracted section must be replaced in the master specification by a pointer — never deleted — so the audit trail survives.

## 8.4 The omission finding

The proposed 19-file core accounted for only **6 of the 19 existing documents**. Thirteen were unaccounted for, and **six of those are the sole home of an approved decision**:

| Orphaned in the proposal | Carries |
|---|---|
| `PRIVACY-GUIDELINES.md` | **D28** |
| `ANALYTICS.md` | **D29** |
| `ARCHITECTURE-GOVERNANCE.md` | **D30** |
| `UX-DESIGN-GUIDELINES.md` | **D31** |
| `COMMUNICATION.md` | **D33** |
| `GLOBAL-OPERATING-MODEL.md` | **D35 + D25** |

Plus seven infrastructure documents with no proposed equivalent: `00-MASTER-SPECIFICATION.md`, `FEATURE-INVENTORY.md`, `IMPLEMENTATION-GAPS.md`, `OPEN-QUESTIONS.md`, `README.md`, `CHANGELOG.md`, and this document.

**Mitigation applied:** `README.md` §3.2.1 now carries a permanent **decision-to-document map** listing every decision carrier and what would be lost if it were dropped, with a standing instruction that any taxonomy proposal must account for every row.

**Standing rule established:** a documentation taxonomy proposal is **incomplete by definition** if it does not map every approved decision to a carrier document.

## 8.5 What did not change

- **No document was deleted.**
- **No approved decision was lost, merged away, or reworded.**
- **No new document was created.**
- **No implementation gap was closed**; all 76 remain open.
- **No open question was answered**; one was added (`OQ-G07`), bringing the total to 153.
- **No application code was touched.**

## 8.6 Count correction — `FEATURE-INVENTORY.md` domains

**Finding `F-12`.** Four documents described `FEATURE-INVENTORY.md` as covering **"27 domains"**. Recounted against the file: it has 29 numbered `##` sections, of which **25 are feature domains** (§3 Authentication … §27 Notifications). §1 *How to read this inventory* and §2 *Summary* are intro/summary; §28 *Cross-cutting* and §29 *Rules for using this inventory* are cross-cutting/rules.

**Correct figure: 25 feature domains.**

| Document | Location | Correction |
|---|---|---|
| `README.md` | §3.3 *Baseline and reference* table | "Every feature across ~~27~~ **25** domains" |
| `CHANGELOG.md` | 2026-09-02 entry → *Creations rejected* table | "(313 features, ~~27~~ **25** domains)" |
| `CHANGELOG.md` | 2026-09-01 entry → *Documents created* table | "REFERENCE — ~~27~~ **25** domains" |
| `DOCUMENTATION-AUDIT.md` | §8.2 *Creations rejected* table | "313 features across ~~27~~ **25** domains" |

**Origin of the error:** the figure was carried over from the 28-item domain list in the original drafting instruction. Several of those items were consolidated during writing — Gifts/Boosts/Spotlight/Super Likes into §12, Subscriptions & Extras into §13, Rewards & User Earning into §14, Events & Hosts into §17, Elite & Concierge into §18 — while Experiences, Daily Experience and Notifications were added. The resulting count was never recomputed. `FEATURE-INVENTORY.md` itself never stated a domain count, so the error existed only in documents referencing it.

**Note on correcting a dated entry.** The *Documents created* table inside `CHANGELOG.md`'s 2026-09-01 historical entry was corrected anyway. This is deliberate and differs from the filename handling in §8.2: "27 domains" was **never true** — it was a factual error at the time of writing, not a fact that later changed. Preserving it would propagate the error. By contrast, `TRUST-SAFETY.md` genuinely *was* the filename on 2026-09-01, so that name is preserved in dated records.

**Cross-checked while auditing:** the adjacent "21 analytics domains" claim in `README.md` (lines 85, 102), `ANALYTICS.md`, `00-MASTER-SPECIFICATION.md` and `IMPLEMENTATION-GAPS.md` is **correct** — `ANALYTICS.md` §2 contains exactly 21 domain rows. No change made.

---

# 9. Canonical documentation pass — 2026-09-02

| Field | Value |
|---|---|
| **Date** | 2026-09-02 |
| **Trigger** | V2 brief: complete, reconcile and finalise the canonical documentation so the repository becomes implementation-ready. |
| **Outcome** | **7 decisions approved (36–42)** · 18 documents created · 10 updated · **3 project-defining blockers resolved** |

## 9.1 Conflicts surfaced before work began

Three items in the V2 brief contradicted approved decisions. Per D30 (stop and surface, never silently reconcile) these were **escalated to the product owner before any document was written**, not resolved by inference.

| Conflict | Brief said | Approved record said | Resolution |
|---|---|---|---|
| **Subscription tiers** | Free / Premium / **Gold** / **Platinum** / Elite (5) | **D26:** Free / **Plus** / Premium / Elite (4). Gold and Platinum appeared nowhere in Anera documentation | **Product owner chose the 5-tier ladder.** Recorded as **D38 superseding D26's tier names**; "Plus" `DEPRECATED`; NR-09 revised |
| **Next.js version** | "Next.js 15" `LOCKED` | `package.json` has `^16.1.1` — the brief specified a **major-version downgrade** | **Product owner confirmed 16.x**; "15" was an error. No downgrade |
| **Documentation taxonomy** | Nested `architecture/`, `product/`, `safety/`, `operations/` dirs; split the master spec; create `FEATURE-SPECIFICATION.md` and `REFERRAL-ENGINE.md` | The 2026-09-02 taxonomy review (§8) had **rejected all four**, hours earlier | **Product owner chose to keep the flat structure.** §8 decisions stand; recorded as **D41** |

> Had these been actioned as written, D26 would have been silently overwritten, the framework downgraded a major version, and a same-day decision reversed without record. **This is the governance rule working as designed.**

## 9.2 Decisions approved

| # | Decision | Effect |
|---|---|---|
| **36** | V2 Technology Stack | Locks Next.js 16, TypeScript, Tailwind, Prisma, **PostgreSQL**, cookies, bcrypt, minimal Zustand. Supersedes D30's technology question in part |
| **37** | V2 Authentication Architecture | **HTTP-only cookie + server validation.** Seven prohibitions. **Resolves `OD-09`/`OQ-B02`/`IG-01`** |
| **38** | Subscription Tier Structure | Five tiers. **Supersedes D26's tier names.** D26's model and eight prohibitions retained |
| **39** | Phased Implementation Plan | Thirteen phases (0–12) with a mandatory gate. **Resolves `OD-29`/`OQ-B03`** |
| **40** | Legacy Code Policy | Five-step gate; classifies all MVP auth/infra artefacts as `DEPRECATED` |
| **41** | Documentation Taxonomy | Flat structure; no duplicate sources of truth; master spec not split |
| **42** | Principles for D16–D23 | Upgrades D16, D17, D18, D20, D22, D23 to `APPROVED`. **D19 and D21 remain `SCOPE ONLY`** |

## 9.3 Documents created — 18

`01-PRODUCT-BLUEPRINT` · `02-APP-FLOW` · `TECH-STACK` · `SYSTEM-ARCHITECTURE` · `BACKEND-SCHEMA` · `API-SPECIFICATION` · `AUTHENTICATION` · `REALTIME-ARCHITECTURE` · `DATING-CORE` · `AI-ARCHITECTURE` · `SOCIAL` · `EVENTS` · `ELITE` · `SECURITY-GUIDELINES` · `VERIFICATION` · `FRAUD-PREVENTION` · `TESTING-STRATEGY` · `DEPLOYMENT-OPERATIONS`

Each carries the required header block: Purpose · Status · Owner · Authority · Dependencies · Related documents · Last updated · Change history.

## 9.4 Documents NOT created — and why

Per D41 and §8, avoiding duplicate sources of truth:

| Proposed | Why not | Carrier |
|---|---|---|
| `03-FEATURE-SPECIFICATION.md` | Duplicate | `FEATURE-INVENTORY.md` |
| `PREMIUM-MONETIZATION.md` | Duplicate | `SUBSCRIPTION-MONETIZATION.md` (updated for D38) |
| `REFERRAL-ENGINE.md` | Loses D27's "Growth Economy" framing | `REFERRAL-ECONOMY.md` |
| `PRIVACY.md` | Duplicate | `PRIVACY-GUIDELINES.md` |
| `ADMIN-RBAC.md` | Narrower than the carrier | `ADMIN-OPERATIONS.md` |
| `GLOBALIZATION.md` | Duplicate | `GLOBAL-OPERATING-MODEL.md` |
| `operations/ANALYTICS.md`, `safety/TRUST-AND-SAFETY.md` | Already exist at root | unchanged |
| `04-ROADMAP.md`, `05-DECISIONS.md` | Renumbering only | `ROADMAP.md`, `DECISIONS.md` |
| Nested directories | D41 — flat structure | — |

**No approved decision lost a carrier.** Verified against `README.md` §3.2.1.

## 9.5 Documents updated — 10

`DECISIONS.md` (D36–42, index, NR-09 revised, NR-31…NR-35 added, history, §11 resolutions, D30 supersession note) · `ROADMAP.md` (**rewritten `DRAFT/BLOCKED` → `APPROVED`**) · `SUBSCRIPTION-MONETIZATION.md` (five tiers; Plus deprecated) · `FEATURE-INVENTORY.md`, `README.md`, `OPEN-QUESTIONS.md` (tier names) · `IMPLEMENTATION-GAPS.md` (`IG-01` `UNRESOLVED` → `CONFLICT`, `OPEN — PHASE 1`) · `00-MASTER-SPECIFICATION.md` (§13.4 binding rule **lifted**; `OD-23` tier note) · `README.md` (§3.2.2 index of 18 new docs; roadmap status; phase answer) · `CHANGELOG.md`.

## 9.6 Final contradiction scan

Searched all of `docs/` for the mandated terms.

| Term | Result |
|---|---|
| localStorage · Bearer · HMAC | ✅ Every occurrence outside `00-MASTER-SPECIFICATION.md` §1–§38 is a **prohibition, deprecation or removal instruction**. Occurrences inside §1–§38 correctly describe the **as-built MVP**, which §13.4's new banner marks as superseded |
| Firebase · Firestore | ✅ **Verified absent from the repository.** Recorded as prohibited-by-default in `TECH-STACK.md`, not as present legacy |
| SQLite | ✅ Only as `CURRENT IMPLEMENTATION`/`DEPRECATED`; PostgreSQL is locked |
| Next.js version | ✅ **16.x** everywhere. No "Next.js 15" remains |
| PostgreSQL · Prisma · Zustand | ✅ Consistent with D36 |
| Pricing tiers | ✅ Five tiers everywhere forward-looking; "Plus" only in dated historical records and the explicit deprecation note |
| Premium · Gold · Platinum · Elite | ✅ Consistent |
| AI | ✅ No provider named as approved anywhere |
| Referrals · verification · realtime | ✅ No approved provider; consistent phasing |
| Security · testing | ✅ Consistent; gates locked |

### Contradiction found and fixed

**`F-13`.** `DECISIONS.md` D30 §"Note on the existing stack" stated the stack's *"future status is `OPEN / UNDECIDED`"* — directly contradicting D36, which locks it. **Fixed:** a supersession note was added in place. D30's architectural principles remain unchanged.

## 9.7 Registers

| Register | Before | After |
|---|---|---|
| Approved decisions | 20 (16–35) | **27 (16–42)** |
| Open questions | 153 (9 blocking) | **179 (7 blocking)** — 3 resolved, 29 raised |
| Implementation gaps | 76 | **76** — none closed; `IG-01` reclassified to Phase 1 remediation |
| Platform non-negotiable rules | 30 | **35** |

## 9.8 What did NOT change

- **No application code, schema, migration, config, environment or package file was modified.**
- **No gap was fixed** — remediation belongs to Phase 1.
- **No price, reward amount, formula, provider or legal determination was invented.**
- **No decision was silently overwritten** — D26's tier names were superseded by an explicit, recorded decision.

---

# 10. `OQ-B06` resolution and Phase 0 freeze — 2026-09-02

| Field | Value |
|---|---|
| **Date** | 2026-09-02 |
| **Trigger** | Resolve `OQ-B06` — the last Phase 0 blocker — and freeze Phase 0. |
| **Outcome** | **Decision 43 approved** · 11 documents updated · **Phase 0 ❄️ FROZEN** · Phase 1 ready |

## 10.1 Evidence check before approving

Per D30, the specified stack was checked against repository evidence rather than accepted on assertion. **No incompatibility found.**

| Check | Finding |
|---|---|
| Existing test framework | **None** — no test dependency, no test script, no `vitest`/`jest`/`playwright` config |
| Existing CI | **None** — no `.github/` directory |
| Potentially conflicting runner | `bun-types` is a devDependency and `start` runs under Bun. Bun's test runner is an **alternative, not a conflict**; Vitest chosen deliberately over it and recorded as a rejected alternative |
| Framework compatibility | Vitest and Playwright both support Next.js 16 + TypeScript (D36) |
| Playwright's prior status | Already `RECOMMENDED` in `TECH-STACK.md` and `TESTING-STRATEGY.md` — **preserved and promoted to `LOCKED`**, as instructed |

**Sequencing constraint surfaced, not suppressed:** two lockfiles are committed (`bun.lock`, `package-lock.json` — `IG-62`). Reproducible CI requires choosing one. This does **not** block the decision; it is recorded in D43 and is already a Phase 1 exit criterion.

## 10.2 Decision recorded

**Decision 43 — Testing Stack, CI and the Phase 1 Verification Gate.** Locks Vitest, Playwright, GitHub Actions, `tsc`, ESLint and the Next.js production build. Supersedes D30's `OPEN` entry for testing tools and CI; D30's principles unchanged.

**Coverage:** deliberately **no percentage target.** Defined as critical-path coverage (pass/fail) plus a no-regression ratchet, with a numeric threshold deferred to `OQ-TEST-02` once a real baseline exists. Setting a number before a single test exists would have been invention.

## 10.3 Phase 1 verification gate

Defined authoritatively in `TESTING-STRATEGY.md` §4 — **one definition, no competing statement anywhere**:

| Part | Contents |
|---|---|
| **§4.1 Static** | 3 checks — typecheck · lint · production build |
| **§4.2 Automated tests** | 20 tests — signup · login · invalid credentials · logout · session persistence after refresh · persistence across navigation/new tab · protected-route enforcement · unauthenticated rejection · multi-account isolation · fresh/incognito · session expiry · session revocation · survives server restart · database persistence · authorization isolation · profile creation · profile editing · photo upload · preferences · age floor |
| **§4.3 Security boundaries** | 8 negative assertions — no localStorage token · no Bearer auth · no token in response bodies · no `authReady`/`waitForAuth`/hydration gate · no auth state in logs · rate limiting active · no unauthenticated session-granting endpoint · security headers present |

Every item required by the brief is covered. §4.3 exists so the **D37 prohibitions stay gone** — without negative tests the legacy pattern can silently return.

**Scope discipline:** the gate covers only approved Phase 1 scope (auth, profile, photos, preferences). No functionality outside it was introduced.

## 10.4 Documents updated — 11

`DECISIONS.md` (D43, index, history, D30 + `OD-28` supersessions) · `TESTING-STRATEGY.md` (**stack locked; gate rewritten**) · `TECH-STACK.md` (3 rows `OPEN` → `LOCKED`, 1 added) · `ROADMAP.md` (**Phase 0 FROZEN**; Phase 1 gate wired; exit criteria rewritten) · `OPEN-QUESTIONS.md` (`OQ-B06` and `OQ-TEST-01` resolved with history retained; `OQ-TEST-02` added) · `ARCHITECTURE-GOVERNANCE.md` · `DEPLOYMENT-OPERATIONS.md` · `README.md` · `00-MASTER-SPECIFICATION.md` (Annex A blockers table; `OD-28`) · `DOCUMENTATION-AUDIT.md` · `CHANGELOG.md`.

## 10.5 Contradiction scan

| Term | Result |
|---|---|
| `OQ-B06` | ✅ Every reference now reads as **resolved**; no document still calls it open or blocking |
| Test runner | ✅ **Vitest** everywhere. No competing runner named as chosen |
| Playwright | ✅ **`LOCKED`** everywhere. No residual `RECOMMENDED` |
| Vitest | ✅ Consistent across `DECISIONS`, `TESTING-STRATEGY`, `TECH-STACK`, `ROADMAP` |
| CI | ✅ **GitHub Actions** everywhere; no residual `OPEN` |
| Coverage | ✅ One model — critical-path + ratchet. **No percentage stated anywhere** |
| Phase 1 gate | ✅ **One definition** (`TESTING-STRATEGY.md` §4). `ROADMAP.md` references it rather than restating it |
| Technology classifications | ✅ No `OPEN` row contradicts a `LOCKED` row |

**Stale statements found and fixed:** `ARCHITECTURE-GOVERNANCE.md` and `DEPLOYMENT-OPERATIONS.md` still listed testing tools and CI provider as `OPEN / UNDECIDED`; `00-MASTER-SPECIFICATION.md` Annex A still listed `BL-03`, `BL-04` and `BL-06` as "still blocking" from before D37/D39/D43. All corrected.

**Historical statements preserved:** `00-MASTER-SPECIFICATION.md` §28 (`OD-28`) and §35 remain as the 2026-08-30 audit recorded them; Annex A carries the supersession.

## 10.6 Legacy prohibitions re-verified

`DEPRECATED` / prohibited status confirmed intact for: HMAC tokens · Bearer transport · localStorage auth · `authReady` · `waitForAuth` · `hasHydrated`-as-auth · SQLite · in-memory persistence · local-disk uploads · sandbox coupling · unauthenticated `/api/dev` · seed-session grants · `next-auth` · origin-reflecting CORS.

**None was revived.** §4.3 of the gate actively tests that four of them stay absent.

## 10.7 What did not change

- **No application code, schema, migration, configuration, environment, deployment or package file was modified.**
- No lockfile touched.
- No gap closed — `IG-21` and `IG-62` remain open as Phase 1 items.
- No coverage percentage invented.

---

*Audit performed 2026-09-01 (§1–§7), taxonomy review 2026-09-02 (§8), canonical documentation pass 2026-09-02 (§9), `OQ-B06` resolution and Phase 0 freeze 2026-09-02 (§10). No application code was modified in any pass.*
