# Anera V2 — Deployment & Operations

| Field | Value |
|---|---|
| **Purpose** | Environments, secrets, migrations, backups, monitoring and incident response. |
| **Status** | **OPEN** for hosting and tooling; **LOCKED** for the operational rules |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from D36 (stack), D30 (observability, migration governance), D32 (operational controls). |
| **Dependencies** | D36 · D30 · D32 · D28 (retention, deletion) |
| **Related documents** | [`TECH-STACK.md`](TECH-STACK.md) · [`SECURITY-GUIDELINES.md`](SECURITY-GUIDELINES.md) · [`TESTING-STRATEGY.md`](TESTING-STRATEGY.md) · [`BACKEND-SCHEMA.md`](BACKEND-SCHEMA.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decisions 36/30/32. |

---

## 1. Current state

> The MVP has **no deployment story**. It is coupled to a sandbox: Caddy `XTransformPort` routing, `allowedDevOrigins: ['.space-z.ai']`, `start-dev.sh` hard-coding `/home/z/my-project`, a hard-coded `http://localhost:3003`, and an external `z-cdn.chatglm.cn` favicon (`IG-53`). The database is a gitignored SQLite file (`IG-58`).
>
> **All of this is `DEPRECATED` (D40) and removed in Phase 1.**

## 2. Environments

`SELECTED` — three, with strict separation:

| Environment | Purpose | Data | Notes |
|---|---|---|---|
| **Development** | Local | Synthetic only | Dev tooling permitted here **only** |
| **Staging** | Pre-production verification | Synthetic or anonymised | Mirrors production config |
| **Production** | Live | Real user data | No dev endpoints. No debug tooling |

`LOCKED`:
- **No production data in development.**
- **No dev endpoint reachable in staging or production** — `/api/dev`, `demo-login`, `seed` (`IG-26`, `IG-67`).
- `NODE_ENV` is **not** a security boundary on its own. Dev capabilities are removed at build or protected by real authentication.

`OPEN` — hosting provider and topology (`OQ-B04`, `OQ-A14`).

## 3. Configuration & secrets

`LOCKED`:

1. **Secrets never in source control.** Environment or a secret manager only.
2. **No hard-coded fallback.** The app **fails closed** if a required secret is absent (`IG-65`).
3. Secrets never logged, never in errors, never returned by an API.
4. Rotation without a code change.
5. `.env.example` documents required variables **with no values**.

Required at minimum: database URL · session signing material · (later) storage, email, payment, AI credentials.

`OPEN` — secret management tooling (`OQ-A07`).

## 4. Database migrations

`LOCKED (D30 migration governance)`:

1. **`prisma/migrations/` is tracked in git** — currently untracked (`IG-22`).
2. Migrations are forward-only and reviewed.
3. Applied to staging before production.
4. **Backward compatible** where possible — deploy schema, then code.
5. Destructive migrations require explicit approval and a verified backup.
6. **No manual schema edits in any environment.**

## 5. Backups & recovery

`LOCKED` requirement, `OPEN` parameters:

| Item | Status |
|---|---|
| Automated production backups | Required |
| Backup frequency, retention | `OPEN` |
| **Restore tested on a schedule** | Required — an untested backup is not a backup |
| RPO / RTO targets | `OPEN` (`OQ-P04`) |
| Backups encrypted at rest, access-controlled | `LOCKED` (D28) |

## 6. Deployment

`SELECTED`:

- CI runs the full test suite; **a failing suite blocks deploy** (D39)
- Type check and lint gates enforced
- Reproducible builds from a single lockfile (`IG-62`)
- **Rollback path exists and is exercised**
- Health check endpoint per service

`LOCKED (D43)` — **GitHub Actions** is the CI provider. Required checks: `tsc` · ESLint · Next.js production build · Vitest · Playwright. A failing run blocks merge.

`OPEN` — deploy mechanism, blue/green vs rolling.

## 7. Monitoring & logging

`LOCKED (D30 observability)`:

| Concern | Requirement |
|---|---|
| Structured logging | Required. **No PII, no auth state, no secrets** (`IG-17`) |
| Error monitoring | Required — `console.error` is not monitoring (`IG-10`) |
| Uptime / health checks | Required |
| Alerting | Required for error-rate, latency and availability |
| Log retention | `OPEN` — subject to D28 |

`OPEN` — vendors (`OQ-A04`).

## 8. Incident response

`SELECTED` — process required, detail `OPEN`:

1. Detect (alerting) → 2. Triage severity → 3. Mitigate — **kill switches and feature flags** (D32) → 4. Communicate → 5. Resolve → 6. **Blameless post-mortem** → 7. Record follow-ups

`LOCKED (D28)` — a suspected data breach follows the privacy breach procedure. **That procedure requires legal review and does not yet exist** (`OQ-PR09`).

## 9. Disaster recovery

`OPEN` — targets undecided. Required to exist before production launch: documented restore procedure · tested restore · dependency failure playbooks · a decision on multi-region.

## 10. Phase 1 requirements

| # | Requirement |
|---|---|
| 1 | PostgreSQL provisioned for dev and staging |
| 2 | Migrations tracked in git and applied through the pipeline |
| 3 | Secrets from environment; app fails closed without them |
| 4 | Sandbox coupling removed (`IG-53`) |
| 5 | Single package manager and lockfile (`IG-62`) |
| 6 | CI running the full suite, blocking on failure |
| 7 | Error monitoring capturing server errors |
| 8 | Health check endpoint |
| 9 | Backups configured and one restore tested |
| 10 | No dev endpoint reachable outside development |

## 11. Open items

| Item | Tracked as |
|---|---|
| Hosting provider and topology | `OQ-B04`, `OQ-A14` |
| ~~CI provider~~ | ✅ **RESOLVED by D43** — GitHub Actions |
| Secret management | `OQ-A07` |
| Error monitoring vendor | `OQ-A04` |
| Backup frequency, retention, RPO/RTO | `OQ-OPS-01` |
| Breach notification procedure | `OQ-PR09` — **legal review** |
| Multi-region | `OQ-OPS-02` |

---

*Canonical operations requirements. Hosting and tooling remain open.*
