import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies before importing the router
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/server/services/cache", () => ({
  redis: null,
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    cacheSummoner: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/server/services/db", () => ({
  db: {
    summoner: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { appRouter } from "@/server/root";
import { cache } from "@/server/services/cache";
import { db } from "@/server/services/db";
import { rateLimit } from "@/lib/rate-limit";

const caller = appRouter.createCaller({ ip: "127.0.0.1" });

describe("summoner.getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue(true);
    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(cache.cacheSummoner).mockResolvedValue(undefined);
    vi.mocked(db.summoner.findUnique).mockResolvedValue(null);
  });

  it("returns placeholder data when summoner is not in the database", async () => {
    const result = await caller.summoner.getProfile({
      name: "testuser",
      region: "na1",
    });

    expect(result).toMatchObject({ name: "testuser", region: "na1" });
  });

  it("returns cached data without hitting the database", async () => {
    const cached = { name: "cached", region: "na1", summonerLevel: 50, ranks: [] };
    vi.mocked(cache.get).mockResolvedValue(cached);

    const result = await caller.summoner.getProfile({
      name: "cached",
      region: "na1",
    });

    expect(result).toEqual(cached);
    expect(db.summoner.findUnique).not.toHaveBeenCalled();
  });

  it("caches the result after a database miss", async () => {
    await caller.summoner.getProfile({ name: "testuser", region: "na1" });

    expect(cache.cacheSummoner).toHaveBeenCalledWith("na1", "testuser", expect.any(Object));
  });

  it("rejects an empty summoner name", async () => {
    await expect(caller.summoner.getProfile({ name: "", region: "na1" })).rejects.toThrow();
  });

  it("rejects a summoner name that exceeds 16 characters", async () => {
    await expect(
      caller.summoner.getProfile({ name: "a".repeat(17), region: "na1" })
    ).rejects.toThrow();
  });

  it("rejects when rate limit is exceeded", async () => {
    vi.mocked(rateLimit).mockResolvedValue(false);

    await expect(caller.summoner.getProfile({ name: "testuser", region: "na1" })).rejects.toThrow(
      "Too many requests"
    );
  });
});
