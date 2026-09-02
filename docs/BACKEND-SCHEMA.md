# Anera V2 — Backend Data Model

| Field | Value |
|---|---|
| **Purpose** | The canonical V2 data model, divided by phase. |
| **Status** | **SELECTED** — foundation tables locked in shape; later tables are indicative |
| **Owner** | Product owner |
| **Authority** | **Canonical for V2 target schema.** [`00-MASTER-SPECIFICATION.md`](00-MASTER-SPECIFICATION.md) §14 remains canonical for the **as-built** SQLite schema. |
| **Dependencies** | D36 (PostgreSQL, Prisma) · D37 (sessions) · D28 (privacy, deletion, retention) · D38 (tiers) |
| **Related documents** | [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) · [`API-SPECIFICATION.md`](API-SPECIFICATION.md) · [`PRIVACY-GUIDELINES.md`](PRIVACY-GUIDELINES.md) · [`AUTHENTICATION.md`](AUTHENTICATION.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 36 (PostgreSQL locked), which unblocked the schema question. |

---

## 1. Rules

`LOCKED`:

1. **PostgreSQL.** SQLite is `DEPRECATED`.
2. **Foreign keys on every relation**, with explicit cascade behaviour. The MVP has FKs on only 2 of 10 models, which makes account deletion unreliable (`IG-12`) and blocks D28.
3. **Do not create future-phase tables in the Phase 1 migration.** Build what the phase needs.
4. **Every table** carries `id`, `createdAt`, `updatedAt`.
5. **Soft delete** where D28 retention requires it; hard delete where erasure requires it. Which applies per entity is `OPEN` until data classification exists (`OQ-B08`).
6. **No enum invented without an approved requirement.**

---

## 2. FOUNDATION TABLES — Phase 1

These are required to ship Phase 1 (auth + profile).

| Table | Key fields | Constraints & indexes | Notes |
|---|---|---|---|
| **`users`** | `id` PK, `email` **unique**, `passwordHash`, `emailVerifiedAt?`, `status` | unique(`email`); index(`status`) | `passwordHash` **NOT NULL** in V2 — the MVP's nullable-password demo users are `DEPRECATED` |
| **`sessions`** | `id` PK, `userId` FK→users **cascade**, `expiresAt`, `createdAt`, `lastUsedAt?` | index(`userId`); index(`expiresAt`) | **New in V2.** Enables real revocation (replaces `IG-70`) |
| **`profiles`** | `id` PK, `userId` FK→users **unique, cascade**, `displayName`, `birthDate`, `gender`, `bio`, `city`, `intent`, `isOnboarded` | unique(`userId`); index(`city`) | **`birthDate` replaces the MVP's `age` integer** — age must be derived, not stored, or it silently rots |
| **`photos`** | `id` PK, `profileId` FK→profiles **cascade**, `url`, `order`, `isPrimary` | index(`profileId`) | Object storage URL, not local disk |
| **`profile_interests`** | `profileId` FK **cascade**, `interest` | PK(`profileId`,`interest`) | **Normalised.** Replaces the MVP's unqueryable JSON string |
| **`preferences`** | `id` PK, `userId` FK **unique, cascade**, age range, gender preference, distance | unique(`userId`) | **New.** The MVP has no preference model — everyone sees everyone (`IG-16`) |

### 2.1 Deliberate Phase 1 changes from the MVP

| MVP | V2 | Why |
|---|---|---|
| `Profile.age` Int | `profiles.birthDate` | Stored age is wrong the day after it's written |
| `Profile.interests` JSON string | `profile_interests` table | Unqueryable; blocks interest-based discovery |
| No `Session` table | `sessions` | D37 requires revocable server-side sessions |
| No preferences | `preferences` | D35 local-first and basic dating filtering both need it |
| Nullable `passwordHash` | NOT NULL | Demo/seed session grants are `DEPRECATED` (`IG-67`) |
| 2 foreign keys total | FKs everywhere | D28 deletion (`IG-12`) |

`OPEN` — exact field lists, gender/intent enum values (D42 did not respecify them; the MVP values are unratified per `OQ-B07`), and location representation (`OQ-B05` — coordinates vs region reference, and precision, which interacts with D28 location privacy).

---

## 3. PHASE 2 TABLES — dating core

| Table | Key fields | Constraints | Notes |
|---|---|---|---|
| `swipes` | `fromUserId` FK, `toUserId` FK, `action` | **unique**(`fromUserId`,`toUserId`); index both | `action`: like / nope / superlike |
| `matches` | `user1Id` FK, `user2Id` FK, `status` | **unique**(`user1Id`,`user2Id`) sorted | `status` supports unmatch (`IG-34`) |
| `blocks` | `blockerId` FK, `blockedId` FK | **unique** pair; index both | **Phase 2, not Phase 4** — discovery must exclude blocked users from the moment discovery exists |

> **Blocks land in Phase 2 deliberately.** D34 requires immediate blocking; building discovery without block-awareness would ship a known safety gap and require reworking the query later.

---

## 4. PHASE 3 TABLES — communication

`conversations` (per match) · `messages` (`conversationId` FK, `senderId` FK, `body`, `readAt?`) · `notifications` · `notification_preferences` · `device_tokens`.

`OPEN` — message retention (`OQ-C06`), media message representation, whether conversations survive unmatch (`OQ-TS06`).

---

## 5. PHASE 4 TABLES — trust & safety

`reports` · `moderation_actions` · `verifications` (level, method, evidence reference, expiry) · `user_status_history` · `trusted_contacts`.

`LOCKED (D34)` — verification is **progressive**: a level, not a boolean. A single `isVerified` flag cannot express it (`IG-06`).
`LOCKED (D34, D28)` — verification evidence is **restricted data** with its own access controls and retention.

---

## 6. FUTURE TABLES — Phase 5+

Listed for planning only. **Do not create until the owning phase.**

| Phase | Tables |
|---|---|
| 5 — AI | `ai_interactions`, `ai_consent` |
| 6 — Commerce | `subscriptions`, `entitlements`, `purchases`, `ledger_entries`, `boosts`, `super_like_grants` |
| 7 — Growth | `referral_codes`, `referrals`, `rewards`, `reward_wallet`, `referral_ledger`, `campaigns` |
| 8 — Social | `posts`, `stories`, `reactions`, `comments`, `groups` |
| 9 — Events | `events`, `tickets`, `attendance`, `hosts` |
| 11 — Elite | `elite_applications`, `concierge_cases` |
| Cross | `analytics_events`, `audit_log`, `feature_flags`, `regions` |

**Ledgers (`ledger_entries`, `referral_ledger`) are append-only** (D30, D32). Corrections are new entries, never updates.

---

## 7. Privacy requirements on the schema

`LOCKED (D28)`:

| Requirement | Schema implication |
|---|---|
| Data deletion | FKs with cascade on every user-owned relation |
| Retention controls | Timestamps on everything; retention policy per class |
| Data classification | Each table/column assigned a class — **`OPEN` (`OQ-B08`)**, and a prerequisite for retention and export |
| Least-privilege access | Restricted tables (verification, reports, safety) separated at the access-control layer |
| Export | Every user-owned table must be enumerable by `userId` |

**Deletion semantics — hard vs soft, and what survives when one party to a conversation deletes — remain `OPEN` (`OQ-PR06`).** This must be decided before Phase 3 messaging ships.

---

## 8. Migration from the MVP

| Step | Notes |
|---|---|
| 1 | Stand up PostgreSQL; author the V2 initial migration |
| 2 | Decide whether existing SQLite data is migrated or discarded — **`OPEN`** |
| 3 | **Track `prisma/migrations/` in git** (`IG-22` — currently untracked) |
| 4 | Backfill `birthDate` from `age` if data is migrated — lossy; needs a rule |
| 5 | Normalise `interests` JSON into `profile_interests` |
| 6 | Add all missing foreign keys; reconcile orphaned rows |

> The MVP database file is gitignored and not reproducible (`IG-58`), so "migrate or discard" is a genuine decision, not a formality.

---

## 9. Open items

| Item | Tracked as |
|---|---|
| Data classification scheme | `OQ-B08` |
| Location representation and precision | `OQ-B05`, `OQ-PR14` |
| Hard vs soft deletion; conversation survivorship | `OQ-PR06` |
| Retention periods per class | `OQ-PR03` |
| Gender / intent enum ratification | `OQ-B07`, `OQ-P01` |
| Whether MVP data is migrated | `OQ-SCHEMA-01` |
| Message retention | `OQ-C06` |

---

*Canonical V2 target schema. As-built schema is `00-MASTER-SPECIFICATION.md` §14.*
