# Notification Service Implementation - Task Record

## Task ID: notification-service
## Agent: main
## Date: 2026-05-08

## Summary
Created and deployed a socket.io-based real-time notification service for the Anera dating app as a mini-service running on port 3003.

## Files Created

### `/home/z/my-project/mini-services/notification-service/package.json`
- Package name: `anera-notification-service`
- Dev script: `bun --hot index.ts` (hot reload support)
- Dependencies: `socket.io@^4.8.1`, `cors@^2.8.5`

### `/home/z/my-project/mini-services/notification-service/index.ts`
Full-featured socket.io server with:

**Token Authentication:**
- Uses the same HMAC-SHA256 approach as the main app (`src/lib/auth.ts`)
- Token format: `base64url(userId):hex(hmac-sha256-signature)`
- SESSION_SECRET: `anera-dev-secret-change-in-production`
- Timing-safe comparison to prevent timing attacks
- Token extracted from both `auth.token` and `query.token` in socket handshake

**Socket.io Features:**
- Path: `/socket.io` (avoids conflict with custom HTTP routes)
- CORS: origin `true` (allow all for dev)
- Authentication middleware validates token before allowing connection
- Users join room `user:{userId}` for targeted notifications
- Events handled:
  - `notification:read` - marks single notification as read, broadcasts to user's room
  - `notification:read_all` - marks all notifications as read, broadcasts to user's room
- Emits `notification:new` event to user's room via `emitNotification()` helper

**HTTP Endpoints:**
- `POST /emit` - Accepts `{ userId, notification }` JSON body for the Next.js API to call
- `GET /health` - Returns service status, version, connection count, timestamp
- URL parsing uses `new URL()` to properly handle query parameters (like `XTransformPort`)

**Graceful Shutdown:**
- Handles SIGTERM and SIGINT signals
- Disconnects all sockets before closing server

## Key Technical Decisions

1. **Socket.io path `/socket.io` instead of `/`**: The original example used `path: '/'` which causes socket.io to intercept ALL HTTP requests. Using `/socket.io` allows custom HTTP routes (`/emit`, `/health`) to coexist without conflicts.

2. **URL parsing with `new URL()`**: Caddy gateway adds `XTransformPort=3003` as a query parameter, so `req.url` becomes `/health?XTransformPort=3003`. Using URL parsing ensures route matching works correctly through the gateway.

3. **HTTP handler attached before socket.io**: The custom request handler is added via `httpServer.on('request', handler)` BEFORE creating the socket.io Server, ensuring it fires first for custom routes.

## Frontend Connection Pattern
```typescript
import { io } from 'socket.io-client';
import { getStoredToken } from '@/lib/api-client';

const socket = io("/", {
  path: "/socket.io",
  query: { XTransformPort: "3003" },
  auth: { token: getStoredToken() },
  transports: ['websocket', 'polling'],
});
```

## Next.js API Usage Pattern
```typescript
// From any Next.js API route:
await fetch('/api/emit?XTransformPort=3003', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'target-user-id',
    notification: {
      id: 'notif-123',
      type: 'match',
      title: 'New Match!',
      message: 'You have a new match',
      data: { matchedUserId: 'user-456' },
    },
  }),
});
```

## Process Management Note
In the sandbox environment, background processes need to be started using the orphan process pattern:
```bash
(cd /home/z/my-project/mini-services/notification-service && nohup bun run dev >> /tmp/notification-service.log 2>&1 &)
```
This ensures the process gets adopted by PID 1 (tini) and survives shell session cleanup.

## Service Status
- **Running**: Yes (PID on port 3003)
- **Health endpoint**: Working (both direct and via Caddy gateway)
- **Emit endpoint**: Working (both direct and via Caddy gateway)
- **Dependencies installed**: Yes (`bun install` completed)
