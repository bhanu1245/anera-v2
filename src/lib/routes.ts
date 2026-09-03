/**
 * Anera V2 — application route paths.
 *
 * Authority: docs/02-APP-FLOW.md §2 (Phase 1 flows), docs/ROADMAP.md
 *            Phase 1 §Frontend ("real routing — retire the single-page shell").
 *
 * The flow names are documented; these URL strings were proposed in M5 and
 * approved by the product owner on 2026-09-03. Collected here so a path is
 * written once and every redirect agrees.
 *
 * Deliberately free of imports: this module is used by Client Components as
 * well as server layouts, so it must never pull the database or the session
 * module into the browser bundle.
 */

export const ROUTES = {
  /** §2.1 Landing. Resolves the session and routes onward. */
  landing: '/',
  /** §2.3 Login. */
  login: '/login',
  /** §2.2 Signup. */
  signup: '/signup',
  /** §2.6 Onboarding. */
  onboarding: '/onboarding',
  /** §2.7 Profile create / edit. */
  profile: '/profile',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
