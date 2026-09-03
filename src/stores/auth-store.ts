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
 * Narrowed in M5. It used to feed the single-page shell's rendering decisions
 * — which screen to show, and a spinner while it asked the server who you
 * were. Real routing moved all of that to the server: `getCurrentSession()`
 * resolves the session before render and the route groups redirect (see
 * `src/app/(auth)/layout.tsx` and `src/app/(app)/layout.tsx`). Nothing decides
 * what to render from this store any more.
 *
 * What is left is form state — whether a submit is in flight and what the
 * server said went wrong — plus the identity the server last reported, which
 * onboarding still reads. Mutating any of it authenticates nobody: every
 * protected endpoint re-validates the cookie server-side.
 *
 * Removed in M5 because nothing read them once the server did the routing:
 * `isChecking` (spinner flag) and `needsOnboarding` (screen selector).
 *
 * Deliberately absent (D37 §2): no token storage, no `hasHydrated` gate,
 * no `authReady`, no `waitForAuth`, no retry loop.
 */

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  /** Identity the server last reported. Never an authorization input. */
  user: AuthUser | null;
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
  };
}

interface CredentialPayload {
  data: { user: AuthUser };
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSubmitting: false,
  error: null,

  clearError: () => set({ error: null }),

  /**
   * Asks the server who we are. The server's answer is the only answer.
   *
   * No longer called on mount: the server resolves the session before render.
   * It remains available for a client that needs the identity after a hard
   * load — see the note in the M5 report about onboarding.
   */
  checkSession: async () => {
    try {
      const res = await apiFetch('/api/auth/session', { skipAuthRefresh: true });
      if (!res.ok) {
        set({ user: null });
        return;
      }
      const body = (await res.json()) as SessionPayload;
      set({ user: body.data.authenticated ? (body.data.user ?? null) : null });
    } catch {
      set({ user: null });
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
      set({ user: body.data.user, isSubmitting: false });
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
      set({ user: body.data.user, isSubmitting: false });
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
    set({ user: null, error: null });
  },
}));

// A 401 anywhere means the server no longer recognises us — reflect that.
onUnauthorized(() => {
  useAuthStore.setState({ user: null });
});
