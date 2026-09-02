/**
 * Anera V2 — API client.
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md §2,
 *            docs/SECURITY-GUIDELINES.md.
 *
 * Authentication travels ONLY in the HTTP-only session cookie, which the
 * browser attaches automatically. This module holds no authentication state
 * and makes no authentication decisions.
 *
 * Deliberately absent (D37 §2 — the seven prohibitions):
 *   - no localStorage / sessionStorage token
 *   - no `Authorization: Bearer` header
 *   - no `authReady` flag
 *   - no `waitForAuth` gate
 *   - no hydration gate
 *   - no client-side authorization
 *
 * These were removed in Phase 1 M4, not renamed. Requests simply carry the
 * cookie; the server decides.
 */

export interface ApiFetchOptions extends Omit<RequestInit, 'credentials'> {
  /** Suppress the global unauthorized callback (used by auth calls themselves). */
  skipAuthRefresh?: boolean;
}

let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Registers a callback fired when any request returns 401.
 *
 * This is a UI concern only — it lets the app re-render as signed out. It is
 * NOT an authorization mechanism: the server has already refused the request.
 */
export function onUnauthorized(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

/**
 * `fetch` with cookie credentials and consistent 401 handling.
 *
 * `credentials: 'include'` ensures the session cookie is sent. No other
 * authentication material is attached, because none exists on the client.
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuthRefresh, ...rest } = options;

  const response = await fetch(url, { ...rest, credentials: 'include' });

  if (response.status === 401 && !skipAuthRefresh) {
    onUnauthorizedCallback?.();
  }

  return response;
}

/** Parses a JSON response, throwing the server's error message on failure. */
export async function apiFetchJson<T = unknown>(
  url: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const res = await apiFetch(url, options);

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      // API-SPECIFICATION.md §2 error envelope: { error: { code, message } }
      if (body?.error?.message) message = body.error.message;
      else if (typeof body?.error === 'string') message = body.error;
    } catch {
      // Non-JSON response — keep the default message.
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/** Parses a response as JSON, returning null for non-JSON or HTML bodies. */
export async function safeJsonParse<T = unknown>(response: Response): Promise<T | null> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    const text = await response.text();
    if (!text || text.trimStart().startsWith('<')) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
