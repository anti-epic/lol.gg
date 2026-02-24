# Deployment Guide

This document outlines the deployment strategy for the OP.GG Clone application.

## Architecture Overview

- **Frontend & API**: Vercel (Next.js App Router)
- **Database**: Railway (PostgreSQL)
- **Cache**: Upstash (Redis)
- **CDN**: Cloudflare (in front of Vercel)

## Environment Setup

### Development (Local)
- PostgreSQL: Docker container (localhost:5432)
- Redis: Docker container (localhost:6379)
- Next.js: localhost:3000
- Environment: `.env.local`

### Staging (Auto-deploy)
- PostgreSQL: Railway staging database
- Redis: Upstash staging instance
- Next.js: Vercel preview deployment
- Domain: `opgg-clone-staging.vercel.app`
- Environment: `.env.staging` (managed via Vercel UI)

### Production (Tagged releases)
- PostgreSQL: Railway production database
- Redis: Upstash production instance
- Next.js: Vercel production deployment
- Domain: Your custom domain (pointed through Cloudflare)
- Environment: `.env.production` (managed via Vercel UI)

## Deployment Steps

### Initial Setup

#### 1. Set up Railway (Database)

1. Sign up at [railway.app](https://railway.app)
2. Create new project
3. Deploy PostgreSQL service
4. Create two environments: `staging` and `production`
5. Note down connection strings for both environments

#### 2. Set up Upstash (Redis)

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database for staging
3. Create Redis database for production
4. Note down Redis URLs for both environments

#### 3. Set up Vercel (Frontend/API)

1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Import this project
4. Configure environment variables:

   **Staging Environment:**
   - `DATABASE_URL`: Railway staging connection string
   - `REDIS_URL`: Upstash staging Redis URL
   - `RIOT_API_KEY`: Your development Riot API key
   - `DEFAULT_REGION`: `na1`
   - `NEXT_PUBLIC_APP_URL`: Your staging URL

   **Production Environment:**
   - `DATABASE_URL`: Railway production connection string
   - `REDIS_URL`: Upstash production Redis URL
   - `RIOT_API_KEY`: Your production Riot API key (requires approval)
   - `DEFAULT_REGION`: `na1`
   - `NEXT_PUBLIC_APP_URL`: Your production domain

#### 4. Set up Cloudflare (CDN)

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers at your domain registrar
4. Point domain to Vercel:
   - `A` record: `@` → `76.76.19.19`
   - `CNAME` record: `www` → `cname.vercel-dns.com`

### Database Setup

#### Initial Migration

```bash
# Connect to staging database
DATABASE_URL="staging-url-here" npm run db:push
DATABASE_URL="staging-url-here" npm run db:generate

# Connect to production database
DATABASE_URL="production-url-here" npm run db:push
DATABASE_URL="production-url-here" npm run db:generate
```

## Deployment Workflow

### Automatic Staging Deployment
- Every push to `main` branch automatically deploys to staging
- Environment: staging environment variables
- Domain: `opgg-clone-staging.vercel.app`
- Database: Railway staging instance

### Production Deployment
- Only deploy on git tags (manual release process)
- Environment: production environment variables
- Domain: Your custom domain
- Database: Railway production instance

### Release Process

1. **Test on staging**
   ```bash
   git push origin main
   # Verify staging deployment works
   ```

2. **Create release**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. **Deploy to production**
   - Vercel automatically deploys tagged releases to production
   - Verify production deployment
   - Monitor for any issues

## Environment Variables

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `DATABASE_URL` | Local Docker | Railway Staging | Railway Production |
| `REDIS_URL` | Local Docker | Upstash Staging | Upstash Production |
| `RIOT_API_KEY` | Development Key | Development Key | Production Key |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Staging URL | Production Domain |

## Monitoring & Maintenance

### Health Checks
- Set up Vercel deployment notifications
- Monitor Railway database performance
- Set up Upstash Redis monitoring

### Backups
- Railway provides automatic PostgreSQL backups
- Consider additional backup strategy for production

### Rate Limiting
- Monitor Riot API usage through their developer dashboard
- Set up alerts for rate limit approaching

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check Railway database status and connection string
2. **Redis connection errors**: Verify Upstash Redis URL and instance status
3. **Riot API errors**: Check API key validity and rate limits
4. **Build failures**: Check TypeScript errors and dependency issues

### Logs
- **Application logs**: Vercel dashboard
- **Database logs**: Railway dashboard
- **Redis logs**: Upstash dashboard