import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireOwnership, getCurrentUser } from '@/lib/auth';

// GET /api/profile - Get a user's profile
// Public: Anyone can view a profile (for discover).
// The userId comes from query params since viewing other profiles is allowed.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const profile = await db.profile.findUnique({
      where: { userId },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse interests from JSON string
    const parsedProfile = {
      ...profile,
      interests: JSON.parse(profile.interests),
    };

    return NextResponse.json({ profile: parsedProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profile - Update the authenticated user's profile
// PROTECTED: userId comes from session, NOT request body.
export async function PUT(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session cookie, not request body
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const userId = authResult; // This is the AUTHENTICATED user's ID

    const body = await request.json();
    // ⚠️ We ignore any userId in the body — only the session userId is used
    const { name, age, gender, bio, interests, city, relationshipIntent } = body;

    // Validate required fields
    const VALID_GENDERS = ['male', 'female', 'non-binary', 'other'] as const;
    const VALID_INTENTS = ['casual', 'serious', 'networking', 'friendship', 'not-sure', ''] as const;
    const MAX_BIO_LENGTH = 500;
    const MAX_INTERESTS = 10;
    const MAX_NAME_LENGTH = 50;
    const MAX_CITY_LENGTH = 100;

    if (name !== undefined && (!name || name.trim().length < 1)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (name !== undefined && name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name too long (max ${MAX_NAME_LENGTH} chars)` }, { status: 400 });
    }
    if (age !== undefined && (age < 18 || age > 120)) {
      return NextResponse.json({ error: 'Age must be between 18 and 120' }, { status: 400 });
    }
    if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
    }
    if (bio !== undefined && bio.length > MAX_BIO_LENGTH) {
      return NextResponse.json({ error: `Bio too long (max ${MAX_BIO_LENGTH} chars)` }, { status: 400 });
    }
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return NextResponse.json({ error: 'Interests must be an array' }, { status: 400 });
      }
      if (interests.length > MAX_INTERESTS) {
        return NextResponse.json({ error: `Maximum ${MAX_INTERESTS} interests allowed` }, { status: 400 });
      }
    }
    if (city !== undefined && city.length > MAX_CITY_LENGTH) {
      return NextResponse.json({ error: `City name too long (max ${MAX_CITY_LENGTH} chars)` }, { status: 400 });
    }
    if (relationshipIntent !== undefined && !VALID_INTENTS.includes(relationshipIntent)) {
      return NextResponse.json({ error: 'Invalid relationship intent value' }, { status: 400 });
    }

    // Check if profile exists (for the AUTHENTICATED user)
    const existing = await db.profile.findUnique({ where: { userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found. Create one first.' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (interests !== undefined) updateData.interests = JSON.stringify(interests);
    if (city !== undefined) updateData.city = city;
    if (relationshipIntent !== undefined) updateData.relationshipIntent = relationshipIntent;
    updateData.isOnboarded = true;

    // ✅ Update ONLY the authenticated user's profile
    const profile = await db.profile.update({
      where: { userId },
      data: updateData,
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    const parsedProfile = {
      ...profile,
      interests: JSON.parse(profile.interests),
    };

    return NextResponse.json({ profile: parsedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// POST /api/profile - Create a profile for the authenticated user
// PROTECTED: userId comes from session, NOT request body.
export async function POST(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session cookie
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const userId = authResult; // AUTHENTICATED user

    const body = await request.json();
    // ⚠️ Ignore userId in body — only session userId is used
    const { name, age, gender, bio, interests, city, relationshipIntent } = body;

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!age || age < 18 || age > 120) {
      return NextResponse.json({ error: 'Valid age (18-120) is required' }, { status: 400 });
    }
    if (!gender || !['male', 'female', 'non-binary', 'other'].includes(gender)) {
      return NextResponse.json({ error: 'Valid gender is required' }, { status: 400 });
    }

    // Check if profile already exists for THIS user
    const existing = await db.profile.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    // ✅ Create profile for the AUTHENTICATED user only
    const profile = await db.profile.create({
      data: {
        userId, // From session, not request body
        name: name.trim(),
        age,
        gender,
        bio: bio || '',
        interests: JSON.stringify(interests || []),
        city: city || '',
        relationshipIntent: relationshipIntent || '',
        isOnboarded: true,
      },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    const parsedProfile = {
      ...profile,
      interests: JSON.parse(profile.interests),
    };

    return NextResponse.json({ profile: parsedProfile }, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
