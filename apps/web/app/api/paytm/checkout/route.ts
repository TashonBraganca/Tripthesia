import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createPaytmTransaction, SUBSCRIPTION_TIERS, generateOrderId } from "@/lib/paytm";
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

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || 'User';
    const userPhone = user.phoneNumbers[0]?.phoneNumber || '';

    // Generate unique order ID
    const orderId = generateOrderId(userId);

    // Create Paytm transaction
    const paytmTransaction = await createPaytmTransaction(
      userId,
      userEmail,
      userPhone,
      tierConfig.price, // ₹599 in paise
      orderId
    );

    // Track checkout initiation
    trackEvent('paytm_checkout_initiated', {
      tier,
      userId,
      orderId,
      amount: tierConfig.price,
      currency: 'INR',
    }, userId);

    return NextResponse.json({
      transaction: paytmTransaction,
      orderId,
      amount: tierConfig.price,
      userDetails: {
        name: userName,
        email: userEmail,
        phone: userPhone,
      },
      tier: tierConfig,
    });

  } catch (error) {
    console.error('Paytm checkout creation failed:', error);

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