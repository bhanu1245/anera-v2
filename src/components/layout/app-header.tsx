'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';

/**
 * Header for the authenticated app (docs/02-APP-FLOW.md §2.4 — Logout).
 *
 * The markup is the single-page shell's, moved unchanged in M5. A Client
 * Component only because the logout control needs an event handler.
 *
 * Logout is a SERVER-side revocation: the store's `logout` posts to
 * /api/auth/logout, which deletes the session row (D37). Clearing local state
 * and navigating are cosmetic follow-ups — `refresh()` discards the cached RSC
 * payload so the server, not this component, decides what renders next. If the
 * request failed, the server would simply keep answering "authenticated".
 */
export function AppHeader() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(async () => {
    useProfileStore.getState().setProfile(null);
    await logout();
    router.replace(ROUTES.login);
    router.refresh();
  }, [logout, router]);

  return (
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
  );
}
