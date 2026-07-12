// -----------------------------------------------------------------------------
// Lightweight in-memory rate limiter for public (unauthenticated) API routes.
//
// Scope & limitations:
// - State lives in this module's memory, so it is PER PROCESS. This is correct
//   for a single-instance deployment (PM2 fork mode / one `next start`).
//   If you later run multiple instances (PM2 cluster, several servers), move
//   this to a shared store (e.g. Redis) or enforce limits at nginx/Cloudflare,
//   otherwise each instance counts independently.
// - Fixed-window algorithm: simple and cheap. Good enough for abuse/spam
//   protection on public endpoints.
// -----------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the current window ends
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

// Periodically drop expired buckets so memory can't grow unbounded.
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Register a hit against `key`. Allows up to `limit` hits per `windowMs`.
 * Returns ok=false once the limit is exceeded within the current window.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, limit, remaining: limit - bucket.count, retryAfterSec: 0 };
}

/**
 * Best-effort client IP. The app runs behind nginx/Cloudflare, so trust the
 * proxy-provided headers. Falls back to a shared "unknown" bucket, which means
 * clients without a resolvable IP share one limit (fail-safe, not fail-open).
 */
export function getClientIp(request: Request): string {
  const h = request.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Standard headers to attach to a 429 (or any rate-limited) response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
