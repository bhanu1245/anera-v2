import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { recordAction } from '@/lib/engagement';

// POST /api/swipe - Record a swipe action (like/pass/superlike)
// PROTECTED: The authenticated user swipes on a target profile
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'targetUserId and action are required' },
        { status: 400 }
      );
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "like", "pass", or "superlike"' },
        { status: 400 }
      );
    }

    // Users cannot swipe on themselves
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot swipe on yourself.' },
        { status: 400 }
      );
    }

    // Check target profile exists
    const targetProfile = await db.profile.findUnique({
      where: { userId: targetUserId },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Target profile not found.' },
        { status: 404 }
      );
    }

    // Get the swiping user's profile for notification data
    const swiperProfile = await db.profile.findUnique({
      where: { userId },
      select: { name: true, photos: { where: { isPrimary: true }, take: 1 } },
    });

    // Check if already swiped (idempotent - return existing result)
    const existingSwipe = await db.swipe.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
    });

    if (existingSwipe) {
      // Already swiped - return the existing result
      const isMatch =
        existingSwipe.action !== 'pass' &&
        (await checkMutualLike(userId, targetUserId));

      return NextResponse.json({
        success: true,
        userId,
        targetUserId,
        action: existingSwipe.action,
        isMatch,
        message: 'Swipe already recorded',
      });
    }

    // Record the swipe
    await db.swipe.create({
      data: {
        fromUserId: userId,
        toUserId: targetUserId,
        action,
      },
    });

    // Record engagement action
    recordAction(userId, 'swipe').catch(() => {});

    // ─── Create notifications based on swipe action ────────────────────────
    const swiperName = swiperProfile?.name || 'Someone';
    const swiperPhoto = swiperProfile?.photos?.[0]?.url || null;

    // Run notification creation in background (don't block the response)
    const notificationPromises: Promise<unknown>[] = [];

    if (action === 'like') {
      // Notify the target: "someone liked you"
      notificationPromises.push(
        createNotification({
          userId: targetUserId,
          type: 'someone_liked',
          title: 'Someone likes you! 💕',
          body: `${swiperName} liked your profile.`,
          fromUserId: userId,
          entityType: 'profile',
          imageUrl: swiperPhoto,
        }).catch(() => {})
      );
    }

    if (action === 'superlike') {
      // Notify the target: "superlike received"
      notificationPromises.push(
        createNotification({
          userId: targetUserId,
          type: 'superlike_received',
          title: 'You got a Super Like! ⭐',
          body: `${swiperName} Super Liked you! You're special.`,
          fromUserId: userId,
          entityType: 'profile',
          imageUrl: swiperPhoto,
        }).catch(() => {})
      );
    }

    // Check for mutual like (match) if action is like or superlike
    let isMatch = false;
    let match = null;

    if (action === 'like' || action === 'superlike') {
      const mutualLike = await checkMutualLike(userId, targetUserId);

      if (mutualLike) {
        isMatch = true;

        // Create match record (with sorted user IDs for uniqueness)
        const [user1Id, user2Id] =
          userId < targetUserId
            ? [userId, targetUserId]
            : [targetUserId, userId];

        try {
          match = await db.match.create({
            data: { user1Id, user2Id },
          });
        } catch {
          // Match might already exist (race condition) - find it
          match = await db.match.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
          });
        }

        // Notify BOTH users about the match
        if (match) {
          const targetName = targetProfile.name || 'Someone';

          // Notify the swiper
          notificationPromises.push(
            createNotification({
              userId,
              type: 'new_match',
              title: "It's a Match! 🎉",
              body: `You and ${targetName} liked each other!`,
              fromUserId: targetUserId,
              entityId: match.id,
              entityType: 'match',
              imageUrl: targetProfile.photos?.[0]?.url || null,
            }).catch(() => {})
          );

          // Notify the target
          notificationPromises.push(
            createNotification({
              userId: targetUserId,
              type: 'new_match',
              title: "It's a Match! 🎉",
              body: `You and ${swiperName} liked each other!`,
              fromUserId: userId,
              entityId: match.id,
              entityType: 'match',
              imageUrl: swiperPhoto,
            }).catch(() => {})
          );

          // Record match engagement
          recordAction(userId, 'match').catch(() => {});
          recordAction(targetUserId, 'match').catch(() => {});
        }
      }
    }

    // Wait for all notifications to be created (but don't block too long)
    await Promise.race([
      Promise.all(notificationPromises),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    return NextResponse.json({
      success: true,
      userId,
      targetUserId,
      action,
      isMatch,
      match: match
        ? {
            id: match.id,
            user1Id: match.user1Id,
            user2Id: match.user2Id,
            createdAt: match.createdAt.toISOString(),
            profile: isMatch
              ? {
                  ...targetProfile,
                  interests: JSON.parse(targetProfile.interests),
                }
              : undefined,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}

/**
 * Check if there's a mutual like between two users.
 * Returns true if targetUserId has liked fromUserId.
 */
async function checkMutualLike(
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  const reverseSwipe = await db.swipe.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId },
    },
  });

  return reverseSwipe !== null && ['like', 'superlike'].includes(reverseSwipe.action);
}
