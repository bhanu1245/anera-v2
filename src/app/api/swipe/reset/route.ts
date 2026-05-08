import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/swipe/reset - Delete ALL swipes and matches for the authenticated user
// This allows the user to see profiles again in discover
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    // Delete all swipes where the user is the swiper
    const deletedSwipes = await db.swipe.deleteMany({
      where: { fromUserId: userId },
    });

    // Delete all matches involving the user
    const deletedMatches = await db.match.deleteMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    return NextResponse.json({
      success: true,
      deletedSwipes: deletedSwipes.count,
      deletedMatches: deletedMatches.count,
      message: `Reset complete: deleted ${deletedSwipes.count} swipes and ${deletedMatches.count} matches`,
    });
  } catch (error) {
    console.error('Error resetting swipes:', error);
    return NextResponse.json(
      { error: 'Failed to reset swipes' },
      { status: 500 }
    );
  }
}
