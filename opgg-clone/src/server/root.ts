import { createTRPCRouter } from "./trpc";
import { summonerRouter } from "./routers/summoner";
import { championsRouter } from "./routers/champions";

export const appRouter = createTRPCRouter({
  summoner: summonerRouter,
  champions: championsRouter,
});

export type AppRouter = typeof appRouter;
