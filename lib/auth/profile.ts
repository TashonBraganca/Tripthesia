import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { profiles, users } from '@/lib/database/schema';
import { eq, sql } from 'drizzle-orm';
import { type SubscriptionTier } from '@/lib/subscription/config';

export interface UserProfile {
  userId: string;
  displayName?: string;
  email?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: string;
  tripsUsedThisMonth: number;
  subscriptionCurrentPeriodEnd?: Date;
  createdAt: Date;
}

/**
 * Get the current user's profile with subscription info
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { userId } = auth();
  
  if (!userId) {
    return null;
  }

  try {
    // Get profile from database
    const profileData = await db
      .select({
        userId: profiles.userId,
        displayName: profiles.displayName,
        subscriptionTier: profiles.subscriptionTier,
        subscriptionStatus: profiles.subscriptionStatus,
        tripsUsedThisMonth: profiles.tripsUsedThisMonth,
        subscriptionCurrentPeriodEnd: profiles.subscriptionCurrentPeriodEnd,
        createdAt: profiles.createdAt,
        email: users.email,
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profileData.length === 0) {
      // Profile doesn't exist, create it
      return await createUserProfile(userId);
    }

    const profile = profileData[0];
    return {
      userId: profile.userId,
      displayName: profile.displayName || undefined,
      email: profile.email || undefined,
      subscriptionTier: (profile.subscriptionTier as SubscriptionTier) || 'free',
      subscriptionStatus: profile.subscriptionStatus || undefined,
      tripsUsedThisMonth: profile.tripsUsedThisMonth || 0,
      subscriptionCurrentPeriodEnd: profile.subscriptionCurrentPeriodEnd || undefined,
      createdAt: profile.createdAt,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string, email?: string): Promise<UserProfile> {
  try {
    // Insert user record if it doesn't exist
    if (email) {
      await db
        .insert(users)
        .values({ id: userId, email })
        .onConflictDoNothing();
    }

    // Insert profile
    await db
      .insert(profiles)
      .values({
        userId,
        subscriptionTier: 'free',
        tripsUsedThisMonth: 0,
      })
      .onConflictDoNothing();

    return {
      userId,
      email: email || '',
      subscriptionTier: 'free',
      tripsUsedThisMonth: 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  userId: string,
  updates: {
    tier?: SubscriptionTier;
    status?: string;
    subscriptionId?: string;
    customerId?: string;
    currentPeriodEnd?: Date;
  }
) {
  try {
    await db
      .update(profiles)
      .set({
        ...(updates.tier && { subscriptionTier: updates.tier }),
        ...(updates.status && { subscriptionStatus: updates.status }),
        ...(updates.subscriptionId && { subscriptionId: updates.subscriptionId }),
        ...(updates.customerId && { razorpayCustomerId: updates.customerId }),
        ...(updates.currentPeriodEnd && { subscriptionCurrentPeriodEnd: updates.currentPeriodEnd }),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`Updated subscription for user ${userId}:`, updates);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Increment user's trip usage
 */
export async function incrementTripUsage(userId: string): Promise<void> {
  try {
    await db
      .update(profiles)
      .set({
        tripsUsedThisMonth: sql`${profiles.tripsUsedThisMonth} + 1`,
        lastTripCreated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
  } catch (error) {
    console.error('Error incrementing trip usage:', error);
    throw error;
  }
}

/**
 * Reset monthly usage (run via cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    await db
      .update(profiles)
      .set({
        tripsUsedThisMonth: 0,
        updatedAt: new Date(),
      });
    
    console.log('Monthly usage reset for all users');
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
}