'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ProfileEditForm } from './profile-edit-form';
import { PhotoManager } from './photo-manager';
import { useProfileStore } from '@/stores/profile-store';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';

interface ProfileEditorProps {
  userId: string;
}

export function ProfileEditor({ userId }: ProfileEditorProps) {
  const { profile, isLoading, error, fetchProfile } = useProfileStore();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (userId && !initialized) {
      fetchProfile(userId).then(() => setInitialized(true));
    }
  }, [userId, initialized, fetchProfile]);

  const handleRetry = () => {
    setInitialized(false);
    fetchProfile(userId).then(() => setInitialized(true));
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

  // No profile yet - show create option
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">No profile found</h2>
            <p className="text-sm text-muted-foreground">
              Let&apos;s create your profile to get started!
            </p>
            <Button
              onClick={async () => {
                try {
                  const res = await apiFetch('/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      // ✅ No userId — session provides it
                      name: 'New User',
                      age: 25,
                      gender: 'male',
                    }),
                  });
                  if (!res.ok) throw new Error('Failed to create');
                  await res.json();
                  await fetchProfile(userId);
                  toast({ title: 'Profile created!', description: 'Start editing your profile.' });
                } catch {
                  toast({
                    title: 'Error',
                    description: 'Failed to create profile.',
                    variant: 'destructive',
                  });
                }
              }}
              className="gap-2"
            >
              Create Profile
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
        <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-muted-foreground">
          {profile.age} • {profile.city || 'No city set'} •{' '}
          {profile.photos.length} photo{profile.photos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Separator />

      {/* Mobile: Tabs for Photos / Details | Desktop: Stacked layout */}
      <div className="block lg:hidden">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="photos">📸 Photos</TabsTrigger>
            <TabsTrigger value="details">✏️ Details</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-4">
            <PhotoManager userId={userId} />
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <ProfileEditForm userId={userId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Stacked sections */}
      <div className="hidden lg:block space-y-8">
        <PhotoManager userId={userId} />
        <Separator />
        <ProfileEditForm userId={userId} />
      </div>
    </div>
  );
}
