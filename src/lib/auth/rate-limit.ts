import type { NextRequest } from 'next/server';

/**
 * Anera V2 — fixed-window rate limiting for authentication endpoints.
 *
 * Authority: docs/SECURITY-GUIDELINES.md §7, docs/DECISIONS.md D33
 *            (risk-based rate limiting), thresholds PROVISIONAL — `OQ-C05`.
 *
 * SCOPE LIMIT — this counter is per-process and in-memory. It is sufficient
 * for single-instance Phase 1 and satisfies the "rate limiting active"
 * requirement, but it does NOT survive a restart and does NOT coordinate
 * across instances. A shared store is required before multi-instance
 * deployment; the cache/queue technology is still `OPEN` (`OQ-A01`) and the
 * deployment target is `OQ-B04`.
 *
 * This is NOT in-memory *persistence* (prohibited by D40) — no domain data
 * is stored here, only ephemeral request counters.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Bounds memory growth from unique keys. */
const MAX_BUCKETS = 10_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

/**
 * Derives a client key from proxy headers, falling back to a shared bucket.
 *
 * NOTE: these headers are client-supplied unless a trusted proxy overwrites
 * them. Trusted-proxy configuration depends on the deployment target
 * (`OQ-B04`) and must be settled before production.
 */
export function clientKey(request: NextRequest, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : request.headers.get('x-real-ip') ?? 'unknown';
  return `${scope}:${ip}`;
}

/** Test-only: clears all counters so suites do not interfere. */
export function __resetRateLimits(): void {
  buckets.clear();
}
