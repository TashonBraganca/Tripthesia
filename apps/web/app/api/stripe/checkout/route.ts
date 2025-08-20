import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createCheckoutSession, SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { trackEvent } from "@/lib/monitoring";

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  tier: z.enum(['pro']), // Only pro tier for now
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
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
    const { tier, successUrl, cancelUrl } = checkoutSchema.parse(body);

    const tierConfig = SUBSCRIPTION_TIERS[tier];
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Default URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/upgrade?cancelled=true`;

    // Create Stripe checkout session
    const session = await createCheckoutSession(
      userId,
      tierConfig.priceId,
      successUrl || defaultSuccessUrl,
      cancelUrl || defaultCancelUrl
    );

    // Track checkout initiation
    trackEvent('checkout_initiated', {
      tier,
      userId,
      sessionId: session.id,
      amount: tierConfig.price,
    }, userId);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout session creation failed:', error);

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