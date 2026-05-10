import { create } from 'zustand';
import type { DiscoverProfile, SwipeAction, SwipeResult, Match } from '@/types/swipe';

interface DiscoverState {
  // Profiles to swipe on
  profiles: DiscoverProfile[];
  currentProfileIndex: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Swipe history for undo
  swipeHistory: {
    profile: DiscoverProfile;
    action: SwipeAction;
    result: SwipeResult;
  }[];

  // Match notification
  latestMatch: Match | null;
  showMatchAnimation: boolean;

  // My profile (for compatibility calculation)
  myInterests: string[];

  // Actions
  setProfiles: (profiles: DiscoverProfile[]) => void;
  addProfiles: (profiles: DiscoverProfile[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setMyInterests: (interests: string[]) => void;

  // Swipe actions
  swipe: (action: SwipeAction) => SwipeResult | null;
  updateSwipeResult: (targetUserId: string, serverResult: { isMatch: boolean; match?: Match }) => void;
  undoSwipe: () => DiscoverProfile | null;

  // Match actions
  setLatestMatch: (match: Match | null) => void;
  setShowMatchAnimation: (show: boolean) => void;

  // Reset for logout/login cycle
  reset: () => void;

  // Computed
  currentProfile: () => DiscoverProfile | null;
  nextProfile: () => DiscoverProfile | null;
  remainingCount: () => number;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  profiles: [],
  currentProfileIndex: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  swipeHistory: [],
  latestMatch: null,
  showMatchAnimation: false,
  myInterests: [],

  setProfiles: (profiles) => set({ profiles, currentProfileIndex: 0 }),
  addProfiles: (newProfiles) =>
    set((state) => ({
      profiles: [...state.profiles, ...newProfiles],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setHasMore: (hasMore) => set({ hasMore }),
  setMyInterests: (myInterests) => set({ myInterests }),

  swipe: (action) => {
    const state = get();
    const profile = state.currentProfile();

    if (!profile) return null;

    // Optimistic swipe result — isMatch will be updated by the server response
    // We do NOT use random match logic here; the server determines matches.
    const result: SwipeResult = {
      success: true,
      action,
      targetUserId: profile.userId,
      isMatch: false, // Will be updated when the server responds
    };

    set((state) => ({
      currentProfileIndex: state.currentProfileIndex + 1,
      swipeHistory: [
        { profile, action, result },
        ...state.swipeHistory,
      ].slice(0, 10), // Keep last 10 for undo
    }));

    return result;
  },

  /**
   * Update the swipe result with the server's actual match determination.
   * Called after the /api/swipe response is received.
   */
  updateSwipeResult: (targetUserId: string, serverResult: { isMatch: boolean; match?: Match }) => {
    const state = get();
    // Find the swipe in history for this target
    const swipeEntry = state.swipeHistory.find(
      (h) => h.profile.userId === targetUserId
    );

    if (swipeEntry && serverResult.isMatch) {
      const matchData = serverResult.match || {
        id: `match_${Date.now()}`,
        user1Id: '',
        user2Id: targetUserId,
        createdAt: new Date().toISOString(),
        profile: swipeEntry.profile,
      };

      // Update the result in history
      set((state) => ({
        swipeHistory: state.swipeHistory.map((h) =>
          h.profile.userId === targetUserId
            ? { ...h, result: { ...h.result, isMatch: true, match: matchData } }
            : h
        ),
        latestMatch: matchData,
        showMatchAnimation: true,
      }));
    }
  },

  undoSwipe: () => {
    const state = get();
    if (state.swipeHistory.length === 0) return null;

    const lastSwipe = state.swipeHistory[0];

    set((state) => ({
      currentProfileIndex: state.currentProfileIndex - 1,
      swipeHistory: state.swipeHistory.slice(1),
      latestMatch: null,
      showMatchAnimation: false,
    }));

    return lastSwipe.profile;
  },

  setLatestMatch: (latestMatch) => set({ latestMatch }),
  setShowMatchAnimation: (showMatchAnimation) => set({ showMatchAnimation }),

  /** Full reset — used during logout to ensure clean slate for next login */
  reset: () => {
    set({
      profiles: [],
      currentProfileIndex: 0,
      isLoading: false,
      error: null,
      hasMore: true,
      swipeHistory: [],
      latestMatch: null,
      showMatchAnimation: false,
      myInterests: [],
    });
  },

  currentProfile: () => {
    const state = get();
    return state.profiles[state.currentProfileIndex] || null;
  },

  nextProfile: () => {
    const state = get();
    return state.profiles[state.currentProfileIndex + 1] || null;
  },

  remainingCount: () => {
    const state = get();
    return Math.max(0, state.profiles.length - state.currentProfileIndex);
  },
}));
