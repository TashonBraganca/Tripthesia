/**
 * Comprehensive caching strategies for performance optimization
 */

import { redis, setInCache, getFromCache } from '@/lib/redis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
  staleWhileRevalidate?: boolean;
}

// Cache duration constants
export const CACHE_DURATIONS = {
  FLIGHT_SEARCH: 300, // 5 minutes
  PLACE_DATA: 3600, // 1 hour
  USER_PROFILE: 900, // 15 minutes
  TRIP_DATA: 1800, // 30 minutes
  ITINERARY: 7200, // 2 hours
  PRICE_QUOTES: 600, // 10 minutes
  GEOCODING: 86400, // 24 hours (locations rarely change)
  API_RESPONSES: 300, // 5 minutes for external APIs
} as const;

// Cache key generators
export const cacheKeys = {
  flightSearch: (params: any) => 
    `flight:${params.from}:${params.to}:${params.date}:${params.adults}`,
  placeData: (placeId: string) => `place:${placeId}`,
  userProfile: (userId: string) => `profile:${userId}`,
  tripData: (tripId: string) => `trip:${tripId}`,
  itinerary: (tripId: string, version?: number) => 
    `itinerary:${tripId}${version ? `:v${version}` : ''}`,
  priceQuotes: (tripId: string, type: string) => `prices:${tripId}:${type}`,
  geocoding: (address: string) => `geo:${encodeURIComponent(address)}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
} as const;

/**
 * Generic cache wrapper with stale-while-revalidate support
 */
export async function withCache<T>(
  config: CacheConfig,
  fetchFunction: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getFromCache<{
      data: T;
      timestamp: number;
      stale?: boolean;
    }>(config.key);

    const now = Date.now();

    if (cached) {
      const age = (now - cached.timestamp) / 1000;
      
      if (age < config.ttl) {
        // Fresh data
        return cached.data;
      }

      if (config.staleWhileRevalidate && age < config.ttl * 2) {
        // Return stale data immediately, refresh in background
        setImmediate(async () => {
          try {
            const fresh = await fetchFunction();
            await setInCache(config.key, {
              data: fresh,
              timestamp: Date.now(),
            }, config.ttl);
          } catch (error) {
            console.error('Background cache refresh failed:', error);
          }
        });
        
        return cached.data;
      }
    }

    // Fetch fresh data
    const fresh = await fetchFunction();
    
    // Cache the result
    await setInCache(config.key, {
      data: fresh,
      timestamp: now,
    }, config.ttl);

    return fresh;
  } catch (error) {
    console.error('Cache operation failed:', error);
    // Fallback to direct function call
    return fetchFunction();
  }
}

/**
 * Multi-level cache with memory and Redis
 */
class MultiLevelCache<T> {
  private memoryCache = new Map<string, {
    data: T;
    timestamp: number;
    ttl: number;
  }>();

  async get(key: string, memoryTtl = 60): Promise<T | null> {
    // Check memory cache first (fastest)
    const memCached = this.memoryCache.get(key);
    if (memCached && (Date.now() - memCached.timestamp) / 1000 < memCached.ttl) {
      return memCached.data;
    }

    // Check Redis cache
    try {
      const redisCached = await getFromCache<T>(key);
      if (redisCached) {
        // Store in memory for faster access
        this.memoryCache.set(key, {
          data: redisCached,
          timestamp: Date.now(),
          ttl: memoryTtl,
        });
        return redisCached;
      }
    } catch (error) {
      console.error('Redis cache read failed:', error);
    }

    return null;
  }

  async set(key: string, data: T, redisTtl: number, memoryTtl = 60): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: memoryTtl,
    });

    try {
      await setInCache(key, data, redisTtl);
    } catch (error) {
      console.error('Redis cache write failed:', error);
    }
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }

    // Clear matching keys
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Singleton instance
export const multiCache = new MultiLevelCache();

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all caches related to a user
  async invalidateUser(userId: string): Promise<void> {
    const patterns = [
      `profile:${userId}`,
      `trips:${userId}`,
      `usage:${userId}`,
    ];

    multiCache.clear(userId);
    
    // In a real implementation, you'd want to use Redis pattern deletion
    // For now, we track keys to invalidate manually
  },

  // Invalidate all caches related to a trip
  async invalidateTrip(tripId: string): Promise<void> {
    const patterns = [
      `trip:${tripId}`,
      `itinerary:${tripId}`,
      `prices:${tripId}`,
    ];

    multiCache.clear(tripId);
  },

  // Invalidate search caches
  async invalidateSearch(searchType: 'flight' | 'place' | 'hotel'): Promise<void> {
    multiCache.clear(searchType);
  },
};

/**
 * Preemptive cache warming for common operations
 */
export const cacheWarming = {
  // Warm flight search cache for popular routes
  async warmFlightSearches(popularRoutes: Array<{
    from: string;
    to: string;
    dates: string[];
  }>): Promise<void> {
    for (const route of popularRoutes) {
      for (const date of route.dates) {
        const cacheKey = cacheKeys.flightSearch({
          from: route.from,
          to: route.to,
          date,
          adults: 1,
        });

        // Only warm if not already cached
        const exists = await getFromCache(cacheKey);
        if (!exists) {
          // Trigger background search to populate cache
          setImmediate(() => {
            // Call flight search API here
          });
        }
      }
    }
  },

  // Warm place data for popular destinations
  async warmPlaceData(popularPlaces: string[]): Promise<void> {
    for (const placeId of popularPlaces) {
      const cacheKey = cacheKeys.placeData(placeId);
      const exists = await getFromCache(cacheKey);
      
      if (!exists) {
        setImmediate(() => {
          // Fetch place data and cache
        });
      }
    }
  },
};

/**
 * Cache performance monitoring
 */
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,

  recordHit(): void {
    this.hits++;
  },

  recordMiss(): void {
    this.misses++;
  },

  recordError(): void {
    this.errors++;
  },

  getStats(): {
    hitRate: number;
    totalRequests: number;
    errorRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      hitRate: total > 0 ? this.hits / total : 0,
      totalRequests: total,
      errorRate: total > 0 ? this.errors / total : 0,
    };
  },

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  },
};