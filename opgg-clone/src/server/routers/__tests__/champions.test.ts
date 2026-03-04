import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindManyItems, mockFindManyStats } = vi.hoisted(() => ({
  mockFindManyItems: vi.fn(),
  mockFindManyStats: vi.fn(),
}));

vi.mock("@/server/services/db", () => ({
  db: {
    championBuildStat: {
      findMany: mockFindManyItems,
    },
    championWinStat: {
      findMany: mockFindManyStats,
    },
  },
}));

import { appRouter } from "@/server/root";

const caller = appRouter.createCaller({ ip: "127.0.0.1" });

const MOCK_ITEMS = [
  { itemId: 3157, wins: 30, games: 50 },
  { itemId: 3020, wins: 25, games: 48 },
];

const MOCK_WIN_STATS = [
  { wins: 55, games: 100 },
  { wins: 45, games: 90 },
];

describe("champions.getBuilds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindManyItems.mockResolvedValue(MOCK_ITEMS);
    mockFindManyStats.mockResolvedValue(MOCK_WIN_STATS);
  });

  it("returns item win rates and overall win rate", async () => {
    const result = await caller.champions.getBuilds({
      championId: 103,
      patch: "16.5",
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({ itemId: 3157, winRate: 0.6, games: 50 });
    expect(result.totalGames).toBe(190);
    expect(result.winRate).toBeCloseTo(100 / 190);
    expect(result.patch).toBe("16.5");
  });

  it("passes role filter to DB query when role is provided", async () => {
    await caller.champions.getBuilds({
      championId: 103,
      patch: "16.5",
      role: "MIDDLE",
    });

    expect(mockFindManyItems).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: "MIDDLE" }),
      })
    );
  });

  it("omits role filter from DB query when role is not provided", async () => {
    await caller.champions.getBuilds({ championId: 103, patch: "16.5" });

    const callArg = mockFindManyItems.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(callArg.where).not.toHaveProperty("role");
  });

  it("returns winRate: null when there are no games", async () => {
    mockFindManyStats.mockResolvedValue([]);

    const result = await caller.champions.getBuilds({
      championId: 103,
      patch: "16.5",
    });

    expect(result.winRate).toBeNull();
    expect(result.totalGames).toBe(0);
  });

  it("returns empty items array when no items meet the minimum threshold", async () => {
    mockFindManyItems.mockResolvedValue([]);

    const result = await caller.champions.getBuilds({
      championId: 103,
      patch: "16.5",
    });

    expect(result.items).toEqual([]);
  });
});
