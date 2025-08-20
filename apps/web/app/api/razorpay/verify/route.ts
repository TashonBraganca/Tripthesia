import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { verifyWebhookSignature, getSubscription } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackEvent } from "@/lib/monitoring";

export const runtime = 'nodejs';

const verifySchema = z.object({
  order_id: z.string(),
  payment_id: z.string(),
  signature: z.string(),
  subscription_id: z.string().optional(),
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
    const { order_id, payment_id, signature, subscription_id } = verifySchema.parse(body);

    // Verify payment signature
    const generatedSignature = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment is verified, update user subscription
    try {
      await db
        .update(profiles)
        .set({ 
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          subscriptionId: subscription_id || payment_id,
          razorpayCustomerId: payment_id, // Store payment ID as reference
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));

      // Track successful payment
      trackEvent('payment_successful', {
        userId,
        orderId: order_id,
        paymentId: payment_id,
        subscriptionId: subscription_id,
        tier: 'pro',
      }, userId);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated',
      });

    } catch (dbError) {
      console.error('Database update failed:', dbError);
      
      // Track failed subscription activation
      trackEvent('subscription_activation_failed', {
        userId,
        orderId: order_id,
        paymentId: payment_id,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      }, userId);

      return NextResponse.json(
        { error: 'Payment verified but subscription activation failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment verification failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}