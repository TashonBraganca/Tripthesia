import { Redis } from '@upstash/redis';

// Create Redis client with proper error handling
function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token || url.includes('build') || token.includes('build')) {
    console.warn('Redis not configured or in build mode, using mock');
    return null;
  }
  
  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

// Mock Redis implementation for fallback
class MockRedis {
  async get(key: string) {
    return null;
  }
  
  async setex(key: string, ttl: number, value: string) {
    return 'OK';
  }
  
  async del(key: string) {
    return 1;
  }
  
  async ping() {
    throw new Error('Redis not available');
  }
  
  async keys(pattern: string) {
    return [];
  }
}

// Use real Redis if available, otherwise mock
const redisClient = createRedisClient();
export const redis = redisClient || new MockRedis();

// Cache helper functions
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redisClient) {
    return null;
  }
  
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setInCache(
  key: string, 
  value: any, 
  ttlSeconds: number = 3600
): Promise<boolean> {
  if (!redisClient) {
    return false;
  }
  
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

export async function deleteFromCache(key: string): Promise<boolean> {
  if (!redisClient) {
    return false;
  }
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

// Cache patterns
export const CacheKeys = {
  userProfile: (userId: string) => `user:${userId}:profile`,
  userTrips: (userId: string) => `user:${userId}:trips`,
  placeSearch: (query: string, lat: number, lng: number) => 
    `places:${query}:${lat.toFixed(3)}:${lng.toFixed(3)}`,
  flightPrices: (origin: string, destination: string, date: string) => 
    `flights:${origin}:${destination}:${date}`,
  aiGeneration: (tripId: string) => `ai:trip:${tripId}`,
};

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  if (!redisClient) {
    console.log('⚠️  Redis not configured');
    return false;
  }
  
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}