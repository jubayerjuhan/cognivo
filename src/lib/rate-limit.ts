// Tiny in-memory rate limiter (single-instance app, so a Map is enough).
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the caller has exceeded `max` hits inside `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > max;
}
