'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart, Users, Trash2, Sparkles, GitMerge, XCircle, MessageSquare, Bell,
  Loader2, LogIn, RefreshCw, ArrowLeft, Shield, Activity, Database,
  Mail, User, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { setStoredToken } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DevUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  hasPassword: boolean;
  createdAt: string;
  profile: {
    id: string;
    name: string;
    age: number;
    gender: string;
    city: string;
    bio: string;
    interests: string[];
    photos: { id: string; url: string; order: number; isPrimary: boolean }[];
  } | null;
}

interface DevStats {
  totalUsers: number;
  totalProfiles: number;
  totalMatches: number;
  totalMessages: number;
  totalNotifications: number;
  totalSwipes: number;
}

interface DevData {
  users: DevUser[];
  stats: DevStats;
}

// ─── Production Guard ────────────────────────────────────────────────────────

function ProductionGuard() {
  const [isProduction, setIsProduction] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Try to access the dev API - if it returns 403, we're in production
    fetch('/api/dev')
      .then((res) => {
        if (res.status === 403) {
          setIsProduction(true);
        }
      })
      .catch(() => {
        // Network error - not necessarily production
      })
      .finally(() => {
        setChecked(true);
      });
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProduction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Dev tools are not available in production.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
}

// ─── Action Result Toast ─────────────────────────────────────────────────────

