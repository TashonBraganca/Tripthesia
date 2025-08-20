import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { profiles, trips } from '@/lib/db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { getTierLimits } from '@/lib/razorpay';
import { trackEvent } from '@/lib/monitoring';

export interface SubscriptionLimit {
  allowed: boolean;
  reason?: string;
  usage?: {
    current: number;
    limit: number;
  };
}

/**
 * Check if user can create a new trip based on their subscription tier
 */
export async function checkTripCreationLimit(
  request: NextRequest
): Promise<SubscriptionLimit> {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return { allowed: false, reason: 'Authentication required' };
    }

    // Get user's subscription tier
    const profile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const tier = profile[0]?.subscriptionTier || 'free';
    const limits = getTierLimits(tier);

    // Pro users have unlimited trips
    if (tier === 'pro') {
      return { allowed: true };
    }

    // Check free tier limits
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const tripsThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(trips)
      .where(
        eq(trips.userId, userId),
        gte(trips.createdAt, startOfMonth)
      );

    const currentUsage = tripsThisMonth[0]?.count || 0;
    const monthlyLimit = limits.tripsPerMonth;

    if (currentUsage >= monthlyLimit) {
      // Track limit hit for analytics
      trackEvent('subscription_limit_hit', {
        userId,
        tier,
        limitType: 'trips_per_month',
        currentUsage,
        limit: monthlyLimit,
      }, userId);

      return {
        allowed: false,
        reason: 'Monthly trip limit reached. Upgrade to Pro for unlimited trips.',
        usage: {
          current: currentUsage,
          limit: monthlyLimit,
        },
      };
    }

    return {
      allowed: true,
      usage: {
        current: currentUsage,
        limit: monthlyLimit,
      },
    };

  } catch (error) {
    console.error('Failed to check trip creation limit:', error);
    // Allow creation if check fails to avoid blocking users
    return { allowed: true };
  }
}

/**
 * Check if user can access a Pro feature
 */
export async function checkProFeatureAccess(
  request: NextRequest,
  feature: string
): Promise<SubscriptionLimit> {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return { allowed: false, reason: 'Authentication required' };
    }

    // Get user's subscription tier
    const profile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
        subscriptionStatus: profiles.subscriptionStatus,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const tier = profile[0]?.subscriptionTier || 'free';
    const status = profile[0]?.subscriptionStatus;

    // Check if user has active Pro subscription
    if (tier === 'pro' && (status === 'active' || status === 'trialing')) {
      return { allowed: true };
    }

    // Track feature access attempt for analytics
    trackEvent('pro_feature_blocked', {
      userId,
      tier,
      feature,
      subscriptionStatus: status,
    }, userId);

    return {
      allowed: false,
      reason: `This feature requires a Pro subscription. Current tier: ${tier}`,
    };

  } catch (error) {
    console.error('Failed to check Pro feature access:', error);
    // Deny access if check fails for security
    return { 
      allowed: false, 
      reason: 'Unable to verify subscription status' 
    };
  }
}

/**
 * Middleware helper to enforce trip limits
 */
export async function withTripLimits(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const limitCheck = await checkTripCreationLimit(request);
  
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { 
        error: limitCheck.reason,
        upgrade_required: true,
        usage: limitCheck.usage,
      },
      { status: 403 }
    );
  }
  
  return handler(request);
}

/**
 * Middleware helper to enforce Pro features
 */
export async function withProAccess(
  request: NextRequest,
  feature: string,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const accessCheck = await checkProFeatureAccess(request, feature);
  
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { 
        error: accessCheck.reason,
        upgrade_required: true,
        feature,
      },
      { status: 403 }
    );
  }
  
  return handler(request);
}

/**
 * Get subscription status for a user
 */
export async function getUserSubscriptionStatus(userId: string) {
  try {
    const profile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
        subscriptionStatus: profiles.subscriptionStatus,
        razorpayCustomerId: profiles.razorpayCustomerId,
        subscriptionId: profiles.subscriptionId,
        subscriptionCurrentPeriodEnd: profiles.subscriptionCurrentPeriodEnd,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return {
        tier: 'free',
        status: null,
        customerId: null,
        subscriptionId: null,
        currentPeriodEnd: null,
      };
    }

    return profile[0];
  } catch (error) {
    console.error('Failed to get user subscription status:', error);
    return {
      tier: 'free',
      status: null,
      customerId: null,
      subscriptionId: null,
      currentPeriodEnd: null,
    };
  }
}

/**
 * Update user subscription tier
 */
export async function updateUserSubscription(
  userId: string,
  updates: {
    tier?: string;
    status?: string;
    customerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Date;
  }
) {
  try {
    await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`Updated subscription for user ${userId}:`, updates);
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}