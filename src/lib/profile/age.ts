import { MAX_AGE_YEARS, MIN_AGE_YEARS } from './constants';

/**
 * Anera V2 — age derivation.
 *
 * Authority: docs/BACKEND-SCHEMA.md §2.1 — `birthDate` replaces the MVP's
 *            stored `age` integer, "which was wrong the day after it was
 *            written". Age is derived on read, never stored.
 *
 * docs/02-APP-FLOW.md §2.6 requires the 18 floor be enforced server-side.
 */

/**
 * Whole years elapsed, in UTC.
 *
 * UTC on both sides deliberately: the server's local timezone must not decide
 * whether someone is eligible. A birthday is a calendar date, not an instant,
 * so comparing calendar components avoids the off-by-one a millisecond
 * subtraction produces around midnight and around leap days.
 */
export function deriveAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();

  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayDelta = now.getUTCDate() - birthDate.getUTCDate();

  // Birthday not yet reached this year.
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age;
}

export type AgeCheck =
  | { ok: true; age: number }
  | { ok: false; reason: 'invalid' | 'future' | 'under-age' | 'implausible' };

/**
 * Validates a birth date and the age it implies.
 *
 * Returns a reason rather than a message so the caller controls the wording;
 * `under-age` in particular must not be paraphrased into something that
 * reveals more than the policy.
 */
export function checkBirthDate(value: Date, now: Date = new Date()): AgeCheck {
  if (Number.isNaN(value.getTime())) {
    return { ok: false, reason: 'invalid' };
  }
  if (value.getTime() > now.getTime()) {
    return { ok: false, reason: 'future' };
  }

  const age = deriveAge(value, now);

  if (age < MIN_AGE_YEARS) {
    return { ok: false, reason: 'under-age' };
  }
  if (age > MAX_AGE_YEARS) {
    return { ok: false, reason: 'implausible' };
  }

  return { ok: true, age };
}

/**
 * Parses a date-only string (`YYYY-MM-DD`) as UTC midnight.
 *
 * Accepts only that shape. A bare `new Date(string)` would take
 * "2000-13-45", timezone-shifted values and free-text, all of which either
 * throw off the age calculation or silently become `Invalid Date` later.
 */
export function parseBirthDate(input: unknown): Date | null {
  if (typeof input !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  // Rejects overflow like 2001-02-30, which Date.UTC would roll into March.
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}
