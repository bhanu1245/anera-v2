'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profile-store';
import { ROUTES } from '@/lib/routes';
import { apiFetch } from '@/lib/api-client';
import { AnimatedBackground } from '@/components/layout/animated-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Anera V2 — onboarding (docs/02-APP-FLOW.md §2.6).
 *
 * Relocated to its own route in M5; wired to a real endpoint in M6. It now
 * completes: `POST /api/profile` creates the profile and the server routes the
 * user onward.
 *
 * IDENTITY. This component holds no user id, and asks for none. It used to
 * read one from the auth store — the M5 carry-forward issue — which broke on a
 * hard reload and, worse, invited the client to think it knew who it was. The
 * profile endpoint derives the owner from the session cookie and has no
 * parameter that could name anyone else, so there is nothing here to pass,
 * spoof, or get wrong (D37).
 *
 * Photo upload is absent from the flow: `APP-FLOW.md` §2.6 lists it as the
 * third onboarding step, but the upload surface was removed in M6 pending a
 * media-storage decision (`IG-18`). Onboarding is complete without it.
 */

const AVAILABLE_INTERESTS = [
  'Travel', 'Music', 'Photography', 'Cooking', 'Fitness',
  'Reading', 'Movies', 'Art', 'Gaming', 'Hiking',
  'Yoga', 'Dancing', 'Coffee', 'Wine', 'Pets',
  'Sports', 'Tech', 'Fashion', 'Food', 'Nature',
  'Writing', 'Cycling', 'Swimming', 'Meditation', 'Gardening',
];

export function OnboardingScreen() {
  const router = useRouter();
  const { fetchProfile } = useProfileStore();
  const [step, setStep] = useState<'gender' | 'details' | 'interests'>('gender');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    birthDate: '',
    gender: '' as string,
    bio: '',
    city: '',
    intent: '',
    interests: [] as string[],
  });

  const handleInterestToggle = useCallback((interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : prev.interests.length < 10
          ? [...prev.interests, interest]
          : prev.interests,
    }));
  }, []);

  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      let res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // A profile already exists — the user reached onboarding twice, perhaps
      // in two tabs. Update it rather than failing. PATCH, per
      // API-SPECIFICATION.md §4; the MVP used PUT, which is not documented.
      if (res.status === 409) {
        res = await apiFetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        // API-SPECIFICATION.md §2: { error: { code, message, details } }.
        const body = await res.json().catch(() => null);
        const fieldMessage = body?.error?.details?.[0]?.message;
        setError(fieldMessage || body?.error?.message || 'Could not save your profile.');
        return;
      }

      await fetchProfile();
      // The server decides where an onboarded user belongs; refresh so the
      // route guards re-run against the profile that now exists.
      router.replace(ROUTES.profile);
      router.refresh();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, fetchProfile, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatedBackground />

      <header className="relative z-10 shrink-0 h-14 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-bold text-lg tracking-tight">Anera</span>
        </div>
        {step !== 'gender' && (
          <button
            onClick={() => setStep(step === 'interests' ? 'details' : 'gender')}
            className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          {step === 'gender' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">What&apos;s your gender?</h2>
              </div>
              <div className="space-y-3">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'non-binary', label: 'Non-binary' },
                  { value: 'other', label: 'Other' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, gender: option.value }));
                      setStep('details');
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left bg-card/50"
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (formData.displayName.trim() && formData.birthDate) setStep('interests');
              }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboard-name">Name</Label>
                <Input
                  id="onboard-name"
                  value={formData.displayName}
                  onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboard-birthdate">Date of birth</Label>
                {/* A date, not an age. BACKEND-SCHEMA.md §2.1: a stored age
                    "is wrong the day after it's written", so the server keeps
                    the date and derives the age. The 18 floor is enforced
                    server-side (APP-FLOW.md §2.6). */}
                <Input
                  id="onboard-birthdate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboard-city">City</Label>
                <Input
                  id="onboard-city"
                  value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboard-bio">Bio</Label>
                <textarea
                  id="onboard-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={500}
                  className="flex min-h-[100px] w-full rounded-md border border-border/30 bg-secondary/50 px-3 py-2 text-sm resize-none"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={!formData.displayName.trim() || !formData.birthDate}>
                Continue
              </Button>
            </form>
          )}

          {step === 'interests' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Pick your interests</h2>
                <p className="text-muted-foreground text-sm">
                  Choose at least 3 ({formData.interests.length}/10)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/30 hover:border-primary/30 bg-card/50'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div
                  className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
                  role="alert"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                className="w-full h-11 gap-2"
                onClick={handleComplete}
                disabled={isSaving || formData.interests.length < 3}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  'Finish'
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
