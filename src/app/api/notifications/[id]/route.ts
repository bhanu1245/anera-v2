import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteNotification } from '@/lib/notifications';

// ─── DELETE /api/notifications/[id] ────────────────────────────────────────
// Delete a single notification (must belong to authenticated user)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const { id } = await params;

    const result = await deleteNotification(userId, id);

    if (!result) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('[DELETE /api/notifications/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
