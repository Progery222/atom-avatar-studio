/**
 * In-memory fixed-window rate limiter, keyed by API key id.
 *
 * Tradeoffs (acceptable for the single-instance deployment): state lives in the
 * process, so it resets on restart/redeploy and is NOT shared across instances.
 * To go multi-instance later, reimplement `check()` against Redis (INCR+EXPIRE)
 * — callers only depend on this function's shape.
 */

const WINDOW_MS = 60_000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function limitPerMinute(): number {
  const raw = Number(process.env.EXTERNAL_API_RATE_LIMIT_PER_MINUTE ?? 120);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 120;
}

function sweep(now: number): void {
  if (now - lastSweep < WINDOW_MS) {
    return;
  }
  lastSweep = now;
  for (const [id, b] of buckets) {
    if (b.resetAt <= now) {
      buckets.delete(id);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  headers: Record<string, string>;
}

export function check(keyId: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const max = limitPerMinute();
  let bucket = buckets.get(keyId);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(keyId, bucket);
  }
  bucket.count += 1;

  const remaining = Math.max(0, max - bucket.count);
  const resetSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (bucket.count > max) {
    headers['Retry-After'] = String(resetSec);
    return { allowed: false, headers };
  }
  return { allowed: true, headers };
}

/** Test helper — clears all buckets. */
export function _reset(): void {
  buckets.clear();
  lastSweep = 0;
}
