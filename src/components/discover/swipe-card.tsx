'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DiscoverProfile } from '@/types/swipe';
import { MapPin, BadgeCheck, Sparkles, Heart } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { PhotoCarousel } from './photo-carousel';

// ─── Placeholder Avatar ────────────────────────────────────────────────────

function PlaceholderAvatar({ name }: { name: string }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className="w-full h-full bg-gradient-to-br from-rose-950/50 via-purple-950/30 to-neutral-900 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-primary">{initial}</span>
        </div>
        <p className="text-white/60 text-sm font-medium">{name || 'Anonymous'}</p>
      </div>
    </div>
  );
}

// ─── Profile Info Overlay ────────────────────────────────────────────────────

interface ProfileCardInfoProps {
  profile: DiscoverProfile;
  myInterests?: string[];
}

function ProfileCardInfo({ profile, myInterests = [] }: ProfileCardInfoProps) {
  // Safe access: ensure interests is always an array
  const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];

  const sharedInterests = useMemo(
    () => profileInterests.filter((i: string) => Array.isArray(myInterests) && myInterests.includes(i)),
    [profileInterests, myInterests]
  );

  const compatibilityScore = useMemo(() => {
    if (!Array.isArray(myInterests) || myInterests.length === 0) return null;
    return Math.round((sharedInterests.length / myInterests.length) * 100);
  }, [myInterests, sharedInterests.length]);

  const intentLabel = useMemo(() => {
    const map: Record<string, string> = {
      casual: 'Casual',
      serious: 'Serious',
      networking: 'Networking',
      friendship: 'Friendship',
      'not-sure': 'Exploring',
    };
    return map[profile.relationshipIntent] || '';
  }, [profile.relationshipIntent]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative px-4 pb-4 pt-16 space-y-2">
        {/* Name, age, verified */}
        <div className="flex items-center gap-2">
          <h2 className="text-white text-2xl font-bold tracking-tight drop-shadow-lg">
            {profile.name || 'Anonymous'}, {profile.age || '?'}
          </h2>
          {profile.isVerified && (
            <BadgeCheck className="w-5 h-5 text-blue-400 fill-blue-400/20" />
          )}
        </div>

        {/* City */}
        {profile.city && (
          <div className="flex items-center gap-1.5 text-white/80">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{profile.city}</span>
            {profile.distance && (
              <span className="text-xs text-white/50">• {profile.distance}</span>
            )}
          </div>
        )}

        {/* Relationship intent + compatibility */}
        <div className="flex items-center gap-2 flex-wrap">
          {intentLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium border border-white/10">
              <Heart className="w-3 h-3" />
              {intentLabel}
            </span>
          )}
          {compatibilityScore !== null && compatibilityScore > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 backdrop-blur-sm text-white/90 text-xs font-semibold border border-violet-400/20">
              <Sparkles className="w-3 h-3" />
              {compatibilityScore}% Match
            </span>
          )}
        </div>

        {/* Bio - truncated */}
        {profile.bio && (
          <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profileInterests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profileInterests.slice(0, 6).map((interest: string) => {
              const isShared = sharedInterests.includes(interest);
              return (
                <span
                  key={interest}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isShared
                      ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-rose-200 border border-rose-400/30'
                      : 'bg-white/10 text-white/70 border border-white/5'
                  }`}
                >
                  {isShared && <Sparkles className="w-2.5 h-2.5 mr-1" />}
                  {interest}
                </span>
              );
            })}
            {profileInterests.length > 6 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs">
                +{profileInterests.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Swipe Feedback Overlays ─────────────────────────────────────────────────

function SwipeFeedbackOverlay({ x }: { x: ReturnType<typeof useMotionValue<number>> }) {
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const likeRotate = useTransform(x, [50, 150], [0, 15]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
  const nopeRotate = useTransform(x, [-50, -150], [0, -15]);

  return (
    <>
      <motion.div
        className="absolute top-10 right-6 z-30 pointer-events-none"
        style={{ opacity: likeOpacity, rotate: likeRotate }}
      >
        <div className="border-4 border-emerald-400 rounded-xl px-5 py-2 -rotate-12 bg-emerald-500/10 backdrop-blur-sm">
          <span className="text-emerald-400 font-black text-2xl sm:text-3xl tracking-wider uppercase drop-shadow-lg">
            LIKE
          </span>
        </div>
      </motion.div>
      <motion.div
        className="absolute top-10 left-6 z-30 pointer-events-none"
        style={{ opacity: nopeOpacity, rotate: nopeRotate }}
      >
        <div className="border-4 border-rose-400 rounded-xl px-5 py-2 rotate-12 bg-rose-500/10 backdrop-blur-sm">
          <span className="text-rose-400 font-black text-2xl sm:text-3xl tracking-wider uppercase drop-shadow-lg">
            NOPE
          </span>
        </div>
      </motion.div>
    </>
  );
}

function SuperlikeFeedbackOverlay({ show }: { show: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.5, y: 20 }}
        animate={show ? { scale: 1, y: 0 } : { scale: 0.5, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="border-4 border-blue-400 rounded-xl px-5 py-2 bg-blue-500/20 backdrop-blur-sm">
          <span className="text-blue-400 font-black text-2xl sm:text-3xl tracking-wider uppercase drop-shadow-lg">
            SUPER
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Swipe Card (Interactive) ────────────────────────────────────────────────

interface SwipeCardProps {
  profile: DiscoverProfile;
  isTop: boolean;
  isSecond: boolean;
  myInterests?: string[];
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function SwipeCard({
  profile,
  isTop,
  isSecond,
  myInterests,
  onSwipe,
  onDragStateChange,
}: SwipeCardProps) {
  // Sort photos by order — safely handle undefined/null photos
  const sortedPhotos = useMemo(
    () => {
      const photos = Array.isArray(profile.photos) ? profile.photos : [];
      return [...photos].sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    [profile.photos]
  );

  // Preload images for top card
  useEffect(() => {
    if (isTop && sortedPhotos.length > 0) {
      sortedPhotos.forEach((photo) => {
        if (photo?.url) {
          const img = new Image();
          img.src = photo.url;
        }
      });
    }
  }, [isTop, sortedPhotos]);

  if (!isTop && !isSecond) {
    // Background card - just a shadow
    return (
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-neutral-800/80 border border-white/5" />
    );
  }

  if (isSecond) {
    // Second card - visible behind top card with depth effect
    return (
      <div className="absolute inset-0 rounded-2xl overflow-hidden scale-[0.95] translate-y-3 opacity-80">
        {sortedPhotos.length > 0 ? (
          <PhotoCarousel photos={sortedPhotos} />
        ) : (
          <PlaceholderAvatar name={profile.name} />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  // Top card - interactive, draggable
  return (
    <SwipeCardInteractive
      profile={profile}
      sortedPhotos={sortedPhotos}
      myInterests={myInterests}
      onSwipe={onSwipe}
      onDragStateChange={onDragStateChange}
    />
  );
}

// ─── Interactive Swipe Card (Top card only) ──────────────────────────────────

function SwipeCardInteractive({
  profile,
  sortedPhotos,
  myInterests,
  onSwipe,
  onDragStateChange,
}: Omit<SwipeCardProps, 'isTop' | 'isSecond'> & {
  sortedPhotos: { url: string; order: number }[];
}) {
  const [showSuperlike, setShowSuperlike] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Motion values for drag position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Card rotation based on horizontal drag
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    const isQuickSwipe = Math.abs(info.velocity.x) > velocityThreshold;
    const isFarEnough = Math.abs(info.offset.x) > swipeThreshold;
    const isUpSwipe = info.offset.y < -100 && Math.abs(info.offset.y) > Math.abs(info.offset.x) * 1.2;

    onDragStateChange?.(false);

    if (isUpSwipe) {
      // Superlike - swipe up
      setShowSuperlike(true);
      animate(y, -600, { duration: 0.3 });
      setTimeout(() => {
        onSwipe('up');
        setShowSuperlike(false);
      }, 350);
      return;
    }

    if (isFarEnough || isQuickSwipe) {
      setIsExiting(true);
      if (info.offset.x > 0 || info.velocity.x > 0) {
        // Swipe right - LIKE
        animate(x, 600, { duration: 0.25 });
        setTimeout(() => onSwipe('right'), 200);
      } else {
        // Swipe left - NOPE
        animate(x, -600, { duration: 0.25 });
        setTimeout(() => onSwipe('left'), 200);
      }
    }
    // If not enough, dragConstraints will snap it back automatically
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      dragMomentum={false}
      onDragStart={() => onDragStateChange?.(true)}
      onDragEnd={handleDragEnd}
    >
      {/* Photos or placeholder */}
      {sortedPhotos.length > 0 ? (
        <PhotoCarousel photos={sortedPhotos} />
      ) : (
        <PlaceholderAvatar name={profile.name} />
      )}

      {/* Swipe feedback overlays */}
      <SwipeFeedbackOverlay x={x} />
      <SuperlikeFeedbackOverlay show={showSuperlike} />

      {/* Profile info overlay */}
      <ProfileCardInfo profile={profile} myInterests={myInterests} />
    </motion.div>
  );
}
