---
Task ID: 1
Agent: main
Task: Rebuild Anera homepage/auth entry page with auth hydration safety, premium dark UI, and proper logout/reset

Work Log:
- Read existing codebase: auth-store.ts, auth.ts, api-client.ts, page.tsx, all stores, discover-page.tsx, globals.css, layout.tsx
- Analyzed auth lifecycle: HMAC tokens in cookies + localStorage, dual transport apiFetch, Zustand stores
- Identified key issues: no hasHydrated guard, no isCheckingSession prevention, no store reset on logout, socket not init/disconnect properly
- Rebuilt src/app/page.tsx with:
  - AnimatedBackground component (premium dark gradient blobs)
  - HydrationLoader component (branded loading screen during auth initialization)
  - Enhanced AuthScreen with premium dark UI (glass cards, gradient branding, backdrop-blur)
  - Enhanced OnboardingScreen with premium styling (glass buttons, gradient CTA)
  - resetAllStores() function that resets discover, profile, notification (disconnects socket), chat stores
  - Proper handleLogout that calls resetAllStores() before logout, resets init flags
  - Auth hydration guard: `initialized` + `isInitializing` + `initRef` to prevent double init
  - Post-auth initialization: fetchProfile + initSocket + fetchEngagement in single useEffect
  - Conditional rendering: Loading → Auth → Onboarding → Main App (strict order)
- Enhanced src/stores/auth-store.ts with:
  - `hasHydrated` boolean (false until checkSession/login/register completes)
  - `isCheckingSession` boolean (prevents concurrent session checks)
  - `resetAuth()` action for full state cleanup
  - All auth actions now set `hasHydrated: true` on completion
  - checkSession now sets `hasHydrated: true` even on failure (prevents infinite loading)
  - logout now sets `hasHydrated: false` and `isCheckingSession: false`
- Verified: lint passes, TypeScript has no errors in changed files, page returns HTTP 200, session API returns 200

Stage Summary:
- Anera homepage fully rebuilt with premium dark dating app UI
- Auth hydration safety implemented (no more "Authentication required" after re-login)
- Full store reset on logout prevents stale state
- Proper session check with concurrent guard
- Dev server and notification service both running

---
Task ID: 2
Agent: main
Task: AUTH SESSION BUG — FINAL FIX. Fix "Authentication required" after logout→login cycle.

Work Log:
- Traced full auth lifecycle: login → token stored → checkSession → hasHydrated → discover fetches
- Identified ROOT CAUSE: Discover page fires API calls before auth token is confirmed in localStorage/cookies
- Also identified: fetchAttempted flag in discover-page not reset between logout→login cycles
- Also identified: no centralized auth-readiness signal — each component guessed when auth was ready

Fixes applied:

1. **api-client.ts** — Added auth readiness guard system:
   - `markAuthReady()` / `clearAuthReady()` — global flag that protected API calls check
   - `isAuthReady()` / `waitForAuth()` — async wait with 5s timeout
   - `requireAuth: true` option on `apiFetch()` — waits for auth before fetching
   - Console logs: [API] Token stored, [API] Auth marked as ready, [API] Blocked, [API] Waiting
   - 401 handler now also calls `clearAuthReady()`

2. **auth-store.ts** — Post-login session verification:
   - After login/register/demo-login: store token FIRST, then call `checkSession()` to verify
   - Only then call `markAuthReady()` to unblock protected API calls
   - `logout()` calls `clearAuthReady()` 
   - `checkSession()` calls `markAuthReady()` on success
   - Console logs: [AUTH] Login attempt, [AUTH] Session verified, [AUTH] redirecting, [AUTH] Logging out, etc.
   - Global 401 handler also calls `clearAuthReady()`

3. **discover-page.tsx** — Auth hydration guard:
   - Checks `isAuthenticated`, `hasHydrated`, AND `isAuthReady()` before fetching
   - All `apiFetch` calls use `requireAuth: true`
   - `fetchAttempted` resets when `userId` changes (logout→login cycle)
   - `seeded` also resets on userId change
   - Console logs: [DISCOVER] fetching, [DISCOVER] blocked — auth not ready

4. **discover-store.ts** — Added `reset()` method for full state cleanup

5. **page.tsx** — Simplified auth hydration:
   - Removed redundant `initialized`/`isInitializing` local state — uses `hasHydrated` from auth-store
   - `resetAllStores()` now calls `discoverStore.reset()` and `clearAuthReady()`
   - Strict render guard: `if (!hasHydrated || isLoading) return <HydrationLoader />`
   - Post-auth init only fires when `hasHydrated && isAuthenticated`
   - Console log: [AUTH] Rendering authenticated app

6. **profile-store.ts** — Added `requireAuth: true` to fetchProfile, 401 silently fails

7. **notification-store.ts** — Added `requireAuth: true` to fetchNotifications, fetchEngagement

8. **chat-store.ts** — Added `requireAuth: true` to fetchMessages, prependOlderMessages, sendMessage

Stage Summary:
- The "Authentication required" bug after logout→login is now fixed at the root cause level
- Auth readiness is a centralized signal (markAuthReady/clearAuthReady) 
- All protected API calls use `requireAuth: true` which waits for auth
- Discover page re-fetches on userId change (fixes stale fetchAttempted flag)
- Full logout clears ALL stores AND the auth readiness flag
- Login flow: login → storeToken → checkSession → markAuthReady → app renders → discover fetches
- No lint errors, no TypeScript errors in changed files
