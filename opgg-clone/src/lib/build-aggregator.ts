import { db } from "@/server/services/db";
import type { RiotMatch } from "@/server/services/riot";

const EXCLUDED_ITEMS = new Set([
  3340, // Warding Totem
  3363, // Farsight Alteration
  3364, // Oracle Lens
  2003, // Health Potion
  2031, // Refillable Potion
  2055, // Control Ward
]);

const VALID_ROLES = new Set(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);

export function extractPatch(gameVersion: string): string {
  const parts = gameVersion.split(".");
  return `${parts[0]}.${parts[1]}`;
}

export async function processMatchForBuildStats(match: RiotMatch): Promise<void> {
  // Only ranked solo/duo
  if (match.info.queueId !== 420) return;

  const patch = extractPatch(match.info.gameVersion);

  for (const p of match.info.participants) {
    const role = p.teamPosition;
    if (!VALID_ROLES.has(role)) continue;

    // Upsert overall win stat for this champion/patch/role
    await db.championWinStat.upsert({
      where: { championId_patch_role: { championId: p.championId, patch, role } },
      create: { championId: p.championId, patch, role, wins: p.win ? 1 : 0, games: 1 },
      update: { wins: { increment: p.win ? 1 : 0 }, games: { increment: 1 } },
    });

    // Upsert per-item stats
    const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
    for (const itemId of items) {
      if (itemId === 0 || EXCLUDED_ITEMS.has(itemId)) continue;
      await db.championBuildStat.upsert({
        where: {
          championId_patch_role_itemId: { championId: p.championId, patch, role, itemId },
        },
        create: {
          championId: p.championId,
          patch,
          role,
          itemId,
          wins: p.win ? 1 : 0,
          games: 1,
        },
        update: { wins: { increment: p.win ? 1 : 0 }, games: { increment: 1 } },
      });
    }
  }
}
