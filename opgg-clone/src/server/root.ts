import { createTRPCRouter } from './trpc'
import { summonerRouter } from './routers/summoner'

export const appRouter = createTRPCRouter({
  summoner: summonerRouter,
})

export type AppRouter = typeof appRouter