function ActionResult({ result, onDismiss }: { result: { success: boolean; message: string }; onDismiss: () => void }) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-xl border shadow-lg transition-all ${
        result.success
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
          : 'bg-destructive/10 border-destructive/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {result.success ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${result.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-destructive'}`}>
            {result.success ? 'Success' : 'Error'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{result.message}</p>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dev Panel ──────────────────────────────────────────────────────────

export default function DevPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [data, setData] = useState<DevData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProduction, setIsProduction] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dev');
      if (res.status === 403) {
        setIsProduction(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setResult({ success: false, message: `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const executeAction = useCallback(async (action: string, params: Record<string, string> = {}) => {
    setActionLoading(action);
    setResult(null);

    try {
      const res = await fetch('/api/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });

      const json = await res.json();

      if (!res.ok) {
        setResult({ success: false, message: json.error || 'Action failed' });
        return;
      }

      setResult({ success: true, message: json.message || 'Action completed' });

      // Special handling for login-as
      if (action === 'login-as' && json.token) {
        setStoredToken(json.token);
        setAuth(json.userId, json.needsOnboarding || false);
        // Redirect to main app
        setTimeout(() => {
          router.push('/');
        }, 500);
        return;
      }

      // Refresh data after successful action
      await fetchData();
    } catch (err) {
      setResult({ success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown'}` });
    } finally {
      setActionLoading(null);
    }
  }, [fetchData, router, setAuth]);

  // Production guard
  if (isProduction) {
    return <ProductionGuard />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading dev panel...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle>Failed to Load</CardTitle>
            <CardDescription>Could not connect to dev API.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data.stats;
  const isActing = !!actionLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">Dev Panel</span>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Activity className="w-3 h-3 text-emerald-500" />
            Development
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
            { label: 'Profiles', value: stats.totalProfiles, icon: User, color: 'text-emerald-600' },
            { label: 'Matches', value: stats.totalMatches, icon: Heart, color: 'text-pink-500' },
            { label: 'Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-sky-500' },
            { label: 'Notifications', value: stats.totalNotifications, icon: Bell, color: 'text-amber-500' },
            { label: 'Swipes', value: stats.totalSwipes, icon: Activity, color: 'text-violet-500' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-3">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Database operations and data generation tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Reset Database */}
              <Button
                variant="destructive"
                className="h-auto py-3 px-4 justify-start gap-3"
                disabled={isActing}
                onClick={() => {
                  if (confirm('This will DELETE ALL DATA in the database. Are you sure?')) {
                    executeAction('reset-database');
                  }
                }}
              >
                {actionLoading === 'reset-database' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Trash2 className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">Reset Database</div>
                  <div className="text-xs opacity-80">Delete all users, profiles, matches, messages</div>
                </div>
              </Button>

              {/* Seed Demo Profiles */}
              <Button
                variant="outline"
                className="h-auto py-3 px-4 justify-start gap-3"
                disabled={isActing}
                onClick={() => executeAction('seed-demo-profiles')}
              >
                {actionLoading === 'seed-demo-profiles' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">Seed Demo Profiles</div>
                  <div className="text-xs opacity-80">Create 15 Indian-themed demo profiles</div>
                </div>
              </Button>

              {/* Generate Notifications */}
              <Button
                variant="outline"
                className="h-auto py-3 px-4 justify-start gap-3"
                disabled={isActing}
                onClick={() => {
                  // Use first user if available
                  const userId = data.users[0]?.id;
                  if (!userId) {
                    setResult({ success: false, message: 'No users found. Create or seed users first.' });
                    return;
                  }
                  executeAction('generate-notifications', { userId });
                }}
              >
                {actionLoading === 'generate-notifications' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">Generate Notifications</div>
                  <div className="text-xs opacity-80">Create 6 test notifications for first user</div>
                </div>
              </Button>

              {/* Generate Test Messages */}
              <Button
                variant="outline"
                className="h-auto py-3 px-4 justify-start gap-3"
                disabled={isActing}
                onClick={() => {
                  const userId = data.users[0]?.id;
                  if (!userId) {
                    setResult({ success: false, message: 'No users found. Create or seed users first.' });
                    return;
                  }
                  executeAction('generate-test-messages', { userId });
                }}
              >
                {actionLoading === 'generate-test-messages' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <MessageSquare className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">Generate Test Messages</div>
                  <div className="text-xs opacity-80">Create conversation with match for first user</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registered Users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Registered Users
                </CardTitle>
                <CardDescription>
                  {data.users.length} user{data.users.length !== 1 ? 's' : ''} in database
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No users yet.</p>
                <p className="text-xs mt-1">Seed demo profiles or register a user from the main app.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-border transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.profile?.photos?.[0]?.url ? (
                        <img
                          src={user.profile.photos[0].url}
                          alt={user.profile.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-primary font-bold text-sm">${(user.profile?.name || user.email)[0].toUpperCase()}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-primary font-bold text-sm">
                          {(user.profile?.name || user.email)[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {user.profile?.name || user.name || 'No name'}
                        </span>
                        {user.profile && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {user.profile.age} / {user.profile.gender}
                          </Badge>
                        )}
                        {user.hasPassword ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            Auth
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                            Demo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                      {user.profile && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {user.profile.city && (
                            <span className="text-[10px] text-muted-foreground">{user.profile.city}</span>
                          )}
                          {user.profile.interests?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {user.profile.interests.slice(0, 4).map((interest) => (
                                <span
                                  key={interest}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10"
                                >
                                  {interest}
                                </span>
                              ))}
                              {user.profile.interests.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{user.profile.interests.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {!user.profile && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                          No profile (needs onboarding)
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1.5 px-2.5"
                        disabled={isActing}
                        onClick={() => executeAction('login-as', { userId: user.id })}
                      >
                        {actionLoading === `login-as-${user.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LogIn className="w-3 h-3" />
                        )}
                        Login As
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 px-2.5"
                        disabled={isActing}
                        onClick={() => executeAction('create-random-match', { userId: user.id })}
                      >
                        {actionLoading === `create-random-match-${user.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <GitMerge className="w-3 h-3" />
                        )}
                        Match
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 px-2.5"
                        disabled={isActing}
                        onClick={() => executeAction('clear-swipes', { userId: user.id })}
                      >
                        {actionLoading === `clear-swipes-${user.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        Clear Swipes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User-specific actions */}
        {data.users.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Per-User Utilities
              </CardTitle>
              <CardDescription>
                Generate test data for a specific user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Generate Messages for specific user */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generate Messages For</label>
                  <div className="flex gap-2">
                    <select
                      id="msg-user-select"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={data.users[0]?.id}
                    >
                      {data.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.profile?.name || u.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5"
                      disabled={isActing}
                      onClick={() => {
                        const select = document.getElementById('msg-user-select') as HTMLSelectElement;
                        if (select?.value) {
                          executeAction('generate-test-messages', { userId: select.value });
                        }
                      }}
                    >
                      {actionLoading === 'generate-test-messages' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Generate Notifications for specific user */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generate Notifications For</label>
                  <div className="flex gap-2">
                    <select
                      id="notif-user-select"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={data.users[0]?.id}
                    >
                      {data.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.profile?.name || u.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5"
                      disabled={isActing}
                      onClick={() => {
                        const select = document.getElementById('notif-user-select') as HTMLSelectElement;
                        if (select?.value) {
                          executeAction('generate-notifications', { userId: select.value });
                        }
                      }}
                    >
                      {actionLoading === 'generate-notifications' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Create Match for specific user */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Create Random Match For</label>
                  <div className="flex gap-2">
                    <select
                      id="match-user-select"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={data.users[0]?.id}
                    >
                      {data.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.profile?.name || u.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5"
                      disabled={isActing}
                      onClick={() => {
                        const select = document.getElementById('match-user-select') as HTMLSelectElement;
                        if (select?.value) {
                          executeAction('create-random-match', { userId: select.value });
                        }
                      }}
                    >
                      {actionLoading === 'create-random-match' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <GitMerge className="w-3.5 h-3.5" />
                      )}
                      Match
                    </Button>
                  </div>
                </div>

                {/* Clear Swipes for specific user */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clear Swipes For</label>
                  <div className="flex gap-2">
                    <select
                      id="swipe-user-select"
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={data.users[0]?.id}
                    >
                      {data.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.profile?.name || u.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5"
                      disabled={isActing}
                      onClick={() => {
                        const select = document.getElementById('swipe-user-select') as HTMLSelectElement;
                        if (select?.value) {
                          executeAction('clear-swipes', { userId: select.value });
                        }
                      }}
                    >
                      {actionLoading === 'clear-swipes' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Completeness Indicators */}
        {data.users.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Test Readiness Indicators
              </CardTitle>
              <CardDescription>
                Check if the app has enough data for meaningful testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: 'Users',
                  value: stats.totalUsers,
                  min: 2,
                  ideal: 10,
                  description: 'Need at least 2 users for matching',
                },
                {
                  label: 'Profiles',
                  value: stats.totalProfiles,
                  min: 2,
                  ideal: 10,
                  description: 'Profiles needed for discover/swiping',
                },
                {
                  label: 'Matches',
                  value: stats.totalMatches,
                  min: 1,
                  ideal: 5,
                  description: 'Matches needed for chat testing',
                },
                {
                  label: 'Messages',
                  value: stats.totalMessages,
                  min: 1,
                  ideal: 10,
                  description: 'Messages needed for chat testing',
                },
                {
                  label: 'Notifications',
                  value: stats.totalNotifications,
                  min: 1,
                  ideal: 5,
                  description: 'Notifications needed for bell testing',
                },
              ].map((indicator) => {
                const percent = Math.min((indicator.value / indicator.ideal) * 100, 100);
                const isReady = indicator.value >= indicator.min;
                const isIdeal = indicator.value >= indicator.ideal;

                return (
                  <div key={indicator.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{indicator.label}</span>
                        {isIdeal ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : isReady ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {indicator.value} / {indicator.ideal} ideal
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className={`h-2 ${isIdeal ? '[&>div]:bg-emerald-500' : isReady ? '[&>div]:bg-amber-500' : '[&>div]:bg-destructive'}`}
                    />
                    <p className="text-[10px] text-muted-foreground">{indicator.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full gap-2"
              disabled={isActing}
              onClick={() => {
                if (confirm('This will DELETE ALL DATA in the database. This cannot be undone. Are you sure?')) {
                  if (confirm('Really? All users, profiles, matches, messages, and notifications will be permanently deleted.')) {
                    executeAction('reset-database');
                  }
                }
              }}
            >
              {actionLoading === 'reset-database' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Reset Entire Database
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Action Result Toast */}
      {result && (
        <ActionResult
          result={result}
          onDismiss={() => setResult(null)}
        />
      )}
    </div>
  );
}
