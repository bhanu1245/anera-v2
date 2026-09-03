'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProfileEditForm } from './profile-edit-form';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { useProfileStore } from '@/stores/profile-store';

/**
 * Anera V2 — profile editor.
 *
 * PHOTO MANAGEMENT IS DELIBERATELY ABSENT (M6, 2026-09-03).
 *
 * `SECURITY-GUIDELINES.md` §9 is `LOCKED` and requires uploads to be "stored
 * outside the web root, served via signed URLs". The implementation that
 * existed here wrote to `public/uploads` — inside the web root, world
 * readable, no access control. That is `IG-18`, and it was already recorded
 * as `DEPRECATED`.
 *
 * It survived only because it was unreachable: no profile could be created,
 * so this editor could not be rendered. M6 makes profile creation work, which
 * would have made that path reachable for the first time. So the upload
 * routes and the photo manager were removed rather than carried forward.
 *
 * `TECH-STACK.md` §3 lists media storage as `OPEN` with no provider approved,
 * so there is nothing to replace it with yet. Photos return when that
 * decision is made; inventing a storage architecture here was explicitly out
 * of scope.
 */

interface ProfileEditorProps {
  userId: string;
}

export function ProfileEditor({ userId }: ProfileEditorProps) {
  const { profile, isLoading, error, fetchProfile } = useProfileStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (userId && !initialized) {
      fetchProfile().then(() => setInitialized(true));
    }
  }, [initialized, fetchProfile]);

  const handleRetry = () => {
    setInitialized(false);
    fetchProfile().then(() => setInitialized(true));
  };

  // Loading state
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Failed to load profile</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No profile. The (app) route guard sends a user without one to onboarding
  // before this renders, so reaching here means the profile went away
  // mid-session. Onboarding is where a profile is created — this used to POST
  // a stub called "New User" with MVP field names, which would now be rejected
  // and would in any case have skipped the flow that collects real answers.
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">No profile found</h2>
            <p className="text-sm text-muted-foreground">
              Let&apos;s set up your profile to get started.
            </p>
            <Button asChild className="gap-2">
              <Link href={ROUTES.onboarding}>Set up your profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
        <p className="text-muted-foreground">
          {profile.age} • {profile.city || 'No city set'}
        </p>
      </div>

      <Separator />

      {/* Photo management is absent by design — see the note at the top of
          this file. The Photos/Details tabs went with it: a tab that renders
          nothing is worse than no tab. */}
      <ProfileEditForm userId={userId} />
    </div>
  );
}
