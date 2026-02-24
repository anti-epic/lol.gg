# Step 2: Architecture Decisions

---

## Rendering Strategy — Next.js Hybrid (SSR + SSG + CSR)

I'm using Next.js with a hybrid rendering strategy, choosing the right approach per page type rather than applying one strategy everywhere:

| Page | Strategy | Why |
|---|---|---|
| Homepage / search | SSG | Static, fast, great for SEO |
| Summoner profile (`/summoner/NA/Faker`) | SSR | Data is dynamic, needs to be fresh on load, SEO matters |
| Match history expansion | CSR (client fetch) | User-triggered, doesn't need SEO |
| Live game | CSR with polling | Changes every few seconds, pure client |
| Tier lists / champion stats | SSG + ISR (revalidate every hour) | Aggregate data changes slowly, but needs periodic refresh |

ISR is particularly useful for my tier list pages — they behave like static pages but automatically rebuild in the background on a schedule without a full redeploy.

---

## Why Next.js Over Plain React

Plain React is CSR only by default. It's a UI library that handles what's on screen, not how pages are served or fetched. I'd have to manually bolt on everything else. Next.js is a framework built on top of React that gives me SSR, SSG, ISR, file-based routing, API routes, image optimization, and SEO support out of the box — while I'm still just writing React components. The key reason for this project specifically is that different pages need different rendering strategies, and Next.js lets me choose per page with almost no extra code.

---

## Backend Structure — Full-Stack Next.js Monorepo

I'm keeping my frontend and backend together in one Next.js monorepo. Everything is TypeScript end to end. My project structure:

```
my-opgg-clone/
├── src/
│   ├── app/                    
│   │   ├── page.tsx            # Homepage / search
│   │   ├── summoner/
│   │   │   └── [region]/
│   │   │       └── [name]/
│   │   │           └── page.tsx   # Summoner profile page
│   │   ├── champions/
│   │   │   └── page.tsx        # Tier list page
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts   # Single tRPC entry point
│   │
│   ├── server/                 
│   │   ├── routers/
│   │   │   ├── summoner.ts
│   │   │   ├── matches.ts
│   │   │   ├── liveGame.ts
│   │   │   └── champions.ts
│   │   ├── services/
│   │   │   ├── riotApi.ts      # All Riot API calls live here
│   │   │   ├── cache.ts        # Redis caching logic
│   │   │   └── db.ts           # Database queries
│   │   ├── root.ts             # Merges all routers together
│   │   └── trpc.ts             # tRPC initialization
│   │
│   ├── components/             # React UI components
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Helper functions
│
├── prisma/
│   └── schema.prisma           # My database schema
│
├── .env.local
├── .env.staging
├── .env.production
├── next.config.ts
└── tsconfig.json
```

---

## API Design — tRPC End to End

I'm using tRPC for all communication between my frontend and backend. Since everything lives in one TypeScript monorepo, I get full type safety with zero schema duplication. If I change a field on the server, TypeScript immediately shows an error in my frontend before I even run the app.

**I define a procedure on the server:**

```typescript
// src/server/routers/summoner.ts
export const summonerRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({
      name: z.string(),
      region: z.string()
    }))
    .query(async ({ input }) => {
      const cacheKey = `summoner:${input.region}:${input.name}`
      const cached = await cache.get(cacheKey)
      if (cached) return cached

      const data = await riotApi.getSummoner(input.name, input.region)
      await cache.set(cacheKey, data, 300)
      return data
    })
})
```

**I call it from my frontend like a regular function:**

```typescript
// src/app/summoner/[region]/[name]/page.tsx
const { data, isLoading } = trpc.summoner.getProfile.useQuery({
  name: params.name,
  region: params.region
})
```

No URL strings, no guessing what fields come back. TypeScript knows the exact shape of every response automatically.

---

## Database — PostgreSQL + Redis

I'm using PostgreSQL as my primary database because my data is highly relational — summoners link to matches, matches link to participants, participants link back to summoners. Trying to model this in a NoSQL database would mean doing manual joins anyway.

Redis is non-negotiable because Riot's API is my bottleneck and I pay against rate limits per request. My caching strategy:

| Data | TTL | Reason |
|---|---|---|
| Summoner rank / profile | 5 min | Changes after games |
| Match history list | 3 min | New games appear |
| Match detail (single game) | Permanent | A completed match never changes |
| Live game data | 30 sec | Actively in progress |
| Tier list aggregates | 1 hour | Bulk stats, slow changing |

Match details are immutable once a game ends so I cache them forever and never re-fetch. This alone saves the majority of my Riot API calls.

---

## Key Libraries

| Purpose | Library |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Type-safe API | tRPC v11 |
| Runtime validation | Zod |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Caching | Redis via ioredis |
| Styling | Tailwind CSS |

I'm using Prisma specifically because it generates TypeScript types from my database schema automatically. My database, API layer, and frontend all share the same types with no manual duplication.

**My type flow end to end:**

```
Prisma Schema (source of truth)
      │ generates
      ▼
Database Types (SummonerRecord, MatchRecord...)
      │ used in
      ▼
tRPC Procedures (server-side, fully typed)
      │ inferred by
      ▼
tRPC Client (frontend gets same types automatically)
      │ consumed by
      ▼
React Components (know exactly what data they'll receive)
```

---

## TypeScript Configuration

I'm locking down TypeScript from day one with strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Much easier to enforce at the start than retrofit later.
