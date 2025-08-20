# Deployment Documentation

## Overview
Tripthesia is deployed on Vercel with serverless architecture, using Neon PostgreSQL, Upstash Redis, and various monitoring services for a production-ready environment.

## Platform Architecture

### Vercel Configuration
- **Runtime**: Node.js 20
- **Region**: US East (primary), EU West (secondary)
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --frozen-lockfile`

### Project Structure
```
vercel.json
├── functions: API routes run as serverless functions
├── edge: Middleware runs on Edge Runtime
└── static: Assets served from CDN
```

## Environment Configuration

### Production Environment Variables
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://tripthesia.com
NODE_ENV=production
SKIP_ENV_VALIDATION=false

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# AI & APIs
ANTHROPIC_API_KEY=sk-ant-...
FOURSQUARE_API_KEY=xxx
OPENROUTESERVICE_API_KEY=xxx
KIWI_API_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# External Services
GYG_PARTNER_KEY=xxx
BOOKING_AFFILIATE_ID=xxx
OPEN_EXCHANGE_RATES_KEY=xxx
```

### Environment Management
- **Development**: `.env.local` (gitignored)
- **Staging**: Vercel Preview deployments
- **Production**: Vercel dashboard environment variables

## Vercel Configuration

### vercel.json
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1", "fra1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    },
    "app/api/trips/[id]/generate/route.ts": {
      "maxDuration": 180
    }
  },
  "crons": [
    {
      "path": "/api/cron/refresh-prices",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/cron/cleanup-cache", 
      "schedule": "0 0 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://tripthesia.com"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/app",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### Build Configuration
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["tripthesia.com", "www.tripthesia.com"],
    },
  },
  images: {
    domains: [
      "images.unsplash.com",
      "fastly.4sqi.net", 
      "foursquare.com",
    ],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options", 
            value: "nosniff",
          },
        ],
      },
    ];
  },
};
```

## Database Deployment

### Neon PostgreSQL Setup
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create database with proper locale
CREATE DATABASE tripthesia 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='en_US.UTF-8' 
  LC_CTYPE='en_US.UTF-8';
```

### Migration Strategy
```bash
# Production migration workflow
pnpm db:generate          # Generate migration files
pnpm db:migrate:check     # Validate migrations
pnpm db:migrate:prod      # Apply to production (with backup)
```

### Connection Configuration
```typescript
// lib/db.ts - Production optimized
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 1, // Serverless: single connection per function
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === "development",
});
```

## CDN & Assets

### Asset Optimization
- **Images**: Next.js Image optimization with WebP/AVIF
- **Fonts**: Self-hosted with `font-display: swap`
- **Icons**: SVG sprite sheets
- **Bundle**: Tree shaking and code splitting

### Caching Strategy
```typescript
// Cache headers for different content types
const cacheHeaders = {
  static: "public, max-age=31536000, immutable", // 1 year
  api: "public, max-age=300, s-maxage=3600",     // 5min/1hour
  pages: "public, max-age=0, s-maxage=86400",    // 0/24hours
};
```

## Monitoring Setup

### Sentry Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out noise
    if (event.exception?.values?.[0]?.value?.includes("Non-Error")) {
      return null;
    }
    return event;
  },
});
```

### PostHog Analytics
```typescript
// lib/posthog.ts
import { PostHog } from "posthog-node";

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 20,
    flushInterval: 10000,
  }
);
```

### Health Monitoring
```typescript
// api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    // Database connectivity
    db.execute(sql`SELECT 1`),
    // Redis connectivity  
    redis.ping(),
    // External API health
    fetch("https://api.foursquare.com/v3/places/search?limit=1"),
  ]);

  const health = {
    status: checks.every(c => c.status === "fulfilled") ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === "fulfilled" ? "ok" : "down",
      redis: checks[1].status === "fulfilled" ? "ok" : "down", 
      external: checks[2].status === "fulfilled" ? "ok" : "degraded",
    },
  };

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}
```

## CRON Jobs

### Scheduled Tasks
```typescript
// api/cron/refresh-prices/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  try {
    // Find expiring price quotes
    const expiring = await db.query.priceQuotes.findMany({
      where: lte(priceQuotes.expiresAt, new Date(Date.now() + 2 * 60 * 60 * 1000)),
    });

    // Refresh prices in batches
    for (const batch of chunk(expiring, 10)) {
      await Promise.allSettled(
        batch.map(quote => refreshPriceQuote(quote))
      );
      await sleep(1000); // Rate limiting
    }

    return NextResponse.json({ 
      refreshed: expiring.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Price refresh failed:", error);
    return NextResponse.json({error: "Refresh failed"}, {status: 500});
  }
}
```

### Cron Configuration in Vercel
```bash
# Set up cron jobs in Vercel dashboard
Path: /api/cron/refresh-prices
Schedule: 0 */2 * * * (every 2 hours)

