/**
 * Anera V2 — profile field limits.
 *
 * Authority: docs/00-MASTER-SPECIFICATION.md §266 (`R-10`),
 *            docs/02-APP-FLOW.md §2.6, docs/BACKEND-SCHEMA.md §2.
 *
 * These are the limits the MVP already enforced, recorded as observed
 * behaviour `R-10`: "Interests are capped at 10; bio at 500 chars; name at
 * 50; city at 100." They are **not ratified requirements** — `OQ-B07` asks
 * which of the `R-01`…`R-25` behaviours are approved, and it is unresolved.
 *
 * They are preserved rather than re-chosen precisely because inventing new
 * numbers would be worse: a limit that already exists and is documented is
 * evidence, whereas a fresh one would be an unapproved requirement smuggled
 * into the schema layer.
 */

/** PROVISIONAL — `OQ-B07`. */
export const DISPLAY_NAME_MAX = 50;
/** PROVISIONAL — `OQ-B07`. */
export const BIO_MAX = 500;
/** PROVISIONAL — `OQ-B07`. */
export const CITY_MAX = 100;
/** PROVISIONAL — `OQ-B07`. */
export const INTERESTS_MAX = 10;

/**
 * Structural bounds for `gender` and `intent`.
 *
 * Deliberately NOT an allowed-value list. The value sets are unresolved:
 * `OQ-B07` (ratification of existing behaviour) and `OQ-P01`, which asks
 * whether the non-dating `networking` and `friendship` intents survive at
 * all. `BACKEND-SCHEMA.md` stores both as `String`, not a Prisma enum, and
 * the schema comment says validation stays in the application layer "until
 * those are decided".
 *
 * So these are length bounds only. Checking against the current option lists
 * in `src/types/profile.ts` would ratify an open question by implementation.
 */
export const GENDER_MAX = 40;
export const INTENT_MAX = 40;
export const INTEREST_MAX = 50;

/**
 * Minimum age, enforced server-side.
 *
 * Authority: docs/02-APP-FLOW.md §2.6 — "Age floor 18 enforced server-side",
 * and docs/TESTING-STRATEGY.md §4.2 #20. This one is a requirement, not a
 * preserved behaviour.
 */
export const MIN_AGE_YEARS = 18;

/**
 * Upper sanity bound on age, used to reject implausible birth dates.
 * Matches the `preferences.maxAge` default in the schema.
 */
export const MAX_AGE_YEARS = 120;
