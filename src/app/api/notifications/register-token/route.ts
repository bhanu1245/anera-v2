import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// ─── POST /api/notifications/register-token ────────────────────────────────
// Register a device token for push notifications.
// Body: { token: string, platform: string }

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const body = await request.json();

    const { token, platform } = body;

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'Platform is required (ios, android, web)' },
        { status: 400 }
      );
    }

    // Validate platform value
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Deactivate any existing tokens for this user with the same token value
    // (handles re-registration gracefully)
    await db.deviceToken.updateMany({
      where: {
        userId,
        token,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create or reactivate the device token
    const deviceToken = await db.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: 'Device token registered successfully',
      deviceToken: {
        id: deviceToken.id,
        platform: deviceToken.platform,
        isActive: deviceToken.isActive,
      },
    });
  } catch (error) {
    console.error('[POST /api/notifications/register-token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register device token' },
      { status: 500 }
    );
  }
}
