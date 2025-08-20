import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile with subscription info
    const profile = await db
      .select({
        subscriptionTier: profiles.subscriptionTier,
        subscriptionStatus: profiles.subscriptionStatus,
        stripeCustomerId: profiles.stripeCustomerId,
        stripeSubscriptionId: profiles.stripeSubscriptionId,
        subscriptionCurrentPeriodEnd: profiles.subscriptionCurrentPeriodEnd,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // Create default profile if doesn't exist
      await db.insert(profiles).values({
        userId,
        subscriptionTier: 'free',
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        tier: 'free',
        status: null,
        customerId: null,
        subscriptionId: null,
        currentPeriodEnd: null,
      });
    }

    const userProfile = profile[0];

    return NextResponse.json({
      tier: userProfile.subscriptionTier || 'free',
      status: userProfile.subscriptionStatus,
      customerId: userProfile.stripeCustomerId,
      subscriptionId: userProfile.stripeSubscriptionId,
      currentPeriodEnd: userProfile.subscriptionCurrentPeriodEnd,
    });

  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}