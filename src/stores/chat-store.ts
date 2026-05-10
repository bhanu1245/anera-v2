import { create } from 'zustand';
import { apiFetch } from '@/lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string;
    photoUrl: string | null;
  } | null;
}

interface ChatState {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  currentMatchId: string | null;

  // Actions
  fetchMessages: (matchId: string, cursor?: string) => Promise<void>;
  sendMessage: (matchId: string, content: string) => Promise<ChatMessage | null>;
  markAsRead: (matchId: string) => Promise<void>;
  clearMessages: () => void;
  prependOlderMessages: (matchId: string, cursor: string) => Promise<void>;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  hasMore: false,
  nextCursor: null,
  currentMatchId: null,

  fetchMessages: async (matchId: string, cursor?: string) => {
    set({ isLoading: true, error: null, currentMatchId: matchId });

    try {
      const params = new URLSearchParams({ matchId });
      if (cursor) params.set('cursor', cursor);

      const res = await apiFetch(`/api/messages?${params.toString()}`, { requireAuth: true });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch messages');
      }

      const data = await res.json();

      set({
        messages: data.messages || [],
        hasMore: data.hasMore || false,
        nextCursor: data.nextCursor || null,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch messages',
        isLoading: false,
      });
    }
  },

  prependOlderMessages: async (matchId: string, cursor: string) => {
    try {
      const params = new URLSearchParams({ matchId, cursor });
      const res = await apiFetch(`/api/messages?${params.toString()}`, { requireAuth: true });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch messages');
      }

      const data = await res.json();
      const olderMessages = data.messages || [];

      set((state) => ({
        messages: [...olderMessages, ...state.messages],
        hasMore: data.hasMore || false,
        nextCursor: data.nextCursor || null,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load older messages',
      });
    }
  },

  sendMessage: async (matchId: string, content: string) => {
    set({ isSending: true, error: null });

    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content }),
        requireAuth: true,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();
      const sentMessage = data.message as ChatMessage;

      // Add to local messages
      set((state) => ({
        messages: [...state.messages, sentMessage],
        isSending: false,
      }));

      return sentMessage;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isSending: false,
      });
      return null;
    }
  },

  markAsRead: async (matchId: string) => {
    try {
      // Fetching messages automatically marks them as read on the server
      // This is an explicit call if needed
      const params = new URLSearchParams({ matchId, limit: '0' });
      await apiFetch(`/api/messages?${params.toString()}`);
    } catch {
      // Silent fail - not critical
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      hasMore: false,
      nextCursor: null,
      error: null,
      currentMatchId: null,
    });
  },
}));
