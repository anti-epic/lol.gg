import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  client.on("error", () => {
    // Suppress unhandled error events — cache miss is non-fatal
  });

  return client;
}

const redis: Redis | null =
  globalForRedis.redis !== undefined ? globalForRedis.redis : createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch {
      // Cache write failure is non-fatal
    }
  },

  async delete(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      // Cache delete failure is non-fatal
    }
  },

  async cacheMatch(matchId: string, data: unknown): Promise<void> {
    await this.set(`match:${matchId}`, data, 365 * 24 * 60 * 60); // 1 year
  },

  async cacheSummoner(region: string, name: string, data: unknown): Promise<void> {
    await this.set(`summoner:${region}:${name}`, data, 300); // 5 minutes
  },
};
