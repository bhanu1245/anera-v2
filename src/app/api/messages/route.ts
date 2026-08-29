import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// GET /api/messages - Get messages for a match
// Query params: matchId (required), cursor (optional), limit (optional, default 50)
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const cursor = searchParams.get('cursor');
  const limitParam = searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100);

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    // Verify user is a participant in this match
    const match = await db.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this match' },
        { status: 403 }
      );
    }

    // Build where clause with optional cursor-based pagination
    const where: Record<string, unknown> = { matchId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Fetch messages + one extra to determine hasMore
    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Get sender profiles for the messages
    const senderIds = [...new Set(resultMessages.map((m) => m.senderId))];
    const senders = await db.profile.findMany({
      where: { userId: { in: senderIds } },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    });

    const senderMap = new Map(
      senders.map((s) => [
        s.userId,
        {
          name: s.name,
          photoUrl: s.photos[0]?.url || null,
        },
      ])
    );

    // Mark unread messages as read (where senderId !== userId)
    await db.message.updateMany({
      where: {
        matchId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Build next cursor from the last message
    const lastMessage = resultMessages[resultMessages.length - 1];
    const nextCursor = hasMore && lastMessage
      ? lastMessage.createdAt.toISOString()
      : null;

    return NextResponse.json({
      messages: resultMessages.map((m) => ({
        id: m.id,
        matchId: m.matchId,
        senderId: m.senderId,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        sender: senderMap.get(m.senderId) || null,
      })),
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const body = await request.json();
    const { matchId, content } = body;

    // Validation
    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required and must be non-empty' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or less' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    // Verify user is a participant in this match
    const match = await db.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return NextResponse.json(
        { error: 'You are not a participant in this match' },
        { status: 403 }
      );
    }

    // Create message
    const message = await db.message.create({
      data: {
        matchId,
        senderId: userId,
        content: trimmedContent,
      },
    });

    // Determine the recipient
    const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // Get sender's profile for notification
    const senderProfile = await db.profile.findUnique({
      where: { userId },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    });

    // Create notification for the recipient
    await createNotification({
      userId: recipientId,
      type: 'new_message',
      title: 'New Message',
      body: `${senderProfile?.name || 'Someone'} sent you a message`,
      fromUserId: userId,
      entityId: matchId,
      entityType: 'message',
      imageUrl: senderProfile?.photos[0]?.url || undefined,
    });

    return NextResponse.json({
      message: {
        id: message.id,
        matchId: message.matchId,
        senderId: message.senderId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        sender: senderProfile
          ? {
              name: senderProfile.name,
              photoUrl: senderProfile.photos[0]?.url || null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
