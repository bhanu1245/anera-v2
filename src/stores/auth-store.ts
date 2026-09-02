import { create } from 'zustand';
import {
  apiFetch,
  setStoredToken,
  clearStoredToken,
  onUnauthorized,
  markAuthReady,
  clearAuthReady,
} from '@/lib/api-client';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  error: string | null;

  /** Whether the initial session check has completed (hydration guard) */
  hasHydrated: boolean;

  /** Whether a session check is in progress right now */
  isCheckingSession: boolean;

  // Actions
  setAuth: (userId: string | null, needsOnboarding?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => Promise<void>;
  checkSession: () => Promise<string | null>;
  /** Full reset of auth state — used during logout to ensure clean slate */
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  isAuthenticated: false,
  isLoading: true, // Start true so UI shows loading until first checkSession completes
  needsOnboarding: false,
  error: null,
  hasHydrated: false,  // Not hydrated until checkSession finishes
  isCheckingSession: false,

  setAuth: (userId, needsOnboarding = false) => {
    set({
      userId,
      isAuthenticated: !!userId,
      isLoading: false,
      needsOnboarding,
      error: null,
      hasHydrated: true,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  resetAuth: () => {
    set({
      userId: null,
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: false,
      error: null,
      hasHydrated: false,
      isCheckingSession: false,
    });
    clearAuthReady();
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[AUTH] Login attempt:', email);

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

      // Store token FIRST — this is critical for subsequent API calls
      if (data.token) {
        setStoredToken(data.token);
      }

      // Verify session is actually established by calling checkSession
      console.log('[AUTH] Login response received, verifying session...');
      const verifiedUserId = await get().checkSession();

      if (verifiedUserId) {
        console.log('[AUTH] Session verified after login, userId:', verifiedUserId);
        // Mark auth as ready so protected API calls can proceed
        markAuthReady();
        // Return the userId — page.tsx will use this to redirect
        return verifiedUserId;
      } else {
        // Session verification failed — but login succeeded, use login data
        console.warn('[AUTH] Session verification failed after login, using login data');
        set({
          userId: data.userId,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: data.needsOnboarding || false,
          error: null,
          hasHydrated: true,
        });
        markAuthReady();
        return data.userId;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      console.error('[AUTH] Login failed:', msg);
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
      console.log('[AUTH] Register attempt:', email);

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

      // Store token FIRST
      if (data.token) {
        setStoredToken(data.token);
      }

      // Verify session
      console.log('[AUTH] Register response received, verifying session...');
      const verifiedUserId = await get().checkSession();

      if (verifiedUserId) {
        console.log('[AUTH] Session verified after register, userId:', verifiedUserId);
        markAuthReady();
        return verifiedUserId;
      } else {
        console.warn('[AUTH] Session verification failed after register, using register data');
        set({
          userId: data.userId,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: data.needsOnboarding || true,
          error: null,
          hasHydrated: true,
        });
        markAuthReady();
        return data.userId;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      console.error('[AUTH] Register failed:', msg);
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
    console.log('[AUTH] Logging out...');
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        skipAuthRefresh: true,
      });
    } catch {
      // Ignore logout errors
    }
    clearStoredToken();
    clearAuthReady();
    set({
      userId: null,
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: false,
      error: null,
      hasHydrated: false,
      isCheckingSession: false,
    });
    console.log('[AUTH] Logout complete — auth state cleared');
  },

  checkSession: async () => {
    // Prevent concurrent session checks
    if (get().isCheckingSession) {
      console.log('[AUTH] Session check already in progress, skipping');
      return null;
    }

    set({ isLoading: true, isCheckingSession: true });
    try {
      const res = await apiFetch('/api/auth/session', {
        skipAuthRefresh: true,
      });
      if (!res.ok) {
        console.log('[AUTH] Session check failed — not authenticated');
        set({
          isAuthenticated: false,
          userId: null,
          isLoading: false,
          hasHydrated: true,
          isCheckingSession: false,
        });
        return null;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.log('[AUTH] Session check — non-JSON response');
        set({
          isAuthenticated: false,
          userId: null,
          isLoading: false,
          hasHydrated: true,
          isCheckingSession: false,
        });
        return null;
      }
      const data = await res.json();
      if (data.authenticated && data.userId) {
        console.log('[AUTH] Session restored — userId:', data.userId);
        set({
          userId: data.userId,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: data.needsOnboarding || false,
          hasHydrated: true,
          isCheckingSession: false,
        });

        // Refresh the stored token so subsequent API calls have it
        if (data.token) {
          setStoredToken(data.token);
        }

        // Mark auth as ready for protected API calls
        markAuthReady();

        return data.userId;
      } else {
        console.log('[AUTH] Session check — not authenticated');
        set({
          userId: null,
          isAuthenticated: false,
          isLoading: false,
          hasHydrated: true,
          isCheckingSession: false,
        });
        return null;
      }
    } catch (err) {
      console.error('[AUTH] Session check error:', err);
      set({
        userId: null,
        isAuthenticated: false,
        isLoading: false,
        hasHydrated: true,
        isCheckingSession: false,
      });
      return null;
    }
  },
}));

// Register the global 401 handler
onUnauthorized(() => {
  console.log('[AUTH] 401 received — clearing auth state');
  useAuthStore.getState().setAuth(null);
  clearAuthReady();
});
