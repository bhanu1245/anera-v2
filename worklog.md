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
