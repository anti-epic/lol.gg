import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the redis export before importing rateLimit
vi.mock("@/server/services/cache", () => ({
  redis: null,
  cache: {},
}));

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit (Redis unavailable)", () => {
  it("allows all requests when Redis is not configured", async () => {
    expect(await rateLimit("127.0.0.1")).toBe(true);
    expect(await rateLimit("10.0.0.1", 0, 60)).toBe(true); // even with limit=0
  });
});

describe("rateLimit (Redis available)", () => {
  const mockRedis = {
    incr: vi.fn(),
    expire: vi.fn().mockResolvedValue(1),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("allows request when under the limit", async () => {
    mockRedis.incr.mockResolvedValue(1); // first request in window

    vi.doMock("@/server/services/cache", () => ({ redis: mockRedis }));
    const { rateLimit: rl } = await import("@/lib/rate-limit");

    expect(await rl("127.0.0.1", 10, 60)).toBe(true);
    expect(mockRedis.incr).toHaveBeenCalledOnce();
    expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 60);
  });

  it("blocks request when over the limit", async () => {
    mockRedis.incr.mockResolvedValue(11); // 11th request, limit is 10

    vi.doMock("@/server/services/cache", () => ({ redis: mockRedis }));
    const { rateLimit: rl } = await import("@/lib/rate-limit");

    expect(await rl("127.0.0.1", 10, 60)).toBe(false);
  });

  it("allows request when Redis throws (fail open)", async () => {
    mockRedis.incr.mockRejectedValue(new Error("Redis connection lost"));

    vi.doMock("@/server/services/cache", () => ({ redis: mockRedis }));
    const { rateLimit: rl } = await import("@/lib/rate-limit");

    expect(await rl("127.0.0.1", 10, 60)).toBe(true);
  });

  it("does not set expiry after the first request in a window", async () => {
    mockRedis.incr.mockResolvedValue(5); // not first request

    vi.doMock("@/server/services/cache", () => ({ redis: mockRedis }));
    const { rateLimit: rl } = await import("@/lib/rate-limit");

    await rl("127.0.0.1", 10, 60);
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });
});
