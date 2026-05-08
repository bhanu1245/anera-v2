import { create } from 'zustand';
import {
  apiFetch,
  setStoredToken,
  clearStoredToken,
  onUnauthorized,
} from '@/lib/api-client';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  error: string | null;

  // Actions
  setAuth: (userId: string | null, needsOnboarding?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  loginDemo: () => Promise<string | null>;
  logout: () => Promise<void>;
  checkSession: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  needsOnboarding: false,
  error: null,

  setAuth: (userId, needsOnboarding = false) => {
    set({
      userId,
      isAuthenticated: !!userId,
      isLoading: false,
      needsOnboarding,
      error: null,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuthRefresh: true,
      });

      if (!res.ok) {
        let errorMsg = 'Invalid email or password';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      const data = await res.json();
      set({
        userId: data.userId,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding: data.needsOnboarding || false,
        error: null,
      });

      if (data.token) {
        setStoredToken(data.token);
      }

      return data.userId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        set({
          error: 'Unable to connect to server. Please refresh the page.',
          isLoading: false,
          isAuthenticated: false,
          userId: null,
        });
        return null;
      }
      set({
        error: msg,
        isLoading: false,
        isAuthenticated: false,
        userId: null,
      });
      return null;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        skipAuthRefresh: true,
      });

      if (!res.ok) {
        let errorMsg = 'Registration failed';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      const data = await res.json();
      set({
        userId: data.userId,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding: data.needsOnboarding || true,
        error: null,
      });

      if (data.token) {
        setStoredToken(data.token);
      }

      return data.userId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        set({
          error: 'Unable to connect to server. Please refresh the page.',
          isLoading: false,
          isAuthenticated: false,
          userId: null,
        });
        return null;
      }
      set({
        error: msg,
        isLoading: false,
        isAuthenticated: false,
        userId: null,
      });
      return null;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/api/auth/demo-login', {
        method: 'POST',
        skipAuthRefresh: true,
      });
      if (!res.ok) {
        let errorMsg = 'Login failed';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMsg);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected response. Please try again.');
      }
      const data = await res.json();
      set({
        userId: data.userId,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding: false,
        error: null,
      });

      if (data.token) {
        setStoredToken(data.token);
      }

      return data.userId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        set({
          error: 'Unable to connect to server. Please refresh the page.',
          isLoading: false,
          isAuthenticated: false,
          userId: null,
        });
        return null;
      }
      set({
        error: msg,
        isLoading: false,
        isAuthenticated: false,
        userId: null,
      });
      return null;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        skipAuthRefresh: true,
      });
    } catch {
      // Ignore logout errors
    }
    clearStoredToken();
    set({
      userId: null,
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: false,
      error: null,
    });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/auth/session', {
        skipAuthRefresh: true,
      });
      if (!res.ok) {
        set({ isAuthenticated: false, userId: null, isLoading: false });
        return null;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        set({ isAuthenticated: false, userId: null, isLoading: false });
        return null;
      }
      const data = await res.json();
      if (data.authenticated && data.userId) {
        set({
          userId: data.userId,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: data.needsOnboarding || false,
        });

        if (data.token) {
          setStoredToken(data.token);
        }

        return data.userId;
      } else {
        set({
          userId: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return null;
      }
    } catch {
      set({
        userId: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },
}));

// Register the global 401 handler
onUnauthorized(() => {
  useAuthStore.getState().setAuth(null);
});
