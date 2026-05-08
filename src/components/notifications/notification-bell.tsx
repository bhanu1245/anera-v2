'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { cn } from '@/lib/utils';

/** Duration in ms for the "new notification" pulse animation */
const PULSE_DURATION = 3000;

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { unreadCount, lastNotificationAt, initSocket, disconnectSocket } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  // Track the lastNotificationAt to trigger pulse animation.
  // We use a ref to avoid calling setState synchronously in an effect.
  const prevLastNotificationAt = useRef(lastNotificationAt);

  // Detect new notifications from the store's lastNotificationAt timestamp
  useEffect(() => {
    if (lastNotificationAt && lastNotificationAt !== prevLastNotificationAt.current) {
      prevLastNotificationAt.current = lastNotificationAt;
      // Clear any existing timer
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      // Schedule state updates via setTimeout to avoid synchronous setState in effect
      const showTimer = setTimeout(() => {
        setHasNewNotification(true);
        pulseTimerRef.current = setTimeout(() => {
          setHasNewNotification(false);
          pulseTimerRef.current = null;
        }, PULSE_DURATION);
      }, 0);
      return () => clearTimeout(showTimer);
    }
  }, [lastNotificationAt]);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, initSocket, disconnectSocket]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
    setHasNewNotification(false);
  }, []);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={togglePanel}
        className={cn(
          'relative h-11 w-11 rounded-xl transition-colors',
          isOpen && 'bg-accent text-accent-foreground'
        )}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <motion.div
          animate={
            hasNewNotification
              ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <Bell className={cn('w-5 h-5', isOpen ? 'text-foreground' : 'text-muted-foreground')} />
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {displayCount && (
            <motion.span
              key="unread-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                'bg-primary text-primary-foreground shadow-sm',
                hasNewNotification && 'animate-pulse'
              )}
            >
              {displayCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring for new notifications */}
        <AnimatePresence>
          {hasNewNotification && (
            <motion.span
              key="pulse-ring"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-xl border-2 border-primary"
            />
          )}
        </AnimatePresence>
      </Button>

      {/* Notification Center Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-[calc(100vw-2rem)] sm:w-96',
              'origin-top-right'
            )}
          >
            <NotificationCenter />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
