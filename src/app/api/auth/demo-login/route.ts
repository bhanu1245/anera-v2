import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

// POST /api/auth/demo-login - Create a demo user session (dev mode)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    const userEmail = email || 'demo@anera.app';

    // Find or create user
    let user = await db.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      user = await db.user.create({
        data: { email: userEmail, name: 'Demo User' },
      });
    }

    // Create session token
    const token = createSessionToken(user.id);

    // Create profile if it doesn't exist
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
      });
    }

    // Return with session cookie + token in body (for cross-origin fallback)
    // The token in the body allows the client to store it and send it via
    // the Authorization header when cookies are silently dropped by the browser
    // in cross-origin sandbox/preview environments.
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      token,
      profile: { ...profile, interests: JSON.parse(profile.interests) },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Error creating demo session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
