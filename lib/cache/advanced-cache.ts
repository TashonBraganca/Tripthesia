import { Redis } from '@upstash/redis';

// Redis client for advanced caching
const redis = Redis.fromEnv();

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  tags?: string[];
  version?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: string;
}

export class AdvancedCache {
  private static instance: AdvancedCache;
  private redis: Redis;
  
  private constructor() {
    this.redis = redis;
  }
  
  static getInstance(): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache();
    }
    return AdvancedCache.instance;
  }
  
  // Generate cache key with namespace and tags
  private generateKey(key: string, config: CacheConfig = {}): string {
    const namespace = config.namespace || 'app';
    const version = config.version || 'v1';
    return `${namespace}:${version}:${key}`;
  }
  
  // Set cache with advanced options
  async set<T>(
    key: string, 
    data: T, 
    config: CacheConfig = {}
  ): Promise<void> {
    const cacheKey = this.generateKey(key, config);
    const ttl = config.ttl || 3600; // 1 hour default
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: config.tags || [],
      version: config.version || 'v1'
    };
    
    try {
      await this.redis.setex(cacheKey, ttl, JSON.stringify(entry));
      
      // Index tags for bulk operations
      if (config.tags && config.tags.length > 0) {
        for (const tag of config.tags) {
          await this.redis.sadd(`tag:${tag}`, cacheKey);
          await this.redis.expire(`tag:${tag}`, ttl + 300); // Tag expires 5 min after data
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  // Get cache with validation
  async get<T>(key: string, config: CacheConfig = {}): Promise<T | null> {
    const cacheKey = this.generateKey(key, config);
    
    try {
      const result = await this.redis.get(cacheKey);
      if (!result) return null;
      
      const entry: CacheEntry<T> = JSON.parse(result as string);
      
      // Validate cache entry
      const now = Date.now();
      const age = (now - entry.timestamp) / 1000;
      
      if (age > entry.ttl) {
        await this.delete(key, config);
        return null;
      }
      
      // Version check
      if (config.version && entry.version !== config.version) {
        await this.delete(key, config);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  // Delete single cache entry
  async delete(key: string, config: CacheConfig = {}): Promise<void> {
    const cacheKey = this.generateKey(key, config);
    
    try {
      await this.redis.del(cacheKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  // Invalidate by tags
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys && keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
      }
    } catch (error) {
      console.error('Cache invalidate by tag error:', error);
    }
  }
  
  // Cache with automatic revalidation
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, config);
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    await this.set(key, data, config);
    return data;
  }
  
  // Batch operations
  async mget<T>(keys: string[], config: CacheConfig = {}): Promise<(T | null)[]> {
    const cacheKeys = keys.map(key => this.generateKey(key, config));
    
    try {
      const results = await this.redis.mget(...cacheKeys);
      return results.map(result => {
        if (!result) return null;
        try {
          const entry: CacheEntry<T> = JSON.parse(result as string);
          const now = Date.now();
          const age = (now - entry.timestamp) / 1000;
          
          if (age > entry.ttl) return null;
          return entry.data;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }
  
  // Cache statistics
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const keyCount = await this.redis.dbsize();
      
      return {
        totalKeys: keyCount,
        memoryUsage: 'unknown', // Redis info not available in Upstash
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'unknown'
      };
    }
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Trip-specific caching strategies
export class TripCache {
  private cache = AdvancedCache.getInstance();
  
  // Cache trip data with user-specific namespace
  async cacheTripData(
    userId: string,
    tripId: string,
    data: any,
    ttl: number = 3600
  ) {
    return this.cache.set(
      `trip:${tripId}`,
      data,
      {
        namespace: `user:${userId}`,
        ttl,
        tags: ['trips', `user:${userId}`, `trip:${tripId}`],
        version: 'v1'
      }
    );
  }
  
  // Get cached trip data
  async getTripData(userId: string, tripId: string) {
    return this.cache.get(
      `trip:${tripId}`,
      {
        namespace: `user:${userId}`,
        version: 'v1'
      }
    );
  }
  
  // Invalidate user's trip cache
  async invalidateUserTrips(userId: string) {
    return this.cache.invalidateByTag(`user:${userId}`);
  }
  
  // Cache search results with geo-based key
  async cacheSearchResults(
    query: string,
    location: string,
    results: any,
    ttl: number = 1800 // 30 minutes
  ) {
    return this.cache.set(
      `search:${query}:${location}`,
      results,
      {
        namespace: 'search',
        ttl,
        tags: ['search', 'transport', location],
        version: 'v1'
      }
    );
  }
  
  // Cache AI-generated content
  async cacheAIResponse(
    prompt: string,
    response: any,
    ttl: number = 7200 // 2 hours
  ) {
    const promptHash = Buffer.from(prompt).toString('base64url').slice(0, 32);
    return this.cache.set(
      `ai:${promptHash}`,
      response,
      {
        namespace: 'ai',
        ttl,
        tags: ['ai', 'generated'],
        version: 'v1'
      }
    );
  }
}

// API response caching middleware
export function withCache<T>(
  keyGenerator: (...args: any[]) => string,
  config: CacheConfig = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]): Promise<T> {
      const cache = AdvancedCache.getInstance();
      const cacheKey = keyGenerator(...args);
      
      // Try to get from cache first
      const cached = await cache.get<T>(cacheKey, config);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method and cache result
      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, config);
      
      return result;
    };
    
    return descriptor;
  };
}

export default AdvancedCache;