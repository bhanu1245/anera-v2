import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server, Socket } from 'socket.io';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── Configuration ───────────────────────────────────────────────────────────

const PORT = 3003;
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'anera-dev-secret-change-in-production';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
  createdAt: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// ─── Token Validation ────────────────────────────────────────────────────────

/**
 * Validate a session token and extract the userId.
 * Mirrors the exact logic from the main app's `src/lib/auth.ts`.
 * Token format: base64url(userId):hex(hmac-sha256-signature)
 */
function validateSessionToken(token: string): string | null {
  try {
    const [payload, signature] = token.split(':');
    if (!payload || !signature) return null;

    const expectedSignature = createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    return Buffer.from(payload, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Extract token from socket handshake.
 * Checks both `auth.token` and `query.token` for flexibility.
 */
function extractToken(socket: Socket): string | null {
  // 1. Check handshake auth (preferred — client sends via io({ auth: { token } }))
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  // 2. Check query parameter (fallback for simpler clients)
  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
}

// ─── HTTP Request Handler ────────────────────────────────────────────────────

/**
 * Handle custom HTTP routes. This handler is attached to the httpServer
 * BEFORE socket.io so that it takes priority for non-socket.io routes.
 *
 * IMPORTANT: We only respond to our custom routes here. All other requests
 * (including socket.io handshake/upgrade requests) are ignored and fall
 * through to socket.io's built-in handler.
 */
function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse
): void {
  // Skip if headers already sent (e.g., by socket.io or a previous handler)
  if (res.headersSent) return;

  // Parse the URL to extract the pathname (ignoring query parameters like XTransformPort)
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ── POST /emit ──────────────────────────────────────────────────────────
  // The Next.js API routes call this endpoint to push notifications
  // to specific users in real-time.
  //
  // Request body:
  //   { userId: string, notification: { id, type, title, message, data?, createdAt } }
  if (req.method === 'POST' && pathname === '/emit') {
    let body = '';

    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const { userId, notification } = parsed;

        if (!userId || typeof userId !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'userId is required and must be a string' })
          );
          return;
        }

        if (!notification || !notification.id || !notification.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'notification is required and must include id, type',
            })
          );
          return;
        }

        // Ensure createdAt is set
        if (!notification.createdAt) {
          notification.createdAt = new Date().toISOString();
        }

        emitNotification(userId, notification);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, emitted: true }));
      } catch (err) {
        console.error('[NotificationService] Error parsing /emit request:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });

    return; // Don't fall through to socket.io
  }

  // ── GET /health ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'anera-notification-service',
        version: '1.0.0',
        connections: io.sockets.sockets.size,
        timestamp: new Date().toISOString(),
      })
    );
    return; // Don't fall through to socket.io
  }

  // For all other requests, do NOT respond — let socket.io handle them.
  // This includes socket.io handshake requests at /socket.io/?EIO=4&transport=...
}

// ─── HTTP Server & Socket.io Setup ──────────────────────────────────────────

const httpServer = createServer();

// Attach our custom HTTP handler FIRST (before socket.io) so it takes priority.
// Node.js fires request listeners in the order they were added.
httpServer.on('request', handleHttpRequest);

// Now create socket.io — its request handler is added AFTER ours.
// Using the default path '/socket.io' so it only handles socket.io protocol
// requests, not our custom HTTP routes (/emit, /health).
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: true, // Allow all origins in dev
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Socket.io Authentication Middleware ─────────────────────────────────────

io.use((socket: AuthenticatedSocket, next) => {
  const token = extractToken(socket);

  if (!token) {
    return next(new Error('Authentication required: no token provided'));
  }

  const userId = validateSessionToken(token);

  if (!userId) {
    return next(new Error('Authentication failed: invalid or expired token'));
  }

  // Attach userId to socket for use in event handlers
  socket.userId = userId;
  next();
});

// ─── Socket.io Connection Handler ───────────────────────────────────────────

io.on('connection', (socket: AuthenticatedSocket) => {
  const userId = socket.userId!;

  // Join the user's personal room for targeted notifications
  const userRoom = `user:${userId}`;
  socket.join(userRoom);

  console.log(
    `[NotificationService] User connected: ${userId} (socket: ${socket.id}), joined room: ${userRoom}`
  );

  // ── notification:read ────────────────────────────────────────────────────
  // Client emits this when they mark a single notification as read.
  // We broadcast the update to all of the user's connected sockets.
  socket.on('notification:read', (data: { notificationId: string }) => {
    if (!data?.notificationId) {
      socket.emit('error', { message: 'notificationId is required' });
      return;
    }
    console.log(
      `[NotificationService] User ${userId} marked notification ${data.notificationId} as read`
    );
    // Broadcast to all sockets in the user's room (including sender)
    io.to(userRoom).emit('notification:read', {
      notificationId: data.notificationId,
      userId,
      readAt: new Date().toISOString(),
    });
  });

  // ── notification:read_all ────────────────────────────────────────────────
  // Client emits this when they mark all notifications as read.
  socket.on('notification:read_all', () => {
    console.log(
      `[NotificationService] User ${userId} marked all notifications as read`
    );
    io.to(userRoom).emit('notification:read_all', {
      userId,
      readAt: new Date().toISOString(),
    });
  });

  // ── Disconnect ──────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(
      `[NotificationService] User disconnected: ${userId} (socket: ${socket.id}), reason: ${reason}`
    );
  });

  // ── Error ───────────────────────────────────────────────────────────────
  socket.on('error', (error) => {
    console.error(
      `[NotificationService] Socket error for user ${userId} (${socket.id}):`,
      error
    );
  });
});

// ─── Emit Helper (for programmatic use) ─────────────────────────────────────

/**
 * Emit a notification to a specific user's room.
 * Can be called from the HTTP /emit endpoint or any other internal logic.
 */
function emitNotification(userId: string, notification: Notification): void {
  const userRoom = `user:${userId}`;
  io.to(userRoom).emit('notification:new', {
    ...notification,
    read: notification.read ?? false,
  });
  console.log(
    `[NotificationService] Emitted notification to user ${userId}: ${notification.id} (${notification.type})`
  );
}

// ─── Start Server ────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(
    `[NotificationService] 🚀 Anera notification service running on port ${PORT}`
  );
  console.log(
    `[NotificationService] Socket.io path: /socket.io (connect via Caddy with XTransformPort=${PORT})`
  );
  console.log('[NotificationService] HTTP endpoints:');
  console.log(`  POST /emit   — Emit a notification to a user`);
  console.log(`  GET  /health — Health check`);
  console.log(
    `[NotificationService] Frontend connection: io("/?XTransformPort=${PORT}", { path: "/socket.io" })`
  );
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal: string) {
  console.log(`[NotificationService] Received ${signal}, shutting down...`);
  io.disconnectSockets(true);
  httpServer.close(() => {
    console.log('[NotificationService] Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
