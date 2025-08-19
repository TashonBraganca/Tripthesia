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
      const { isDatabaseAvailable, testConnection } = await import('@/lib/db');
      if (isDatabaseAvailable()) {
        const connected = await testConnection();
        healthStatus.services.database = connected ? 'healthy' : 'error';
      } else {
        healthStatus.services.database = 'not_configured';
      }
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
      // Just check if auth function exists and is callable
      if (typeof auth === 'function') {
        healthStatus.services.auth = 'healthy';
      } else {
        healthStatus.services.auth = 'error';
      }
    } catch (error) {
      healthStatus.services.auth = 'error';
    }

    // Check OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && !openaiKey.includes('your_') && openaiKey.length > 20) {
      healthStatus.services.ai = 'configured';
    } else {
      healthStatus.services.ai = 'missing_key';
    }

    // Check Foursquare
    const foursquareKey = process.env.FOURSQUARE_API_KEY;
    if (foursquareKey && !foursquareKey.includes('your_') && foursquareKey.length > 10) {
      healthStatus.services.places = 'configured';
    } else {
      healthStatus.services.places = 'missing_key';
    }

    // Check Mapbox
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (mapboxToken && !mapboxToken.includes('your_') && mapboxToken.length > 10) {
      healthStatus.services.maps = 'configured';
    } else {
      healthStatus.services.maps = 'missing_key';
    }

    // Check Razorpay
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (
      razorpayKeyId && !razorpayKeyId.includes('your_') &&
      razorpayKeySecret && !razorpayKeySecret.includes('your_')
    ) {
      healthStatus.services.payments = 'configured';
    } else {
      healthStatus.services.payments = 'missing_keys';
    }

    // Overall status
    const hasErrors = Object.values(healthStatus.services).some(status => status === 'error');
    const hasMissingKeys = Object.values(healthStatus.services).some(status => 
      status.includes('missing') || status === 'not_configured'
    );
    
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