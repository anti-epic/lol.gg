import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDDragonVersion,
  getAllChampions,
  getChampionDetail,
  championIconUrl,
  championLoadingUrl,
  spellIconUrl,
  passiveIconUrl,
  itemIconUrl,
} from "@/lib/ddragon";

const BASE = "https://ddragon.leagueoflegends.com";
const MOCK_VERSION = "14.1.1";

const MOCK_CHAMPION = {
  id: "Ahri",
  key: "103",
  name: "Ahri",
  title: "the Nine-Tailed Fox",
  blurb: "A fox spirit who consumes souls.",
  tags: ["Mage", "Assassin"],
  image: { full: "Ahri.png" },
};

const MOCK_CHAMPION_DETAIL = {
  ...MOCK_CHAMPION,
  lore: "Long ago in a land far to the east...",
  spells: [],
  passive: {
    name: "Essence Theft",
    description: "Ahri gains an Essence stack whenever her spell hits an enemy.",
    image: { full: "Ahri_P.png" },
  },
  stats: {
    hp: 526,
    mp: 418,
    armor: 21,
    spellblock: 30,
    attackdamage: 53,
    attackspeed: 0.668,
    movespeed: 330,
    attackrange: 550,
  },
  recommended: [],
};

// Build a fetch mock that matches URLs by substring
function makeFetchMock(responses: Record<string, unknown>) {
  return vi.fn((url: string) => {
    for (const [pattern, body] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(body),
        });
      }
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

describe("DDragon URL helpers", () => {
  it("championIconUrl returns the correct CDN path", () => {
    expect(championIconUrl("14.1.1", "Ahri")).toBe(`${BASE}/cdn/14.1.1/img/champion/Ahri.png`);
  });

  it("championLoadingUrl returns the correct loading art path", () => {
    expect(championLoadingUrl("Ahri")).toBe(`${BASE}/cdn/img/champion/loading/Ahri_0.jpg`);
  });

  it("spellIconUrl returns the correct spell icon path", () => {
    expect(spellIconUrl("14.1.1", "AhriSeduce.png")).toBe(
      `${BASE}/cdn/14.1.1/img/spell/AhriSeduce.png`
    );
  });

  it("passiveIconUrl returns the correct passive icon path", () => {
    expect(passiveIconUrl("14.1.1", "Ahri_P.png")).toBe(
      `${BASE}/cdn/14.1.1/img/passive/Ahri_P.png`
    );
  });

  it("itemIconUrl returns the correct item icon path", () => {
    expect(itemIconUrl("14.1.1", "3157")).toBe(`${BASE}/cdn/14.1.1/img/item/3157.png`);
  });
});

// ─── getDDragonVersion ────────────────────────────────────────────────────────

describe("getDDragonVersion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the first (latest) version from the array", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ "versions.json": ["14.1.1", "14.0.1", "13.24.1"] }));
    expect(await getDDragonVersion()).toBe("14.1.1");
  });

  it("throws when the fetch response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 503 }))
    );
    await expect(getDDragonVersion()).rejects.toThrow("DDragon versions fetch failed: 503");
  });

  it("throws when the versions array is empty", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ "versions.json": [] }));
    await expect(getDDragonVersion()).rejects.toThrow("DDragon versions list is empty");
  });
});

// ─── getAllChampions ──────────────────────────────────────────────────────────

describe("getAllChampions", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        "versions.json": [MOCK_VERSION],
        "champion.json": { data: { Ahri: MOCK_CHAMPION } },
      })
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the champion data record keyed by id", async () => {
    const champions = await getAllChampions();
    expect(champions).toEqual({ Ahri: MOCK_CHAMPION });
  });

  it("uses the version fetched from getDDragonVersion", async () => {
    await getAllChampions();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0] as string
    );
    expect(calls.some((url) => url.includes(MOCK_VERSION))).toBe(true);
  });

  it("throws when the champion endpoint returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("versions")
          ? Promise.resolve({
              ok: true,
              json: () => Promise.resolve([MOCK_VERSION]),
            })
          : Promise.resolve({ ok: false, status: 500 })
      )
    );
    await expect(getAllChampions()).rejects.toThrow("DDragon champions fetch failed: 500");
  });
});

// ─── getChampionDetail ────────────────────────────────────────────────────────

describe("getChampionDetail", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        "versions.json": [MOCK_VERSION],
        "Ahri.json": { data: { Ahri: MOCK_CHAMPION_DETAIL } },
      })
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the champion detail object", async () => {
    const detail = await getChampionDetail("Ahri");
    expect(detail.name).toBe("Ahri");
    expect(detail.passive.name).toBe("Essence Theft");
    expect(detail.stats.movespeed).toBe(330);
  });

  it("throws when the champion id is not present in the response", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        "versions.json": [MOCK_VERSION],
        "Ghost.json": { data: {} }, // id absent
      })
    );
    await expect(getChampionDetail("Ghost")).rejects.toThrow(
      'Champion "Ghost" not found in DDragon response'
    );
  });

  it("throws when the detail endpoint returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("versions")
          ? Promise.resolve({
              ok: true,
              json: () => Promise.resolve([MOCK_VERSION]),
            })
          : Promise.resolve({ ok: false, status: 404 })
      )
    );
    await expect(getChampionDetail("Ahri")).rejects.toThrow(
      "DDragon champion detail fetch failed: 404"
    );
  });
});
