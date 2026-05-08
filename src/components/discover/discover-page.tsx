'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDiscoverStore } from '@/stores/discover-store';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { apiFetch } from '@/lib/api-client';
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

  const { userId } = useAuthStore();
  const { profile: myProfile, fetchProfile } = useProfileStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Seed demo profiles if needed, then fetch
  const seedAndFetch = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Seed bulk demo profiles (idempotent - safe to call once per session)
      if (!seeded) {
        await apiFetch('/api/seed/bulk', { method: 'POST' }).catch(() => {});
        setSeeded(true);
      }

      // Then fetch discover profiles
      const res = await apiFetch('/api/discover', {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) {
        // Safely parse error — server might be down and Caddy returns HTML
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
        setProfiles([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to load profiles';
      // Don't show "Unexpected token" errors from HTML responses
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        setLoading(false);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, seeded, setProfiles, setLoading, setError]);

  // Load my profile for compatibility + interests
  useEffect(() => {
    if (userId && !myProfile) {
      fetchProfile(userId);
    }
  }, [userId, myProfile, fetchProfile]);

  // Set my interests from profile
  useEffect(() => {
    if (myProfile?.interests) {
      setMyInterests(myProfile.interests);
    }
  }, [myProfile, setMyInterests]);

  // Fetch discover profiles on mount
  useEffect(() => {
    if (userId && !fetchAttempted) {
      setFetchAttempted(true);
      seedAndFetch();
    }
  }, [userId, fetchAttempted, seedAndFetch]);

  // Preload next profiles when running low
  useEffect(() => {
    if (remainingCount() <= 2 && remainingCount() > 0 && !isLoading) {
      // Could fetch more profiles here
    }
  }, [currentProfileIndex, remainingCount, isLoading]);

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
    [isSwipeAnimating, swipe, currentProfile]
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
    if (!userId || isResetting) return;
    setIsResetting(true);
    setLoading(true);
    setError(null);
    try {
      // 1. Reset swipes via API
      const res = await apiFetch('/api/swipe/reset', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset swipes');
      }
      // 2. Re-seed (this also resets demo user swipes on the server side)
      await apiFetch('/api/seed/bulk', { method: 'POST' }).catch(() => {});
      // 3. Fetch discover profiles fresh
      const discoverRes = await apiFetch('/api/discover');
      if (!discoverRes.ok) {
        const data = await discoverRes.json();
        throw new Error(data.error || 'Failed to fetch profiles');
      }
      const data = await discoverRes.json();
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset swipes');
    } finally {
      setLoading(false);
      setIsResetting(false);
    }
  }, [userId, isResetting, setProfiles, setLoading, setError]);

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
      {/* Card area */}
      <div className="flex-1 relative px-3 sm:px-4 pt-2 pb-1 min-h-0">
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
