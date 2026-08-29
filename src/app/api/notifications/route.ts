import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  type NotificationType,
} from '@/lib/notifications';

// ─── GET /api/notifications ────────────────────────────────────────────────
// List notifications with pagination (cursor-based), optional type filter,
// and unreadOnly filter. Returns grouped notifications.

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );
    const cursor = searchParams.get('cursor') || undefined;
    const type = (searchParams.get('type') || undefined) as NotificationType | undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await getNotifications(userId, {
      limit,
      cursor,
      type,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// ─── PUT /api/notifications ────────────────────────────────────────────────
// Mark notifications as read.
// Body: { notificationId?: string } | { markAll: true }

export async function PUT(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const body = await request.json();

    if (body.markAll === true) {
      const result = await markAllRead(userId);
      return NextResponse.json({
        message: 'All notifications marked as read',
        count: result.count,
      });
    }

    if (body.notificationId && typeof body.notificationId === 'string') {
      const notification = await markAsRead(userId, body.notificationId);

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Notification marked as read',
        notification,
      });
    }

    return NextResponse.json(
      { error: 'Provide notificationId or markAll: true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[PUT /api/notifications] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
