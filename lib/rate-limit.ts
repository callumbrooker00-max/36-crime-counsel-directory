import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Durable, distributed rate limiter. In production (Vercel serverless, many
// short-lived instances) an in-memory Map is useless — it resets on every cold
// start. When UPSTASH_REDIS_REST_URL/TOKEN are set we use Upstash sliding
// window (shared across all instances). Locally, with no Upstash configured,
// we fall back to an in-memory limiter so dev still works — never rely on that
// fallback in production.

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashConfigured ? Redis.fromEnv() : null;
// Ratelimit instances are keyed by their limit/window so a single module can
// serve different policies without reconstructing per call.
const limiters = new Map<string, Ratelimit>();

function upstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  let rl = limiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
      prefix: "rl",
      analytics: false,
    });
    limiters.set(key, rl);
  }
  return rl;
}

// ---- in-memory fallback (dev only) ----
const hits = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (rec.count >= limit) return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  rec.count += 1;
  return { ok: true, retryAfter: 0 };
}

let warnedNoUpstash = false;

export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): Promise<{ ok: boolean; retryAfter: number }> {
  if (redis) {
    const { success, reset } = await upstashLimiter(limit, windowMs).limit(key);
    return { ok: success, retryAfter: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  }
  if (process.env.NODE_ENV === "production" && !warnedNoUpstash) {
    warnedNoUpstash = true;
    console.warn("[rate-limit] Upstash not configured — using in-memory fallback. NOT safe for production.");
  }
  return memoryLimit(key, limit, windowMs);
}

/** True when a durable backend is configured — surfaced in the launch checklist. */
export function rateLimitIsDurable(): boolean {
  return upstashConfigured;
}
