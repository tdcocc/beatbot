// In-memory rate limiter. Keyed by IP, rolling 24h window.
// On Vercel serverless, state is per-instance — resets on cold start.
// Good enough to stop casual scripting; real protection would need Upstash/KV.

const WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const MAX_BUCKETS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function rateLimit(ip: string, limit = DEFAULT_LIMIT): RateLimitResult {
  const now = Date.now();

  // Simple LRU-ish sweep to keep memory bounded
  if (buckets.size >= MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }

  let bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
