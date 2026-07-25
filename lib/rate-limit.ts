// TODO(slice-8): replace with a durable, distributed rate limiter (Upstash).
// This in-memory limiter is per-instance and resets on redeploy — it is NOT
// safe for multi-instance production. Tracked as REQUIRED in the launch
// checklist (docs/launch-checklist.md).
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (rec.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.count += 1;
  return { ok: true, retryAfter: 0 };
}
