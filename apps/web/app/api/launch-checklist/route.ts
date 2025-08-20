import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, any>;
  required: boolean;
}

export async function GET(request: NextRequest) {
  // Only allow in development or with admin auth
  const authHeader = request.headers.get('authorization');
  const isAuthorized = process.env.NODE_ENV === 'development' || 
                      authHeader === `Bearer ${process.env.ADMIN_SECRET}`;
  
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('🚀 Running pre-launch checklist...');

  const checks: CheckResult[] = [];

  // 1. Database Connection Check
  try {
    await db.execute(sql`SELECT 1`);
    checks.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Database connection successful',
      required: true,
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      required: true,
    });
  }

  // 2. Redis Connection Check
  try {
    const pingResult = await redis.ping();
    checks.push({
      name: 'Redis Connection',
      status: pingResult === 'PONG' ? 'pass' : 'fail',
      message: `Redis connection ${pingResult === 'PONG' ? 'successful' : 'failed'}`,
      required: true,
    });
  } catch (error) {
    checks.push({
      name: 'Redis Connection',
      status: 'fail',
      message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      required: true,
    });
  }

  // 3. Environment Variables Check
  const requiredEnvVars = [
    'DATABASE_URL',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
    'FOURSQUARE_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const optionalEnvVars = [
    'STRIPE_SECRET_KEY',
    'SENTRY_DSN',
    'NEXT_PUBLIC_POSTHOG_KEY',
    'KIWI_API_KEY',
    'OPENROUTESERVICE_API_KEY',
  ];

  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);

  if (missingRequired.length === 0) {
    checks.push({
      name: 'Required Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      required: true,
    });
  } else {
    checks.push({
      name: 'Required Environment Variables',
      status: 'fail',
      message: `Missing required environment variables: ${missingRequired.join(', ')}`,
      details: { missing: missingRequired },
      required: true,
    });
  }

  if (missingOptional.length > 0) {
    checks.push({
      name: 'Optional Environment Variables',
      status: 'warning',
      message: `Missing optional environment variables: ${missingOptional.join(', ')}`,
      details: { missing: missingOptional },
      required: false,
    });
  }

  // 4. External API Health Check
  const apiChecks = [
    {
      name: 'Foursquare API',
      url: 'https://api.foursquare.com/v3/places/search?limit=1&near=New%20York',
      headers: { 'Authorization': process.env.FOURSQUARE_API_KEY || '' },
    },
    {
      name: 'Mapbox API',
      url: `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
    },
    {
      name: 'Anthropic API',
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    },
  ];

  for (const apiCheck of apiChecks) {
    try {
      const response = await fetch(apiCheck.url, {
        method: apiCheck.method || 'GET',
        headers: apiCheck.headers,
        body: apiCheck.body,
        signal: AbortSignal.timeout(10000),
      });

      checks.push({
        name: `${apiCheck.name} Health`,
        status: response.ok ? 'pass' : 'warning',
        message: response.ok 
          ? `${apiCheck.name} is responding correctly`
          : `${apiCheck.name} returned status ${response.status}`,
        details: { status: response.status },
        required: false,
      });
    } catch (error) {
      checks.push({
        name: `${apiCheck.name} Health`,
        status: 'warning',
        message: `${apiCheck.name} health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        required: false,
      });
    }
  }

  // 5. Database Tables Check
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const requiredTables = ['users', 'profiles', 'trips', 'itineraries', 'places', 'price_quotes'];
    const existingTables = tables.map((t: any) => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length === 0) {
      checks.push({
        name: 'Database Tables',
        status: 'pass',
        message: 'All required database tables exist',
        details: { tables: existingTables },
        required: true,
      });
    } else {
      checks.push({
        name: 'Database Tables',
        status: 'fail',
        message: `Missing required tables: ${missingTables.join(', ')}`,
        details: { missing: missingTables, existing: existingTables },
        required: true,
      });
    }
  } catch (error) {
    checks.push({
      name: 'Database Tables',
      status: 'fail',
      message: `Failed to check database tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
      required: true,
    });
  }

  // 6. Seed Data Check
  try {
    const placesCount = await db.execute(sql`SELECT COUNT(*) as count FROM places`);
    const count = placesCount[0]?.count || 0;

    if (count > 10) {
      checks.push({
        name: 'Seed Data',
        status: 'pass',
        message: `Database contains ${count} places`,
        details: { placesCount: count },
        required: false,
      });
    } else {
      checks.push({
        name: 'Seed Data',
        status: 'warning',
        message: `Database contains only ${count} places - consider running seed script`,
        details: { placesCount: count },
        required: false,
      });
    }
  } catch (error) {
    checks.push({
      name: 'Seed Data',
      status: 'warning',
      message: `Failed to check seed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      required: false,
    });
  }

  // 7. CRON Jobs Check (development only)
  if (process.env.NODE_ENV === 'development') {
    const cronEndpoints = [
      '/api/cron/refresh-prices',
      '/api/cron/cleanup-cache',
      '/api/cron/health-check',
    ];

    for (const endpoint of cronEndpoints) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET || 'test'}` },
          signal: AbortSignal.timeout(30000),
        });

        checks.push({
          name: `CRON Job ${endpoint}`,
          status: response.ok ? 'pass' : 'warning',
          message: response.ok 
            ? `CRON job ${endpoint} is working`
            : `CRON job ${endpoint} returned status ${response.status}`,
          required: false,
        });
      } catch (error) {
        checks.push({
          name: `CRON Job ${endpoint}`,
          status: 'warning',
          message: `CRON job ${endpoint} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          required: false,
        });
      }
    }
  }

  // 8. Build Verification
  checks.push({
    name: 'Next.js Build',
    status: process.env.NODE_ENV === 'production' ? 'pass' : 'warning',
    message: process.env.NODE_ENV === 'production' 
      ? 'Running in production mode'
      : 'Running in development mode',
    required: false,
  });

  // Calculate overall status
  const failedRequired = checks.filter(check => check.required && check.status === 'fail');
  const warnings = checks.filter(check => check.status === 'warning');
  
  let overallStatus: 'ready' | 'not-ready' | 'warnings';
  if (failedRequired.length > 0) {
    overallStatus = 'not-ready';
  } else if (warnings.length > 0) {
    overallStatus = 'warnings';
  } else {
    overallStatus = 'ready';
  }

  const duration = Date.now() - startTime;
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    durationMs: duration,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      failedRequired: failedRequired.length,
    },
    checks,
    environment: process.env.NODE_ENV,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
  };

  console.log(`🚀 Pre-launch checklist completed in ${duration}ms:`, response.summary);
  
  return NextResponse.json(response);
}