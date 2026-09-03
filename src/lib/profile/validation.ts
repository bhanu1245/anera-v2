import { checkBirthDate, parseBirthDate } from './age';
import {
  BIO_MAX,
  CITY_MAX,
  DISPLAY_NAME_MAX,
  GENDER_MAX,
  INTENT_MAX,
  INTEREST_MAX,
  INTERESTS_MAX,
  MIN_AGE_YEARS,
} from './constants';

/**
 * Anera V2 — server-side profile validation.
 *
 * Authority: docs/02-APP-FLOW.md §2.7 ("server-side validation authoritative"),
 *            docs/API-SPECIFICATION.md §2, docs/SECURITY-GUIDELINES.md.
 *
 * This is the authority. Client-side checks exist for the sake of the person
 * filling in the form; they are never relied upon, and every field is
 * re-validated here regardless of what the browser claims to have checked.
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface ProfileInput {
  displayName: string;
  birthDate: Date;
  gender: string;
  bio: string;
  city: string;
  intent: string;
  interests: string[];
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

/** Required, trimmed, length-bounded string. */
function requiredString(
  raw: unknown,
  field: string,
  max: number,
  errors: FieldError[],
): string | null {
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${field} is required` });
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    errors.push({ field, message: `${field} is required` });
    return null;
  }
  if (trimmed.length > max) {
    errors.push({ field, message: `${field} must be at most ${max} characters` });
    return null;
  }
  return trimmed;
}

/** Optional, trimmed, length-bounded string. Absent and empty both mean "". */
function optionalString(
  raw: unknown,
  field: string,
  max: number,
  errors: FieldError[],
): string | null {
  if (raw === undefined || raw === null) return '';
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${field} must be text` });
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length > max) {
    errors.push({ field, message: `${field} must be at most ${max} characters` });
    return null;
  }
  return trimmed;
}

/**
 * Normalises the interest list: trims, drops blanks, removes duplicates.
 *
 * Duplicates are removed rather than rejected because `profile_interests` has
 * a composite primary key of (profileId, interest); sending the same interest
 * twice is a client slip, not an attack, and would otherwise surface as a
 * database constraint error.
 */
function interestList(raw: unknown, errors: FieldError[]): string[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    errors.push({ field: 'interests', message: 'interests must be a list' });
    return null;
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of raw) {
    if (typeof entry !== 'string') {
      errors.push({ field: 'interests', message: 'each interest must be text' });
      return null;
    }
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length > INTEREST_MAX) {
      errors.push({
        field: 'interests',
        message: `each interest must be at most ${INTEREST_MAX} characters`,
      });
      return null;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  if (out.length > INTERESTS_MAX) {
    errors.push({ field: 'interests', message: `at most ${INTERESTS_MAX} interests` });
    return null;
  }

  return out;
}

/** Shared birth-date handling for both create and update. */
function birthDateField(raw: unknown, errors: FieldError[]): Date | null {
  const parsed = parseBirthDate(raw);
  if (!parsed) {
    errors.push({ field: 'birthDate', message: 'Enter a valid date of birth (YYYY-MM-DD)' });
    return null;
  }

  const check = checkBirthDate(parsed);
  if (!check.ok) {
    const message =
      check.reason === 'under-age'
        ? `You must be at least ${MIN_AGE_YEARS} to use Anera`
        : check.reason === 'future'
          ? 'Date of birth cannot be in the future'
          : 'Enter a valid date of birth';
    errors.push({ field: 'birthDate', message });
    return null;
  }

  return parsed;
}

/**
 * Validates a complete profile — used by `POST /api/profile`.
 *
 * `gender` and `intent` are checked structurally only. Their value sets are
 * unresolved (`OQ-B07`, `OQ-P01`), and checking them against the option lists
 * in `src/types/profile.ts` would ratify an open question by implementation.
 */
export function validateProfileCreate(body: unknown): ValidationResult<ProfileInput> {
  const errors: FieldError[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: [{ field: 'body', message: 'A JSON object is required' }] };
  }
  const input = body as Record<string, unknown>;

  const displayName = requiredString(input.displayName, 'displayName', DISPLAY_NAME_MAX, errors);
  const birthDate = birthDateField(input.birthDate, errors);
  const gender = requiredString(input.gender, 'gender', GENDER_MAX, errors);
  const bio = optionalString(input.bio, 'bio', BIO_MAX, errors);
  const city = optionalString(input.city, 'city', CITY_MAX, errors);
  const intent = optionalString(input.intent, 'intent', INTENT_MAX, errors);
  const interests = interestList(input.interests, errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      displayName: displayName!,
      birthDate: birthDate!,
      gender: gender!,
      bio: bio!,
      city: city!,
      intent: intent!,
      interests: interests!,
    },
  };
}

/**
 * Validates a partial profile — used by `PATCH /api/profile`.
 *
 * Only supplied keys are considered. An omitted key leaves the stored value
 * alone; a supplied key must be valid, so PATCH can never be used to bypass a
 * rule that POST enforces — the age floor in particular.
 */
export function validateProfileUpdate(body: unknown): ValidationResult<Partial<ProfileInput>> {
  const errors: FieldError[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: [{ field: 'body', message: 'A JSON object is required' }] };
  }
  const input = body as Record<string, unknown>;
  const value: Partial<ProfileInput> = {};

  const has = (key: string) => Object.prototype.hasOwnProperty.call(input, key);

  if (has('displayName')) {
    const v = requiredString(input.displayName, 'displayName', DISPLAY_NAME_MAX, errors);
    if (v !== null) value.displayName = v;
  }
  if (has('birthDate')) {
    const v = birthDateField(input.birthDate, errors);
    if (v !== null) value.birthDate = v;
  }
  if (has('gender')) {
    const v = requiredString(input.gender, 'gender', GENDER_MAX, errors);
    if (v !== null) value.gender = v;
  }
  if (has('bio')) {
    const v = optionalString(input.bio, 'bio', BIO_MAX, errors);
    if (v !== null) value.bio = v;
  }
  if (has('city')) {
    const v = optionalString(input.city, 'city', CITY_MAX, errors);
    if (v !== null) value.city = v;
  }
  if (has('intent')) {
    const v = optionalString(input.intent, 'intent', INTENT_MAX, errors);
    if (v !== null) value.intent = v;
  }
  if (has('interests')) {
    const v = interestList(input.interests, errors);
    if (v !== null) value.interests = v;
  }

  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(value).length === 0) {
    return { ok: false, errors: [{ field: 'body', message: 'No editable fields were supplied' }] };
  }

  return { ok: true, value };
}
