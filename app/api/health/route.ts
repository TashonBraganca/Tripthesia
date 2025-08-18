import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'checking...',
      redis: 'checking...',
      auth: 'checking...',
      ai: 'checking...',
      places: 'checking...',
      maps: 'checking...',
      payments: 'checking...',
    },
  };

  try {
    // Check database connection
    try {
      const { db } = await import('@/lib/db');
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`SELECT 1`);
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'error';
    }

    // Check Redis connection
    try {
      const { redis } = await import('@/lib/redis');
      await redis.ping();
      healthStatus.services.redis = 'healthy';
    } catch (error) {
      healthStatus.services.redis = 'error';
    }

    // Check Auth (Clerk)
    try {
      const authStatus = auth();
      healthStatus.services.auth = 'healthy';
    } catch (error) {
      healthStatus.services.auth = 'error';
    }

    // Check OpenAI
    healthStatus.services.ai = process.env.OPENAI_API_KEY ? 'configured' : 'missing_key';

    // Check Foursquare
    healthStatus.services.places = process.env.FOURSQUARE_API_KEY ? 'configured' : 'missing_key';

    // Check Mapbox
    healthStatus.services.maps = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'configured' : 'missing_key';

    // Check Razorpay
    healthStatus.services.payments = 
      (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) 
        ? 'configured' 
        : 'missing_keys';

    // Overall status
    const hasErrors = Object.values(healthStatus.services).some(status => status === 'error');
    const hasMissingKeys = Object.values(healthStatus.services).some(status => status.includes('missing'));
    
    if (hasErrors) {
      healthStatus.status = 'unhealthy';
    } else if (hasMissingKeys) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'healthy';
    }

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}