'use client';

import type { DiscoverProfile } from '@/types/swipe';
import { SwipeCard } from './swipe-card';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeStackProps {
  profiles: DiscoverProfile[];
  currentIndex: number;
  myInterests?: string[];
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onDragStateChange?: (isDragging: boolean) => void;
  isLoading?: boolean;
  onReset?: () => void;
  isResetting?: boolean;
}

export function SwipeStack({
  profiles,
  currentIndex,
  myInterests,
  onSwipe,
  onDragStateChange,
  isLoading,
  onReset,
  isResetting,
}: SwipeStackProps) {
  const currentProfile = profiles[currentIndex];
  const hasMore = currentIndex < profiles.length;

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-800/50 border border-white/5 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/40" />
          <p className="text-white/40 text-sm">Finding people near you...</p>
        </div>
      </div>
    );
  }

  if (!hasMore || !currentProfile) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/5 flex items-center justify-center">
        <div className="text-center space-y-4 px-8">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-white/80 text-lg font-semibold">No more profiles</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            You&apos;ve seen everyone nearby. Reset your swipes to discover people again!
          </p>
          {onReset && (
            <Button
              onClick={onReset}
              disabled={isResetting}
              className="mt-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-6"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Find More People
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Third card (barely visible behind second) */}
      {profiles[currentIndex + 2] && (
        <div className="absolute inset-0">
          <SwipeCard
            profile={profiles[currentIndex + 2]}
            isTop={false}
            isSecond={false}
            myInterests={myInterests}
            onSwipe={() => {}}
          />
        </div>
      )}

      {/* Second card (visible behind top, slightly scaled down) */}
      {profiles[currentIndex + 1] && (
        <div className="absolute inset-0">
          <SwipeCard
            profile={profiles[currentIndex + 1]}
            isTop={false}
            isSecond={true}
            myInterests={myInterests}
            onSwipe={() => {}}
          />
        </div>
      )}

      {/* Top card - interactive, draggable */}
      <div className="absolute inset-0 z-10">
        <SwipeCard
          profile={currentProfile}
          isTop={true}
          isSecond={false}
          myInterests={myInterests}
          onSwipe={onSwipe}
          onDragStateChange={onDragStateChange}
        />
      </div>
    </div>
  );
}
