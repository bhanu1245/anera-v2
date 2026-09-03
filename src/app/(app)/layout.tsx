import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

/**
 * Authenticated-only route group.
 *
 * Authority: docs/02-APP-FLOW.md §2 (`LOCKED (D37)`), docs/TESTING-STRATEGY.md
 *            §4.2 #8 ("401 **or redirect** — never protected content, never a
 *            partial render").
 *
 * The session is resolved against PostgreSQL on the server BEFORE any child
 * renders, so an unauthenticated request is redirected without a protected
 * byte ever reaching the browser. Nothing here is hidden client-side.
 *
 * This guard is a rendering decision only. It is not the security boundary and
 * does not replace one: every protected API route independently re-validates
 * the session through `requireAuth` (D37). A user who defeats this redirect
 * gains a page skeleton and no data.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentSession())) {
    redirect(ROUTES.login);
  }

  return <>{children}</>;
}
