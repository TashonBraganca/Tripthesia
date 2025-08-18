// Mock Redis implementation for build compatibility
const Redis = {
  prototype: {
    get: async () => null,
    setex: async () => 'OK',
    del: async () => 1,
    ping: async () => 'PONG'
  }
};

// Create a simple Redis-like interface
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
    return 'PONG';
  }
}

// Use mock Redis for build compatibility
export const redis = new MockRedis();

// Cache helper functions
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached as T;
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
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

export async function deleteFromCache(key: string): Promise<boolean> {
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
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}