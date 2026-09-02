import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { IMAGE_CONSTRAINTS } from '@/types';
import { requireAuth } from '@/lib/auth';

// Magic byte signatures for valid image types
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
  const signatures = IMAGE_SIGNATURES[declaredType];
  if (!signatures) return false;
  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

function sanitizeFilename(filename: string): string {
  const parts = filename.split('.');
  let ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  if (!ALLOWED_EXTENSIONS.includes(ext)) ext = 'jpg';
  return ext;
}

// POST /api/profile/photos - Upload a new photo
// PROTECTED: userId from session, NOT form data.
export async function POST(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const { userId } = authResult; // From the server session only (D37)

    const formData = await request.formData();
    // ⚠️ Ignore userId from form data — session userId is authoritative
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!IMAGE_CONSTRAINTS.ACCEPTED_TYPES.includes(file.type as typeof IMAGE_CONSTRAINTS.ACCEPTED_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid file type. Accepted: ${IMAGE_CONSTRAINTS.ACCEPTED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      const maxMB = IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxMB}MB` },
        { status: 400 }
      );
    }

    // Read file buffer for magic byte validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type. Possible MIME spoofing detected.' },
        { status: 400 }
      );
    }

    // ✅ Check profile for AUTHENTICATED user only
    const profile = await db.profile.findUnique({
      where: { userId },
      include: { photos: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.photos.length >= IMAGE_CONSTRAINTS.MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${IMAGE_CONSTRAINTS.MAX_PHOTOS} photos allowed` },
        { status: 400 }
      );
    }

    // Sanitize and save
    const ext = sanitizeFilename(file.name);
    const filename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    const resolvedPath = path.resolve(filepath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!resolvedPath.startsWith(resolvedUploadDir + path.sep) && resolvedPath !== resolvedUploadDir) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    await writeFile(filepath, buffer);

    const photoUrl = `/uploads/${filename}`;
    const maxOrder = profile.photos.reduce((max, p) => Math.max(max, p.order), -1);
    const isFirstPhoto = profile.photos.length === 0;

    // ✅ Save photo to AUTHENTICATED user's profile only
    const photo = await db.photo.create({
      data: {
        profileId: profile.id,
        url: photoUrl,
        order: maxOrder + 1,
        isPrimary: isFirstPhoto,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

// DELETE /api/profile/photos - Delete a photo
// PROTECTED: Verifies photo ownership via session
export async function DELETE(request: NextRequest) {
  try {
    // ✅ Auth: Get userId from session
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult; // 401
    const { userId } = authResult; // From the server session only (D37)

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    }

    // ⚠️ No userId from query params — we use session userId

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
        { error: 'You do not have permission to delete this photo.' },
        { status: 403 }
      );
    }

    const wasPrimary = photo.isPrimary;
    const profileId = photo.profileId;

    await db.photo.delete({ where: { id: photoId } });

    // Try to delete the file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', photo.url);
      const resolvedPath = path.resolve(filePath);
      const uploadDir = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
      if (resolvedPath.startsWith(uploadDir + path.sep)) {
        await import('fs/promises').then(fs => fs.unlink(resolvedPath)).catch(() => {});
      }
    } catch {}

    // Re-assign primary if needed
    if (wasPrimary) {
      const remaining = await db.photo.findMany({
        where: { profileId },
        orderBy: { order: 'asc' },
      });
      if (remaining.length > 0) {
        await db.photo.update({
          where: { id: remaining[0].id },
          data: { isPrimary: true },
        });
      }
    }

    // Re-order remaining photos
    const remaining = await db.photo.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await db.photo.update({
          where: { id: remaining[i].id },
          data: { order: i },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
