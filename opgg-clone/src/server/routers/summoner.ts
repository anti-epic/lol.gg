import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "../services/db";
import { cache } from "../services/cache";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedData,
  getRecentMatchIds,
  getMatch,
  type RiotMatch,
  type RiotMatchParticipant,
} from "../services/riot";
import { processMatchForBuildStats } from "@/lib/build-aggregator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "GameName#Tag" → { gameName, tagLine } */
function parseRiotId(input: string): { gameName: string; tagLine: string } {
  const idx = input.indexOf("#");
  if (idx === -1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Please use Riot ID format: GameName#Tag (e.g., Faker#KR1). Summoner names were replaced by Riot IDs.",
    });
  }
  const gameName = input.slice(0, idx).trim();
  const tagLine = input.slice(idx + 1).trim();
  if (!gameName || !tagLine) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Riot ID. Both a game name and tag are required.",
    });
  }
  return { gameName, tagLine };
}

/** Build the match summary for a specific player from full match data */
function buildMatchSummary(match: RiotMatch, puuid: string) {
  const p = match.info.participants.find((x: RiotMatchParticipant) => x.puuid === puuid);
  if (!p) return null;

  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const durationMinutes = match.info.gameDuration / 60;

  return {
    matchId: match.metadata.matchId,
    gameCreation: match.info.gameCreation,
    gameDuration: match.info.gameDuration,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    win: p.win,
    championId: p.championId,
    championName: p.championName,
    champLevel: p.champLevel,
    teamPosition: p.teamPosition,
    spell1Id: p.summoner1Id,
    spell2Id: p.summoner2Id,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: parseFloat(((p.kills + p.assists) / Math.max(p.deaths, 1)).toFixed(2)),
    cs,
    csPerMin: parseFloat((cs / Math.max(durationMinutes, 1)).toFixed(1)),
    visionScore: p.visionScore,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const summonerRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(
      z.object({
        // "GameName#Tag" — tagLine can be up to 5 chars, gameName up to 16
        name: z.string().min(1).max(22),
        region: z.string().min(2).max(5),
      })
    )
    .query(async ({ input }) => {
      const { gameName, tagLine } = parseRiotId(input.name);
      const region = input.region.toLowerCase();
      // Store as "GameName#Tag" in DB/cache so uniqueness is correct
      const riotId = `${gameName}#${tagLine}`;
      const cacheKey = `summoner:${region}:${riotId}`;

      // 1. Redis cache hit
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      // 2. DB hit (fresh data = fetched within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existing = await db.summoner.findUnique({
        where: { name_region: { name: riotId, region } },
        include: { ranks: true },
      });

      if (existing && existing.lastFetchedAt > fiveMinutesAgo) {
        await cache.set(cacheKey, existing, 300);
        return existing;
      }

      // 3. Fetch from Riot API (sequential — each call depends on the previous)
      const account = await getAccountByRiotId(gameName, tagLine, region);
      const summoner = await getSummonerByPuuid(account.puuid, region);
      const rankEntries = await getRankedData(account.puuid, region);

      // 4. Upsert summoner + ranks in a transaction
      const result = await db.$transaction(async (tx) => {
        await tx.summoner.upsert({
          where: { puuid: account.puuid },
          create: {
            puuid: account.puuid,
            name: riotId,
            region,
            profileIconId: summoner.profileIconId,
            summonerLevel: summoner.summonerLevel,
            revisionDate: BigInt(summoner.revisionDate),
            lastFetchedAt: new Date(),
          },
          update: {
            name: riotId,
            profileIconId: summoner.profileIconId,
            summonerLevel: summoner.summonerLevel,
            revisionDate: BigInt(summoner.revisionDate),
            lastFetchedAt: new Date(),
          },
        });

        // Replace ranks (delete + recreate is simpler than upserting each)
        await tx.summonerRank.deleteMany({
          where: { summonerPuuid: account.puuid },
        });

        if (rankEntries.length > 0) {
          await tx.summonerRank.createMany({
            data: rankEntries.map((r) => ({
              summonerPuuid: account.puuid,
              queueType: r.queueType,
              tier: r.tier,
              rank: r.rank,
              leaguePoints: r.leaguePoints,
              wins: r.wins,
              losses: r.losses,
              winRate: r.wins / Math.max(r.wins + r.losses, 1),
            })),
          });
        }

        return tx.summoner.findUniqueOrThrow({
          where: { puuid: account.puuid },
          include: { ranks: true },
        });
      });

      // 5. Cache and return
      await cache.set(cacheKey, result, 300); // 5 min
      return result;
    }),

  refresh: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        region: z.string().min(2).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const region = input.region.toLowerCase();
      await Promise.all([
        cache.delete(`summoner-data:${input.puuid}`),
        cache.delete(`ranks:${input.puuid}`),
        cache.delete(`match-ids:${region}:${input.puuid}`),
        cache.delete(`account:${region}:${input.puuid}`),
        cache.delete(`masteries:${input.puuid}`),
      ]);
      return { ok: true };
    }),

  getMatchHistory: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        region: z.string().min(2).max(5),
        count: z.number().int().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const region = input.region.toLowerCase();
      const idsCacheKey = `match-ids:${region}:${input.puuid}`;

      // 1. Get match IDs (cached 5 min)
      let matchIds = await cache.get<string[]>(idsCacheKey);
      if (!matchIds) {
        matchIds = await getRecentMatchIds(input.puuid, region, input.count);
        await cache.set(idsCacheKey, matchIds, 300);
      }

      // 2. Fetch each match, using cache (completed matches never change)
      const matches = await Promise.all(
        matchIds.map(async (matchId) => {
          const matchCacheKey = `match:${matchId}`;
          const cached = await cache.get<RiotMatch>(matchCacheKey);
          if (cached) return cached;

          const match = await getMatch(matchId, region);
          await cache.set(matchCacheKey, match, 365 * 24 * 60 * 60); // 1 year
          // Passively populate build stats — fire and forget
          void processMatchForBuildStats(match).catch(console.error);
          return match;
        })
      );

      // 3. Extract the requesting player's summary from each match
      return matches.map((m) => buildMatchSummary(m, input.puuid)).filter((s) => s !== null);
    }),
});
