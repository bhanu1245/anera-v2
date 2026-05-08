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
 */

// ─── Token Storage ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'anera_session_token';

/** Store the session token in localStorage so it survives page reloads */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
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
  } catch {
    // Ignore
  }
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
}

/**
 * Drop-in replacement for `fetch()` that:
 * - Includes `credentials: 'include'` for cookie-based auth
 * - Adds `Authorization: Bearer <token>` header as fallback
 * - Handles 401 responses globally (triggers auth store refresh)
 * - Provides consistent error handling
 */
export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { skipAuthRefresh, headers: customHeaders, ...rest } = options;

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
    clearStoredToken();
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
