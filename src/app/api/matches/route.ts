import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/matches - Get the authenticated user's matches
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    // Find all matches where the user is either user1 or user2
    const matches = await db.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each match, get the other user's profile
    const matchesWithProfiles = await Promise.all(
      matches.map(async (match) => {
        const otherUserId =
          match.user1Id === userId ? match.user2Id : match.user1Id;

        const profile = await db.profile.findUnique({
          where: { userId: otherUserId },
          include: { photos: { orderBy: { order: 'asc' } } },
        });

        return {
          id: match.id,
          user1Id: match.user1Id,
          user2Id: match.user2Id,
          createdAt: match.createdAt.toISOString(),
          profile: profile
            ? {
                ...profile,
                interests: JSON.parse(profile.interests),
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      matches: matchesWithProfiles,
      userId,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

// POST /api/matches - Create/check a match (handled by swipe endpoint now)
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  return NextResponse.json({
    message: 'Matches are created automatically when both users like each other. Use the swipe endpoint.',
    userId,
  });
}
