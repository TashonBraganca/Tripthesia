/**
 * Redis Cache Manager - Phase 2.7
 * 
 * Comprehensive caching system for travel API responses with:
 * - Intelligent TTL management based on data type and volatility
 * - Stale-while-revalidate patterns for optimal user experience
 * - Geographic and user-specific cache segmentation
 * - Cache warming and preemptive invalidation
 * - Performance monitoring and analytics
 * - Distributed cache coordination
 * - Compression and serialization optimization
 */

import { Redis } from '@upstash/redis';
import { Currency } from '../services/travel-normalization';

// ==================== CONFIGURATION ====================

export interface CacheConfig {
  defaultTTL: number; // Default TTL in seconds
  staleWhileRevalidateBuffer: number; // Additional time for SWR
  compressionThreshold: number; // Minimum size for compression
  maxRetries: number;
  retryDelayMs: number;
  enableAnalytics: boolean;
  enableWarming: boolean;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 900, // 15 minutes
  staleWhileRevalidateBuffer: 300, // 5 minutes
  compressionThreshold: 1024, // 1KB
  maxRetries: 3,
  retryDelayMs: 100,
  enableAnalytics: true,
  enableWarming: true
};

// ==================== CACHE KEY STRATEGIES ====================

export type CacheKeyType = 
  | 'flight_search'
  | 'hotel_search'
  | 'transport_search'
  | 'car_rental_search'
  | 'poi_search'
  | 'price_comparison'
  | 'deal_analysis'
  | 'route_optimization'
  | 'user_preferences'
  | 'exchange_rates'
  | 'provider_status'
  | 'analytics_data';

export type TravelServiceType = 'flight' | 'hotel' | 'transport' | 'car_rental';

export interface CacheMetadata {
  type: CacheKeyType;
  version: number;
  region?: string;
  userId?: string;
  searchQuery?: string;
  createdAt: number;
  expiresAt: number;
  lastAccessed?: number;
  hitCount?: number;
  compressionRatio?: number;
}

// ==================== TTL STRATEGIES ====================

export const CACHE_TTL_STRATEGIES: Record<CacheKeyType, { 
  ttl: number; 
  staleBuffer: number; 
  description: string;
  warmingStrategy?: 'preemptive' | 'background' | 'none';
}> = {
  // High volatility - short TTL
  flight_search: { 
    ttl: 300, // 5 minutes
    staleBuffer: 120, // 2 minutes
    description: 'Flight prices change frequently',
    warmingStrategy: 'preemptive'
  },
  price_comparison: { 
    ttl: 300, // 5 minutes
    staleBuffer: 120,
    description: 'Price analysis needs fresh data',
    warmingStrategy: 'background'
  },
  deal_analysis: { 
    ttl: 180, // 3 minutes
    staleBuffer: 60,
    description: 'Deals expire quickly',
    warmingStrategy: 'preemptive'
  },
  
  // Medium volatility - moderate TTL
  hotel_search: { 
    ttl: 900, // 15 minutes
    staleBuffer: 300,
    description: 'Hotel availability changes moderately',
    warmingStrategy: 'background'
  },
  transport_search: { 
    ttl: 1800, // 30 minutes
    staleBuffer: 600,
    description: 'Transport schedules relatively stable'
  },
  car_rental_search: { 
    ttl: 1800, // 30 minutes
    staleBuffer: 600,
    description: 'Car rental inventory stable'
  },
  
  // Low volatility - long TTL
  poi_search: { 
    ttl: 7200, // 2 hours
    staleBuffer: 1800,
    description: 'POI data rarely changes',
    warmingStrategy: 'background'
  },
  route_optimization: { 
    ttl: 3600, // 1 hour
    staleBuffer: 900,
    description: 'Routes change with traffic patterns'
  },
  
  // Very stable data - very long TTL
  exchange_rates: { 
    ttl: 3600, // 1 hour
    staleBuffer: 900,
    description: 'Exchange rates updated hourly'
  },
  user_preferences: { 
    ttl: 86400, // 24 hours
    staleBuffer: 7200,
    description: 'User preferences rarely change'
  },
  provider_status: { 
    ttl: 600, // 10 minutes
    staleBuffer: 180,
    description: 'Provider availability monitoring'
  },
  analytics_data: { 
    ttl: 1800, // 30 minutes
    staleBuffer: 600,
    description: 'Analytics aggregation data'
  }
};

// ==================== CACHE MANAGER CLASS ====================

