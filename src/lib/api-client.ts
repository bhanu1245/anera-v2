/**
 * Centralized API client for Anera.
 *
 * WHY: In the sandbox/preview environment, the app runs inside a cross-origin
 * iframe. Browsers silently drop cookies on cross-origin fetch() calls unless
 * `credentials: 'include'` is explicitly set. Additionally, `Secure` cookies
 * are never sent over HTTP. This wrapper guarantees that:
 *
 * 1. Every request includes `credentials: 'include'` (sends + stores cookies)
 * 2. Every request includes the `Authorization: Bearer <token>` header as a
 *    fallback when cookies are unavailable (e.g., cross-origin HTTP sandbox)
 * 3. 401 responses trigger global auth-state refresh via the auth store
 * 4. Error handling is standardized across the entire app
 * 5. Auth-readiness guard prevents API calls before the session is established
 */

// ─── Token Storage ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'anera_session_token';

/** Store the session token in localStorage so it survives page reloads */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[API] Token stored in localStorage');
  } catch {
    // localStorage unavailable (SSR, private browsing)
  }
}

/** Retrieve the stored session token */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored session token */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('[API] Token cleared from localStorage');
  } catch {
    // Ignore
  }
}

// ─── Auth Readiness Guard ───────────────────────────────────────────────────
//
// Prevents protected API calls from firing before the auth token is available.
// The auth store calls markAuthReady() after successful login/register/checkSession.
// This is the KEY fix for the "Authentication required" bug after logout→login.

let authReady = false;
let authReadyResolve: (() => void) | null = null;
let authReadyPromise: Promise<void> = new Promise((resolve) => {
  authReadyResolve = resolve;
});

/**
 * Mark auth as ready — called by auth-store after:
 * - Successful login/register/demo-login (token is in localStorage)
 * - Successful checkSession (token is refreshed in localStorage)
 * The discover page and other protected fetches will wait for this.
 */
export function markAuthReady(): void {
  authReady = true;
  console.log('[API] Auth marked as ready — protected API calls can proceed');
  authReadyResolve?.();
  // Reset for next cycle (logout will call clearAuthReady)
  authReadyPromise = new Promise((resolve) => {
    authReadyResolve = resolve;
  });
}

/**
 * Clear auth readiness — called during logout.
 * Ensures that after logout, no protected API calls can proceed.
 */
export function clearAuthReady(): void {
  authReady = false;
  console.log('[API] Auth readiness cleared — protected API calls blocked');
  authReadyPromise = new Promise((resolve) => {
    authReadyResolve = resolve;
  });
}

/**
 * Check if auth is ready for protected API calls.
 */
export function isAuthReady(): boolean {
  return authReady;
}

/**
 * Wait for auth to be ready. Returns immediately if already ready.
 * Used by apiFetch when `requireAuth: true` is set.
 */
export async function waitForAuth(timeoutMs = 5000): Promise<boolean> {
  if (authReady) return true;

  console.log('[API] Waiting for auth readiness...');
  const timeout = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), timeoutMs)
  );
  return Promise.race([authReadyPromise.then(() => true), timeout]);
}

// ─── 401 Handler ────────────────────────────────────────────────────────────

let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Register a callback to fire when any API call receives a 401.
 * The auth store uses this to clear state and trigger re-login.
 */
export function onUnauthorized(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

// ─── API Fetch ──────────────────────────────────────────────────────────────

export interface ApiFetchOptions extends Omit<RequestInit, 'credentials'> {
  /** If true, don't trigger the global 401 handler (used by auth calls themselves) */
  skipAuthRefresh?: boolean;
  /**
   * If true, wait for auth readiness before making the request.
   * Prevents "Authentication required" errors by ensuring the token
   * is available in localStorage before the fetch fires.
   * Default: false (backward compatible)
   */
  requireAuth?: boolean;
}

/**
 * Drop-in replacement for `fetch()` that:
 * - Includes `credentials: 'include'` for cookie-based auth
 * - Adds `Authorization: Bearer <token>` header as fallback
 * - Handles 401 responses globally (triggers auth store refresh)
 * - Optionally waits for auth readiness before firing (requireAuth: true)
 * - Provides consistent error handling
 */
export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { skipAuthRefresh, requireAuth, headers: customHeaders, ...rest } = options;

  // If this is a protected API call and auth isn't ready yet, wait
  if (requireAuth && !authReady) {
    console.log(`[API] Blocked: ${url} — auth not ready, waiting...`);
    const ready = await waitForAuth();
    if (!ready) {
      console.warn(`[API] Auth readiness timeout for ${url} — proceeding anyway`);
    } else {
      console.log(`[API] Auth ready — proceeding with ${url}`);
    }
  }

  // Build headers: merge custom headers with Authorization
  const headers = new Headers(customHeaders);

  // Add Authorization header if we have a stored token
  // This is the CRITICAL fallback for cross-origin environments where
  // cookies are silently dropped by the browser
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    // ALWAYS include credentials — required for cross-origin cookie flow
    credentials: 'include',
  });

  // Handle 401 globally: clear token and notify auth store
  if (response.status === 401 && !skipAuthRefresh) {
    console.warn(`[API] 401 Unauthorized for ${url} — clearing token`);
    clearStoredToken();
    clearAuthReady();
    onUnauthorizedCallback?.();
  }

  return response;
}

/**
 * Convenience wrapper that parses JSON responses with error handling.
 * Throws an Error with the server's error message on non-2xx responses.
 */
export async function apiFetchJson<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const res = await apiFetch(url, options);

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMessage = data.error;
    } catch {
      // Response wasn't JSON — use default message
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

/**
 * Safely parse a response as JSON. If the response body is HTML
 * (e.g., from the Caddy proxy fallback page when the server is down),
 * returns null instead of throwing a parse error.
 */
export async function safeJsonParse<T = unknown>(response: Response): Promise<T | null> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
      return null;
    }
    const text = await response.text();
    if (!text || text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
