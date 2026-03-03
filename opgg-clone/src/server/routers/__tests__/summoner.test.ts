import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@/server/services/db", () => {
  const mockUpsert = vi.fn();
  const mockFindUniqueOrThrow = vi.fn();
  const mockFindUnique = vi.fn().mockResolvedValue(null);
  const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const mockCreateMany = vi.fn().mockResolvedValue({ count: 0 });
  const tx = {
    summoner: { upsert: mockUpsert, findUniqueOrThrow: mockFindUniqueOrThrow },
    summonerRank: { deleteMany: mockDeleteMany, createMany: mockCreateMany },
  };
  return {
    db: {
      summoner: {
        findUnique: mockFindUnique,
        upsert: mockUpsert,
        findUniqueOrThrow: mockFindUniqueOrThrow,
      },
      summonerRank: { deleteMany: mockDeleteMany, createMany: mockCreateMany },
      $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(tx)),
    },
  };
});

vi.mock("@/server/services/riot", () => ({
  getAccountByRiotId: vi.fn(),
  getSummonerByPuuid: vi.fn(),
  getRankedData: vi.fn().mockResolvedValue([]),
  getRecentMatchIds: vi.fn().mockResolvedValue([]),
  getMatch: vi.fn(),
}));

import { appRouter } from "@/server/root";
import { cache } from "@/server/services/cache";
import { db } from "@/server/services/db";
import { rateLimit } from "@/lib/rate-limit";
import { getAccountByRiotId, getSummonerByPuuid } from "@/server/services/riot";

const caller = appRouter.createCaller({ ip: "127.0.0.1" });

const MOCK_ACCOUNT = { puuid: "test-puuid", gameName: "TestUser", tagLine: "NA1" };
const MOCK_SUMMONER = {
  id: "summoner-id",
  accountId: "account-id",
  puuid: "test-puuid",
  profileIconId: 1,
  revisionDate: Date.now(),
  summonerLevel: 100,
};
const MOCK_DB_SUMMONER = {
  puuid: "test-puuid",
  summonerId: "summoner-id",
  accountId: "account-id",
  name: "TestUser#NA1",
  region: "na1",
  profileIconId: 1,
  summonerLevel: 100,
  revisionDate: BigInt(0),
  createdAt: new Date(),
  updatedAt: new Date(),
  lastFetchedAt: new Date(),
  ranks: [],
};

describe("summoner.getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue(true);
    vi.mocked(cache.get).mockResolvedValue(null);
    vi.mocked(db.summoner.findUnique).mockResolvedValue(null);
    vi.mocked(getAccountByRiotId).mockResolvedValue(MOCK_ACCOUNT);
    vi.mocked(getSummonerByPuuid).mockResolvedValue(MOCK_SUMMONER);
    vi.mocked(db.summoner.findUniqueOrThrow).mockResolvedValue(MOCK_DB_SUMMONER as never);
  });

  it("rejects a name without #tag (not Riot ID format)", async () => {
    await expect(caller.summoner.getProfile({ name: "testuser", region: "na1" })).rejects.toThrow(
      "Riot ID format"
    );
  });

  it("returns cached data without hitting the database", async () => {
    vi.mocked(cache.get).mockResolvedValue(MOCK_DB_SUMMONER);

    const result = await caller.summoner.getProfile({
      name: "TestUser#NA1",
      region: "na1",
    });

    expect(result).toEqual(MOCK_DB_SUMMONER);
    expect(db.summoner.findUnique).not.toHaveBeenCalled();
  });

  it("fetches from Riot API on a cache + DB miss and caches the result", async () => {
    await caller.summoner.getProfile({ name: "TestUser#NA1", region: "na1" });

    expect(getAccountByRiotId).toHaveBeenCalledWith("TestUser", "NA1", "na1");
    expect(getSummonerByPuuid).toHaveBeenCalledWith("test-puuid", "na1");
    expect(cache.set).toHaveBeenCalled();
  });

  it("rejects an empty summoner name", async () => {
    await expect(caller.summoner.getProfile({ name: "", region: "na1" })).rejects.toThrow();
  });

  it("rejects a name that exceeds the max length", async () => {
    await expect(
      caller.summoner.getProfile({ name: "a".repeat(23), region: "na1" })
    ).rejects.toThrow();
  });

  it("rejects when rate limit is exceeded", async () => {
    vi.mocked(rateLimit).mockResolvedValue(false);

    await expect(
      caller.summoner.getProfile({ name: "TestUser#NA1", region: "na1" })
    ).rejects.toThrow("Too many requests");
  });
});
