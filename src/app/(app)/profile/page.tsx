import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { AppHeader } from '@/components/layout/app-header';
import { ProfileEditor } from '@/components/profile/profile-editor';

/** docs/02-APP-FLOW.md §2.7 — Profile create / edit. */
export const metadata: Metadata = {
  title: 'Your profile · Anera',
};

/**
 * The authenticated app shell, moved out of the single-page component in M5.
 *
 * Note what changed for the better: `userId` now comes from the server session
 * rather than from client state. The shell read it from the Zustand store,
 * which was only ever a cache of what the server said; here it is the server's
 * own answer, resolved before render (D37).
 *
 * A user who has not onboarded is sent to onboarding — the flow's "onboarded?"
 * branch (§2.1).
 */
export default async function ProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const profile = await db.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!profile) redirect(ROUTES.onboarding);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <ProfileEditor userId={session.userId} />
      </main>
    </div>
  );
}
