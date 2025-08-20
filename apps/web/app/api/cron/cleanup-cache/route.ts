import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { priceQuotes, places } from "@/lib/db/schema";
import { lt } from "drizzle-orm";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.log('🧹 Starting cache cleanup cron job');

  try {
    let cleanupResults = {
      expiredPriceQuotes: 0,
      stalePlaceData: 0,
      redisKeys: 0,
      errors: 0,
    };

    // 1. Clean up expired price quotes from database
    console.log('🗑️ Cleaning expired price quotes...');
    try {
      const expiredQuotes = await db
        .delete(priceQuotes)
        .where(lt(priceQuotes.expiresAt, new Date()))
        .returning({ id: priceQuotes.id });
      
      cleanupResults.expiredPriceQuotes = expiredQuotes.length;
      console.log(`📊 Deleted ${expiredQuotes.length} expired price quotes`);
    } catch (error) {
      console.error('Failed to clean price quotes:', error);
      cleanupResults.errors++;
    }

    // 2. Clean up stale place data (older than 30 days with no recent access)
    console.log('🏢 Cleaning stale place data...');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const stalePlaces = await db
        .delete(places)
        .where(lt(places.updatedAt, thirtyDaysAgo))
        .returning({ id: places.id });
      
      cleanupResults.stalePlaceData = stalePlaces.length;
      console.log(`🏗️ Deleted ${stalePlaces.length} stale place records`);
    } catch (error) {
      console.error('Failed to clean stale places:', error);
      cleanupResults.errors++;
    }

    // 3. Clean up Redis cache keys
    console.log('🔄 Cleaning Redis cache...');
    try {
      // Get all cache keys
      const cacheKeys = await redis.keys('cache:*');
      let deletedKeys = 0;

      // Process in batches to avoid overwhelming Redis
      const batchSize = 50;
      for (let i = 0; i < cacheKeys.length; i += batchSize) {
        const batch = cacheKeys.slice(i, i + batchSize);
        
        // Check TTL for each key and delete expired ones
        const pipeline = redis.pipeline();
        for (const key of batch) {
          pipeline.ttl(key);
        }
        
        const ttls = await pipeline.exec();
        const expiredKeys = batch.filter((_, index) => {
          const ttl = ttls?.[index]?.[1] as number;
          return ttl === -1 || ttl === -2; // -1 = no expiry but should have, -2 = expired
        });

        if (expiredKeys.length > 0) {
          await redis.del(...expiredKeys);
          deletedKeys += expiredKeys.length;
        }

        // Rate limiting between batches
        if (i + batchSize < cacheKeys.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      cleanupResults.redisKeys = deletedKeys;
      console.log(`🧹 Deleted ${deletedKeys} expired Redis keys`);
    } catch (error) {
      console.error('Failed to clean Redis cache:', error);
      cleanupResults.errors++;
    }

    // 4. Clean up temporary files (if any)
    console.log('📁 Cleaning temporary files...');
    try {
      // In serverless environment, temp files are automatically cleaned
      // This is more for future container deployments
      console.log('📂 Temp file cleanup skipped (serverless environment)');
    } catch (error) {
      console.error('Failed to clean temp files:', error);
      cleanupResults.errors++;
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      cleanup: cleanupResults,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Cache cleanup completed:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Cache cleanup cron failed:', error);
    return NextResponse.json(
      { 
        error: 'Cache cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Helper function to get cache statistics
async function getCacheStats() {
  try {
    const info = await redis.info('memory');
    const keyspace = await redis.info('keyspace');
    
    return {
      memoryUsed: extractMemoryUsage(info),
      totalKeys: extractKeyCount(keyspace),
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return null;
  }
}

function extractMemoryUsage(info: string): string {
  const match = info.match(/used_memory_human:([^\r\n]+)/);
  return match ? match[1].trim() : 'unknown';
}

function extractKeyCount(keyspace: string): number {
  const match = keyspace.match(/keys=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}