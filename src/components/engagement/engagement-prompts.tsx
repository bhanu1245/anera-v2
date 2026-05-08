'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Users, User, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PromptConfig {
  type: string;
  icon: typeof Flame;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  defaultTitle: string;
  defaultBody: string;
  navigateTo: string;
}

// ─── Prompt Configurations ──────────────────────────────────────────────────

const PROMPT_CONFIGS: PromptConfig[] = [
  {
    type: 'streak_reminder',
    icon: Flame,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    defaultTitle: 'Keep your streak alive!',
    defaultBody: 'Come back today to keep your streak going!',
    navigateTo: 'discover',
  },
  {
    type: 'people_waiting',
    icon: Users,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    defaultTitle: 'People are waiting',
    defaultBody: 'Check out who liked you!',
    navigateTo: 'discover',
  },
  {
    type: 'profile_incomplete',
    icon: User,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    defaultTitle: 'Complete your profile',
    defaultBody: 'Add more details to get better matches',
    navigateTo: 'profile',
  },
];

// ─── Dismissed State (persisted per session) ────────────────────────────────

const dismissedPrompts = new Set<string>();

// ─── Single Prompt Card ─────────────────────────────────────────────────────

interface PromptCardProps {
  prompt: {
    type: string;
    title: string;
    body: string;
    priority: string;
  };
  config: PromptConfig;
  onDismiss: (type: string) => void;
  onNavigate: (tab: string) => void;
}

function PromptCard({ prompt, config, onDismiss, onNavigate }: PromptCardProps) {
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]',
          config.borderColor,
          'bg-card/95 backdrop-blur-md'
        )}
        onClick={() => onNavigate(config.navigateTo)}
        role="button"
        tabIndex={0}
        aria-label={prompt.title}
      >
        <CardContent className="p-3 flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
              config.bgColor
            )}
          >
            <Icon className={cn('w-4.5 h-4.5', config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">
              {prompt.title || config.defaultTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {prompt.body || config.defaultBody}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(prompt.type);
            }}
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label={`Dismiss ${prompt.title}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface EngagementPromptsProps {
  /** Callback when a prompt is clicked — navigate to the relevant tab */
  onNavigate?: (tab: string) => void;
}

export function EngagementPrompts({ onNavigate }: EngagementPromptsProps) {
  const { engagement, isEngagementLoading, fetchEngagement } = useNotificationStore();
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!engagement) {
      fetchEngagement();
    }
  }, [engagement, fetchEngagement]);

  const handleDismiss = useCallback((type: string) => {
    dismissedPrompts.add(type);
    setLocalDismissed((prev) => new Set(prev).add(type));
  }, []);

  const handleNavigate = useCallback(
    (tab: string) => {
      onNavigate?.(tab);
    },
    [onNavigate]
  );

  if (isEngagementLoading || !engagement) {
    return null;
  }

  const prompts = engagement.prompts ?? [];

  // Filter out dismissed prompts
  const visiblePrompts = prompts.filter((p) => !dismissedPrompts.has(p.type) && !localDismissed.has(p.type));

  if (visiblePrompts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {visiblePrompts.map((prompt) => {
          const config = PROMPT_CONFIGS.find((c) => c.type === prompt.type);
          if (!config) return null;

          return (
            <PromptCard
              key={prompt.type}
              prompt={prompt}
              config={config}
              onDismiss={handleDismiss}
              onNavigate={handleNavigate}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
