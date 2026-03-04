/**
 * Protected crawl endpoint — seeds build aggregation data from challenger matches.
 *
 * Called automatically by Vercel Cron (GET, daily at 06:00 UTC).
 * Can also be triggered manually:
 *   curl -X GET https://your-domain.com/api/crawl \
 *     -H "x-crawl-secret: <CRAWL_SECRET>"
 *
 * Env vars:
 *   CRAWL_SECRET   - shared secret for manual invocations
 *   CRON_SECRET    - set automatically by Vercel for cron auth
 *   RIOT_API_KEY   - production Riot API key
 *   CRAWL_REGION   - region to crawl (default: na1)
 *   CRAWL_PLAYERS  - challenger players to process (default: 5)
 *   CRAWL_MATCHES  - matches per player (default: 10)
 *   CRAWL_DELAY_MS - ms between Riot API calls (default: 100 for prod keys)
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/services/db";
import { processMatchForBuildStats, extractPatch } from "@/lib/build-aggregator";
import type { RiotMatch } from "@/server/services/riot";

// Vercel Pro allows up to 300s; keeps us well within limits for 5 players × 10 matches.
export const maxDuration = 300;

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

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;

  // Manual invocations use: x-crawl-secret: <CRAWL_SECRET>
  const crawlSecret = process.env.CRAWL_SECRET;
  if (crawlSecret && req.headers.get("x-crawl-secret") === crawlSecret) return true;

  return false;
}

async function runCrawl(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RIOT_API_KEY not configured" }, { status: 500 });
  }

  const region = (
    req.nextUrl.searchParams.get("region") ??
    process.env.CRAWL_REGION ??
    "na1"
  ).toLowerCase();
  const playerLimit = parseInt(process.env.CRAWL_PLAYERS ?? "5", 10);
  const matchLimit = parseInt(process.env.CRAWL_MATCHES ?? "10", 10);
  // Production keys allow ~100ms between calls; dev keys need 1200ms.
  const delayMs = parseInt(process.env.CRAWL_DELAY_MS ?? "100", 10);

  const platform = PLATFORM_HOST[region];
  const regional = REGIONAL_HOST[region];
  if (!platform || !regional) {
    return NextResponse.json({ error: `Unknown region: ${region}` }, { status: 400 });
  }

  async function riotGet<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { "X-Riot-Token": apiKey! } });
    if (!res.ok) throw new Error(`Riot API ${res.status} for ${url}`);
    return res.json() as Promise<T>;
  }

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const started = Date.now();
  let processed = 0;
  let skipped = 0;

  const league = await riotGet<{ entries: { puuid: string }[] }>(
    `https://${platform}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
  );

  const players = league.entries.slice(0, playerLimit);

  for (const player of players) {
    const matchIds = await riotGet<string[]>(
      `https://${regional}/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=420&count=${matchLimit}`
    );
    await sleep(delayMs);

    for (const matchId of matchIds) {
      const seen = await db.crawledMatch.findUnique({ where: { matchId } });
      if (seen) {
        skipped++;
        continue;
      }

      try {
        const match = await riotGet<RiotMatch>(
          `https://${regional}/lol/match/v5/matches/${matchId}`
        );
        await sleep(delayMs);

        const patch = extractPatch(match.info.gameVersion);
        await db.crawledMatch.create({ data: { matchId, patch } });
        await processMatchForBuildStats(match);
        processed++;
      } catch {
        await sleep(delayMs);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    region,
    processed,
    skipped,
    durationMs: Date.now() - started,
  });
}

// Vercel Cron Jobs send GET requests.
export function GET(req: NextRequest) {
  return runCrawl(req);
}

// Manual curl invocations can use POST.
export function POST(req: NextRequest) {
  return runCrawl(req);
}
