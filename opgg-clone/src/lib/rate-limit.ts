import { redis } from "@/server/services/cache";

/**
 * Fixed-window rate limiter backed by Redis.
 * Gracefully allows requests when Redis is unavailable.
 *
 * @returns true if the request is allowed, false if it should be blocked
 */
export async function rateLimit(identifier: string, limit = 60, windowSecs = 60): Promise<boolean> {
  if (!redis) return true; // no Redis configured — allow

  const window = Math.floor(Date.now() / (windowSecs * 1000));
  const key = `rl:${identifier}:${window}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSecs);
    return count <= limit;
  } catch {
    return true; // Redis error — allow rather than block legitimate users
  }
}
