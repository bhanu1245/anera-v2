import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ProxyConfig } from 'next/server';

/**
 * Proxy (formerly "middleware") for CORS and auth header support.
 *
 * In the sandbox/preview environment, the app runs in a cross-origin iframe.
 * This proxy ensures:
 * 1. CORS headers are set on API responses (allows credentials + Authorization header)
 * 2. OPTIONS preflight requests are handled properly
 * 3. The Authorization header is allowed through
 */

export const config: ProxyConfig = {
  matcher: '/api/:path*',
};

export function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    const origin = request.headers.get('origin') || '*';

    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    return response;
  }

  // Process the actual request
  const response = NextResponse.next();

  // Add CORS headers to API responses
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}
