/**
 * Seed build aggregation data by crawling challenger players.
 *
 * Usage:
 *   DATABASE_URL="<url>" RIOT_API_KEY="<key>" npx tsx scripts/crawl.ts
 *
 * Optional env vars:
 *   CRAWL_REGION    - region to crawl (default: na1)
 *   CRAWL_PLAYERS   - number of challenger players to process (default: 15)
 *   CRAWL_MATCHES   - number of matches per player (default: 20)
 *   CRAWL_DELAY_MS  - delay between match fetches in ms (default: 1200)
 */

import { PrismaClient } from "@prisma/client";
import { processMatchForBuildStats, extractPatch } from "../src/lib/build-aggregator";

const db = new PrismaClient();

const REGION = process.env.CRAWL_REGION ?? "na1";
const PLAYER_LIMIT = parseInt(process.env.CRAWL_PLAYERS ?? "15", 10);
const MATCH_LIMIT = parseInt(process.env.CRAWL_MATCHES ?? "20", 10);
const DELAY_MS = parseInt(process.env.CRAWL_DELAY_MS ?? "1200", 10);

const PLATFORM_HOST: Record<string, string> = {
  na1: "na1.api.riotgames.com",
  euw1: "euw1.api.riotgames.com",
  eun1: "eun1.api.riotgames.com",
  kr: "kr.api.riotgames.com",
  jp1: "jp1.api.riotgames.com",
  br1: "br1.api.riotgames.com",
};

const REGIONAL_HOST: Record<string, string> = {
  na1: "americas.api.riotgames.com",
  br1: "americas.api.riotgames.com",
  euw1: "europe.api.riotgames.com",
  eun1: "europe.api.riotgames.com",
  kr: "asia.api.riotgames.com",
  jp1: "asia.api.riotgames.com",
};

const API_KEY = process.env.RIOT_API_KEY;
if (!API_KEY) {
  console.error("RIOT_API_KEY is not set");
  process.exit(1);
}

async function riotGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "X-Riot-Token": API_KEY! } });
  if (!res.ok) throw new Error(`Riot API error ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const platform = PLATFORM_HOST[REGION];
  const regional = REGIONAL_HOST[REGION];
  if (!platform || !regional) {
    console.error(`Unknown region: ${REGION}`);
    process.exit(1);
  }

  console.log(`Crawling ${PLAYER_LIMIT} challenger players in ${REGION.toUpperCase()}...`);

  // 1. Fetch challenger league
  const league = await riotGet<{ entries: { puuid: string; leaguePoints: number }[] }>(
    `https://${platform}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
  );

  const players = league.entries.slice(0, PLAYER_LIMIT);
  console.log(`Got ${players.length} players`);

  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const [pi, player] of players.entries()) {
    console.log(
      `\n[${pi + 1}/${players.length}] Processing PUUID ${player.puuid.slice(0, 16)}... (${player.leaguePoints} LP)`
    );

    // 2. Get recent ranked match IDs (puuid is now returned directly by league endpoint)
    const matchIds = await riotGet<string[]>(
      `https://${regional}/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=420&count=${MATCH_LIMIT}`
    );
    await sleep(DELAY_MS);

    console.log(`  Found ${matchIds.length} ranked match IDs`);

    for (const matchId of matchIds) {
      // 4. Skip already-crawled matches
      const alreadyCrawled = await db.crawledMatch.findUnique({ where: { matchId } });
      if (alreadyCrawled) {
        totalSkipped++;
        continue;
      }

      try {
        const match = await riotGet<{
          metadata: { matchId: string };
          info: { gameVersion: string; queueId: number; participants: unknown[] };
        }>(`https://${regional}/lol/match/v5/matches/${matchId}`);
        await sleep(DELAY_MS);

        const patch = extractPatch(match.info.gameVersion);

        // Record as crawled before processing to avoid duplicates on retry
        await db.crawledMatch.create({ data: { matchId, patch } });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await processMatchForBuildStats(match as any);
        totalProcessed++;
        console.log(`  ✓ ${matchId} (patch ${patch})`);
      } catch (err) {
        console.error(`  ✗ ${matchId}: ${err}`);
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`\nDone. Processed: ${totalProcessed}, Skipped (already seen): ${totalSkipped}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
