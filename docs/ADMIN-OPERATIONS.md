# Anera V2 — Administration, Operations & Internal Control

| Field | Value |
|---|---|
| **Document name** | `docs/ADMIN-OPERATIONS.md` |
| **Status** | **APPROVED** — principles, roles and controls. **The permission matrix is `OPEN / UNDECIDED`.** |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 32**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved administrative capabilities, roles and internal controls for Anera V2. |
| **Last updated** | 2026-09-01 |

> **This closes `OD-24` in the master specification.** A dedicated Admin platform is now an approved product area.

> **Important:** the role list below is an inventory of **functions**, not a permission matrix. **Which permissions attach to which role is `OPEN / UNDECIDED` and must not be assumed. Do not assume any role has unrestricted access — including Super Admin.**

---

## 1. A dedicated Admin platform

`APPROVED (D32)` — Anera V2 has a **dedicated Admin platform**.

It is a distinct, purpose-built surface — not a set of debug endpoints, not a database console, and not a feature flag on the user application.

`OPEN / UNDECIDED`: whether the admin platform is delivered as part of the same application, a separate application, or a separate deployment.

---

## 2. The seven absolute controls

`APPROVED (D32)` — non-negotiable:

| # | Control |
|---|---|
| 1 | **No shared admin accounts.** Every administrator is individually identified. |
| 2 | **No unrestricted raw database access.** Nobody queries production data directly. |
| 3 | **Least privilege.** Every role receives the minimum access required — including Super Admin. |
| 4 | **Audit logs.** Administrative actions are logged. |
| 5 | **MFA / step-up authentication.** Required for admin access. |
| 6 | **Separation of duties.** The same person cannot both request and approve a sensitive action. |
| 7 | **Controlled exports.** Data export is a governed operation, not a free-form capability. |

Reinforced by `APPROVED (D28)`: least-privilege internal access, auditability, and controlled exports are privacy requirements as well as operational ones.

---

## 3. Approved admin roles and functions

`APPROVED (D32)` — the following roles/functions exist. **Their permissions are `OPEN / UNDECIDED`.**

| Role / function | Approved scope of concern | Related decisions |
|---|---|---|
| **Super Admin** | Highest-level administration. **Not exempt from audit, MFA, or least privilege.** | D32 |
| **Admin** | General administration. | D32 |
| **Trust & Safety** | Reports, moderation, enforcement, appeals, verification review. | D34 |
| **Customer Support** | User assistance. | D32 |
| **Finance** | Financial operations; ledger-based adjustments. | D20, D26, D27, D30 |
| **Events Operations** | Event administration. | D22 |
| **Host Management** | Host administration. | D22, D27 |
| **Marketplace Operations** | Marketplace and provider administration. | D21, D27 |
| **Concierge Operations** | Concierge service administration. | D23 |
| **AI Operations** | AI system operation, quality, cost and safety oversight. | D18, D29, D30 |
| **Analytics** | Analytics and reporting access. | D29 |
| **CMS / content** | Content management. | D31 |
| **Promotions** | Promotional campaigns. | D26, D27 |
| **Country / city configuration** | Regional configuration. | D35 |

### 3.1 What is NOT decided about roles

`OPEN / UNDECIDED`:

- **The permission matrix** — which role may perform which action on which data class.
- Whether these are roles, permission groups, or both.
- Role assignment and revocation process.
- Whether a person may hold multiple roles, and which combinations separation of duties forbids.
- Whether roles are scoped regionally (a Trust & Safety operator for one country only).
- Access to which data classes — this depends on Decision 28's data classification, which is itself `OPEN / UNDECIDED`.

---

## 4. Approved control mechanisms

### 4.1 RBAC

`APPROVED (D32)` — **role-based access control**.

`OPEN / UNDECIDED`: the RBAC model's granularity and implementation.

### 4.2 Approval workflows

`APPROVED (D32)` — **approval workflows** exist for sensitive actions.

`OPEN / UNDECIDED`: which actions require approval, who approves, escalation, and timeout behaviour.

This mechanism implements separation of duties (control 6): a sensitive action is requested by one person and approved by another.

### 4.3 Audit logs

`APPROVED (D32)` — **audit logs** are mandatory.
`APPROVED (D28)` — **auditability** is a privacy requirement.

`OPEN / UNDECIDED`: audit log schema, what is logged, retention period, who may read the audit log, and whether audit logs are tamper-evident.

### 4.4 Ledger-based financial adjustments

`APPROVED (D32)` — **financial adjustments are ledger-based.**
`APPROVED (D30)` — **auditable ledgers** are an architectural requirement.

**A correction is a new ledger entry, never an edit to an existing record or a direct data change.** This applies to subscriptions, extras, Credits, referral rewards and user earnings.

`OPEN / UNDECIDED`: ledger schema, adjustment types, and which role may post an adjustment (and with what approval).

### 4.5 Emergency controls and kill switches

`APPROVED (D32)` — **emergency controls** and **kill switches**.

These are safety and operational controls. They are related to, but not the same as, Decision 30's **feature flags**: a feature flag manages rollout; a kill switch stops something that is causing harm.

`OPEN / UNDECIDED`: what can be killed, who may trigger it, whether triggering requires approval (and whether emergency use bypasses approval), and the restoration process.

