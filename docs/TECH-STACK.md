# Anera V2 — Technology Stack

| Field | Value |
|---|---|
| **Purpose** | The canonical technology stack for Anera V2, with each item's commitment level. |
| **Status** | **LOCKED** for the core; `OPEN` for peripheral services |
| **Owner** | Product owner |
| **Authority** | **Canonical.** Derived from [`DECISIONS.md`](DECISIONS.md) Decision 36. D30's architectural *principles* remain in force and are unchanged. |
| **Dependencies** | D36 (stack) · D37 (authentication) · D30 (architecture governance) |
| **Related documents** | [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) · [`AUTHENTICATION.md`](AUTHENTICATION.md) · [`ARCHITECTURE-GOVERNANCE.md`](ARCHITECTURE-GOVERNANCE.md) · [`DEPLOYMENT-OPERATIONS.md`](DEPLOYMENT-OPERATIONS.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decision 36, which closed `OQ-A01`/`OQ-B05` in part. Supersedes D30's "no technology approved" position for the locked items only. |

---

## 1. Commitment levels

| Status | Meaning |
|---|---|
| `LOCKED` | Fixed by Decision 36. Changing it requires a new decision. |
| `SELECTED` | Chosen and expected to hold; not yet locked. |
| `RECOMMENDED` | Engineering suggestion. **No authority.** |
| `OPTION` | Candidate under consideration. |
| `OPEN` | Undecided. **Must not be assumed.** |
| `DEPRECATED` | Present in the MVP; being removed. |

**Governing principle (D36):** minimal architecture. Do not add a technology that the current phase does not require.

---

## 2. Core stack — LOCKED

| Layer | Technology | Status | Notes |
|---|---|---|---|
| **Framework** | Next.js **16.x**, App Router | `LOCKED` | Matches installed `^16.1.1` |
| **Language** | TypeScript | `LOCKED` | `strict: true` required; `ignoreBuildErrors` removed (`IG-21`) |
| **Rendering** | React Server Components **by default** | `LOCKED` | Client components are the justified exception |
| **Styling** | Tailwind CSS | `LOCKED` | v4 as installed |
| **Component library** | shadcn/ui | `LOCKED` | D31: foundational UI |
| **Accent UI** | Magic UI | `SELECTED` | D31: **selective use only**, premium/high-impact interactions. Not currently installed |
| **ORM** | Prisma | `LOCKED` | |
| **Database** | **PostgreSQL** | `LOCKED` | Replaces SQLite |
| **Session transport** | HTTP-only cookies | `LOCKED` | See `AUTHENTICATION.md` |
| **Password hashing** | bcrypt | `LOCKED` | |
| **Client state** | Zustand — **minimal** | `LOCKED` | UI state only; **never** auth or authorization truth |

### 2.1 Why the version note matters

The V2 brief specified **Next.js 15**; the repository has **`^16.1.1`**. The product owner confirmed on 2026-09-02 that **16.x is the target** and "15" was an error. **No downgrade is required.** Recorded so it is not re-raised.

---

## 3. Peripheral services — mostly OPEN

**No vendor is approved for any row below.** Selecting one requires a decision.

| Concern | Status | Notes |
|---|---|---|
| **Media storage / CDN** | `OPEN` | Local-disk uploads (`IG-18`) are `DEPRECATED`. Object storage + signed URLs is `RECOMMENDED`; no provider chosen |
| **Realtime transport** | `OPEN` | See [`REALTIME-ARCHITECTURE.md`](REALTIME-ARCHITECTURE.md). Phase 3 |
| **Background jobs / queue** | `OPEN` | Required by D30. Phase 2+ |
| **Cache** | `OPEN` | Not required for Phase 1 |
| **AI provider / models** | `OPEN` | **No provider approved** (`OQ-AI01`). All access via the AI Gateway (D30) |
| **Payments** | `OPEN` | **No provider approved** (`OQ-M06`). Phase 6 |
| **Email** | `OPEN` | Needed for verification and password reset. Phase 1–4 |
| **SMS** | `OPEN` | Phase 4 verification |
| **Push notifications** | `OPEN` | `DeviceToken` exists but nothing sends (`IG-75`). Phase 3 |
| **Observability / error monitoring** | `OPEN` | Required by D30. `console.error` only today (`IG-10`) |
| **Analytics platform** | `OPEN` | `OQ-A06`. Phase 2+ |
| **Feature flags** | `OPEN` | Required by D29/D30 |
| **Hosting / deployment** | `OPEN` | `OQ-B04`. See `DEPLOYMENT-OPERATIONS.md` |
| **Secret management** | `OPEN` | `OQ-A07` |
| **Test runner** | **`LOCKED`: Vitest** | D43 |
| **E2E framework** | **`LOCKED`: Playwright** | D43 — promoted from `RECOMMENDED` |
| **CI provider** | **`LOCKED`: GitHub Actions** | D43 |
| **Type check / lint / build verification** | **`LOCKED`: `tsc` · ESLint · Next.js production build** | D43 |
| **Package manager** | **`LOCKED`: npm + `package-lock.json`** | D44 — `bun.lock` removed; CI uses `npm ci` |

---

## 4. Prohibited and deprecated

| Technology | Status | Reason |
|---|---|---|
| **NextAuth / Auth.js** | **PROHIBITED** | D36/D37. `next-auth` is declared but unused (`IG-02`) — remove in Phase 1 |
| **SQLite** | `DEPRECATED` | Replaced by PostgreSQL. Cannot support multi-instance deployment (`IG-58`) |
| **HMAC session tokens** | `DEPRECATED` | D37 |
| **localStorage auth tokens** | **PROHIBITED** | D37 |
| **Bearer-token auth transport** | **PROHIBITED** | D37 |
| **Firebase / Firestore** | **PROHIBITED by default** | Named in the V2 brief's legacy list. **Verified absent from this repository** — prohibited pre-emptively, not removed |
| **In-memory database fallbacks** | **PROHIBITED** | D40 |
| `z-ai-web-dev-sdk` | `DEPRECATED` | Sandbox artefact, never imported (`IG-15`). Not an approved AI provider |
| `@tanstack/react-query` | `DEPRECATED` | Declared, never imported. Server Components reduce the need |
| `next-intl` | `OPEN` | Declared, never imported. i18n approach undecided (`IG-25`) |
| Caddy `XTransformPort` routing | `DEPRECATED` | Sandbox coupling (`IG-53`) |

---

## 5. Declared-but-unused dependencies

Verified against `package.json`. These are **not** stack decisions; several should be removed in Phase 1 cleanup.

`next-auth` · `@tanstack/react-query` · `next-intl` · `z-ai-web-dev-sdk` · `uuid` · `sharp` · `date-fns` · `react-markdown` · `react-syntax-highlighter` · `@mdxeditor/editor`

Used in exactly one file each: `next-themes` (`ui/sonner.tsx`), `recharts` (`ui/chart.tsx`), `zod` (`profile-edit-form.tsx` — **client-side only; not used for API validation**).

> `RECOMMENDED`: adopt `zod` for server-side request validation in Phase 1. It is already a dependency, and API validation is currently hand-written per route. Not yet approved — see `API-SPECIFICATION.md`.

---

## 6. Rules

1. **Do not add a technology** not required by the current phase.
2. **Do not select an `OPEN` vendor** without a decision recorded in `DECISIONS.md`.
3. **Do not treat the as-built MVP stack as approved** — only the `LOCKED` rows above are approved.
4. **Server Components by default.** Justify every `'use client'`.
5. **Zustand never holds authentication or authorization state.**
6. Prefer removing a dependency over adding one.

---

*Canonical technology stack. Derived from `DECISIONS.md` Decision 36.*
