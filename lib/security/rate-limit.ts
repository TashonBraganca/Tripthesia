import { NextRequest, NextResponse } from 'next/server';
import { redis, setInCache, getFromCache } from '@/lib/redis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    return `rate_limit:${ip}`;
  },
};

export function createRateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
    try {
      const key = config.keyGenerator!(req);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current rate limit info
      const rateLimitInfo = await getFromCache<RateLimitInfo>(key);

      if (!rateLimitInfo) {
        // First request in window
        await setInCache(key, { count: 1, resetTime: now + config.windowMs }, config.windowMs / 1000);
        return null; // Allow request
      }

      if (now > rateLimitInfo.resetTime) {
        // Window has expired, reset counter
        await setInCache(key, { count: 1, resetTime: now + config.windowMs }, config.windowMs / 1000);
        return null; // Allow request
      }

      if (rateLimitInfo.count >= config.maxRequests) {
        // Rate limit exceeded
        const remainingTime = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
        
        return NextResponse.json(
          {
            error: config.message,
            retryAfter: remainingTime,
          },
          {
            status: config.statusCode,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime / 1000).toString(),
              'Retry-After': remainingTime.toString(),
            },
          }
        );
      }

      // Increment counter
      const newInfo = { ...rateLimitInfo, count: rateLimitInfo.count + 1 };
      await setInCache(key, newInfo, config.windowMs / 1000);

      return null; // Allow request
    } catch (error) {
      console.error('Rate limiting error:', error);
      return null; // Allow request on error (fail-open)
    }
  };
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests, please try again later.',
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
});

export const tripCreationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many trip creation requests, please try again later.',
  keyGenerator: (req: NextRequest) => {
    // Use user ID from auth header if available
    const userId = req.headers.get('x-user-id');
    if (userId) {
      return `rate_limit:trip:${userId}`;
    }
    // Fallback to IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    return `rate_limit:trip:${ip}`;
  },
});