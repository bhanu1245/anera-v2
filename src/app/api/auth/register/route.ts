import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/auth/register - Create a new user account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name } = body;

    // ─── Validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be less than 128 characters' },
        { status: 400 }
      );
    }

    const displayName = (name || '').trim();
    if (!displayName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (displayName.length > 50) {
      return NextResponse.json(
        { error: 'Name must be less than 50 characters' },
        { status: 400 }
      );
    }

    // ─── Check if email already exists ───────────────────────────────────
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // ─── Create user with hashed password ────────────────────────────────
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        passwordHash,
      },
    });

    // ─── Create session ──────────────────────────────────────────────────
    const token = createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      token,
      needsOnboarding: true, // New users need to create a profile
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
