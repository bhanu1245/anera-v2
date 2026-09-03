import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

/**
 * Unauthenticated-only route group.
 *
 * Authority: docs/02-APP-FLOW.md §2 (`LOCKED (D37)` — "the session check is a
 * server concern... the server resolves the session before render"),
 * §2.2/§2.3 edge case "signup/login while authenticated".
 *
 * The guard runs on the server, before any of this group's pages render, and
 * asks PostgreSQL whether the session is real (`getCurrentSession`). It is the
 * same authority the API routes use — there is no second one (D37).
 *
 * An authenticated visitor is sent to the landing route rather than to a
 * specific destination, so that one place decides where a signed-in user
 * belongs (§2.1).
 *
 * Reading the cookie makes every page in this group dynamic, which is required:
 * a cached render would serve a stale authentication decision.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentSession()) {
    redirect(ROUTES.landing);
  }

  return <>{children}</>;
}
