'use client';

import { useCallback, useState } from 'react';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { apiFetch } from '@/lib/api-client';
import { AnimatedBackground } from '@/components/layout/animated-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Anera V2 — onboarding (docs/02-APP-FLOW.md §2.6).
 *
 * RELOCATED UNCHANGED in M5. This is the single-page shell's OnboardingScreen
 * moved to its own route, byte-for-byte apart from the `export` keyword and
 * these imports. M5 is a routing change, not a UI change.
 *
 * KNOWN LIMITATION — not introduced here. `handleComplete` posts to
 * `/api/profile`, which does not exist: it was removed under Option A (D45)
 * and is rebuilt in Milestone 6 (ROADMAP.md Phase 1, "M6 — Profile/photos/
 * preferences"). Onboarding therefore cannot be completed yet. That was
 * already true of this screen inside the shell; M5 moves it, and deliberately
 * neither fixes it nor papers over it with a placeholder state, because both
 * would be M6 work.
 */

const AVAILABLE_INTERESTS = [
  'Travel', 'Music', 'Photography', 'Cooking', 'Fitness',
  'Reading', 'Movies', 'Art', 'Gaming', 'Hiking',
  'Yoga', 'Dancing', 'Coffee', 'Wine', 'Pets',
  'Sports', 'Tech', 'Fashion', 'Food', 'Nature',
  'Writing', 'Cycling', 'Swimming', 'Meditation', 'Gardening',
];

export function OnboardingScreen() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const { fetchProfile } = useProfileStore();
  const [step, setStep] = useState<'gender' | 'details' | 'interests'>('gender');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: '' as string,
    bio: '',
    city: '',
    relationshipIntent: '',
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
    if (!userId) return;
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok && res.status === 409) {
        await apiFetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      await fetchProfile(userId);
    } finally {
      setIsSaving(false);
    }
  }, [userId, formData, fetchProfile]);

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
                if (formData.name.trim() && formData.age >= 18) setStep('interests');
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
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboard-age">Age</Label>
                <Input
                  id="onboard-age"
                  type="number"
                  min={18}
                  max={120}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: parseInt(e.target.value, 10) || 18 }))}
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

              <Button type="submit" className="w-full h-11" disabled={!formData.name.trim() || formData.age < 18}>
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