Path: /api/cron/cleanup-cache  
Schedule: 0 0 * * * (daily at midnight)
```

## Security Configuration

### Headers & CSP
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.posthog.com; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' *.vercel.app *.anthropic.com api.mapbox.com;"
  );
  
  return response;
}
```

### Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1h"), // 100 requests per hour
  analytics: true,
});
```

## Disaster Recovery

### Backup Strategy
- **Database**: Neon automatic backups (7-day retention)
- **Code**: Git repository with tags for releases
- **Environment**: Infrastructure as code documentation
- **Data**: Weekly full exports to S3

### Recovery Procedures

#### Database Recovery
```bash
# Point-in-time recovery (Neon Console)
# 1. Access Neon dashboard
# 2. Select "Restore" option
# 3. Choose recovery point
# 4. Update connection string

# Manual restore from backup
pg_restore --clean --if-exists -d $NEW_DATABASE_URL backup.dump
```

#### Application Recovery
```bash
# Rollback to previous deployment
vercel rollback --token $VERCEL_TOKEN

# Deploy specific commit
git checkout <previous-stable-commit>
vercel deploy --prod
```

### Incident Response

#### Monitoring Alerts
- **Uptime**: PagerDuty integration for critical failures
- **Error Rate**: >5% error rate triggers alert
- **Performance**: Response time >10s triggers alert
- **Database**: Connection failures trigger immediate alert

#### Response Playbook
1. **Acknowledge**: Confirm incident and notify team
2. **Assess**: Determine scope and impact
3. **Mitigate**: Apply temporary fixes
4. **Communicate**: Update status page and users
5. **Resolve**: Implement permanent fix
6. **Post-mortem**: Document learnings

## Performance Optimization

### Edge Runtime
```typescript
// Use Edge Runtime for lightweight functions
export const runtime = 'edge';

// api/health/route.ts - fast health checks
export async function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'content-type': 'application/json' },
  });
}
```

### Database Optimization
```sql
-- Production indexes
CREATE INDEX CONCURRENTLY idx_trips_user_status ON trips(user_id, status);
CREATE INDEX CONCURRENTLY idx_places_coords_gist ON places USING GIST(coords);
CREATE INDEX CONCURRENTLY idx_price_quotes_trip_type ON price_quotes(trip_id, item_type);

-- Connection pooling
SET max_connections = 100;
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
```

### Redis Optimization
```typescript
// Connection pooling for Redis
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.pow(2, retryCount) * 50,
  },
});
```

## Scaling Strategy

### Horizontal Scaling
- **Serverless Functions**: Auto-scale based on demand
- **Database**: Neon autoscaling (2-8 vCPUs)
- **CDN**: Global edge distribution
- **Cache**: Redis cluster for high availability

### Vertical Scaling
- **Function Memory**: Optimize per endpoint (128MB-1GB)
- **Database**: Scale compute and storage independently
- **Connection Limits**: Proper pooling and limits

### Cost Optimization
- **Function Duration**: Optimize cold starts
- **Database**: Right-size compute for workload
- **CDN**: Aggressive caching for static assets
- **Monitoring**: Track costs per feature

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Flow
1. **PR Created**: Preview deployment created
2. **Code Review**: Team reviews changes
3. **PR Merged**: Production deployment triggered
4. **Health Check**: Automated verification
5. **Rollback**: Automatic if health checks fail