import { auth } from "@clerk/nextjs";
import { db } from "./db";
import { profiles } from "../../../infra/schema";
import { eq } from "drizzle-orm";
import { cache, CACHE_NAMESPACES, CACHE_TTL } from "./cache";

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface UserSubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  limits: {
    tripsPerMonth: number;
    aiGenerationsPerDay: number;
    advancedFeatures: boolean;
  };
}

const SUBSCRIPTION_LIMITS = {
  free: {
    tripsPerMonth: 5,
    aiGenerationsPerDay: 3,
    advancedFeatures: false,
  },
  pro: {
    tripsPerMonth: 100,
    aiGenerationsPerDay: 50,
    advancedFeatures: true,
  },
  enterprise: {
    tripsPerMonth: 1000,
    aiGenerationsPerDay: 500,
    advancedFeatures: true,
  },
} as const;

export async function getUserSubscriptionTier(userId?: string): Promise<SubscriptionTier> {
  const currentUserId = userId || auth().userId;
  
  if (!currentUserId) {
    return "free"; // Anonymous users get free tier
  }

  try {
    // Check cache first
    const cached = await cache.get<SubscriptionTier>(
      CACHE_NAMESPACES.USER_LIMITS, 
      `subscription:${currentUserId}`
    );
    
    if (cached) {
      return cached;
    }

    // Query database for user's subscription status
    const userProfile = await db
      .select({ pro: profiles.pro })
      .from(profiles)
      .where(eq(profiles.userId, currentUserId))
      .limit(1);

    // Determine tier based on profile
    let tier: SubscriptionTier = "free";
    
    if (userProfile[0]?.pro) {
      tier = "pro"; // For now, we only have free and pro tiers
    }

    // Cache the result for 1 hour
    await cache.set(
      CACHE_NAMESPACES.USER_LIMITS,
      `subscription:${currentUserId}`,
      tier,
      { ttl: CACHE_TTL.RATE_LIMIT }
    );

    return tier;
  } catch (error) {
    console.error("Failed to get user subscription tier:", error);
    return "free"; // Default to free tier on error
  }
}

export async function getUserSubscriptionInfo(userId?: string): Promise<UserSubscriptionInfo> {
  const tier = await getUserSubscriptionTier(userId);
  
  return {
    tier,
    isActive: true, // For now, assume all subscriptions are active
    limits: SUBSCRIPTION_LIMITS[tier],
  };
}

export async function canUseAIFeature(userId?: string): Promise<{ 
  canUse: boolean; 
  tier: SubscriptionTier; 
  reason?: string; 
}> {
  const currentUserId = userId || auth().userId;
  
  if (!currentUserId) {
    return {
      canUse: false,
      tier: "free",
      reason: "Authentication required",
    };
  }

  const subscriptionInfo = await getUserSubscriptionInfo(currentUserId);
  
  // For free tier, check daily AI generation limits
  if (subscriptionInfo.tier === "free") {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `ai_usage:${currentUserId}:${today}`;
    
    try {
      const currentUsage = await cache.get<number>(CACHE_NAMESPACES.USER_LIMITS, usageKey) || 0;
      
      if (currentUsage >= subscriptionInfo.limits.aiGenerationsPerDay) {
        return {
          canUse: false,
          tier: subscriptionInfo.tier,
          reason: `Daily AI generation limit reached (${subscriptionInfo.limits.aiGenerationsPerDay})`,
        };
      }
    } catch (error) {
      console.warn("Failed to check AI usage limits:", error);
      // Allow usage if we can't check limits (fail open)
    }
  }

  return {
    canUse: true,
    tier: subscriptionInfo.tier,
  };
}

export async function incrementAIUsage(userId?: string): Promise<void> {
  const currentUserId = userId || auth().userId;
  
  if (!currentUserId) {
    return; // Can't track usage for anonymous users
  }

  const today = new Date().toISOString().split('T')[0];
  const usageKey = `ai_usage:${currentUserId}:${today}`;
  
  try {
    await cache.increment(
      CACHE_NAMESPACES.USER_LIMITS,
      usageKey,
      24 * 60 * 60 // TTL: 24 hours
    );
  } catch (error) {
    console.warn("Failed to increment AI usage:", error);
    // Non-critical, continue without tracking
  }
}

export async function invalidateUserSubscriptionCache(userId: string): Promise<void> {
  try {
    await Promise.all([
      cache.del(CACHE_NAMESPACES.USER_LIMITS, `subscription:${userId}`),
      cache.del(CACHE_NAMESPACES.USER_LIMITS, `pro:${userId}`),
    ]);
  } catch (error) {
    console.warn("Failed to invalidate subscription cache:", error);
  }
}

// Helper function to get the appropriate model tier for AI calls
export async function getModelTierForUser(userId?: string): Promise<SubscriptionTier> {
  const subscriptionTier = await getUserSubscriptionTier(userId);
  
  // Map subscription tiers to model tiers
  // This allows us to experiment with different model assignments
  switch (subscriptionTier) {
    case "enterprise":
      return "enterprise";
    case "pro":
      return "pro";
    case "free":
    default:
      return "free"; // Use GPT-4o-mini for free tier
  }
}