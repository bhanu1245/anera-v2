import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';

/** docs/02-APP-FLOW.md §2.6 — Onboarding. */
export const metadata: Metadata = {
  title: 'Set up your profile · Anera',
};

/**
 * The `(app)` layout has already established that a session exists. This page
 * answers the flow's second question — "onboarded?" (§2.1) — and sends an
 * already-onboarded user to the app rather than re-running setup.
 *
 * The profile lookup is the same one `/api/auth/session` performs; it reads
 * the existing `profiles` table and adds no API and no schema (M6 owns both).
 */
export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const profile = await db.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (profile) redirect(ROUTES.profile);

  return <OnboardingScreen />;
}
