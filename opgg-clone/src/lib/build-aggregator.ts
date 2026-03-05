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

/** Queue IDs we aggregate build data for */
const TRACKED_QUEUES = new Set([
  420, // Ranked Solo/Duo
  440, // Ranked Flex
  450, // ARAM
  900, // ARURF / URF
  1700, // Arena (2v2v2v2)
  1020, // One for All
  1300, // Nexus Blitz
  490, // Normal / Quickplay
]);

/** Queue IDs where teamPosition is meaningful */
const ROLE_QUEUES = new Set([420, 440, 490]);

export function extractPatch(gameVersion: string): string {
  const parts = gameVersion.split(".");
  return `${parts[0]}.${parts[1]}`;
}

export async function processMatchForBuildStats(match: RiotMatch): Promise<void> {
  const { queueId } = match.info;
  if (!TRACKED_QUEUES.has(queueId)) return;

  const patch = extractPatch(match.info.gameVersion);
  const useRole = ROLE_QUEUES.has(queueId);

  for (const p of match.info.participants) {
    const role = useRole ? p.teamPosition : "";
    // For role-based queues, skip participants without a valid role assignment
    if (useRole && !VALID_ROLES.has(role)) continue;

    // Upsert overall win stat
    await db.championWinStat.upsert({
      where: { championId_patch_queueId_role: { championId: p.championId, patch, queueId, role } },
      create: { championId: p.championId, patch, queueId, role, wins: p.win ? 1 : 0, games: 1 },
      update: { wins: { increment: p.win ? 1 : 0 }, games: { increment: 1 } },
    });

    // Upsert per-item stats (skip trinkets, consumables, empty slots)
    const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
    for (const itemId of items) {
      if (itemId === 0 || EXCLUDED_ITEMS.has(itemId)) continue;
      await db.championBuildStat.upsert({
        where: {
          championId_patch_queueId_role_itemId: {
            championId: p.championId,
            patch,
            queueId,
            role,
            itemId,
          },
        },
        create: {
          championId: p.championId,
          patch,
          queueId,
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
