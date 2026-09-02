'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, LogOut, Loader2, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { apiFetch } from '@/lib/api-client';
import { ProfileEditor } from '@/components/profile/profile-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Anera V2 — Phase 1 application shell.
 *
 * Scope (docs/ROADMAP.md Phase 1): authentication entry, onboarding and
 * profile. Discovery, matching, messaging, notifications and engagement were
 * removed under Option A (D40) and are rebuilt in their owning phases.
 *
 * Authentication (M4, D37): this component makes NO authentication decision.
 * It renders whatever the server last reported through /api/auth/session. The
 * session lives in an HTTP-only cookie the client cannot read, and every
 * protected endpoint re-validates it server-side. There is no hydration gate,
 * no readiness flag and no client-held token — swapping the store's `user`
 * field in a browser console changes what is drawn and nothing else.
 */

type AuthView = 'login' | 'register';

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-primary/8 blur-[100px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />
    </div>
  );
}

function SessionLoader() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatedBackground />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-10 h-10 text-primary fill-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Anera</h1>
            <p className="text-muted-foreground text-sm">Finding your way...</p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary/60" />
        </motion.div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const { login, register, isSubmitting, error, clearError } = useAuthStore();
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isLoading = isSubmitting;
  const displayError = localError || error;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      if (!email.trim()) {
        setLocalError('Email is required');
        return;
      }
      if (!password) {
        setLocalError('Password is required');
        return;
      }

      // The server is the authority on the outcome; these calls only update
      // what the UI renders. The session itself lives in the HTTP-only cookie.
      if (view === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    },
    [view, email, password, login, register],
  );

  const switchView = useCallback(
    (next: AuthView) => {
      setView(next);
      setLocalError(null);
      clearError();
    },
    [clearError],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatedBackground />

      <header className="relative z-10 shrink-0 h-14 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-bold text-lg tracking-tight">Anera</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Anera</h1>
            <p className="text-muted-foreground text-sm">
              {view === 'login' ? 'Sign in to continue' : 'Create your account'}
            </p>
          </div>

          <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{view === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
              <CardDescription>
                {view === 'login' ? 'Enter your credentials' : 'Fill in your details to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Display name is collected during onboarding, not at
                    registration: the V2 `users` table holds credentials only
                    and the name lives on `profiles.displayName`
                    (BACKEND-SCHEMA.md §2). */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={view === 'login' ? 'Your password' : 'At least 6 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
                      role="alert"
                    >
                      <p className="text-sm text-destructive">{displayError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full h-11 gap-2 font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {view === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : view === 'login' ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">
                  {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  type="button"
                  onClick={() => switchView(view === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  {view === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

const AVAILABLE_INTERESTS = [
  'Travel', 'Music', 'Photography', 'Cooking', 'Fitness',
  'Reading', 'Movies', 'Art', 'Gaming', 'Hiking',
  'Yoga', 'Dancing', 'Coffee', 'Wine', 'Pets',
  'Sports', 'Tech', 'Fashion', 'Food', 'Nature',
  'Writing', 'Cycling', 'Swimming', 'Meditation', 'Gardening',
];

function OnboardingScreen() {
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

export default function Home() {
  const { user, needsOnboarding, isChecking, logout, checkSession } = useAuthStore();
  const initRef = useRef(false);

  // Ask the server once on mount who we are. There is no hydration gate and
  // no readiness flag — the cookie is sent automatically and the server
  // answers (D37). `isChecking` only drives a spinner.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void checkSession();
  }, [checkSession]);

  const handleLogout = useCallback(async () => {
    useProfileStore.getState().setProfile(null);
    await logout();
    initRef.current = false;
  }, [logout]);

  if (isChecking) return <SessionLoader />;

  // Rendering decision only. Every protected resource is refused by the
  // server independently of what is rendered here.
  if (!user) return <AuthScreen />;

  if (needsOnboarding) return <OnboardingScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-border/50 z-40">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-bold text-lg tracking-tight">Anera</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-muted-foreground hover:text-destructive h-9"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Logout</span>
        </Button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <ProfileEditor userId={user.id} />
      </main>
    </div>
  );
}
