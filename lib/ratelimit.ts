// In-memory, per-instance request limiter for the quote generation endpoint.
//
// This is a demo deployed on Vercel. The endpoint calls a paid Nebius Token
// Factory key, so two caps protect it against runaway cost: a per-IP cap and
// a global daily cap shared by every visitor.
//
// Deliberate choice, no shared store. A correct global cap across every
// serverless instance needs a store all instances can read and write,
// Upstash Redis through the Vercel Marketplace, or Vercel Edge Config. Both
// were ruled out for this project, Edge Config writes need a Vercel API
// token with write scope baked into a public repo's deployment, a needless
// extra secret to protect for a few requests a day, and a Marketplace Redis
// add-on is one more thing to provision under time pressure for no real
// gain at this traffic level. A single Vercel Function instance serves the
// large majority of requests to a low-traffic demo (Vercel keeps warm
// instances alive between requests), so these in-memory counters hold in
// practice. The known gap, if Vercel spins up a second concurrent instance,
// each instance counts independently, so the true daily total could exceed
// GLOBAL_MAX_PER_DAY by roughly the number of concurrent instances. Should
// this project outgrow a demo, the fix is a shared store, not a bigger
// in-memory number.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_IP_BUCKET_MS = 2 * HOUR_MS;

const PER_IP_MAX_PER_HOUR = 3;
const GLOBAL_MAX_PER_DAY = 40;

type Window = { count: number; windowStartedAt: number };

const ipBuckets = new Map<string, Window>();
let globalBucket: Window = { count: 0, windowStartedAt: Date.now() };

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "ip" | "global"; retryAfterMs: number };

function pruneStaleIpBuckets(now: number): void {
  for (const [key, bucket] of ipBuckets) {
    if (now - bucket.windowStartedAt >= STALE_IP_BUCKET_MS) {
      ipBuckets.delete(key);
    }
  }
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  pruneStaleIpBuckets(now);

  if (now - globalBucket.windowStartedAt >= DAY_MS) {
    globalBucket = { count: 0, windowStartedAt: now };
  }
  if (globalBucket.count >= GLOBAL_MAX_PER_DAY) {
    return {
      allowed: false,
      reason: "global",
      retryAfterMs: DAY_MS - (now - globalBucket.windowStartedAt),
    };
  }

  const ipBucket = ipBuckets.get(identifier);
  if (!ipBucket || now - ipBucket.windowStartedAt >= HOUR_MS) {
    ipBuckets.set(identifier, { count: 1, windowStartedAt: now });
  } else {
    if (ipBucket.count >= PER_IP_MAX_PER_HOUR) {
      return {
        allowed: false,
        reason: "ip",
        retryAfterMs: HOUR_MS - (now - ipBucket.windowStartedAt),
      };
    }
    ipBucket.count += 1;
  }

  globalBucket.count += 1;
  return { allowed: true };
}
