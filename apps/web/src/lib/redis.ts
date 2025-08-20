/**
 * Redis Cache Configuration
 * Using Upstash Redis for serverless-compatible caching
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export { redis }

/**
 * Cache key generators with consistent naming
 */
export const cacheKeys = {
  place: (bbox: string, category: string) => `place:${bbox}:${category}`,
  hours: (placeId: string) => `hours:${placeId}`,
  price: (tripId: string, itemKey: string) => `price:${tripId}:${itemKey}`,
  user: (userId: string) => `user:${userId}`,
  trip: (tripId: string) => `trip:${tripId}`,
  search: (query: string) => `search:${query}`,
  reviews: (placeId: string) => `reviews:${placeId}`,
  weather: (location: string, date: string) => `weather:${location}:${date}`,
}

/**
 * Cache TTL constants (in seconds)
 */
export const cacheTTL = {
  places: 24 * 60 * 60, // 24 hours
  hours: 7 * 24 * 60 * 60, // 7 days
  prices: 4 * 60 * 60, // 4 hours
  user: 30 * 60, // 30 minutes
  search: 60 * 60, // 1 hour
  reviews: 12 * 60 * 60, // 12 hours
  weather: 2 * 60 * 60, // 2 hours
}

/**
 * Cache helper functions
 */
export const cacheHelpers = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await redis.get(key)
      return result as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  async increment(key: string, ttl?: number): Promise<number | null> {
    try {
      const result = await redis.incr(key)
      if (ttl && result === 1) {
        await redis.expire(key, ttl)
      }
      return result
    } catch (error) {
      console.error('Cache increment error:', error)
      return null
    }
  },

  async flush(): Promise<boolean> {
    try {
      await redis.flushall()
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }
}