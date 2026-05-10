import { create } from 'zustand';
import { apiFetch } from '@/lib/api-client';
import type { Profile, ProfileFormData, ProfilePhoto } from '@/types';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;

  // Optimistic updates
  optimisticUpdateProfile: (data: Partial<ProfileFormData>) => void;
  optimisticAddPhoto: (photo: ProfilePhoto) => void;
  optimisticRemovePhoto: (photoId: string) => void;
  optimisticReorderPhotos: (photos: ProfilePhoto[]) => void;
  optimisticSetPrimary: (photoId: string) => void;

  // Revert on error
  revertProfile: () => void;

  // Fetch
  fetchProfile: (userId: string) => Promise<void>;
}

// Store a backup for reverting optimistic updates
let profileBackup: Profile | null = null;

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  isUploading: false,
  error: null,

  setProfile: (profile) => {
    set({ profile });
    profileBackup = profile ? { ...profile, photos: [...profile.photos] } : null;
  },
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setUploading: (isUploading) => set({ isUploading }),
  setError: (error) => set({ error }),

  optimisticUpdateProfile: (data) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current, photos: [...current.photos] };
    set({ profile: { ...current, ...data } });
  },

  optimisticAddPhoto: (photo) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current, photos: [...current.photos] };
    set({ profile: { ...current, photos: [...current.photos, photo] } });
  },

  optimisticRemovePhoto: (photoId) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current, photos: [...current.photos] };
    set({
      profile: {
        ...current,
        photos: current.photos.filter((p) => p.id !== photoId),
      },
    });
  },

  optimisticReorderPhotos: (photos) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current, photos: [...current.photos] };
    set({ profile: { ...current, photos } });
  },

  optimisticSetPrimary: (photoId) => {
    const current = get().profile;
    if (!current) return;
    profileBackup = { ...current, photos: [...current.photos] };
    set({
      profile: {
        ...current,
        photos: current.photos.map((p) => ({
          ...p,
          isPrimary: p.id === photoId,
        })),
      },
    });
  },

  revertProfile: () => {
    if (profileBackup) {
      set({ profile: profileBackup });
      profileBackup = null;
    }
  },

  fetchProfile: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ GET is allowed with userId param (public profile view)
      const res = await apiFetch(`/api/profile?userId=${userId}`, { requireAuth: true });
      if (!res.ok) {
        // Safely parse error — server might be down and Caddy returns HTML
        let errorMsg = 'Failed to fetch profile';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          }
        } catch {
          // Ignore JSON parse errors
        }
        if (res.status === 401) {
          // Don't throw — just silently fail. The auth store will handle redirect.
          set({ isLoading: false });
          return;
        }
        throw new Error(errorMsg);
      }
      // Safely parse JSON — server might be down and Caddy returns HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        set({ isLoading: false });
        return;
      }
      const data = await res.json();
      const profile = data.profile as Profile;
      // Parse interests from JSON string if needed
      if (typeof profile.interests === 'string') {
        profile.interests = JSON.parse(profile.interests as unknown as string);
      }
      set({ profile, isLoading: false });
      profileBackup = { ...profile, photos: [...profile.photos] };
    } catch (err) {
      // Don't show "Unexpected token" errors from HTML responses
      const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
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
}));
