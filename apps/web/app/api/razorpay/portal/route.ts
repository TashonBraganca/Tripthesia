import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getSubscription, cancelSubscription, pauseSubscription, resumeSubscription } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackEvent } from "@/lib/monitoring";

export const runtime = 'nodejs';

const portalSchema = z.object({
  action: z.enum(['view', 'cancel', 'pause', 'resume']).optional().default('view'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = portalSchema.parse(body);

    // Get user's subscription from database
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!userProfile.length || !userProfile[0].subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const profile = userProfile[0];
    const subscriptionId = profile.subscriptionId;

    // Get subscription details from Razorpay
    const subscription = await getSubscription(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found in Razorpay' },
        { status: 404 }
      );
    }

    // Handle different actions
    let result = subscription;
    
    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscriptionId);
        // Update database
        await db
          .update(profiles)
          .set({ 
            subscriptionStatus: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId));
        
        trackEvent('subscription_cancelled', { userId, subscriptionId }, userId);
        break;
        
      case 'pause':
        result = await pauseSubscription(subscriptionId);
        await db
          .update(profiles)
          .set({ 
            subscriptionStatus: 'paused',
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId));
        
        trackEvent('subscription_paused', { userId, subscriptionId }, userId);
        break;
        
      case 'resume':
        result = await resumeSubscription(subscriptionId);
        await db
          .update(profiles)
          .set({ 
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId));
        
        trackEvent('subscription_resumed', { userId, subscriptionId }, userId);
        break;
        
      default:
        // Just view subscription details
        trackEvent('billing_portal_accessed', { userId, subscriptionId }, userId);
    }

    return NextResponse.json({
      subscription: result,
      profile: {
        tier: profile.subscriptionTier,
        status: profile.subscriptionStatus,
      },
      actions: {
        canCancel: result.status === 'active',
        canPause: result.status === 'active',
        canResume: result.status === 'paused',
      },
    });

  } catch (error) {
    console.error('Subscription management failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}