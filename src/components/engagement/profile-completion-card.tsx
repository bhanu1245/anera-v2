'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, User, Camera, FileText, MapPin, Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

interface ProfileCompletionCardProps {
  /** Callback when CTA is clicked — navigate to profile tab */
  onGoToProfile?: () => void;
}

// ─── Circular Progress Ring (SVG) ───────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-accent"
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-primary'
          )}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {/* Percentage text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

// ─── Missing Item Definitions ───────────────────────────────────────────────

interface MissingItem {
  key: string;
  label: string;
  icon: typeof User;
}

const MISSING_ITEMS: MissingItem[] = [
  { key: 'name', label: 'Add your name', icon: User },
  { key: 'bio', label: 'Write a bio', icon: FileText },
  { key: 'city', label: 'Add your city', icon: MapPin },
  { key: 'interests', label: 'Add interests', icon: Heart },
  { key: 'photos', label: 'Add 3+ photos', icon: Camera },
  { key: 'relationshipIntent', label: 'Set relationship intent', icon: MessageSquare },
];

/**
 * Determine which items are "missing" based on the profile completion score.
 * Since we only have a percentage from the API, we use heuristics:
 * - Each item contributes a known amount to the score
 * - We check which items would be needed to reach 100%
 */
function getMissingItems(percentage: number): MissingItem[] {
  if (percentage >= 100) return [];

  // Scoring breakdown from engagement.ts:
  // name: 10, bio: 15, city: 10, interests: 15, photos: 25, relationshipIntent: 10, age: 5, gender: 10
  const contributions: { key: string; weight: number }[] = [
    { key: 'photos', weight: 25 },
    { key: 'bio', weight: 15 },
    { key: 'interests', weight: 15 },
    { key: 'gender', weight: 10 },
    { key: 'name', weight: 10 },
    { key: 'city', weight: 10 },
    { key: 'relationshipIntent', weight: 10 },
    { key: 'age', weight: 5 },
  ];

  const total = contributions.reduce((s, c) => s + c.weight, 0);
  const missing = percentage < total;

  if (!missing) return [];

  // Start from percentage and figure out which items are likely missing
  // This is an approximation — the most impactful missing items
  let remaining = total - percentage;
  const missingKeys = new Set<string>();

  // Sort by weight descending — assume biggest items are missing first
  const sorted = [...contributions].sort((a, b) => b.weight - a.weight);
  for (const item of sorted) {
    if (remaining >= item.weight) {
      missingKeys.add(item.key);
      remaining -= item.weight;
    }
  }

  return MISSING_ITEMS.filter((item) => missingKeys.has(item.key));
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProfileCompletionCard({ onGoToProfile }: ProfileCompletionCardProps) {
  const { engagement, isEngagementLoading, fetchEngagement } = useNotificationStore();

  useEffect(() => {
    if (!engagement) {
      fetchEngagement();
    }
  }, [engagement, fetchEngagement]);

  const profileCompletion = engagement?.profileCompletion ?? 0;
  const missingItems = useMemo(() => getMissingItems(profileCompletion), [profileCompletion]);

  // Don't show if profile is complete
  if (!isEngagementLoading && profileCompletion >= 100) {
    return null;
  }

  if (isEngagementLoading) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-accent" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-accent rounded" />
              <div className="h-3 w-1/2 bg-accent rounded" />
              <div className="h-3 w-2/3 bg-accent rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/95 backdrop-blur-md overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Progress Ring */}
            <ProgressRing percentage={profileCompletion} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Complete your profile
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                {profileCompletion}% done — add more to get better matches
              </p>

              {/* Missing items list */}
              <div className="space-y-1.5">
                {missingItems.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center shrink-0">
                        <Icon className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  );
                })}
                {missingItems.length > 4 && (
                  <span className="text-[10px] text-muted-foreground/60 pl-6">
                    +{missingItems.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onGoToProfile}
            className="w-full mt-4 h-10 rounded-xl font-semibold text-sm"
            size="sm"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Go to Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
