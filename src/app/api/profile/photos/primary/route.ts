import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// PUT /api/profile/photos/primary - Set a photo as primary
// PROTECTED: Verifies photo ownership via session
export async function PUT(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const { userId } = authResult; // From the server session only (D37)

    const body = await request.json();
    // ⚠️ Ignore userId in body — session userId is authoritative
    const { photoId } = body;

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    }

    // Find the photo
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: { profile: true },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // ✅ Ownership check: Photo must belong to the authenticated user
    if (photo.profile.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this photo.' },
        { status: 403 }
      );
    }

    // Unset all current primaries for this profile
    await db.photo.updateMany({
      where: { profileId: photo.profileId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set the selected photo as primary
    await db.photo.update({
      where: { id: photoId },
      data: { isPrimary: true },
    });

    const photos = await db.photo.findMany({
      where: { profileId: photo.profileId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error setting primary photo:', error);
    return NextResponse.json({ error: 'Failed to set primary photo' }, { status: 500 });
  }
}
