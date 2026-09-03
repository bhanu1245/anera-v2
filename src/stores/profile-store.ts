import { create } from 'zustand';
import { apiFetch } from '@/lib/api-client';
import type { Profile, ProfileFormData } from '@/types/profile';

/**
 * Anera V2 — profile UI state.
 *
 * Authority: docs/DECISIONS.md D36 (Zustand is UI state only),
 *            docs/API-SPECIFICATION.md §4.
 *
 * Rewritten in M6. Two things changed, and the first is a security fix:
 *
 * 1. `fetchProfile` used to call `GET /api/profile?userId=<id>` — the
 *    unauthenticated, enumerable endpoint recorded as `IG-05`, which returned
 *    any user's full profile to anyone who could guess an id. It now calls
 *    `GET /api/profile`, which takes no parameters and answers only for the
 *    session holder. The caller cannot ask about anyone else because there is
 *    nothing to ask with.
 *
 * 2. The photo actions are gone with the photo routes (`IG-18` containment).
 *
 * This store holds server data for rendering. It is not an authority: every
 * read and write is re-authorised server-side against the session cookie.
 */

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  setProfile: (profile: Profile | null) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;

  /** Applies an edit locally so the form feels immediate; revert on failure. */
  optimisticUpdateProfile: (data: Partial<ProfileFormData>) => void;
  revertProfile: () => void;

  /** Loads the signed-in user's own profile. Takes no id, by design. */
  fetchProfile: () => Promise<void>;
}

let profileBackup: Profile | null = null;

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,

  setProfile: (profile) => {
    profileBackup = null;
    set({ profile, error: null });
  },

  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),

  optimisticUpdateProfile: (data) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current };
    set({ profile: { ...current, ...data } });
  },

  revertProfile: () => {
    if (profileBackup) {
      set({ profile: profileBackup });
      profileBackup = null;
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/api/profile');

      if (res.status === 401) {
        // The server no longer recognises this session. The route guards
        // handle where the user goes; there is nothing to show here.
        set({ profile: null, isLoading: false });
        return;
      }

      if (res.status === 404) {
        // Signed in but no profile yet — onboarding, not an error.
        set({ profile: null, isLoading: false });
        return;
      }

      if (!res.ok) {
        let message = 'Failed to load your profile';
        try {
          const body = await res.json();
          if (body?.error?.message) message = body.error.message;
        } catch {
          // Non-JSON response — keep the generic message.
        }
        set({ error: message, isLoading: false });
        return;
      }

      const body = await res.json();
      set({ profile: body.data.profile as Profile, isLoading: false, error: null });
      profileBackup = null;
    } catch {
      set({ error: 'Unable to reach the server. Please try again.', isLoading: false });
    }
  },
}));
