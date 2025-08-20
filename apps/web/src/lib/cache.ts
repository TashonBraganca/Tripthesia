import { Redis } from "@upstash/redis";

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Redis configuration missing");
    }
    
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  private generateKey(namespace: string, key: string): string {
    return `tripthesia:${namespace}:${key}`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const fullKey = this.generateKey(namespace, key);
      const result = await this.redis.get(fullKey);
      return result as T | null;
    } catch (error) {
      console.warn(`Cache get failed for ${namespace}:${key}:`, error);
      return null;
    }
  }

  async set<T>(
    namespace: string, 
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const fullKey = this.generateKey(namespace, key);
      const ttl = options.ttl || this.defaultTTL;
      
      await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      
      // Store tags for invalidation
      if (options.tags?.length) {
        for (const tag of options.tags) {
          const tagKey = this.generateKey("tags", tag);
          await this.redis.sadd(tagKey, fullKey);
          await this.redis.expire(tagKey, ttl);
        }
      }
    } catch (error) {
      console.warn(`Cache set failed for ${namespace}:${key}:`, error);
    }
  }

  async del(namespace: string, key: string): Promise<void> {
    try {
      const fullKey = this.generateKey(namespace, key);
      await this.redis.del(fullKey);
    } catch (error) {
      console.warn(`Cache delete failed for ${namespace}:${key}:`, error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = this.generateKey("tags", tag);
      const keys = await this.redis.smembers(tagKey);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(tagKey);
      }
    } catch (error) {
      console.warn(`Cache invalidation failed for tag ${tag}:`, error);
    }
  }

  async exists(namespace: string, key: string): Promise<boolean> {
    try {
      const fullKey = this.generateKey(namespace, key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.warn(`Cache exists check failed for ${namespace}:${key}:`, error);
      return false;
    }
  }

  async mget<T>(namespace: string, keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.generateKey(namespace, key));
      const results = await this.redis.mget(...fullKeys);
      return results.map(result => result as T | null);
    } catch (error) {
      console.warn(`Cache mget failed for ${namespace}:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    namespace: string, 
    items: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      
      // Use pipeline for batch operations
      const pipeline = this.redis.pipeline();
      
      for (const item of items) {
        const fullKey = this.generateKey(namespace, item.key);
        pipeline.setex(fullKey, ttl, JSON.stringify(item.value));
        
        // Handle tags
        if (options.tags?.length) {
          for (const tag of options.tags) {
            const tagKey = this.generateKey("tags", tag);
            pipeline.sadd(tagKey, fullKey);
            pipeline.expire(tagKey, ttl);
          }
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.warn(`Cache mset failed for ${namespace}:`, error);
    }
  }

  async increment(namespace: string, key: string, ttl?: number): Promise<number> {
    try {
      const fullKey = this.generateKey(namespace, key);
      const result = await this.redis.incr(fullKey);
      
      if (ttl) {
        await this.redis.expire(fullKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.warn(`Cache increment failed for ${namespace}:${key}:`, error);
      return 0;
    }
  }

  async getHealth(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { status: "healthy", latency };
    } catch (error) {
      return { status: "unhealthy" };
    }
  }
}

// Cache namespaces for different data types
export const CACHE_NAMESPACES = {
  PLACES: "places",
  WEATHER: "weather", 
  ROUTES: "routes",
  CURRENCY: "currency",
  PRICES: "prices",
  TRIPS: "trips",
  USER_LIMITS: "user_limits",
  IP_LIMITS: "ip_limits",
  API_RESPONSES: "api_responses",
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PLACES: 24 * 60 * 60, // 24 hours
  WEATHER: 6 * 60 * 60, // 6 hours
  ROUTES: 24 * 60 * 60, // 24 hours
  CURRENCY: 60 * 60, // 1 hour
  PRICES: 5 * 60, // 5 minutes
  TRIPS: 60 * 60, // 1 hour
  RATE_LIMIT: 60 * 60, // 1 hour
  SHORT: 5 * 60, // 5 minutes
} as const;

// Singleton instance
export const cache = new CacheService();