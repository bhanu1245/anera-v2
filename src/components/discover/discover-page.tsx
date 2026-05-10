'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDiscoverStore } from '@/stores/discover-store';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { apiFetch, isAuthReady } from '@/lib/api-client';
import { SwipeStack } from './swipe-stack';
import { ActionButtons } from './action-buttons';
import { MatchAnimation } from './match-animation';
import type { DiscoverProfile, SwipeAction } from '@/types/swipe';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiscoverPageProps {
  onOpenChat?: (matchId: string, profile: DiscoverProfile) => void;
}

export function DiscoverPage({ onOpenChat }: DiscoverPageProps) {
  const {
    profiles,
    currentProfileIndex,
    isLoading,
    error,
    swipeHistory,
    latestMatch,
    showMatchAnimation,
    myInterests,
    setProfiles,
    setLoading,
    setError,
    setMyInterests,
    swipe,
    updateSwipeResult,
    undoSwipe,
    setShowMatchAnimation,
    currentProfile,
    remainingCount,
  } = useDiscoverStore();

  const { userId, isAuthenticated, hasHydrated } = useAuthStore();
  const { profile: myProfile, fetchProfile } = useProfileStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track the userId that was used for the current fetch cycle.
  // When userId changes (logout→login), we reset fetchAttempted
  // so discover re-fetches for the new user.
  const lastFetchedUserId = useRef<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Reset fetch state when userId changes (e.g. after re-login)
  useEffect(() => {
    if (userId !== lastFetchedUserId.current) {
      console.log('[DISCOVER] userId changed:', lastFetchedUserId.current, '→', userId, '— resetting fetch state');
      lastFetchedUserId.current = userId;
      setFetchAttempted(false);
      setSeeded(false);
    }
  }, [userId]);

  // Seed demo profiles if needed, then fetch
  const seedAndFetch = useCallback(async () => {
    // AUTH GUARD: Never fetch if not authenticated and hydrated
    if (!userId || !isAuthenticated || !hasHydrated) {
      console.log('[DISCOVER] Blocked — auth not ready', { userId, isAuthenticated, hasHydrated });
      return;
    }

    // Double-check auth readiness from api-client
    if (!isAuthReady()) {
      console.log('[DISCOVER] Blocked — api-client auth not ready');
      return;
    }

    console.log('[DISCOVER] Fetching profiles for user:', userId);
    setLoading(true);
    setError(null);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Seed bulk demo profiles (idempotent - safe to call once per session)
      if (!seeded) {
        try {
          const seedRes = await apiFetch('/api/seed/bulk', {
            method: 'POST',
            requireAuth: true,
          });
          if (seedRes.ok) {
            const seedData = await seedRes.json();
            console.log('[Discover] Seeded profiles:', seedData.profiles?.length || 0);
          }
        } catch (seedErr) {
          console.warn('[Discover] Seed failed (non-fatal):', seedErr);
        }
        setSeeded(true);
      }

      // Then fetch discover profiles
      const res = await apiFetch('/api/discover', {
        signal: abortControllerRef.current.signal,
        requireAuth: true,
      });
      if (!res.ok) {
        let errorMsg = 'Failed to fetch profiles';
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
      // Safely parse JSON — server might be down and Caddy returns HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('[Discover] Non-JSON response from /api/discover');
        setProfiles([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const fetchedProfiles = data.profiles || [];
      console.log('[Discover] Fetched profiles:', fetchedProfiles.length,
        fetchedProfiles.length > 0 ? `| First: ${fetchedProfiles[0]?.name}, photos: ${fetchedProfiles[0]?.photos?.length || 0}` : '');

      // Validate and sanitize profiles before storing
      const safeProfiles = fetchedProfiles.map((p: DiscoverProfile) => ({
        ...p,
        name: p.name || 'Anonymous',
        age: p.age || 25,
        bio: p.bio || '',
        city: p.city || '',
        gender: p.gender || 'other',
        relationshipIntent: p.relationshipIntent || '',
        interests: Array.isArray(p.interests) ? p.interests : [],
        photos: Array.isArray(p.photos) ? p.photos : [],
        isOnboarded: p.isOnboarded ?? true,
      }));

      setProfiles(safeProfiles);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to load profiles';
      // Don't show "Unexpected token" errors from HTML responses
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        setLoading(false);
        return;
      }
      console.error('[Discover] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated, hasHydrated, seeded, setProfiles, setLoading, setError]);

  // Load my profile for compatibility + interests
  useEffect(() => {
    if (userId && isAuthenticated && hasHydrated && !myProfile) {
      fetchProfile(userId);
    }
  }, [userId, isAuthenticated, hasHydrated, myProfile, fetchProfile]);

  // Set my interests from profile
  useEffect(() => {
    if (myProfile?.interests && Array.isArray(myProfile.interests)) {
      setMyInterests(myProfile.interests);
    }
  }, [myProfile, setMyInterests]);

  // Fetch discover profiles on mount — ONLY when auth is ready
  useEffect(() => {
    if (userId && isAuthenticated && hasHydrated && !fetchAttempted) {
      console.log('[DISCOVER] Auth ready — triggering fetch');
      setFetchAttempted(true);
      seedAndFetch();
    } else if (!isAuthenticated || !hasHydrated) {
      console.log('[DISCOVER] Blocked — auth not ready', { isAuthenticated, hasHydrated });
    }
  }, [userId, isAuthenticated, hasHydrated, fetchAttempted, seedAndFetch]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (isSwipeAnimating) return;

      const actionMap: Record<string, SwipeAction> = {
        left: 'pass',
        right: 'like',
        up: 'superlike',
      };
      const action = actionMap[direction];
      if (!action) return;

      setIsSwipeAnimating(true);

      // Record swipe in store (optimistic - no match yet)
      const result = swipe(action);

      // Send to API and update match state from server response
      const target = currentProfile();
      if (target) {
        apiFetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId: target.userId,
            action,
          }),
          requireAuth: true,
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            // Update the store with the actual server match result
            if (data.isMatch && data.match) {
              // Transform the server match to include the profile from our local data
              const matchWithProfile = {
                ...data.match,
                profile: {
                  ...target,
                  compatibilityScore: undefined,
                  sharedInterests: undefined,
                },
              };
              updateSwipeResult(target.userId, {
                isMatch: true,
                match: matchWithProfile,
              });
            }
          }
        }).catch(() => {
          // Silently fail - the store already recorded the optimistic swipe
        });
      }

      // Animation cooldown
      setTimeout(() => {
        setIsSwipeAnimating(false);
      }, 350);
    },
    [isSwipeAnimating, swipe, currentProfile, updateSwipeResult]
  );

  const handleNope = useCallback(() => {
    handleSwipe('left');
  }, [handleSwipe]);

  const handleLike = useCallback(() => {
    handleSwipe('right');
  }, [handleSwipe]);

  const handleSuperlike = useCallback(() => {
    handleSwipe('up');
  }, [handleSwipe]);

  const handleUndo = useCallback(() => {
    const restored = undoSwipe();
    if (!restored) return;
    setIsSwipeAnimating(true);
    setTimeout(() => setIsSwipeAnimating(false), 300);
  }, [undoSwipe]);

  const handleResetSwipes = useCallback(async () => {
    if (!userId || isResetting || !isAuthenticated) return;
    setIsResetting(true);
    setLoading(true);
    setError(null);
    try {
      // 1. Reset swipes via API
      const res = await apiFetch('/api/swipe/reset', { method: 'POST', requireAuth: true });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to reset swipes');
      }
      // 2. Re-seed (this also resets demo user swipes on the server side)
      await apiFetch('/api/seed/bulk', { method: 'POST', requireAuth: true }).catch(() => {});
      // 3. Fetch discover profiles fresh
      const discoverRes = await apiFetch('/api/discover', { requireAuth: true });
      if (!discoverRes.ok) {
        const data = await discoverRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch profiles');
      }
      const data = await discoverRes.json();
      const fetchedProfiles = data.profiles || [];

      // Sanitize profiles
      const safeProfiles = fetchedProfiles.map((p: DiscoverProfile) => ({
        ...p,
        name: p.name || 'Anonymous',
        age: p.age || 25,
        bio: p.bio || '',
        city: p.city || '',
        gender: p.gender || 'other',
        relationshipIntent: p.relationshipIntent || '',
        interests: Array.isArray(p.interests) ? p.interests : [],
        photos: Array.isArray(p.photos) ? p.photos : [],
        isOnboarded: p.isOnboarded ?? true,
      }));

      setProfiles(safeProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset swipes');
    } finally {
      setLoading(false);
      setIsResetting(false);
    }
  }, [userId, isAuthenticated, isResetting, setProfiles, setLoading, setError]);

  const handleKeepSwiping = useCallback(() => {
    setShowMatchAnimation(false);
  }, [setShowMatchAnimation]);

  const handleSendMessage = useCallback(() => {
    if (latestMatch?.profile && onOpenChat) {
      onOpenChat(latestMatch.id, latestMatch.profile as DiscoverProfile);
    }
    setShowMatchAnimation(false);
  }, [latestMatch, onOpenChat, setShowMatchAnimation]);

  return (
    <div className="flex flex-col h-full">
      {/* Card area - with min-height fallback */}
      <div className="flex-1 relative px-3 sm:px-4 pt-2 pb-1 min-h-0" style={{ minHeight: '400px' }}>
        <SwipeStack
          profiles={profiles}
          currentIndex={currentProfileIndex}
          myInterests={myInterests}
          onSwipe={handleSwipe}
          onDragStateChange={setIsDragging}
          isLoading={isLoading && profiles.length === 0}
          onReset={handleResetSwipes}
          isResetting={isResetting}
        />
      </div>

      {/* Action buttons */}
      <div
        className={`shrink-0 transition-opacity duration-200 ${
          isDragging ? 'opacity-40' : 'opacity-100'
        }`}
      >
        <ActionButtons
          onUndo={handleUndo}
          onNope={handleNope}
          onSuperlike={handleSuperlike}
          onLike={handleLike}
          canUndo={swipeHistory.length > 0}
          isAnimating={isSwipeAnimating}
        />
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            className="absolute bottom-20 left-4 right-4 z-40"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="bg-destructive/90 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 text-white">
              <WifiOff className="w-5 h-5 shrink-0" />
              <p className="text-sm flex-1">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={seedAndFetch}
                className="text-white hover:bg-white/10 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match animation overlay */}
      <MatchAnimation
        match={latestMatch}
        show={showMatchAnimation}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
      />
    </div>
  );
}
