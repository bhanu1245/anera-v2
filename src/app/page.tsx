'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, User, LogOut, Loader2,
  Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft,
  Sparkles, Database, Flame, Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useDiscoverStore } from '@/stores/discover-store';
import { useChatStore } from '@/stores/chat-store';
import { apiFetch, clearStoredToken } from '@/lib/api-client';
import { DiscoverPage } from '@/components/discover/discover-page';
import { ProfileEditor } from '@/components/profile/profile-editor';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { StreakBadge } from '@/components/engagement/streak-badge';
import { ProfileCompletionCard } from '@/components/engagement/profile-completion-card';
import { EngagementPrompts } from '@/components/engagement/engagement-prompts';
import { MatchesPage } from '@/components/matches/matches-page';
import { ChatPage } from '@/components/chat/chat-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ──────────────────────────────────────────────────────────────────

type AppTab = 'discover' | 'matches' | 'profile';
type AuthView = 'login' | 'register';

interface ChatProfile {
  id?: string;
  userId?: string;
  name: string;
  age?: number;
  photos?: { id: string; url: string; order: number; isPrimary: boolean }[];
  bio?: string;
  interests?: string[];
  city?: string;
}

// ─── Animated Background Blobs ──────────────────────────────────────────────

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-primary/8 blur-[100px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/4 right-1/4 w-1/2 h-1/2 rounded-full bg-primary/3 blur-[80px] animate-pulse"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}

// ─── Auth Hydration Loader ──────────────────────────────────────────────────

function HydrationLoader() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatedBackground />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          {/* Logo pulse */}
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

// ─── Auth Screen Component ──────────────────────────────────────────────────

function AuthScreen() {
  const { login, register, loginDemo, isLoading, error, clearError } = useAuthStore();
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Local validation errors
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;

  const handleLogin = useCallback(async (e: React.FormEvent) => {
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

    await login(email.trim(), password);
  }, [email, password, login]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    await register(email.trim(), password, name.trim());
  }, [name, email, password, register]);

  const handleDemoLogin = useCallback(async () => {
    setLocalError(null);
    await loginDemo();
  }, [loginDemo]);

  const switchView = useCallback((newView: AuthView) => {
    setView(newView);
    setLocalError(null);
    clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 shrink-0 h-14 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-bold text-lg tracking-tight">Anera</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm space-y-5">
          {/* Brand hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto backdrop-blur-sm">
              <Flame className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome to Anera</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {view === 'login'
                  ? 'Sign in to continue your journey'
                  : 'Create your account and start discovering'}
              </p>
            </div>
          </motion.div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-border/30 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {view === 'login' ? 'Sign In' : 'Create Account'}
                </CardTitle>
                <CardDescription>
                  {view === 'login'
                    ? 'Enter your credentials to continue'
                    : 'Fill in your details to get started'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={view === 'login' ? handleLogin : handleRegister}
                  className="space-y-4"
                >
                  {/* Name field (register only) */}
                  <AnimatePresence>
                    {view === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="name"
                              type="text"
                              placeholder="Your name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-10 h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
                              autoComplete="name"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
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
                        className="pl-10 h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
                        autoComplete={view === 'login' ? 'email' : 'email'}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                        className="pl-10 pr-10 h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
                        autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {displayError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2"
                      >
                        <p className="text-sm text-destructive">{displayError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={isLoading}
                  >
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

                {/* Switch between login/register */}
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
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Demo login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              className="w-full h-11 gap-2 border-border/30 bg-card/50 backdrop-blur-sm hover:bg-card/80"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              <Heart className="w-4 h-4" />
              Try Demo Account
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              Explore the app with pre-loaded profiles and matches.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// ─── Onboarding Screen Component ────────────────────────────────────────────

function OnboardingScreen() {
  const { userId } = useAuthStore();
  const { fetchProfile, profile } = useProfileStore();
  const [step, setStep] = useState<'gender' | 'details' | 'interests' | 'done'>('gender');
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: '' as string,
    bio: '',
    city: '',
    relationshipIntent: '',
    interests: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  const AVAILABLE_INTERESTS = [
    'Travel', 'Music', 'Photography', 'Cooking', 'Fitness',
    'Reading', 'Movies', 'Art', 'Gaming', 'Hiking',
    'Yoga', 'Dancing', 'Coffee', 'Wine', 'Pets',
    'Sports', 'Tech', 'Fashion', 'Food', 'Nature',
    'Writing', 'Cycling', 'Swimming', 'Meditation', 'Gardening',
  ];

  const handleGenderSelect = useCallback((gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setStep('details');
  }, []);

  const handleDetailsSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.age < 18) return;
    setStep('interests');
  }, [formData]);

  const handleInterestToggle = useCallback((interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          const updateRes = await apiFetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          if (!updateRes.ok) throw new Error('Failed to update profile');
        } else {
          throw new Error(data.error || 'Failed to create profile');
        }
      }

      await fetchProfile(userId);
      setStep('done');
    } catch (err) {
      console.error('Onboarding error:', err);
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
            onClick={() => {
              if (step === 'details') setStep('gender');
              if (step === 'interests') setStep('details');
            }}
            className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Gender */}
            {step === 'gender' && (
              <motion.div
                key="gender"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">What&apos;s your gender?</h2>
                  <p className="text-muted-foreground text-sm">This helps us find better matches for you</p>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'male', label: 'Male', emoji: '👨' },
                    { value: 'female', label: 'Female', emoji: '👩' },
                    { value: 'non-binary', label: 'Non-binary', emoji: '🧑' },
                    { value: 'other', label: 'Other', emoji: '✨' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleGenderSelect(option.value)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left backdrop-blur-sm bg-card/50"
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Basic Details */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Tell us about yourself</h2>
                  <p className="text-muted-foreground text-sm">This will appear on your profile</p>
                </div>

                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="onboard-name">Name</Label>
                    <Input
                      id="onboard-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      className="h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
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
                      onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                      className="h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onboard-city">City</Label>
                    <Input
                      id="onboard-city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      className="h-11 bg-secondary/50 border-border/30 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onboard-bio">Bio</Label>
                    <textarea
                      id="onboard-bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell people about yourself..."
                      maxLength={500}
                      className="flex min-h-[100px] w-full rounded-md border border-border/30 bg-secondary/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>What are you looking for?</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'serious', label: '❤️ Serious' },
                        { value: 'casual', label: '😊 Casual' },
                        { value: 'friendship', label: '🤝 Friendship' },
                        { value: 'networking', label: '🌐 Networking' },
                        { value: 'not-sure', label: '🤷 Not Sure' },
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, relationshipIntent: option.value }))}
                          className={`px-3 py-2 rounded-full text-sm border transition-all ${
                            formData.relationshipIntent === option.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border/30 hover:border-primary/30 bg-card/50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    disabled={!formData.name.trim() || formData.age < 18}
                  >
                    Continue
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Interests */}
            {step === 'interests' && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Pick your interests</h2>
                  <p className="text-muted-foreground text-sm">
                    Choose at least 3 to help find better matches ({formData.interests.length}/10)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map(interest => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/30 hover:border-primary/30 hover:bg-primary/5 bg-card/50'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>

                <Button
                  className="w-full h-11 gap-2 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  onClick={handleComplete}
                  disabled={isSaving || formData.interests.length < 3}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up your profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Start Exploring
                    </>
                  )}
                </Button>

                {formData.interests.length < 3 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Select at least 3 interests to continue
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Reset All Stores on Logout ─────────────────────────────────────────────

function resetAllStores() {
  // Clear stored token from localStorage
  clearStoredToken();

  // Reset discover store
  const discover = useDiscoverStore.getState();
  discover.setProfiles([]);
  discover.setError(null);
  discover.setHasMore(true);

  // Reset profile store
  useProfileStore.getState().setProfile(null);

  // Reset notification store
  const notif = useNotificationStore.getState();
  notif.disconnectSocket();

  // Reset chat store
  useChatStore.getState().clearMessages();
}

// ─── Main App Component ─────────────────────────────────────────────────────

export default function Home() {
  const {
    userId, isAuthenticated, isLoading, needsOnboarding,
    setAuth, logout, checkSession,
  } = useAuthStore();
  const { fetchProfile, profile, isLoading: isProfileLoading } = useProfileStore();
  const { fetchEngagement, initSocket, disconnectSocket } = useNotificationStore();

  // Auth hydration guard — prevents any rendering until session is verified
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false);

  const [activeTab, setActiveTab] = useState<AppTab>('discover');

  // Chat state
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);
  const [chatProfile, setChatProfile] = useState<ChatProfile | null>(null);

  // ── Auth Initialization (runs once) ────────────────────────────────────────
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const result = await checkSession();
        if (!cancelled) {
          setInitialized(true);
          setIsInitializing(false);
        }
      } catch {
        if (!cancelled) {
          setInitialized(true);
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkSession]);

  // ── Post-auth initialization (profile, socket, engagement) ─────────────────
  useEffect(() => {
    if (!userId || !initialized || !isAuthenticated) return;

    // Fetch profile
    fetchProfile(userId);

    // Initialize socket for real-time notifications
    initSocket();

    // Fetch engagement data
    fetchEngagement();
  }, [userId, initialized, isAuthenticated, fetchProfile, initSocket, fetchEngagement]);

  // ── Detect if user needs onboarding ────────────────────────────────────────
  const showOnboarding = isAuthenticated && userId && !isProfileLoading && (
    needsOnboarding || (initialized && profile === null && !isLoading)
  );

  // ── Clear needsOnboarding flag once profile is loaded ──────────────────────
  useEffect(() => {
    if (profile && needsOnboarding) {
      setAuth(userId, false);
    }
  }, [profile, needsOnboarding, userId, setAuth]);

  // ── Full Logout with Store Reset ───────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    // Reset all stores BEFORE clearing auth (so API calls have token if needed)
    resetAllStores();

    // Then clear auth
    await logout();

    // Reset initialization so next login gets fresh checkSession
    setInitialized(false);
    setIsInitializing(true);
    initRef.current = false;
  }, [logout]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const handleNavigateFromPrompt = useCallback((tab: string) => {
    setActiveTab(tab as AppTab);
  }, []);

  const handleOpenChat = useCallback((matchId: string, profile: ChatProfile) => {
    setChatMatchId(matchId);
    setChatProfile(profile);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatMatchId(null);
    setChatProfile(null);
  }, []);

  // ── Render: Loading during auth hydration ──────────────────────────────────
  if (isLoading || !initialized || isInitializing) {
    return <HydrationLoader />;
  }

  // ── Render: Unauthenticated → Show login/register ─────────────────────────
  if (!isAuthenticated || !userId) {
    return <AuthScreen />;
  }

  // ── Render: Needs onboarding ───────────────────────────────────────────────
  if (showOnboarding) {
    return <OnboardingScreen />;
  }

  // ── Render: Authenticated Main App ─────────────────────────────────────────
  const tabs: { id: AppTab; icon: typeof Heart; label: string }[] = [
    { id: 'discover', icon: Heart, label: 'Discover' },
    { id: 'matches', icon: MessageCircle, label: 'Matches' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - hide when chat is open */}
      {!chatMatchId && (
        <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-border/50 z-40">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-bold text-lg tracking-tight">Anera</span>
          </div>
          <div className="flex items-center gap-1">
            <StreakBadge compact />
            <NotificationBell />
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/dev', '_blank')}
                className="gap-1.5 text-muted-foreground hover:text-primary h-9"
                title="Dev Panel"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Dev</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-destructive h-9"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Logout</span>
            </Button>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {chatMatchId && chatProfile ? (
            <motion.div
              key="chat"
              className="h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ChatPage
                matchId={chatMatchId}
                otherProfile={chatProfile}
                onBack={handleCloseChat}
              />
            </motion.div>
          ) : activeTab === 'discover' ? (
            <motion.div
              key="discover"
              className="h-full flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="shrink-0 px-4 pt-3">
                <EngagementPrompts onNavigate={handleNavigateFromPrompt} />
              </div>
              <div className="flex-1 min-h-0">
                <DiscoverPage onOpenChat={handleOpenChat} />
              </div>
            </motion.div>
          ) : activeTab === 'matches' ? (
            <motion.div
              key="matches"
              className="h-full overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-4 space-y-4">
                <ProfileCompletionCard onGoToProfile={() => setActiveTab('profile')} />
                <MatchesPage onOpenChat={handleOpenChat} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              className="h-full overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileEditor userId={userId!} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation - hide when chat is open */}
      {!chatMatchId && (
        <nav className="shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md safe-area-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={tab.label}
                  aria-selected={isActive}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive && tab.id === 'discover' ? 'fill-current' : ''
                      }`}
                    />
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        layoutId="navIndicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
