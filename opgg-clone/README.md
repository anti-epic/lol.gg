# OP.GG Clone

A League of Legends player stats and match history application built with Next.js 14, TypeScript, tRPC, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **API**: tRPC for end-to-end type safety
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Styling**: Tailwind CSS
- **Data Source**: Riot Games API

## Local Development Setup

### Prerequisites

- Node.js 20+ (recommended)
- Docker and Docker Compose
- Riot Games API Key ([get one here](https://developer.riotgames.com))

### Quick Start

1. **Clone and install dependencies**
   ```bash
   cd opgg-clone
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your Riot API key:
   ```
   RIOT_API_KEY="RGAPI-your-key-here"
   ```

3. **Start local services**
   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL on port 5432 and Redis on port 6379.

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Create and run migrations

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── server/                 # Backend/API code
│   ├── routers/           # tRPC route handlers
│   ├── services/          # Business logic services
│   └── trpc.ts            # tRPC configuration
├── components/            # React components
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Development Status

- ✅ Next.js 14 with App Router
- ✅ TypeScript strict mode
- ✅ tRPC end-to-end type safety
- ✅ Prisma ORM with PostgreSQL schema
- ✅ Redis caching layer
- 🟡 Riot API integration (placeholder implementation)
- ⏳ Database migrations and seeding
- ⏳ Core features (summoner search, match history, etc.)
- ⏳ Production deployment

## Getting a Riot API Key

1. Go to [developer.riotgames.com](https://developer.riotgames.com)
2. Sign in with your Riot account
3. Create a new personal API key
4. Copy the key and add it to your `.env.local` file

**Note**: Personal API keys expire every 24 hours and have strict rate limits. For production use, you'll need to apply for a production key.

## Environment Setup

The project supports three environments:

- **Development**: Local with Docker containers
- **Staging**: Auto-deploys on merge to main (coming soon)
- **Production**: Tagged releases only (coming soon)

## Contributing

This is currently a personal project, but the codebase is structured to be easily extensible for additional features and contributors.
