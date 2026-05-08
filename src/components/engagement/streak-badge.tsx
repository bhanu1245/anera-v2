'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  /** Optional click handler to navigate to streak details */
  onClick?: () => void;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function StreakBadge({ onClick, compact = false }: StreakBadgeProps) {
  const { engagement, isEngagementLoading, fetchEngagement } = useNotificationStore();

  // Fetch engagement data if not loaded
  // We use a lazy pattern — the parent component is responsible for calling fetchEngagement

  const streak = engagement?.streak;
  const currentStreak = streak?.currentStreak ?? 0;
  const hasStreak = currentStreak > 0;
  const hasGlow = currentStreak >= 3;

  if (isEngagementLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 animate-pulse',
          compact ? 'px-2 py-1' : 'px-3 py-2'
        )}
      >
        <Flame className="w-4 h-4 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground/50">--</span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 rounded-xl transition-colors',
        compact ? 'px-2 py-1' : 'px-3 py-2',
        hasStreak
          ? 'bg-orange-500/10 hover:bg-orange-500/20'
          : 'bg-accent/50 hover:bg-accent/80'
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`${currentStreak} day streak`}
    >
      {/* Glow effect for streak >= 3 */}
      {hasGlow && (
        <motion.span
          className="absolute inset-0 rounded-xl bg-orange-500/10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <Flame
        className={cn(
          'relative z-10',
          compact ? 'w-3.5 h-3.5' : 'w-4 h-4',
          hasStreak
            ? 'text-orange-400 fill-orange-400'
            : 'text-muted-foreground/40'
        )}
      />

      <div className="relative z-10 flex items-baseline gap-0.5">
        <span
          className={cn(
            'font-bold leading-none',
            compact ? 'text-sm' : 'text-base',
            hasStreak ? 'text-foreground' : 'text-muted-foreground/40'
          )}
        >
          {currentStreak}
        </span>
        {!compact && (
          <span className="text-[10px] text-muted-foreground leading-none">
            day streak
          </span>
        )}
      </div>
    </motion.button>
  );
}
