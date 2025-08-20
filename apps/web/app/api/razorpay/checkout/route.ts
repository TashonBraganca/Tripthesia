import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createOrder, createSubscriptionOrder, SUBSCRIPTION_TIERS } from "@/lib/razorpay";
import { trackEvent } from "@/lib/monitoring";
import { clerkClient } from "@clerk/nextjs";

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  tier: z.enum(['pro']), // Only pro tier for now
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
    const { tier } = checkoutSchema.parse(body);

    const tierConfig = SUBSCRIPTION_TIERS[tier];
    
    // Check if Razorpay is fully configured for subscriptions
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || 'User';

    // Create Razorpay order for immediate payment (₹599)
    const order = await createOrder(
      tierConfig.price, // ₹599 in paise
      'INR',
      `order_${userId}_${Date.now()}`,
      {
        userId,
        tier,
        email: userEmail || '',
        name: userName,
      }
    );

    // Create subscription (will be activated after successful payment)
    let subscription = null;
    if (tierConfig.planId) {
      try {
        subscription = await createSubscriptionOrder(
          userId,
          tierConfig.planId,
          userEmail,
          userName
        );
      } catch (error) {
        console.error('Subscription creation failed:', error);
        // Continue with order creation even if subscription fails
      }
    }

    // Track checkout initiation
    trackEvent('checkout_initiated', {
      tier,
      userId,
      orderId: order.id,
      amount: tierConfig.price,
      currency: 'INR',
    }, userId);

    return NextResponse.json({
      order,
      subscription,
      userDetails: {
        name: userName,
        email: userEmail,
      },
      tier: tierConfig,
    });

  } catch (error) {
    console.error('Razorpay checkout creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}