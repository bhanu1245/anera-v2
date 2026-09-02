import { create } from 'zustand';
import { apiFetch, onUnauthorized } from '@/lib/api-client';

/**
 * Anera V2 — authentication UI state.
 *
 * Authority: docs/DECISIONS.md D37, D36 (Zustand is UI state only),
 *            docs/AUTHENTICATION.md §2.
 *
 * THIS STORE IS NOT AN AUTHENTICATION AUTHORITY.
 *
 * It caches, for rendering only, what the server most recently reported.
 * Every protected operation is decided server-side against the session
 * cookie; nothing here can grant access. Mutating this store cannot
 * authenticate anyone.
 *
 * Deliberately absent (D37 §2): no token storage, no `hasHydrated` gate,
 * no `authReady`, no `waitForAuth`, no retry loop. `isChecking` below is a
 * spinner flag — it gates a loading indicator, never a security decision.
 */

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  /** Last state reported by the server. `null` = not yet asked. */
  user: AuthUser | null;
  needsOnboarding: boolean;
  /** UI-only: a session check is in flight. Never an authorization input. */
  isChecking: boolean;
  /** UI-only: a login/register request is in flight. */
  isSubmitting: boolean;
  error: string | null;

  clearError: () => void;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

interface SessionPayload {
  data: {
    authenticated: boolean;
    user?: AuthUser;
    needsOnboarding?: boolean;
  };
}

interface CredentialPayload {
  data: { user: AuthUser; needsOnboarding: boolean };
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  needsOnboarding: false,
  isChecking: true,
  isSubmitting: false,
  error: null,

  clearError: () => set({ error: null }),

  /** Asks the server who we are. The server's answer is the only answer. */
  checkSession: async () => {
    set({ isChecking: true });
    try {
      const res = await apiFetch('/api/auth/session', { skipAuthRefresh: true });
      if (!res.ok) {
        set({ user: null, needsOnboarding: false, isChecking: false });
        return;
      }
      const body = (await res.json()) as SessionPayload;
      set({
        user: body.data.authenticated ? (body.data.user ?? null) : null,
        needsOnboarding: body.data.needsOnboarding ?? false,
        isChecking: false,
      });
    } catch {
      set({ user: null, needsOnboarding: false, isChecking: false });
    }
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuthRefresh: true,
      });

      if (!res.ok) {
        set({ error: await readError(res, 'Sign in failed.'), isSubmitting: false });
        return false;
      }

      // The response carries no session material — the cookie is already set.
      const body = (await res.json()) as CredentialPayload;
      set({
        user: body.data.user,
        needsOnboarding: body.data.needsOnboarding,
        isSubmitting: false,
        isChecking: false,
      });
      return true;
    } catch {
      set({ error: 'Unable to reach the server. Please try again.', isSubmitting: false });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuthRefresh: true,
      });

      if (!res.ok) {
        set({ error: await readError(res, 'Registration failed.'), isSubmitting: false });
        return false;
      }

      const body = (await res.json()) as CredentialPayload;
      set({
        user: body.data.user,
        needsOnboarding: body.data.needsOnboarding,
        isSubmitting: false,
        isChecking: false,
      });
      return true;
    } catch {
      set({ error: 'Unable to reach the server. Please try again.', isSubmitting: false });
      return false;
    }
  },

  logout: async () => {
    // The server revokes the session row; clearing local state is cosmetic.
    await apiFetch('/api/auth/logout', { method: 'POST', skipAuthRefresh: true }).catch(() => {
      // Even on failure the local view resets; the server session is
      // authoritative and any surviving session is caught on next request.
    });
    set({ user: null, needsOnboarding: false, error: null, isChecking: false });
  },
}));

// A 401 anywhere means the server no longer recognises us — reflect that.
onUnauthorized(() => {
  useAuthStore.setState({ user: null, needsOnboarding: false, isChecking: false });
});
