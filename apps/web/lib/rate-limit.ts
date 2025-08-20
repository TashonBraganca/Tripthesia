import { redis } from "./cache";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds);
  const windowKey = `${key}:${window}`;

  try {
    // Get current count
    const current = await redis.get(windowKey) || 0;
    const currentCount = typeof current === 'number' ? current : parseInt(current as string) || 0;

    if (currentCount >= limit) {
      // Rate limit exceeded
      const reset = (window + 1) * windowSeconds;
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    // Increment counter
    const newCount = await redis.incr(windowKey);
    
    // Set expiration if this is the first request in this window
    if (newCount === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    const reset = (window + 1) * windowSeconds;
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - newCount),
      reset,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // On error, allow the request to proceed
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowSeconds,
    };
  }
}

// Subscription-aware rate limiting
export async function subscriptionRateLimit(
  userId: string,
  isPro: boolean,
  endpoint: string
): Promise<RateLimitResult> {
  const limits = {
    generation: isPro ? { limit: 50, window: 3600 } : { limit: 5, window: 3600 }, // Per hour
    places: isPro ? { limit: 1000, window: 3600 } : { limit: 100, window: 3600 },
    export: isPro ? { limit: 100, window: 3600 } : { limit: 10, window: 3600 },
    default: isPro ? { limit: 500, window: 3600 } : { limit: 50, window: 3600 },
  };

  const config = limits[endpoint as keyof typeof limits] || limits.default;
  const identifier = `${userId}:${endpoint}`;

  return rateLimit(identifier, config.limit, config.window);
}

// Rate limit middleware for API routes
export function rateLimitMiddleware(
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: any) => string
) {
  return async (req: any) => {
    const identifier = keyGenerator ? keyGenerator(req) : req.ip || "anonymous";
    const result = await rateLimit(identifier, limit, windowSeconds);
    
    return {
      rateLimited: !result.success,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      },
    };
  };
}