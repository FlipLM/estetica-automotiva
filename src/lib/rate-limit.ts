import { NextRequest } from "next/server";
import Redis from "ioredis";

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });
    redisClient.connect().catch((err) => {
      console.warn("[REDIS_CONNECT_FAIL] Usando rate limit em memória:", err?.message);
      redisClient = null;
    });
  } catch {
    redisClient = null;
  }
}

/**
 * Rate limit em memória (janela fixa) para ambiente local e fallback.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Retorna true se a requisição está BLOQUEADA. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    buckets.forEach((v, k) => {
      if (v.resetAt < now) buckets.delete(k);
    });
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}

/**
 * Rate limit distribuído via Redis com fallback transparente em memória.
 */
export async function isRateLimitedAsync(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redisClient) {
    return isRateLimited(key, limit, windowMs);
  }
  try {
    const redisKey = `rl:${key}`;
    const count = await redisClient.incr(redisKey);
    if (count === 1) {
      await redisClient.pexpire(redisKey, windowMs);
    }
    return count > limit;
  } catch {
    return isRateLimited(key, limit, windowMs);
  }
}
