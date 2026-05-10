import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { apiFetch, getStoredToken } from '@/lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  fromUserId: string | null;
  entityId: string | null;
  entityType: string | null;
  imageUrl: string | null;
  createdAt: string;
  readAt: string | null;
  groupedCount?: number;
  groupedIds?: string[];
}

export interface EngagementData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
  profileCompletion: number;
  unreadNotifications: number;
  pendingLikes: number;
  peopleWaiting: number;
  prompts: {
    type: string;
    title: string;
    body: string;
    priority: string;
  }[];
}

// ─── Store Interface ────────────────────────────────────────────────────────

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  engagement: EngagementData | null;
  isLoading: boolean;
  isEngagementLoading: boolean;
  socketConnected: boolean;
  error: string | null;
  /** Timestamp (Date.now()) when the last notification was added — used by UI for pulse animations */
  lastNotificationAt: number | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchEngagement: () => Promise<void>;
  addNotification: (notification: NotificationItem) => void;
  setSocketConnected: (connected: boolean) => void;
  initSocket: () => void;
  disconnectSocket: () => void;
}

// ─── Socket Reference (outside store for cleanup) ───────────────────────────

let socketRef: Socket | null = null;
let pollingIntervalRef: ReturnType<typeof setInterval> | null = null;

// ─── Store ──────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  engagement: null,
  isLoading: false,
  isEngagementLoading: false,
  socketConnected: false,
  error: null,
  lastNotificationAt: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/api/notifications', { requireAuth: true });
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      // Safely parse JSON — server might be down and Caddy returns HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        set({ isLoading: false });
        return;
      }
      const data = await res.json();
      set({
        notifications: data.notifications ?? [],
        unreadCount: data.unreadCount ?? 0,
        isLoading: false,
      });
    } catch (err) {
      // Don't show "Unexpected token" errors from HTML responses
      const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        set({ isLoading: false });
        return;
      }
      set({
        error: msg,
        isLoading: false,
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      const res = await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!res.ok) {
        // Revert on failure
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: false, readAt: null } : n
          ),
          unreadCount: state.unreadCount + 1,
        }));
      }
    } catch {
      // Revert on failure
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: false, readAt: null } : n
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markAllRead: async () => {
    const previousUnreadCount = get().unreadCount;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    try {
      const res = await apiFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) {
        // Revert on failure
        set({ unreadCount: previousUnreadCount });
      }
    } catch {
      // Revert on failure
      set({ unreadCount: previousUnreadCount });
    }
  },

  deleteNotification: async (notificationId: string) => {
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;
    const deleted = previousNotifications.find((n) => n.id === notificationId);

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
      unreadCount: deleted && !deleted.isRead
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));

    try {
      const res = await apiFetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        // Revert on failure
        set({
          notifications: previousNotifications,
          unreadCount: previousUnreadCount,
        });
      }
    } catch {
      // Revert on failure
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
    }
  },

  fetchEngagement: async () => {
    set({ isEngagementLoading: true, error: null });
    try {
      const res = await apiFetch('/api/engagement', { requireAuth: true });
      if (!res.ok) {
        throw new Error('Failed to fetch engagement data');
      }
      // Safely parse JSON — server might be down and Caddy returns HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        set({ isEngagementLoading: false });
        return;
      }
      const data = await res.json();
      set({
        engagement: data as EngagementData,
        isEngagementLoading: false,
      });
    } catch (err) {
      // Don't show "Unexpected token" errors from HTML responses
      const msg = err instanceof Error ? err.message : 'Failed to fetch engagement data';
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        set({ isEngagementLoading: false });
        return;
      }
      set({
        error: msg,
        isEngagementLoading: false,
      });
    }
  },

  addNotification: (notification: NotificationItem) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      lastNotificationAt: Date.now(),
    }));
  },

  setSocketConnected: (connected: boolean) => {
    set({ socketConnected: connected });
  },

  initSocket: () => {
    const token = getStoredToken();
    if (!token) return;

    // Don't create a new socket if one already exists and is connected
    if (socketRef?.connected) return;

    // Clean up any existing socket first
    if (socketRef) {
      socketRef.disconnect();
      socketRef = null;
    }

    // Clear any existing polling before starting socket
    if (pollingIntervalRef) {
      clearInterval(pollingIntervalRef);
      pollingIntervalRef = null;
    }

    const socket = io('/', {
      path: '/socket.io',
      query: { XTransformPort: '3003' },
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      set({ socketConnected: true });
      // Clear polling fallback when socket connects — socket is the primary channel
      if (pollingIntervalRef) {
        clearInterval(pollingIntervalRef);
        pollingIntervalRef = null;
      }
    });

    socket.on('disconnect', () => {
      set({ socketConnected: false });
      // Start polling fallback when socket disconnects
      startPollingFallback();
    });

    socket.on('notification:new', (notification: NotificationItem) => {
      get().addNotification(notification);
    });

    socket.on('notification:read', (data: { notificationId: string }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === data.notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    });

    socket.on('notification:read_all', () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    });

    socketRef = socket;

    // Start polling fallback ONLY if socket isn't connected after a brief delay
    // This avoids double-polling during the initial connection
    setTimeout(() => {
      if (!socket.connected) {
        startPollingFallback();
      }
    }, 3000);
  },

  disconnectSocket: () => {
    if (socketRef) {
      socketRef.disconnect();
      socketRef = null;
    }
    if (pollingIntervalRef) {
      clearInterval(pollingIntervalRef);
      pollingIntervalRef = null;
    }
    set({ socketConnected: false });
  },
}));

// ─── Polling Fallback ───────────────────────────────────────────────────────

function startPollingFallback() {
  // Don't start a new interval if one already exists
  if (pollingIntervalRef) return;

  pollingIntervalRef = setInterval(() => {
    const state = useNotificationStore.getState();
    // Only poll if socket is NOT connected
    if (!state.socketConnected) {
      state.fetchNotifications();
    }
  }, 30000); // Poll every 30 seconds
}
