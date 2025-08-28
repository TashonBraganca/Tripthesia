import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface FlightSearchParams {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
}

export interface CachedFlightData {
  flights: any[];
  searchParams: FlightSearchParams;
  resultsCount: number;
  provider: 'amadeus' | 'rapidapi' | 'mock';
  cachedAt: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_CONFIG = {
  // Flight prices change frequently, so we cache for 2-4 hours
  FLIGHT_CACHE_TTL: 2 * 60 * 60, // 2 hours in seconds
  // Premium searches can be cached longer
  PREMIUM_CACHE_TTL: 4 * 60 * 60, // 4 hours in seconds
  // Cache key prefix
  FLIGHT_PREFIX: 'flight_search:',
  // Maximum cache size per entry (to avoid large Redis entries)
  MAX_CACHE_SIZE: 50 * 1024, // 50KB
};

/**
 * Generate a consistent cache key for flight search parameters
 */
export function generateFlightCacheKey(params: FlightSearchParams): string {
  // Normalize parameters for consistent caching
  const normalizedParams = {
    from: params.from.toLowerCase().trim(),
    to: params.to.toLowerCase().trim(),
    departureDate: params.departureDate.split('T')[0], // Only date part
    returnDate: params.returnDate?.split('T')[0] || null,
    adults: params.adults,
    currency: params.currency.toUpperCase(),
  };

  // Create a deterministic key
  const keyData = JSON.stringify(normalizedParams);
  const hash = Buffer.from(keyData).toString('base64').replace(/[+/=]/g, '');
  
  return `${CACHE_CONFIG.FLIGHT_PREFIX}${hash.substring(0, 32)}`;
}

/**
 * Cache flight search results with TTL
 */
export async function cacheFlightResults(
  params: FlightSearchParams,
  flights: any[],
  provider: 'amadeus' | 'rapidapi' | 'mock',
  isPremium = false
): Promise<boolean> {
  try {
    const cacheKey = generateFlightCacheKey(params);
    const now = Date.now();
    const ttl = isPremium ? CACHE_CONFIG.PREMIUM_CACHE_TTL : CACHE_CONFIG.FLIGHT_CACHE_TTL;
    
    const cacheData: CachedFlightData = {
      flights: flights.slice(0, 10), // Limit to top 10 results to save space
      searchParams: params,
      resultsCount: flights.length,
      provider,
      cachedAt: now,
      expiresAt: now + (ttl * 1000),
    };

    // Check cache entry size
    const dataSize = JSON.stringify(cacheData).length;
    if (dataSize > CACHE_CONFIG.MAX_CACHE_SIZE) {
      console.warn(`Flight cache entry too large: ${dataSize} bytes, skipping cache`);
      return false;
    }

    // Store in Redis with TTL
    await redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
    
    console.log(`✅ Cached flight results: ${cacheKey} (${flights.length} flights, ${provider})`);
    return true;
    
  } catch (error) {
    console.error('Failed to cache flight results:', error);
    return false;
  }
}

/**
 * Retrieve cached flight search results
 */
export async function getCachedFlightResults(
  params: FlightSearchParams
): Promise<CachedFlightData | null> {
  try {
    const cacheKey = generateFlightCacheKey(params);
    const cachedData = await redis.get(cacheKey);
    
    if (!cachedData) {
      console.log(`⚡ Cache miss: ${cacheKey}`);
      return null;
    }

    const parsed = JSON.parse(cachedData as string) as CachedFlightData;
    
    // Double-check expiration (Redis should handle this, but extra safety)
    if (Date.now() > parsed.expiresAt) {
      console.log(`⏰ Cache expired: ${cacheKey}`);
      await redis.del(cacheKey); // Clean up expired entry
      return null;
    }

    console.log(`🎯 Cache hit: ${cacheKey} (${parsed.flights.length} flights, ${parsed.provider})`);
    return parsed;
    
  } catch (error) {
    console.error('Failed to retrieve cached flight results:', error);
    return null;
  }
}

/**
 * Invalidate flight cache for specific route
 */
export async function invalidateFlightCache(params: FlightSearchParams): Promise<boolean> {
  try {
    const cacheKey = generateFlightCacheKey(params);
    const result = await redis.del(cacheKey);
    
    console.log(`🗑️ Invalidated flight cache: ${cacheKey}`);
    return result > 0;
    
  } catch (error) {
    console.error('Failed to invalidate flight cache:', error);
    return false;
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getFlightCacheStats(): Promise<{
  totalEntries: number;
  keysSample: string[];
  memoryUsage?: string;
}> {
  try {
    const keys = await redis.keys(`${CACHE_CONFIG.FLIGHT_PREFIX}*`);
    
    return {
      totalEntries: keys.length,
      keysSample: keys.slice(0, 5), // First 5 keys as sample
      memoryUsage: 'Redis info not available via REST API'
    };
    
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      totalEntries: 0,
      keysSample: [],
      memoryUsage: 'Error retrieving stats'
    };
  }
}

/**
 * Clear all flight cache (use carefully)
 */
export async function clearAllFlightCache(): Promise<number> {
  try {
    const keys = await redis.keys(`${CACHE_CONFIG.FLIGHT_PREFIX}*`);
    
    if (keys.length === 0) {
      return 0;
    }
    
    const deleted = await redis.del(...keys);
    console.log(`🧹 Cleared ${deleted} flight cache entries`);
    
    return deleted;
    
  } catch (error) {
    console.error('Failed to clear flight cache:', error);
    return 0;
  }
}

/**
 * Check if Redis cache is available
 */
export async function isFlightCacheAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Flight cache not available:', error);
    return false;
  }
}