### 4.6 MFA and step-up authentication

`APPROVED (D32)` — **MFA / step-up authentication**.

Step-up authentication means a sensitive action may require re-authentication even within an active admin session.

`OPEN / UNDECIDED`: the MFA mechanism, the identity provider, and which actions trigger step-up.

### 4.7 Controlled exports

`APPROVED (D32, D28)` — exports are **controlled**.

`OPEN / UNDECIDED`: which exports are permitted, what approval they need, whether they are logged and watermarked, and their retention.

---

## 5. Relationship to Trust & Safety operations

`APPROVED (D34)` — Trust & Safety is a core platform capability requiring reporting, moderation (AI-assisted with human review where appropriate), risk-based enforcement, false-positive protection and appeals.

**Consequence:** the Trust & Safety admin role is the operational surface for those capabilities. Its tooling requirements are therefore substantial and cannot be scoped until Decision 34's parameters (report categories, enforcement ladder, appeals process) are decided.

`APPROVED (D34)` — safety and identity data is **restricted**, which constrains what even a Trust & Safety operator may see, under least privilege.

---

## 6. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository.

### 6.1 There is no admin platform

What exists is a **development-only debug panel** at `/dev` (`src/app/dev/page.tsx`) backed by `/api/dev`:

| Capability | Detail |
|---|---|
| `GET /api/dev` | Lists **all users** with profile data (password hashes masked as `------`) and aggregate counts. |
| `login-as` | **Assume any user's identity** and receive a valid session. |
| `reset-database` | **Delete every row in every table.** |
| `seed-demo-profiles` | Create 15 demo profiles. |
| `create-random-match` | Fabricate a match. |
| `clear-swipes` | Delete a user's swipes and matches. |
| `generate-test-messages` | Fabricate conversations. |
| `generate-notifications` | Fabricate notifications. |

**Its only protection is `if (process.env.NODE_ENV === 'production') return 403`.**

There is:
- **No authentication of any kind** on `/api/dev`.
- No role model anywhere in the codebase — no `role` field, no permission table, no role checks.
- No audit log table or audit logging.
- No MFA, no step-up authentication.
- No approval workflows.
- No ledger.
- No emergency controls or kill switches.
- No feature flags.
- No export capability.

### 6.2 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved control violated |
|---|---|---|
| `IG-26` | **`/api/dev` has no authentication** and exposes user impersonation (`login-as`) and total data destruction (`reset-database`), gated only by `NODE_ENV`. | Controls 1, 2, 3, 4, 5, 6 — simultaneously |
| `IG-27` | **No role model, no permission table, no audit log.** | §3, §4.1, §4.3 |
| `IG-49` | **No MFA, no step-up authentication, no approval workflows, no separation of duties** — none is representable in the current system. | Controls 5, 6; §4.2, §4.6 |
| `IG-50` | **No emergency controls, kill switches or feature flags.** | §4.5; D30 |
| `IG-43` | **No ledger**, so ledger-based financial adjustment is impossible. | §4.4 |
| `IG-51` | **No controlled export capability.** | §4.7 |

### 6.3 The `/dev` panel cannot become the admin platform

This is a design conclusion that follows directly from the approved controls, and it is recorded so it is not discovered later:

The `/dev` panel fails **every one** of the seven absolute controls. It has no identity, no authorization, no audit, no MFA, no separation of duties, and it grants both impersonation and total data destruction. It is a development tool built before any decision existed.

`OPEN / UNDECIDED`: its disposition — removed, replaced, or retained strictly as a local development tool with hard guarantees that it cannot reach a deployed environment.

---

## 7. Dependencies

| Decision | Relationship |
|---|---|
| D18 Anera AI | AI Operations function |
| D20 Rewards & Earning | Finance; ledger-based adjustments |
| D21 Marketplace | Marketplace Operations |
| D22 Events & Hosts | Events Operations; Host Management |
| D23 Elite & Concierge | Concierge Operations |
| D26 Monetization | Finance; Promotions |
| D27 Referral | Finance; Promotions; referral administration; country rules |
| D28 Privacy | Least-privilege internal access; auditability; controlled exports; data classification gates the permission matrix |
| D29 Analytics | Analytics role; executive/business dashboards |
| D30 Architecture | Security gates; observability; feature flags |
| D31 UX | CMS / content |
| D34 Trust & Safety | Trust & Safety role; enforcement tooling; appeals; restricted data |
| D35 Global | Country / city configuration |

---

## 8. Rules for anyone implementing in this area

1. **Do not implement the admin platform yet.** No phase is approved and no permission matrix exists.
2. **Do not assume any role's permissions** — including Super Admin. Least privilege applies to every role.
3. **Do not extend `/api/dev` into an admin tool.** It fails all seven approved controls.
4. **Do not add an admin capability without RBAC, audit logging, MFA and least privilege** — these are approved as inseparable from admin access.
5. **Never implement a financial correction as a direct data edit.** Ledger entries only.
6. **Never create a shared admin account.**
7. **Never grant raw database access.**
8. **Do not select an identity provider or MFA mechanism.** None is approved.

---

*Derived from `docs/DECISIONS.md` Decision 32. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