export class RedisCacheManager {
  private redis: Redis;
  private config: CacheConfig;
  private analytics: Map<string, any> = new Map();

  constructor(redisUrl?: string, config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    // Initialize Redis client
    const redisConfig = {
      url: redisUrl || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
    
    this.redis = new Redis(redisConfig);

    // Start background processes if enabled
    if (this.config.enableWarming) {
      this.startCacheWarmingProcess();
    }
    if (this.config.enableAnalytics) {
      this.startAnalyticsProcess();
    }
  }

  // ==================== PRIMARY CACHE OPERATIONS ====================

  async get<T>(
    key: string, 
    type: CacheKeyType,
    options?: { 
      allowStale?: boolean; 
      userId?: string;
      region?: string;
    }
  ): Promise<{ data: T | null; metadata: CacheMetadata | null; isStale: boolean }> {
    const fullKey = this.buildCacheKey(key, type, options?.userId, options?.region);
    
    try {
      // Get data and metadata in parallel
      const [serializedData, metadataStr] = await Promise.all([
        this.redis.get(fullKey),
        this.redis.get(`${fullKey}:meta`)
      ]);

      if (!serializedData || !metadataStr) {
        return { data: null, metadata: null, isStale: false };
      }

      const metadata: CacheMetadata = JSON.parse(metadataStr as string);
      const now = Date.now();
      const isExpired = now > metadata.expiresAt;
      const isStale = now > (metadata.expiresAt - CACHE_TTL_STRATEGIES[type].staleBuffer * 1000);

      // Update analytics
      if (this.config.enableAnalytics) {
        await this.updateAccessAnalytics(fullKey, metadata);
      }

      // Return null if expired and stale not allowed
      if (isExpired && !options?.allowStale) {
        return { data: null, metadata, isStale: true };
      }

      // Decompress and deserialize data
      const data = await this.deserializeData<T>(serializedData as string, metadata);
      
      return { data, metadata, isStale };

    } catch (error) {
      console.error('Cache get error:', error);
      return { data: null, metadata: null, isStale: false };
    }
  }

  async set<T>(
    key: string,
    data: T,
    type: CacheKeyType,
    options?: {
      customTTL?: number;
      userId?: string;
      region?: string;
      searchQuery?: string;
      version?: number;
    }
  ): Promise<boolean> {
    const strategy = CACHE_TTL_STRATEGIES[type];
    const ttl = options?.customTTL || strategy.ttl;
    const fullKey = this.buildCacheKey(key, type, options?.userId, options?.region);
    
    try {
      const now = Date.now();
      const expiresAt = now + (ttl * 1000);

      // Serialize and compress data
      const { serializedData, compressionRatio } = await this.serializeData(data);

      // Create metadata
      const metadata: CacheMetadata = {
        type,
        version: options?.version || 1,
        region: options?.region,
        userId: options?.userId,
        searchQuery: options?.searchQuery,
        createdAt: now,
        expiresAt,
        compressionRatio
      };

      // Store data and metadata with appropriate TTL
      const totalTTL = ttl + strategy.staleBuffer;
      await Promise.all([
        this.redis.setex(fullKey, totalTTL, serializedData),
        this.redis.setex(`${fullKey}:meta`, totalTTL, JSON.stringify(metadata))
      ]);

      // Schedule cache warming if enabled
      if (this.config.enableWarming && strategy.warmingStrategy) {
        await this.scheduleCacheWarming(fullKey, type, ttl * 0.8); // Warm at 80% of TTL
      }

      return true;

    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(
    key: string,
    type: CacheKeyType,
    options?: {
      userId?: string;
      region?: string;
      pattern?: boolean; // Delete by pattern matching
    }
  ): Promise<boolean> {
    try {
      if (options?.pattern) {
        // Pattern-based deletion
        const pattern = this.buildCacheKey(key, type, options.userId, options.region);
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          // Also delete metadata keys
          const metaKeys = keys.map(k => `${k}:meta`);
          await this.redis.del(...metaKeys);
        }
      } else {
        // Single key deletion
        const fullKey = this.buildCacheKey(key, type, options?.userId, options?.region);
        await Promise.all([
          this.redis.del(fullKey),
          this.redis.del(`${fullKey}:meta`)
        ]);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // ==================== STALE-WHILE-REVALIDATE ====================

  async getWithRevalidation<T>(
    key: string,
    type: CacheKeyType,
    revalidationFn: () => Promise<T>,
    options?: {
      userId?: string;
      region?: string;
      forceRevalidation?: boolean;
    }
  ): Promise<T | null> {
    // First try to get cached data
    const cached = await this.get<T>(key, type, { 
      allowStale: true, 
      ...options 
    });

    // If we have fresh data, return it
    if (cached.data && !cached.isStale && !options?.forceRevalidation) {
      return cached.data;
    }

    // If we have stale data, return it and revalidate in background
    if (cached.data && cached.isStale) {
      // Background revalidation
      this.backgroundRevalidation(key, type, revalidationFn, options)
        .catch(error => console.error('Background revalidation failed:', error));
      
      return cached.data;
    }

    // No cached data, fetch fresh data
    try {
      const freshData = await revalidationFn();
      await this.set(key, freshData, type, options);
      return freshData;
    } catch (error) {
      console.error('Fresh data fetch failed:', error);
      return null;
    }
  }

  private async backgroundRevalidation<T>(
    key: string,
    type: CacheKeyType,
    revalidationFn: () => Promise<T>,
    options?: any
  ): Promise<void> {
    try {
      const freshData = await revalidationFn();
      await this.set(key, freshData, type, options);
    } catch (error) {
      console.error('Background revalidation error:', error);
    }
  }

  // ==================== CACHE WARMING ====================

  private async scheduleCacheWarming(
    key: string, 
    type: CacheKeyType, 
    delaySeconds: number
  ): Promise<void> {
    // In production, this would use a proper job queue like Bull or Agenda
    setTimeout(async () => {
      try {
        // Check if key still exists and needs warming
        const exists = await this.redis.exists(key);
        if (exists) {
          // Trigger warming event (would be handled by background workers)
          await this.redis.zadd('cache:warming:queue', { score: Date.now(), member: `${type}:${key}` });
        }
      } catch (error) {
        console.error('Cache warming scheduling error:', error);
      }
    }, delaySeconds * 1000);
  }

  private startCacheWarmingProcess(): void {
    // Background process to handle cache warming
    setInterval(async () => {
      try {
        // Get items that need warming
        const now = Date.now();
        const items = await this.redis.zrange('cache:warming:queue', 0, now, { 
          byScore: true,
          offset: 0,
          count: 10
        });

        for (const item of items) {
          // Remove from queue and trigger warming
          await this.redis.zrem('cache:warming:queue', item);
          // In production, this would trigger appropriate warming logic
          console.log(`Cache warming triggered for: ${item}`);
        }
      } catch (error) {
        console.error('Cache warming process error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // ==================== ANALYTICS & MONITORING ====================

  private async updateAccessAnalytics(
    key: string, 
    metadata: CacheMetadata
  ): Promise<void> {
    try {
      const analyticsKey = `analytics:cache:${metadata.type}`;
      const now = Date.now();
      
      // Update access count and last accessed time
      await Promise.all([
        this.redis.hincrby(analyticsKey, 'total_hits', 1),
        this.redis.hset(analyticsKey, { 'last_hit': now.toString() }),
        this.redis.hset(`${key}:meta`, { 'lastAccessed': now.toString() }),
        this.redis.hincrby(`${key}:meta`, 'hitCount', 1)
      ]);

      // Update hourly statistics
      const hour = Math.floor(now / 3600000);
      await this.redis.hincrby(`analytics:cache:hourly:${hour}`, metadata.type.toString(), 1);

    } catch (error) {
      console.error('Analytics update error:', error);
    }
  }

  private startAnalyticsProcess(): void {
    // Collect and aggregate analytics data every 5 minutes
    setInterval(async () => {
      try {
        await this.aggregateAnalytics();
      } catch (error) {
        console.error('Analytics aggregation error:', error);
      }
    }, 300000); // 5 minutes
  }

  private async aggregateAnalytics(): Promise<void> {
    // Aggregate cache performance metrics
    const now = Date.now();
    const hour = Math.floor(now / 3600000);
    
    // Get hourly stats for each cache type
    for (const type of Object.keys(CACHE_TTL_STRATEGIES) as CacheKeyType[]) {
      const hits = await this.redis.hget(`analytics:cache:hourly:${hour}`, type);
      if (hits) {
        await this.redis.zadd('analytics:cache:performance', { 
          score: now, 
          member: JSON.stringify({ type, hour, hits: parseInt(hits as string) })
        });
      }
    }

    // Clean up old hourly data (keep last 48 hours)
    const cutoff = hour - 48;
    const oldKeys = [];
    for (let i = 0; i < 48; i++) {
      oldKeys.push(`analytics:cache:hourly:${cutoff - i}`);
    }
    if (oldKeys.length > 0) {
      await this.redis.del(...oldKeys);
    }
  }

  async getCacheStats(): Promise<{
    typeStats: Record<CacheKeyType, { hits: number; lastHit: number }>;
    performanceMetrics: Array<{ type: CacheKeyType; hour: number; hits: number }>;
    memoryUsage: number;
  }> {
    try {
      const typeStats: any = {};
      
      // Get stats for each cache type
      for (const type of Object.keys(CACHE_TTL_STRATEGIES) as CacheKeyType[]) {
        const analyticsKey = `analytics:cache:${type}`;
        const [totalHits, lastHit] = await Promise.all([
          this.redis.hget(analyticsKey, 'total_hits'),
          this.redis.hget(analyticsKey, 'last_hit')
        ]);
        
        typeStats[type] = {
          hits: parseInt(totalHits as string || '0'),
          lastHit: parseInt(lastHit as string || '0')
        };
      }

      // Get recent performance data
      const performanceData = await this.redis.zrange(
        'analytics:cache:performance', 
        -100, 
        -1
      );
      
      const performanceMetrics = performanceData.map((data: any) => JSON.parse(data));

      // Get approximate memory usage (Redis doesn't provide exact usage per key pattern)
      const memoryUsage = 0; // Would need Redis MEMORY USAGE command or approximation

      return {
        typeStats,
        performanceMetrics,
        memoryUsage
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        typeStats: {} as any,
        performanceMetrics: [],
        memoryUsage: 0
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private buildCacheKey(
    baseKey: string, 
    type: CacheKeyType, 
    userId?: string, 
    region?: string
  ): string {
    const parts = ['tripthesia', type, baseKey];
    
    if (region) parts.push(`region:${region}`);
    if (userId) parts.push(`user:${userId}`);
    
    return parts.join(':');
  }

  private async serializeData<T>(data: T): Promise<{ 
    serializedData: string; 
    compressionRatio?: number; 
  }> {
    const jsonStr = JSON.stringify(data);
    
    // For now, just return JSON string
    // In production, you might want to add compression for large payloads
    if (jsonStr.length > this.config.compressionThreshold) {
      // TODO: Implement compression (e.g., using pako or node:zlib)
      return { serializedData: jsonStr, compressionRatio: 1.0 };
    }
    
    return { serializedData: jsonStr };
  }

  private async deserializeData<T>(
    serializedData: string, 
    metadata: CacheMetadata
  ): Promise<T> {
    // Handle decompression if needed
    if (metadata.compressionRatio && metadata.compressionRatio < 1.0) {
      // TODO: Implement decompression
    }
    
    return JSON.parse(serializedData);
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    details: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Test basic operations
      const testKey = 'health:check';
      const testData = { timestamp: startTime };
      
      await this.redis.set(testKey, JSON.stringify(testData));
      const retrieved = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const latency = Date.now() - startTime;
      
      if (retrieved && latency < 100) {
        return {
          status: 'healthy',
          latency,
          details: { message: 'All operations successful', latency }
        };
      } else if (latency < 500) {
        return {
          status: 'degraded',
          latency,
          details: { message: 'Slow response times', latency }
        };
      } else {
        return {
          status: 'unhealthy',
          latency,
          details: { message: 'Very slow response', latency }
        };
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// ==================== FACTORY FUNCTION ====================

let globalCacheManager: RedisCacheManager | null = null;

export function createCacheManager(
  redisUrl?: string, 
  config?: Partial<CacheConfig>
): RedisCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new RedisCacheManager(redisUrl, config);
  }
  return globalCacheManager;
}

// ==================== CONVENIENCE FUNCTIONS ====================

export async function getCachedData<T>(
  key: string,
  type: CacheKeyType,
  fetchFn: () => Promise<T>,
  options?: {
    customTTL?: number;
    userId?: string;
    region?: string;
    forceRefresh?: boolean;
  }
): Promise<T | null> {
  const cache = createCacheManager();
  
  if (options?.forceRefresh) {
    const fresh = await fetchFn();
    await cache.set(key, fresh, type, options);
    return fresh;
  }
  
  return cache.getWithRevalidation(key, type, fetchFn, options);
}

// Types are already exported above as needed