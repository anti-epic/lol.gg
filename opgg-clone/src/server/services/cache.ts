import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!);

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },

  // Specialized helpers
  async cacheMatch(matchId: string, data: unknown): Promise<void> {
    // Completed matches never change - cache forever
    await this.set(`match:${matchId}`, data, 365 * 24 * 60 * 60); // 1 year
  },

  async cacheSummoner(region: string, name: string, data: unknown): Promise<void> {
    await this.set(`summoner:${region}:${name}`, data, 300); // 5 minutes
  },
};
