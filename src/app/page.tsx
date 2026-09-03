import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

/**
 * Anera V2 — landing (docs/02-APP-FLOW.md §2.1).
 *
 * This file was the entire application: a `'use client'` component that held
 * every screen and switched between them with React state, asked the server
 * "who am I?" from a `useEffect`, and showed a spinner while it waited
 * (`IG-01`-era architecture, recorded in 00-MASTER-SPECIFICATION.md §380).
 * M5 replaces it with the routing that ROADMAP.md Phase 1 requires.
 *
 * It is now the single place that answers the flow's two questions — "session
 * valid?" then "onboarded?" — on the server, before anything renders. Both
 * route groups delegate here rather than duplicating the decision.
 *
 * There is no spinner because there is nothing to wait for: the cookie arrives
 * with the request and the answer is known before the first byte is sent. No
 * hydration gate, no readiness flag (D37).
 *
 * Unauthenticated visitors go to login. `02-APP-FLOW.md` §2.1 records public
 * marketing content as `OPEN / UNDECIDED`, so there is no approved landing
 * content to show them; this preserves what the shell did without inventing
 * a page.
 */
export default async function LandingPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  const profile = await db.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  redirect(profile ? ROUTES.profile : ROUTES.onboarding);
}
