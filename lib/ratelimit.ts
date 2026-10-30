// Fixed-window in-memory rate limiter. Good enough for a single-instance
// demo deployment; a production rollout across multiple regions would need
// a shared store (e.g. Upstash Redis) instead.

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

type Bucket = { count: number; windowStartedAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(identifier);

  if (!bucket || now - bucket.windowStartedAt >= WINDOW_MS) {
    buckets.set(identifier, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStartedAt) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
