import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/login - Authenticate with email + password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    // ─── Validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // ─── Find user ───────────────────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: { include: { photos: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ─── Check password ──────────────────────────────────────────────────
    // Demo/seed users (passwordHash = null) cannot log in via this endpoint
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account does not have a password set. Please register.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ─── Create session ──────────────────────────────────────────────────
    const token = createSessionToken(user.id);

    const profileData = user.profile
      ? { ...user.profile, interests: JSON.parse(user.profile.interests) }
      : null;

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      token,
      profile: profileData,
      needsOnboarding: !user.profile,
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
