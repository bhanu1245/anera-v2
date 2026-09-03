import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { validationError } from '@/lib/api/errors';
import { validatePreferencesUpdate } from '@/lib/preferences/validation';
import { MAX_AGE_YEARS, MIN_AGE_YEARS } from '@/lib/profile/constants';

/**
 * Anera V2 — the authenticated user's matching preferences.
 *
 * Authority: docs/API-SPECIFICATION.md §4 (`GET` / `PATCH`, auth required),
 *            docs/02-APP-FLOW.md §2.9, docs/BACKEND-SCHEMA.md §2.
 *
 * New in V2. The MVP had no preference model at all, which is why everyone
 * saw everyone (`IG-16`).
 *
 * These are stored preferences only. **Nothing reads them yet** — discovery,
 * filtering and ranking are Phase 2 (`ROADMAP.md`). Storing a preference and
 * acting on one are separate pieces of work, and only the first is authorized
 * here.
 *
 * As with the profile, the owner comes from the session and there is no
 * parameter that could name another user.
 */

/** The schema's defaults, for a user who has never saved preferences. */
const DEFAULTS = {
  minAge: MIN_AGE_YEARS,
  maxAge: MAX_AGE_YEARS,
  genderPreference: '',
};

function serialize(prefs: { minAge: number; maxAge: number; genderPreference: string }) {
  return {
    minAge: prefs.minAge,
    maxAge: prefs.maxAge,
    genderPreference: prefs.genderPreference,
    // `maxDistanceKm` is intentionally absent from the contract: it is inert
    // until the location model is decided (`OQ-B05`), and exposing it would
    // invite clients to store a number with no agreed meaning.
  };
}

/**
 * GET — the caller's effective preferences.
 *
 * Returns the defaults rather than 404 when nothing is stored. Every user has
 * preferences conceptually; the row is just where a change is recorded. The
 * specification documents no POST, so there is no "create preferences" step
 * for a 404 to send a client to.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const stored = await db.preferences.findUnique({ where: { userId: auth.userId } });

  return NextResponse.json({ data: { preferences: serialize(stored ?? DEFAULTS) } });
}

/**
 * PATCH — partial update, creating the row on first use.
 *
 * Upsert rather than update-or-404, for the same reason GET returns defaults:
 * there is no documented endpoint that would create the row first.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);

  const current = await db.preferences.findUnique({ where: { userId: auth.userId } });
  const parsed = validatePreferencesUpdate(body, current ?? DEFAULTS);
  if (!parsed.ok) return validationError(parsed.errors);

  const updated = await db.preferences.upsert({
    where: { userId: auth.userId },
    create: { userId: auth.userId, ...DEFAULTS, ...parsed.value },
    update: parsed.value,
  });

  return NextResponse.json({ data: { preferences: serialize(updated) } });
}
