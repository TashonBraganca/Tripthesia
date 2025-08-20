import { cache, CACHE_NAMESPACES, CACHE_TTL } from "./cache";
import { auth } from "@clerk/nextjs";
import { db } from "./db";
import { profiles } from "../../../infra/schema";
import { eq } from "drizzle-orm";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests in window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Timestamp when limit resets
  total: number;
}

export class RateLimiter {
  constructor(private config: RateLimitConfig) {}

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const windowStart = Math.floor(Date.now() / this.config.windowMs) * this.config.windowMs;
    const key = `${identifier}:${windowStart}`;
    
    try {
      const current = await cache.increment(
        CACHE_NAMESPACES.USER_LIMITS,
        key,
        Math.ceil(this.config.windowMs / 1000)
      );

      const remaining = Math.max(0, this.config.maxRequests - current);
      const reset = windowStart + this.config.windowMs;

      return {
        success: current <= this.config.maxRequests,
        remaining,
        reset,
        total: this.config.maxRequests,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        remaining: this.config.maxRequests,
        reset: Date.now() + this.config.windowMs,
        total: this.config.maxRequests,
      };
    }
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  // General API limits
  API_PER_MINUTE: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
  
  API_PER_HOUR: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  }),

  // Trip creation limits (subscription-based)
  TRIP_CREATION_FREE: new RateLimiter({
    windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxRequests: 5,
  }),

  TRIP_CREATION_PRO: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 100,
  }),

  // AI generation limits
  AI_GENERATION_FREE: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3,
  }),

  AI_GENERATION_PRO: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  }),

  // External API limits (to protect our API keys)
  EXTERNAL_API_PER_USER: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  }),

  // Authentication limits
  AUTH_PER_IP: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  }),
} as const;

export async function getUserRateLimit(
  limitType: keyof typeof RATE_LIMITS,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const { userId } = auth();
  
  // Use IP-based limiting for unauthenticated users
  if (!userId) {
    const identifier = customIdentifier || "anonymous";
    return RATE_LIMITS[limitType].checkLimit(`ip:${identifier}`);
  }

  // For subscription-based limits, check user's pro status
  if (limitType.includes("FREE") || limitType.includes("PRO")) {
    const isProUser = await checkProStatus(userId);
    
    if (limitType.includes("TRIP_CREATION")) {
      const limiter = isProUser ? RATE_LIMITS.TRIP_CREATION_PRO : RATE_LIMITS.TRIP_CREATION_FREE;
      return limiter.checkLimit(`user:${userId}`);
    }
    
    if (limitType.includes("AI_GENERATION")) {
      const limiter = isProUser ? RATE_LIMITS.AI_GENERATION_PRO : RATE_LIMITS.AI_GENERATION_FREE;
      return limiter.checkLimit(`user:${userId}`);
    }
  }

  return RATE_LIMITS[limitType].checkLimit(`user:${userId}`);
}

export async function getIPRateLimit(
  limitType: keyof typeof RATE_LIMITS,
  ipAddress: string
): Promise<RateLimitResult> {
  return RATE_LIMITS[limitType].checkLimit(`ip:${ipAddress}`);
}

async function checkProStatus(userId: string): Promise<boolean> {
  try {
    // Check cache first
    const cached = await cache.get<boolean>(CACHE_NAMESPACES.USER_LIMITS, `pro:${userId}`);
    if (cached !== null) {
      return cached;
    }

    // Query database
    const profile = await db
      .select({ pro: profiles.pro })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const isPro = profile[0]?.pro || false;
    
    // Cache for 1 hour
    await cache.set(CACHE_NAMESPACES.USER_LIMITS, `pro:${userId}`, isPro, {
      ttl: CACHE_TTL.RATE_LIMIT,
    });

    return isPro;
  } catch (error) {
    console.error("Failed to check pro status:", error);
    return false; // Fail safe - treat as free user
  }
}

export function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return "unknown";
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.total.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

// Middleware helper for Next.js API routes
export async function withRateLimit<T>(
  request: Request,
  handler: () => Promise<T>,
  options: {
    userLimit?: keyof typeof RATE_LIMITS;
    ipLimit?: keyof typeof RATE_LIMITS;
    skipOnAuth?: boolean;
  } = {}
): Promise<T> {
  const clientIP = getClientIP(request);
  const { userId } = auth();

  // Check IP-based rate limit if specified
  if (options.ipLimit) {
    const ipResult = await getIPRateLimit(options.ipLimit, clientIP);
    if (!ipResult.success) {
      throw new RateLimitError("IP rate limit exceeded", ipResult);
    }
  }

  // Check user-based rate limit if specified and user is authenticated
  if (options.userLimit && userId) {
    const userResult = await getUserRateLimit(options.userLimit);
    if (!userResult.success) {
      throw new RateLimitError("User rate limit exceeded", userResult);
    }
  }

  // Skip user limits for authenticated users if specified
  if (options.skipOnAuth && userId) {
    return handler();
  }

  return handler();
}

export class RateLimitError extends Error {
  constructor(message: string, public result: RateLimitResult) {
    super(message);
    this.name = "RateLimitError";
  }
}