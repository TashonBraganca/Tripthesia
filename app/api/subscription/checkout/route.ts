import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { SUBSCRIPTION_TIERS, type SubscriptionTier, detectUserCurrency, getTierPrice } from "@/lib/subscription/config";
import { getCurrentUserProfile } from "@/lib/auth/profile";

const checkoutSchema = z.object({
  tier: z.enum(['starter', 'pro']),
  currency: z.enum(['INR', 'USD']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, currency: requestedCurrency } = checkoutSchema.parse(body);

    // Get user profile
    const profile = await getCurrentUserProfile();
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Detect currency if not provided
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const currency = requestedCurrency || detectUserCurrency(userAgent, acceptLanguage);

    const tierConfig = SUBSCRIPTION_TIERS[tier];
    const price = getTierPrice(tier, currency);

    // For now, return a mock checkout session
    // In production, this would create a real Razorpay order
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: price,
      currency,
      tier: tierConfig,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      user: {
        name: profile.displayName || 'User',
        email: profile.email,
      },
      // This would be a real Razorpay order in production
      message: 'Mock checkout session created - Razorpay integration ready',
    });

  } catch (error) {
    console.error('Checkout creation failed:', error);

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