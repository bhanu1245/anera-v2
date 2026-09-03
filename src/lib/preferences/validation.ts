import { MAX_AGE_YEARS, MIN_AGE_YEARS } from '@/lib/profile/constants';
import type { FieldError, ValidationResult } from '@/lib/profile/validation';

/**
 * Anera V2 — preferences validation.
 *
 * Authority: docs/BACKEND-SCHEMA.md §2 (`preferences`),
 *            docs/02-APP-FLOW.md §2.9, docs/API-SPECIFICATION.md §4.
 *
 * `maxDistanceKm` is deliberately NOT accepted. The schema comment calls it
 * "inert until the location model is decided (`OQ-B05`)", and `city` is
 * free text with no coordinates behind it, so a distance figure would have
 * no meaning to compare against. Accepting one would store a number whose
 * semantics nobody has agreed — the exact failure `BACKEND-SCHEMA.md` §2.1
 * describes for the MVP's stored `age`. The column stays null until
 * `OQ-B05` is resolved.
 */

/** Bounds a preferred-age value. Structural constraint aside, the floor matters. */
export const PREFERENCE_MIN_AGE = MIN_AGE_YEARS;
export const PREFERENCE_MAX_AGE = MAX_AGE_YEARS;

/** Structural bound only — the gender value set is unresolved (`OQ-B07`). */
export const GENDER_PREFERENCE_MAX = 40;

export interface PreferencesInput {
  minAge: number;
  maxAge: number;
  genderPreference: string;
}

function ageField(raw: unknown, field: string, errors: FieldError[]): number | null {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    errors.push({ field, message: `${field} must be a whole number` });
    return null;
  }
  if (raw < PREFERENCE_MIN_AGE) {
    // A safety boundary, not a preference: the platform is 18+, so no
    // preference may express interest in anyone younger.
    errors.push({ field, message: `${field} cannot be below ${PREFERENCE_MIN_AGE}` });
    return null;
  }
  if (raw > PREFERENCE_MAX_AGE) {
    errors.push({ field, message: `${field} cannot be above ${PREFERENCE_MAX_AGE}` });
    return null;
  }
  return raw;
}

/**
 * Validates a partial preferences update.
 *
 * `current` supplies the stored values so a one-sided change is still checked
 * as a range: raising `minAge` above the stored `maxAge` must fail even though
 * `maxAge` was not part of the request.
 */
export function validatePreferencesUpdate(
  body: unknown,
  current: { minAge: number; maxAge: number },
): ValidationResult<Partial<PreferencesInput>> {
  const errors: FieldError[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: [{ field: 'body', message: 'A JSON object is required' }] };
  }
  const input = body as Record<string, unknown>;
  const has = (key: string) => Object.prototype.hasOwnProperty.call(input, key);
  const value: Partial<PreferencesInput> = {};

  if (has('minAge')) {
    const v = ageField(input.minAge, 'minAge', errors);
    if (v !== null) value.minAge = v;
  }
  if (has('maxAge')) {
    const v = ageField(input.maxAge, 'maxAge', errors);
    if (v !== null) value.maxAge = v;
  }
  if (has('genderPreference')) {
    if (typeof input.genderPreference !== 'string') {
      errors.push({ field: 'genderPreference', message: 'genderPreference must be text' });
    } else {
      const trimmed = input.genderPreference.trim();
      if (trimmed.length > GENDER_PREFERENCE_MAX) {
        errors.push({
          field: 'genderPreference',
          message: `genderPreference must be at most ${GENDER_PREFERENCE_MAX} characters`,
        });
      } else {
        // Structural only — the value set is unresolved (OQ-B07).
        value.genderPreference = trimmed;
      }
    }
  }

  if (has('maxDistanceKm')) {
    errors.push({
      field: 'maxDistanceKm',
      message: 'Distance preferences are not available yet',
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  if (Object.keys(value).length === 0) {
    return { ok: false, errors: [{ field: 'body', message: 'No editable fields were supplied' }] };
  }

  // Range check against the values that will be stored, not only those sent.
  const effectiveMin = value.minAge ?? current.minAge;
  const effectiveMax = value.maxAge ?? current.maxAge;
  if (effectiveMin > effectiveMax) {
    return {
      ok: false,
      errors: [{ field: 'minAge', message: 'minAge cannot be greater than maxAge' }],
    };
  }

  return { ok: true, value };
}
