import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "../services/db";

const MIN_ITEM_GAMES = 3;

export const championsRouter = createTRPCRouter({
  getBuilds: publicProcedure
    .input(
      z.object({
        championId: z.number().int(),
        patch: z.string(),
        queueId: z.number().int().default(420),
        role: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { championId, patch, queueId, role } = input;
      const roleFilter = role ? { role } : {};

      const [items, stats] = await Promise.all([
        db.championBuildStat.findMany({
          where: { championId, patch, queueId, ...roleFilter, games: { gte: MIN_ITEM_GAMES } },
          orderBy: { games: "desc" },
          take: 10,
        }),
        db.championWinStat.findMany({
          where: { championId, patch, queueId, ...roleFilter },
        }),
      ]);

      const totalGames = stats.reduce((sum, s) => sum + s.games, 0);
      const totalWins = stats.reduce((sum, s) => sum + s.wins, 0);

      return {
        items: items.map((i) => ({
          itemId: i.itemId,
          winRate: i.games > 0 ? i.wins / i.games : 0,
          games: i.games,
        })),
        roles: [...new Set(stats.map((s) => s.role).filter(Boolean))],
        totalGames,
        winRate: totalGames > 0 ? totalWins / totalGames : null,
        patch,
        queueId,
      };
    }),

  /** Returns the queue IDs that have aggregated data for a champion at a patch */
  getAvailableModes: publicProcedure
    .input(
      z.object({
        championId: z.number().int(),
        patch: z.string(),
      })
    )
    .query(async ({ input }) => {
      const rows = await db.championWinStat.findMany({
        where: { championId: input.championId, patch: input.patch },
        select: { queueId: true, role: true, games: true },
      });
      // Group by queueId, summing games
      const map = new Map<number, number>();
      for (const r of rows) {
        map.set(r.queueId, (map.get(r.queueId) ?? 0) + r.games);
      }
      return [...map.entries()]
        .filter(([, games]) => games > 0)
        .map(([queueId, games]) => ({ queueId, games }))
        .sort((a, b) => b.games - a.games);
    }),
});
