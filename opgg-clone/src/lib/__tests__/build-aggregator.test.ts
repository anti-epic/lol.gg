import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/services/db", () => ({
  db: {
    championWinStat: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    championBuildStat: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { extractPatch, processMatchForBuildStats } from "@/lib/build-aggregator";
import { db } from "@/server/services/db";

// ---------------------------------------------------------------------------
// extractPatch
// ---------------------------------------------------------------------------

describe("extractPatch", () => {
  it("extracts major.minor from a full version string", () => {
    expect(extractPatch("16.5.1")).toBe("16.5");
  });

  it("handles multi-digit version components", () => {
    expect(extractPatch("14.23.456.789")).toBe("14.23");
  });

  it("handles a two-part version string", () => {
    expect(extractPatch("16.5")).toBe("16.5");
  });
});

// ---------------------------------------------------------------------------
// processMatchForBuildStats
// ---------------------------------------------------------------------------

const makeParticipant = (overrides = {}) => ({
  puuid: "test-puuid",
  championId: 103,
  teamPosition: "MIDDLE",
  win: true,
  item0: 3157,
  item1: 3020,
  item2: 3165,
  item3: 0,
  item4: 0,
  item5: 0,
  ...overrides,
});

const makeMatch = (overrides = {}) => ({
  metadata: { matchId: "NA1_1", participants: ["test-puuid"] },
  info: {
    gameVersion: "16.5.1",
    queueId: 420,
    participants: [makeParticipant()],
    ...overrides,
  },
});

describe("processMatchForBuildStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips untracked game modes (e.g. custom games)", async () => {
    // Queue ID 0 is a custom game — not in TRACKED_QUEUES
    await processMatchForBuildStats(makeMatch({ queueId: 0 }) as never);

    expect(db.championWinStat.upsert).not.toHaveBeenCalled();
    expect(db.championBuildStat.upsert).not.toHaveBeenCalled();
  });

  it("processes ARAM games (queueId 450) with empty role", async () => {
    await processMatchForBuildStats(makeMatch({ queueId: 450 }) as never);

    expect(db.championWinStat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ queueId: 450, role: "" }),
      })
    );
  });

  it("upserts win stat and item stats for a valid ranked game", async () => {
    await processMatchForBuildStats(makeMatch() as never);

    expect(db.championWinStat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          championId: 103,
          patch: "16.5",
          role: "MIDDLE",
          wins: 1,
          games: 1,
        }),
      })
    );
    expect(db.championBuildStat.upsert).toHaveBeenCalledTimes(3); // item0, item1, item2 (item3-5 are 0)
  });

  it("skips participants with invalid or missing role", async () => {
    const match = makeMatch({
      participants: [makeParticipant({ teamPosition: "" })],
    });
    await processMatchForBuildStats(match as never);

    expect(db.championWinStat.upsert).not.toHaveBeenCalled();
  });

  it("skips item slot 0 (empty item)", async () => {
    const match = makeMatch({
      participants: [makeParticipant({ item0: 0, item1: 0, item2: 0 })],
    });
    await processMatchForBuildStats(match as never);

    expect(db.championBuildStat.upsert).not.toHaveBeenCalled();
  });

  it("skips excluded consumable/ward items", async () => {
    const match = makeMatch({
      participants: [
        makeParticipant({ item0: 3340, item1: 2003, item2: 2055, item3: 0, item4: 0, item5: 0 }),
      ],
    });
    await processMatchForBuildStats(match as never);

    expect(db.championBuildStat.upsert).not.toHaveBeenCalled();
  });

  it("records wins=0 for a losing participant", async () => {
    const match = makeMatch({
      participants: [makeParticipant({ win: false })],
    });
    await processMatchForBuildStats(match as never);

    expect(db.championWinStat.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ wins: 0 }),
      })
    );
  });

  it("processes all valid participants in a match", async () => {
    const match = makeMatch({
      participants: [
        makeParticipant({ championId: 103, teamPosition: "MIDDLE" }),
        makeParticipant({ championId: 157, teamPosition: "TOP" }),
      ],
    });
    await processMatchForBuildStats(match as never);

    expect(db.championWinStat.upsert).toHaveBeenCalledTimes(2);
  });
});
