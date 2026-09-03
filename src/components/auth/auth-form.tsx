'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Heart, Loader2, Lock, Mail, Sparkles, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib/routes';
import { AnimatedBackground } from '@/components/layout/animated-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Anera V2 — credential entry for /login and /signup.
 *
 * Authority: docs/02-APP-FLOW.md §2.2/§2.3, docs/DECISIONS.md D37.
 *
 * Moved out of the single-page shell in M5. The markup is the shell's,
 * unchanged; what changed is that the two modes are now two URLs instead of
 * one component's `view` state, so they can be linked, bookmarked and
 * server-guarded.
 *
 * This is a Client Component because it owns controlled inputs. It makes no
 * authentication decision: it posts credentials, and the server sets the
 * session cookie. On success it navigates to the landing route, which
 * re-resolves the session on the server and routes onward (§2.1).
 */

export type AuthMode = 'login' | 'signup';

const COPY = {
  login: {
    subtitle: 'Sign in to continue',
    title: 'Sign In',
    description: 'Enter your credentials',
    passwordPlaceholder: 'Your password',
    passwordAutoComplete: 'current-password',
    submit: 'Sign In',
    pending: 'Signing in...',
    switchPrompt: "Don't have an account? ",
    switchLabel: 'Sign up',
    switchHref: ROUTES.signup,
  },
  signup: {
    subtitle: 'Create your account',
    title: 'Create Account',
    description: 'Fill in your details to get started',
    passwordPlaceholder: 'At least 6 characters',
    passwordAutoComplete: 'new-password',
    submit: 'Create Account',
    pending: 'Creating account...',
    switchPrompt: 'Already have an account? ',
    switchLabel: 'Sign in',
    switchHref: ROUTES.login,
  },
} as const;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { login, register, isSubmitting, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const copy = COPY[mode];
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
      const succeeded =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password);

      if (succeeded) {
        // Hand the decision back to the server: the landing route reads the
        // cookie and sends the user to onboarding or the app (§2.1). refresh()
        // discards the cached RSC payload so that check actually re-runs.
        router.replace(ROUTES.landing);
        router.refresh();
      }
    },
    [mode, email, password, login, register, router],
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
            <p className="text-muted-foreground text-sm">{copy.subtitle}</p>
          </div>

          <Card className="border-border/30 bg-card/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{copy.title}</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
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
                      placeholder={copy.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      autoComplete={copy.passwordAutoComplete}
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
                      {copy.pending}
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {copy.submit}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {copy.submit}
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">{copy.switchPrompt}</span>
                <Link
                  href={copy.switchHref}
                  onClick={() => {
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {copy.switchLabel}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
