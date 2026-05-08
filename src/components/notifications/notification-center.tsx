'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Bell,
  Heart,
  Users,
  Eye,
  Flame,
  Star,
  MessageCircle,
  UserPlus,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore, type NotificationItem } from '@/stores/notification-store';
import { cn } from '@/lib/utils';

// ─── Relative Time Helper ───────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Icon per Notification Type ─────────────────────────────────────────────

/** Render the appropriate icon for a notification type */
function NotificationTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'someone_liked':
      return <Heart className={className} />;
    case 'superlike_received':
      return <Star className={className} />;
    case 'new_message':
      return <MessageCircle className={className} />;
    case 'profile_viewed':
      return <Eye className={className} />;
    case 'streak_reminder':
      return <Flame className={className} />;
    case 'people_waiting':
      return <UserPlus className={className} />;
    case 'new_match':
      return <Users className={className} />;
    default:
      return <Bell className={className} />;
  }
}

function getNotificationIconColor(type: string): string {
  switch (type) {
    case 'someone_liked':
    case 'superlike_received':
    case 'new_match':
      return 'text-primary';
    case 'new_message':
      return 'text-emerald-400';
    case 'profile_viewed':
      return 'text-amber-400';
    case 'streak_reminder':
      return 'text-orange-400';
    case 'people_waiting':
      return 'text-cyan-400';
    default:
      return 'text-muted-foreground';
  }
}

// ─── Single Notification Item ───────────────────────────────────────────────

function NotificationItemRow({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-120, -60, 0], [0, 0.5, 1]);
  const deleteOpacity = useTransform(x, [-120, -60, 0], [1, 0.5, 0]);

  const iconColor = getNotificationIconColor(notification.type);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -100) {
        onDelete(notification.id);
      }
    },
    [notification.id, onDelete]
  );

  return (
    <motion.div
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Delete background revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive/20 rounded-lg">
        <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive font-medium">Delete</span>
        </motion.div>
      </div>

      <motion.div
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.3, right: 0 }}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
          'hover:bg-accent/50 active:bg-accent/70',
          !notification.isRead && 'bg-accent/30'
        )}
        onClick={() => {
          if (!notification.isRead) {
            onMarkRead(notification.id);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${notification.title}: ${notification.body}`}
      >
        {/* Icon */}
        <div className={cn('shrink-0 mt-0.5', iconColor)}>
          <NotificationTypeIcon type={notification.type} className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm leading-snug',
                notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/70">
              {relativeTime(notification.createdAt)}
            </span>
            {notification.groupedCount && notification.groupedCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                +{notification.groupedCount} more
              </Badge>
            )}
          </div>
        </div>

        {/* Delete button (touch-friendly) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="shrink-0 p-1.5 rounded-md hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Delete notification: ${notification.title}`}
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/50 flex items-center justify-center mb-4">
        <Bell className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No notifications yet</p>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        When someone likes or matches with you, you&apos;ll see it here
      </p>
    </motion.div>
  );
}

// ─── Main Notification Center ───────────────────────────────────────────────

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
  }, [markAllRead]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
    },
    [markAsRead]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNotification(id);
    },
    [deleteNotification]
  );

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur-md shadow-xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 px-1.5 text-[10px] font-bold"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <Separator className="opacity-50" />

      {/* Notification List */}
      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence initial={false}>
              {notifications.map((notification) => (
                <NotificationItemRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}
