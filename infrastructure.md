# Step 3: Infrastructure Plan

---

## Hosting — Vercel + Railway

| Layer | Platform | Reason |
|---|---|---|
| Next.js App | Vercel | Zero-config Next.js deploys, global edge network, ISR built-in |
| PostgreSQL | Railway | Managed Postgres, easy setup, straightforward pricing at my current scale |
| Redis | Upstash | Serverless Redis, pairs perfectly with Vercel, pay-per-request |
| Background jobs | Railway worker | Long-running processes can't run on Vercel's serverless environment |

Background jobs are an important distinction — Vercel is serverless, meaning my API routes spin up and down per request. Scheduled workers that refresh popular summoner data need to live on a persistent process on Railway.

---

## CDN — Cloudflare In Front of Everything

I'm pointing my domain at Cloudflare before it hits Vercel. This gives me DDoS protection out of the box (patch days will spike my traffic), edge caching for static assets, free SSL, and rate limiting rules that protect my Riot API key from someone scripting thousands of searches through my UI.

Champion images and game assets come from Riot's Data Dragon CDN. I'll mirror the ones I use frequently to Cloudflare R2 so I'm not dependent on Riot's asset availability.

---

## Environment Strategy — Three Environments From Day One

```
dev (local)  ──▶  staging (Railway preview)  ──▶  production (Vercel + Railway)
```

- **Dev:** Local Next.js with local Docker containers for Postgres and Redis
- **Staging:** Auto-deploys on every merge to `main`. Uses a separate Riot API dev key. Safe to break.
- **Production:** Deploys only on tagged releases. Uses my production Riot API key. Monitored.

I'm managing environment variables with `.env.local`, `.env.staging`, and `.env.production`, using Vercel's built-in env var management as my source of truth.

---

## DNS & Subdomain Plan

```
op-clone.gg          → main Next.js app (Vercel)
api.op-clone.gg      → reserved for a future public API
assets.op-clone.gg   → champion images and static assets (Cloudflare R2)
```

I'm reserving `api.` now even though I won't use it immediately. Moving it later would break any third-party integrations.

---

## Local Development — Docker Compose

I'm using Docker for local development so my environment is consistent across any machine:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: opgg_clone
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Running `docker compose up` gives me a clean Postgres and Redis instance instantly. No setup friction, no environment differences between machines.

---

## Decision Summary

| Decision | My Choice | When to Revisit |
|---|---|---|
| Rendering | Next.js Hybrid (SSR / SSG / ISR / CSR) | Never — scales to millions |
| Backend structure | Full-stack monorepo with tRPC | Extract services if a module needs independent scaling |
| API layer | tRPC throughout | Add REST endpoints if I build a public API later |
| Language | TypeScript everywhere, strict mode | Never |
| Primary DB | PostgreSQL via Prisma | Never — relational is correct for this data |
| Cache | Redis via Upstash | Never — only grows in importance |
| App hosting | Vercel | Move to AWS if I need persistent servers at scale |
| DB hosting | Railway | Migrate to RDS if I need enterprise SLAs |
| CDN / proxy | Cloudflare | Never |
