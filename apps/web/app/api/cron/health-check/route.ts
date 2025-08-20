import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('🏥 Starting health check cron job');

  const healthChecks = {
    database: { status: 'unknown', responseTime: 0, error: null },
    redis: { status: 'unknown', responseTime: 0, error: null },
    externalAPIs: {
      foursquare: { status: 'unknown', responseTime: 0, error: null },
      mapbox: { status: 'unknown', responseTime: 0, error: null },
      anthropic: { status: 'unknown', responseTime: 0, error: null },
    },
    memory: { usage: 'unknown', available: 'unknown' },
  };

  // 1. Database Health Check
  console.log('🗄️ Checking database health...');
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1 as health_check`);
    healthChecks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      error: null,
    };
    console.log('✅ Database is healthy');
  } catch (error) {
    healthChecks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
    console.error('❌ Database health check failed:', error);
  }

  // 2. Redis Health Check
  console.log('🔄 Checking Redis health...');
  try {
    const redisStart = Date.now();
    const pingResult = await redis.ping();
    healthChecks.redis = {
      status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - redisStart,
      error: pingResult !== 'PONG' ? 'Ping failed' : null,
    };
    console.log('✅ Redis is healthy');
  } catch (error) {
    healthChecks.redis = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
    console.error('❌ Redis health check failed:', error);
  }

  // 3. External API Health Checks
  console.log('🌐 Checking external APIs...');

  // Foursquare API
  try {
    const fsStart = Date.now();
    const fsResponse = await fetch('https://api.foursquare.com/v3/places/search?limit=1&near=New%20York', {
      headers: {
        'Authorization': process.env.FOURSQUARE_API_KEY!,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    healthChecks.externalAPIs.foursquare = {
      status: fsResponse.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - fsStart,
      error: fsResponse.ok ? null : `HTTP ${fsResponse.status}`,
    };
  } catch (error) {
    healthChecks.externalAPIs.foursquare = {
      status: 'unhealthy',
      responseTime: 10000,
      error: error instanceof Error ? error.message : 'Unknown Foursquare error',
    };
  }

  // Mapbox API
  try {
    const mapboxStart = Date.now();
    const mapboxResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
      signal: AbortSignal.timeout(10000),
    });
    
    healthChecks.externalAPIs.mapbox = {
      status: mapboxResponse.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - mapboxStart,
      error: mapboxResponse.ok ? null : `HTTP ${mapboxResponse.status}`,
    };
  } catch (error) {
    healthChecks.externalAPIs.mapbox = {
      status: 'unhealthy',
      responseTime: 10000,
      error: error instanceof Error ? error.message : 'Unknown Mapbox error',
    };
  }

  // Anthropic API (simple check)
  try {
    const anthropicStart = Date.now();
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
      signal: AbortSignal.timeout(10000),
    });
    
    healthChecks.externalAPIs.anthropic = {
      status: anthropicResponse.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - anthropicStart,
      error: anthropicResponse.ok ? null : `HTTP ${anthropicResponse.status}`,
    };
  } catch (error) {
    healthChecks.externalAPIs.anthropic = {
      status: 'unhealthy',
      responseTime: 10000,
      error: error instanceof Error ? error.message : 'Unknown Anthropic error',
    };
  }

  // 4. Memory Usage Check (serverless environment)
  try {
    const memUsage = process.memoryUsage();
    healthChecks.memory = {
      usage: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      available: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    };
  } catch (error) {
    console.error('Failed to get memory usage:', error);
  }

  // Calculate overall health status
  const criticalChecks = [
    healthChecks.database.status,
    healthChecks.redis.status,
  ];

  const externalChecks = Object.values(healthChecks.externalAPIs).map(api => api.status);
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  
  if (criticalChecks.every(status => status === 'healthy')) {
    if (externalChecks.every(status => status === 'healthy')) {
      overallStatus = 'healthy';
    } else if (externalChecks.some(status => status === 'healthy' || status === 'degraded')) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
  } else {
    overallStatus = 'unhealthy';
  }

  const duration = Date.now() - startTime;
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    durationMs: duration,
    checks: healthChecks,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
  };

  // Log critical issues
  if (overallStatus === 'unhealthy') {
    console.error('🚨 Critical health issues detected:', response);
  } else if (overallStatus === 'degraded') {
    console.warn('⚠️ Degraded service detected:', response);
  } else {
    console.log('✅ All systems healthy');
  }

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;
  
  return NextResponse.json(response, { status: httpStatus });
}

// Export a simple health check endpoint for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check - just verify we can respond
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}