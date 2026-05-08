'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, MapPin, Clock, Send, Loader2, RefreshCw, Heart } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchPhoto {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface MatchProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  city: string;
  relationshipIntent: string;
  isOnboarded: boolean;
  photos: MatchPhoto[];
  createdAt: string;
  updatedAt: string;
}

interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  profile: MatchProfile | null;
}

interface MatchesResponse {
  matches: Match[];
  userId: string;
}

interface MatchesPageProps {
  onOpenChat?: (matchId: string, profile: MatchProfile) => void;
}

// ─── Utility: Relative time ────────────────────────────────────────────────

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks === 1) return '1w ago';
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths === 1) return '1mo ago';
  return `${diffMonths}mo ago`;
}

// ─── Animation Variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function MatchesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/50 bg-card/95 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            {/* Photo skeleton */}
            <Skeleton className="w-full aspect-[3/4] rounded-none" />
            {/* Info skeleton */}
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-8 w-full mt-2 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function MatchesEmptyState() {
  return (
    <motion.div
      className="flex items-center justify-center min-h-[40vh] px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">No matches yet</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Start swiping to discover people. When you both like each other,
          you&apos;ll show up here!
        </p>
      </div>
    </motion.div>
  );
}

// ─── Match Card ────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: Match;
  onMessage: (matchId: string, profile: MatchProfile) => void;
}

function MatchCard({ match, onMessage }: MatchCardProps) {
  const profile = match.profile;

  // Defensive: if no profile, show a minimal card
  if (!profile) {
    return (
      <motion.div variants={cardVariants}>
        <Card className="border-border/50 bg-card/95 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full aspect-[3/4] bg-accent/50 flex items-center justify-center">
              <Heart className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm text-muted-foreground">Unknown user</p>
              <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Matched {getRelativeTime(match.createdAt)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 rounded-lg text-xs"
                disabled
              >
                <Send className="w-3 h-3 mr-1" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Find the best photo: primary first, then first by order
  const primaryPhoto = profile.photos?.find((p) => p.isPrimary)
    || [...(profile.photos || [])].sort((a, b) => a.order - b.order)[0]
    || null;

  return (
    <motion.div variants={cardVariants}>
      <Card className="border-border/50 bg-card/95 backdrop-blur-md overflow-hidden group cursor-pointer transition-colors hover:border-primary/30">
        <CardContent className="p-0">
          {/* Photo */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-accent/30">
            {primaryPhoto ? (
              <img
                src={primaryPhoto.url}
                alt={`${profile.name}'s photo`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Heart className="w-12 h-12 text-primary/20" />
              </div>
            )}
            {/* Gradient overlay at bottom of photo */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            {/* Name & age overlay */}
            <div className="absolute bottom-2 left-3 right-3">
              <h3 className="text-white font-semibold text-sm drop-shadow-lg truncate">
                {profile.name}, {profile.age}
              </h3>
            </div>
            {/* Online indicator placeholder */}
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card shadow-sm" />
          </div>

          {/* Card info */}
          <div className="p-3 space-y-1.5">
            {/* City */}
            {profile.city && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="text-xs truncate">{profile.city}</span>
              </div>
            )}

            {/* Matched time */}
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" />
              Matched {getRelativeTime(match.createdAt)}
            </p>

            {/* Shared interests (max 3) */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {profile.interests.slice(0, 3).map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Message button */}
            <Button
              variant="default"
              size="sm"
              className="w-full h-8 rounded-lg text-xs gap-1.5 mt-1"
              onClick={() => onMessage(match.id, profile)}
            >
              <Send className="w-3 h-3" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function MatchesPage({ onOpenChat }: MatchesPageProps) {
  const { userId } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/matches');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch matches');
      }
      // Safely parse JSON — server might be down and Caddy returns HTML
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setMatches([]);
        setIsLoading(false);
        return;
      }
      const data: MatchesResponse = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      // Don't show "Unexpected token" errors from HTML responses
      if (msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
        setIsLoading(false);
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleMessage = useCallback((matchId: string, profile: MatchProfile) => {
    if (onOpenChat) {
      onOpenChat(matchId, profile);
    }
  }, [onOpenChat]);

  // Loading state
  if (isLoading) {
    return <MatchesLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[40vh] px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Failed to load matches</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return <MatchesEmptyState />;
  }

  // Matches grid
  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Your Matches
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({matches.length})
          </span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchMatches}
          className="h-7 w-7 p-0"
          aria-label="Refresh matches"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onMessage={handleMessage}
          />
        ))}
      </motion.div>
    </div>
  );
}
