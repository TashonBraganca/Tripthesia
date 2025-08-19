import { auth } from '@clerk/nextjs/server';
import { db, withDatabase, isDatabaseAvailable } from '@/lib/db';
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

  // Return default profile if database is not configured
  if (!isDatabaseAvailable()) {
    return {
      userId,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      tripsUsedThisMonth: 0,
      createdAt: new Date(),
    };
  }

  const profileData = await withDatabase(async (db) => {
    return await db
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
  });

  if (!profileData || profileData.length === 0) {
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
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string, email?: string): Promise<UserProfile> {
  const defaultProfile: UserProfile = {
    userId,
    email: email || '',
    subscriptionTier: 'free',
    tripsUsedThisMonth: 0,
    createdAt: new Date(),
  };

  // Return default profile if database is not configured
  if (!isDatabaseAvailable()) {
    return defaultProfile;
  }

  const result = await withDatabase(async (db) => {
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

    return defaultProfile;
  });

  return result || defaultProfile;
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
): Promise<boolean> {
  // Skip if database is not configured
  if (!isDatabaseAvailable()) {
    return false;
  }

  const result = await withDatabase(async (db) => {
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
    
    return true;
  });

  return result || false;
}

/**
 * Increment user's trip usage
 */
export async function incrementTripUsage(userId: string): Promise<boolean> {
  // Skip if database is not configured
  if (!isDatabaseAvailable()) {
    return true; // Return true to not block functionality
  }

  const result = await withDatabase(async (db) => {
    await db
      .update(profiles)
      .set({
        tripsUsedThisMonth: sql`${profiles.tripsUsedThisMonth} + 1`,
        lastTripCreated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
    
    return true;
  });

  return result || false;
}

/**
 * Reset monthly usage (run via cron job)
 */
export async function resetMonthlyUsage(): Promise<boolean> {
  if (!isDatabaseAvailable()) {
    return false;
  }

  const result = await withDatabase(async (db) => {
    await db
      .update(profiles)
      .set({
        tripsUsedThisMonth: 0,
        updatedAt: new Date(),
      });
    
    return true;
  });

  return result || false;
}

/**
 * Get user by subscription ID (for webhooks)
 */
export async function getUserBySubscriptionId(subscriptionId: string): Promise<UserProfile | null> {
  if (!isDatabaseAvailable()) {
    return null;
  }

  const profileData = await withDatabase(async (db) => {
    return await db
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
      .where(eq(profiles.subscriptionId, subscriptionId))
      .limit(1);
  });

  if (!profileData || profileData.length === 0) {
    return null;
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
}