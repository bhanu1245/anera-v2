import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/discover - Get profiles to swipe on
// Returns profiles that the authenticated user hasn't swiped on yet
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    // Get IDs of users the current user has already swiped on
    const swipedUserIds = await db.swipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    const excludeIds = [userId, ...swipedUserIds.map((s) => s.toUserId)];

    // Get profiles not yet swiped on, with photos
    const profiles = await db.profile.findMany({
      where: {
        isOnboarded: true,
        userId: { notIn: excludeIds },
      },
      include: {
        photos: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Transform for API response
    const discoverProfiles = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      interests: JSON.parse(profile.interests),
      city: profile.city,
      relationshipIntent: profile.relationshipIntent,
      isOnboarded: profile.isOnboarded,
      photos: profile.photos.map((p) => ({
        id: p.id,
        url: p.url,
        order: p.order,
        isPrimary: p.isPrimary,
      })),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      // Computed fields
      isVerified: false,
    }));

    return NextResponse.json({
      profiles: discoverProfiles,
      hasMore: profiles.length >= 20,
    });
  } catch (error) {
    console.error('Error fetching discover profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}
