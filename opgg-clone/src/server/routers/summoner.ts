import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { db } from '../services/db'
import { cache } from '../services/cache'

export const summonerRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(16),
        region: z.string().min(2).max(5),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = `summoner:${input.region}:${input.name}`

      // Check cache first
      const cached = await cache.get(cacheKey)
      if (cached) return cached

      // Check database for existing data
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const existing = await db.summoner.findUnique({
        where: {
          name_region: {
            name: input.name,
            region: input.region,
          },
        },
        include: {
          ranks: true,
        },
      })

      if (existing && existing.lastFetchedAt > fiveMinutesAgo) {
        // Data is fresh, cache and return
        await cache.cacheSummoner(input.region, input.name, existing)
        return existing
      }

      // TODO: Implement Riot API integration
      // For now, return a placeholder
      const placeholder = {
        puuid: 'placeholder',
        name: input.name,
        region: input.region,
        summonerLevel: 100,
        ranks: [],
      }

      await cache.cacheSummoner(input.region, input.name, placeholder)
      return placeholder
    }),
})