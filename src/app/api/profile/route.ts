import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiError, requireAuth } from '@/lib/auth';
import { validationError } from '@/lib/api/errors';
import { deriveAge } from '@/lib/profile/age';
import { validateProfileCreate, validateProfileUpdate } from '@/lib/profile/validation';

/**
 * Anera V2 — the authenticated user's own profile.
 *
 * Authority: docs/API-SPECIFICATION.md §4 (`GET`, `POST`/`PATCH`, auth
 *            required, "userId from session only"), docs/02-APP-FLOW.md
 *            §2.6/§2.7, docs/BACKEND-SCHEMA.md §2, docs/DECISIONS.md D37.
 *
 * Rebuilt for V2, not restored. The MVP's route was removed under Option A
 * (D45) and its worst property is the one deliberately not carried forward:
 * it accepted `?userId=` and returned any user's full profile to anyone
 * (`IG-05`).
 *
 * Here the acting user comes from the server session and nothing else. There
 * is no parameter, header or body field that can name a different user, so
 * there is no identifier to tamper with: the ownership check is not a
 * comparison that could be got wrong, it is the absence of any other way to
 * address the resource.
 *
 * `GET /api/profiles/[id]` — the view of *another* user — is deliberately not
 * implemented. Its field list is unresolved (`OQ-API-01`, `IG-78`).
 */

/** Shapes a profile for its owner. Photos are included for completeness. */
function serialize(profile: {
  id: string;
  displayName: string;
  birthDate: Date;
  gender: string;
  bio: string;
  city: string;
  intent: string;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  interests: { interest: string }[];
  photos: { id: string; url: string; order: number; isPrimary: boolean }[];
}) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    // Sent as a date-only string: it is a calendar date, and an ISO instant
    // would reintroduce the timezone ambiguity `parseBirthDate` avoids.
    birthDate: profile.birthDate.toISOString().slice(0, 10),
    // Derived, never stored (BACKEND-SCHEMA.md §2.1).
    age: deriveAge(profile.birthDate),
    gender: profile.gender,
    bio: profile.bio,
    city: profile.city,
    intent: profile.intent,
    isOnboarded: profile.isOnboarded,
    interests: profile.interests.map((i) => i.interest),
    photos: profile.photos,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

const INCLUDE = {
  interests: { select: { interest: true } },
  photos: {
    select: { id: true, url: true, order: true, isPrimary: true },
    orderBy: { order: 'asc' as const },
  },
};

/** GET — the caller's own profile. 404 when they have not created one. */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const profile = await db.profile.findUnique({
    where: { userId: auth.userId },
    include: INCLUDE,
  });

  if (!profile) {
    return apiError(404, 'PROFILE_NOT_FOUND', 'No profile has been created yet.');
  }

  return NextResponse.json({ data: { profile: serialize(profile) } });
}

/** POST — create the caller's profile. 409 if one already exists. */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = validateProfileCreate(body);
  if (!parsed.ok) return validationError(parsed.errors);

  const { interests, ...fields } = parsed.value;

  const existing = await db.profile.findUnique({
    where: { userId: auth.userId },
    select: { id: true },
  });
  if (existing) {
    return apiError(409, 'PROFILE_EXISTS', 'A profile already exists for this account.');
  }

  // One transaction: a profile that half-exists — created, but without the
  // interests the user chose — is worse than a failed request they can retry.
  const profile = await db.profile.create({
    data: {
      userId: auth.userId,
      ...fields,
      // Completing this form IS onboarding (APP-FLOW.md §2.6).
      isOnboarded: true,
      interests: { create: interests.map((interest) => ({ interest })) },
    },
    include: INCLUDE,
  });

  return NextResponse.json({ data: { profile: serialize(profile) } }, { status: 201 });
}

/** PATCH — partial update of the caller's own profile. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = validateProfileUpdate(body);
  if (!parsed.ok) return validationError(parsed.errors);

  const existing = await db.profile.findUnique({
    where: { userId: auth.userId },
    select: { id: true },
  });
  if (!existing) {
    return apiError(404, 'PROFILE_NOT_FOUND', 'No profile has been created yet.');
  }

  const { interests, ...fields } = parsed.value;

  // Interests are a set, so an update replaces it wholesale rather than
  // merging — otherwise there would be no way to remove one.
  const profile = await db.$transaction(async (tx) => {
    if (interests) {
      await tx.profileInterest.deleteMany({ where: { profileId: existing.id } });
      if (interests.length > 0) {
        await tx.profileInterest.createMany({
          data: interests.map((interest) => ({ profileId: existing.id, interest })),
        });
      }
    }

    return tx.profile.update({
      where: { id: existing.id },
      data: fields,
      include: INCLUDE,
    });
  });

  return NextResponse.json({ data: { profile: serialize(profile) } });
}
