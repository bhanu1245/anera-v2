import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

// POST /api/seed - Create a demo user, profile, and session
// This is a convenience endpoint for development that combines
// user creation + profile seeding + login in one call.
export async function POST() {
  try {
    // Check if demo user already exists
    const existingUser = await db.user.findUnique({ where: { email: 'demo@anera.app' } });

    let user = existingUser;
    if (!user) {
      user = await db.user.create({
        data: { email: 'demo@anera.app', name: 'Demo User' },
      });
    }

    // Check if profile already exists
    const existingProfile = await db.profile.findUnique({ where: { userId: user.id } });

    let profile = existingProfile;
    if (!profile) {
      profile = await db.profile.create({
        data: {
          userId: user.id,
          name: 'Alex Rivera',
          age: 28,
          gender: 'male',
          bio: 'Adventure seeker, coffee lover, and aspiring chef. Looking for someone to explore the city with and try new restaurants!',
          interests: JSON.stringify(['Travel', 'Photography', 'Cooking', 'Coffee', 'Hiking']),
          city: 'Mumbai',
          relationshipIntent: 'serious',
          isOnboarded: true,
        },
        include: { photos: { orderBy: { order: 'asc' } } },
      });
    } else {
      profile = await db.profile.findUnique({
        where: { userId: user.id },
        include: { photos: { orderBy: { order: 'asc' } } },
      });
    }

    // Create session token and set cookie
    const token = createSessionToken(user.id);
    const response = NextResponse.json({
      message: existingProfile ? 'Demo profile already exists' : 'Demo profile created',
      userId: user.id,
      profile: { ...profile!, interests: JSON.parse(profile!.interests) },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
