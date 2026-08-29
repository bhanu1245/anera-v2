import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// PUT /api/profile/photos/reorder - Reorder photos
// PROTECTED: Verifies all photo ownership via session
export async function PUT(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const userId = authResult; // AUTHENTICATED user

    const body = await request.json();
    // ⚠️ Ignore userId in body — session userId is authoritative
    const { photoOrders } = body as {
      photoOrders: { id: string; order: number }[];
    };

    if (!photoOrders || !Array.isArray(photoOrders)) {
      return NextResponse.json({ error: 'photoOrders are required' }, { status: 400 });
    }

    // ✅ Find the authenticated user's profile
    const profile = await db.profile.findUnique({ where: { userId } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // ✅ Verify ALL photos belong to the authenticated user
    const photoIds = photoOrders.map((p) => p.id);
    const photos = await db.photo.findMany({
      where: { id: { in: photoIds } },
      include: { profile: true },
    });

    for (const photo of photos) {
      if (photo.profile.userId !== userId) {
        return NextResponse.json(
          { error: `You do not have permission to reorder photo ${photo.id}.` },
          { status: 403 }
        );
      }
    }

    // Update each photo's order
    await db.$transaction(
      photoOrders.map(({ id, order }) =>
        db.photo.updateMany({
          where: { id, profileId: profile.id },
          data: { order },
        })
      )
    );

    const updatedPhotos = await db.photo.findMany({
      where: { profileId: profile.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ photos: updatedPhotos });
  } catch (error) {
    console.error('Error reordering photos:', error);
    return NextResponse.json({ error: 'Failed to reorder photos' }, { status: 500 });
  }
}
