import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ProxyConfig } from 'next/server';

/**
 * Anera V2 — API proxy (formerly "middleware").
 *
 * Authority: docs/DECISIONS.md D37, docs/AUTHENTICATION.md §2/§3.2,
 *            docs/SECURITY-GUIDELINES.md.
 *
 * Rewritten in Phase 1 M4. The legacy version reflected ANY request `Origin`
 * back as `Access-Control-Allow-Origin` while also sending
 * `Access-Control-Allow-Credentials: true`, and advertised `Authorization` as
 * an allowed request header. Under the D37 cookie-session model that combination
 * is an authentication defect, not a convenience:
 *
 *   - Reflect-any-origin + credentials means every website is a trusted origin
 *     for credentialed calls to /api/*. SameSite=Lax currently withholds the
 *     session cookie from cross-site fetches, so the hole is not presently
 *     reachable — but the CORS policy must not be the thing standing between an
 *     attacker and the session.
 *   - Allowing `Authorization` advertised Bearer transport, which D37 §2
 *     prohibition 2 forbids. Authentication travels ONLY in the session cookie.
 *
 * Cross-origin credentialed access is therefore OFF by default. Same-origin
 * requests are unaffected: browsers send no `Origin` preflight requirement for
 * them and no CORS header is needed.
 *
 * To permit a specific cross-origin front end (for example a hosted preview),
 * set ANERA_ALLOWED_ORIGINS to a comma-separated list of exact origins. An
 * origin is echoed back only on exact match — never reflected blindly, and
 * never `*`, which is invalid with credentials anyway.
 */

export const config: ProxyConfig = {
  matcher: '/api/:path*',
};

const ALLOWED_ORIGINS = new Set(
  (process.env.ANERA_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
);

/** Exact-match allowlist. Returns null when the origin is not permitted. */
function resolveAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null; // Same-origin request — no CORS headers required.
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function applyCors(response: NextResponse, origin: string): void {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  // `Authorization` is deliberately absent: the session cookie is the only
  // authentication transport (D37 §2).
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  // Caches must not serve one origin's CORS response to another.
  response.headers.append('Vary', 'Origin');
}

export function proxy(request: NextRequest) {
  const allowedOrigin = resolveAllowedOrigin(request);

  if (request.method === 'OPTIONS') {
    // Preflight from a disallowed origin gets no CORS headers, so the browser
    // blocks the real request.
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigin) {
      applyCors(response, allowedOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    return response;
  }

  const response = NextResponse.next();
  if (allowedOrigin) applyCors(response, allowedOrigin);
  return response;
}
