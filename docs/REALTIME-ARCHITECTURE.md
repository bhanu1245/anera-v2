# Anera V2 — Realtime Architecture

| Field | Value |
|---|---|
| **Purpose** | The future realtime architecture for chat, presence, notifications and live features. |
| **Status** | **FUTURE — Phase 3.** Transport is `OPEN`. **Do not implement now.** |
| **Owner** | Product owner |
| **Authority** | **Canonical for realtime design intent.** Derived from D30 (realtime + notification architecture) and D33 (communication). |
| **Dependencies** | D30 · D33 · D37 (connection auth) · D34 (safety) · D36 (stack) |
| **Related documents** | [`SYSTEM-ARCHITECTURE.md`](SYSTEM-ARCHITECTURE.md) · [`COMMUNICATION.md`](COMMUNICATION.md) · [`AUTHENTICATION.md`](AUTHENTICATION.md) · [`EVENTS.md`](EVENTS.md) |
| **Last updated** | 2026-09-02 |
| **Change history** | 2026-09-02 — created from Decisions 30/33. |

---

## 1. Scope and timing

`LOCKED (D39)` — realtime is **Phase 3**. It requires Phase 1 (auth) and Phase 2 (matches) first.

**Nothing in this document is implemented now.**

## 2. Capabilities

| Capability | Phase | Status |
|---|---|---|
| Chat message delivery | 3 | `APPROVED (D33)` |
| Typing indicators | 3 | `OPEN` (`OQ-C07`) |
| Presence / online status | 3 | `OPEN` (`OQ-C07`) |
| Read receipts | 3 | `APPROVED (D33)` |
| Realtime notifications | 3 | `APPROVED (D33)` |
| Live events / audio lounges | 9 | `APPROVED (D42)` |
| Voice / video calls | 9+ | `APPROVED (D33)`, provider `OPEN` |

## 3. Transport

**`OPEN` (`OQ-A02`).** No transport is approved.

| Option | Notes |
|---|---|
| WebSocket / Socket.IO | Full duplex; the MVP already uses Socket.IO for notifications |
| Server-Sent Events | Simpler, one-directional; sufficient for notifications alone |
| Polling | Current MVP chat behaviour (5s). **Explicitly a stopgap, not the target** |

> **The MVP has an authenticated Socket.IO service that carries notifications but not chat** (`IG-31`), while chat polls every 5 seconds. Whether that service is reused, replaced or consolidated is part of `OQ-A02`.

## 4. Connection authentication

`LOCKED (D37)` — the realtime layer inherits the auth architecture:

1. **The HTTP-only cookie authenticates the connection handshake.**
2. **No token is passed in a query string, and none is held in client storage.** The MVP passes an HMAC token via `auth.token`/`query.token` — `DEPRECATED`.
3. The server resolves the session and derives `userId`. The client never asserts identity.
4. Session expiry or revocation **terminates the connection**.

## 5. Authorization

`LOCKED`:

- Subscriptions are per-user, server-assigned. A client may not subscribe to arbitrary channels.
- Message delivery requires **match participation**.
- **Blocked users receive nothing from each other** (D34 immediate blocking).
- Every realtime authorization decision is server-side.

## 6. Reliability

`SELECTED` — design requirements, mechanics `OPEN`:

| Concern | Requirement |
|---|---|
| Reconnect | Automatic, with backoff |
| Missed messages | Fetched from the database on reconnect — **the database is the source of truth, not the socket** |
| Delivery | At-least-once; client de-duplicates by message id |
| Ordering | Server timestamp authoritative |
| Fallback | Degrade to polling; the product stays usable |

> **Principle:** realtime is an *optimisation* over a working request/response product, never a dependency of it. The MVP already follows this for notifications (persist first, push second) and that pattern carries forward.

## 7. Scaling

`OPEN`:

- Multi-instance fan-out requires a pub/sub backplane — Redis is an `OPTION`, not approved
- Connection limits, sticky sessions and horizontal scaling: `OPEN`
- Presence at scale is expensive; whether it is worth it is `OPEN`

## 8. Safety

`LOCKED (D34)`:

- Blocking takes effect **immediately** on live connections, not on next reconnect
- Rate limiting applies to realtime just as to HTTP (D33 risk-based)
- Moderation applies to realtime content

## 9. What must not happen

1. **No auth token in a query string or client storage.**
2. **No trusting client-asserted identity or channel subscriptions.**
3. **No realtime-only data** — everything durable is persisted first.
4. **No implementation before Phase 3.**

## 10. Open items

| Item | Tracked as |
|---|---|
| Transport selection | `OQ-A02` |
| Fate of the existing Socket.IO mini-service | `OQ-A02` |
| Pub/sub backplane | `OQ-A02` |
| Typing indicators / presence in scope | `OQ-C07` |
| Voice/video provider | `OQ-C03` |
| Push provider | `OQ-C10` |

---

*Future architecture. Phase 3. Not implemented.*
