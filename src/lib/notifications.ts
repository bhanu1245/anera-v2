import { db } from '@/lib/db';

// ─── Real-time Notification Push ─────────────────────────────────────────────

/**
 * Push a notification to the notification service via HTTP for real-time delivery.
 * The notification service then broadcasts it to the user's socket connections.
 *
 * This is non-blocking — if the notification service is down, notifications
 * will still be persisted in the database and available via polling.
 */
async function pushNotificationRealtime(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    fromUserId?: string | null;
    entityId?: string | null;
    entityType?: string | null;
    imageUrl?: string | null;
  }
): Promise<void> {
  try {
    const response = await fetch('http://localhost:3003/emit?XTransformPort=3003', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification: {
          ...notification,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.warn('[pushNotificationRealtime] Failed to push:', response.status);
    }
  } catch {
    // Notification service may not be running — that's OK,
    // the notification is still persisted in the database
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'someone_liked'
  | 'superlike_received'
  | 'profile_viewed'
  | 'boost_expired'
  | 'streak_reminder'
  | 'profile_incomplete'
  | 'people_waiting';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  fromUserId?: string;
  entityId?: string;
  entityType?: string;
  imageUrl?: string;
}

export interface GetNotificationsOptions {
  limit?: number;
  cursor?: string;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export interface GroupedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  fromUserId: string | null;
  entityId: string | null;
  entityType: string | null;
  imageUrl: string | null;
  createdAt: Date;
  readAt: Date | null;
  /** When grouped, this contains the count of additional notifications in the group */
  groupedCount?: number;
  /** When grouped, contains the IDs of grouped notifications */
  groupedIds?: string[];
}

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 * Create a notification record and push it in real-time.
 * Returns the created notification.
 */
export async function createNotification(params: CreateNotificationParams) {
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      fromUserId: params.fromUserId ?? null,
      entityId: params.entityId ?? null,
      entityType: params.entityType ?? null,
      imageUrl: params.imageUrl ?? null,
    },
  });

  // Push to notification service for real-time delivery (non-blocking)
  pushNotificationRealtime(params.userId, {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    fromUserId: notification.fromUserId,
    entityId: notification.entityId,
    entityType: notification.entityType,
    imageUrl: notification.imageUrl,
  }).catch(() => {
    // Silently ignore push failures — notification is already persisted
  });

  return notification;
}

/**
 * Get count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(userId: string, notificationId: string) {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) return null;

  return db.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userId: string) {
  const result = await db.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result;
}

/**
 * Delete a notification (must belong to user).
 */
export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) return null;

  await db.notification.delete({
    where: { id: notificationId },
  });

  return true;
}

/**
 * Get paginated notifications with grouping support.
 *
 * Notifications of the same type that occur within 1 hour of each other
 * are grouped together. The most recent notification is the "head" of the group,
 * and `groupedCount` indicates how many additional notifications are in the group.
 */
export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {}
): Promise<{
  notifications: GroupedNotification[];
  unreadCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}> {
  const { limit = 20, cursor, type, unreadOnly = false } = options;

  // Build where clause
  const where: Record<string, unknown> = {
    userId,
  };

  if (type) {
    where.type = type;
  }

  if (unreadOnly) {
    where.isRead = false;
  }

  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  // Fetch one extra to determine hasMore
  const rawNotifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = rawNotifications.length > limit;
  const notifications = hasMore ? rawNotifications.slice(0, limit) : rawNotifications;

  // Group consecutive notifications of the same type within 1 hour
  const grouped: GroupedNotification[] = [];
  const ONE_HOUR = 60 * 60 * 1000;

  for (const notification of notifications) {
    const lastGroup = grouped[grouped.length - 1];

    if (
      lastGroup &&
      lastGroup.type === notification.type &&
      lastGroup.fromUserId === notification.fromUserId &&
      Math.abs(lastGroup.createdAt.getTime() - notification.createdAt.getTime()) <= ONE_HOUR
    ) {
      // Merge into existing group
      lastGroup.groupedCount = (lastGroup.groupedCount ?? 0) + 1;
      lastGroup.groupedIds = [...(lastGroup.groupedIds ?? []), notification.id];

      // Update the title to reflect grouping
      if (lastGroup.groupedCount === 1) {
        // First merge: "X and 1 other liked you"
        lastGroup.body = getGroupedBody(lastGroup.type, lastGroup.groupedCount + 1);
      } else {
        lastGroup.body = getGroupedBody(lastGroup.type, lastGroup.groupedCount + 1);
      }
    } else {
      // Start a new group
      grouped.push({
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        body: notification.body,
        isRead: notification.isRead,
        fromUserId: notification.fromUserId,
        entityId: notification.entityId,
        entityType: notification.entityType,
        imageUrl: notification.imageUrl,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        groupedCount: 0,
        groupedIds: [],
      });
    }
  }

  // Get unread count
  const unreadCount = await getUnreadCount(userId);

  // Next cursor is the createdAt of the last raw notification
  const lastNotification = notifications[notifications.length - 1];
  const nextCursor = hasMore && lastNotification
    ? lastNotification.createdAt.toISOString()
    : null;

  return {
    notifications: grouped,
    unreadCount,
    hasMore,
    nextCursor,
  };
}

/**
 * Generate a grouped body text based on notification type and count.
 */
function getGroupedBody(type: NotificationType, count: number): string {
  const others = count - 1;
  switch (type) {
    case 'someone_liked':
      return `${others + 1} people liked you`;
    case 'superlike_received':
      return `You received ${count} Super Likes`;
    case 'new_match':
      return `You have ${count} new matches`;
    case 'new_message':
      return `${count} new messages`;
    case 'profile_viewed':
      return `${count} people viewed your profile`;
    default:
      return `${count} notifications`;
  }
}
