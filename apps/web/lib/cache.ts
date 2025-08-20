import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export { redis };

// Cache utility functions
export class CacheManager {
  private static readonly DEFAULT_TTL = 3600; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await redis.get(key);
      return result as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  static async increment(key: string, increment = 1): Promise<number> {
    try {
      return await redis.incrby(key, increment);
    } catch (error) {
      console.error("Cache increment error:", error);
      return 0;
    }
  }

  static async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await redis.expire(key, ttlSeconds);
    } catch (error) {
      console.error("Cache expire error:", error);
    }
  }

  // Pattern-based operations
  static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await redis.del(...keys);
    } catch (error) {
      console.error("Cache delete pattern error:", error);
      return 0;
    }
  }

  static async getKeys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error("Cache get keys error:", error);
      return [];
    }
  }
}

// Convenience functions with default TTL
export const cache = {
  get: CacheManager.get,
  set: (key: string, value: any, ttl = CacheManager['DEFAULT_TTL']) => 
    CacheManager.set(key, value, ttl),
  del: CacheManager.del,
  exists: CacheManager.exists,
  increment: CacheManager.increment,
  expire: CacheManager.expire,
  deletePattern: CacheManager.deletePattern,
  getKeys: CacheManager.getKeys,
};