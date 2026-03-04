import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "../services/db";

const MIN_ITEM_GAMES = 50;

export const championsRouter = createTRPCRouter({
  getBuilds: publicProcedure
    .input(
      z.object({
        championId: z.number().int(),
        patch: z.string(),
        role: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { championId, patch, role } = input;
      const roleFilter = role ? { role } : {};

      const [items, stats] = await Promise.all([
        db.championBuildStat.findMany({
          where: { championId, patch, ...roleFilter, games: { gte: MIN_ITEM_GAMES } },
          orderBy: { games: "desc" },
          take: 10,
        }),
        db.championWinStat.findMany({
          where: { championId, patch, ...roleFilter },
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
        totalGames,
        winRate: totalGames > 0 ? totalWins / totalGames : null,
        patch,
      };
    }),
});
