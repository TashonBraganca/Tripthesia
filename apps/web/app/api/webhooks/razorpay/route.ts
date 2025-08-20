import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackEvent, trackError } from "@/lib/monitoring";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay signature' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log(`🔔 Razorpay webhook received: ${event.event}`);

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.completed':
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.payment.entity);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;

      default:
        console.log(`📝 Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    
    trackError('Razorpay webhook failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: 'webhook',
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  const userId = payment.notes?.userId;
  const tier = payment.notes?.tier || 'pro';
  
  if (!userId) {
    console.error('No userId found in payment notes');
    return;
  }

  try {
    // Update user profile with Pro subscription
    await db
      .update(profiles)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        razorpayCustomerId: payment.id,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`✅ Payment captured for user ${userId}: ${tier}`);

    // Track payment success
    trackEvent('payment_captured', {
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      tier,
    }, userId);

  } catch (error) {
    console.error('Failed to update payment status:', error);
    trackError('Payment update failed', {
      userId,
      paymentId: payment.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePaymentFailed(payment: any) {
  const userId = payment.notes?.userId;
  
  if (!userId) {
    console.error('No userId found in payment notes');
    return;
  }

  console.log(`💸 Payment failed for user ${userId}`);

  // Track failed payment
  trackEvent('payment_failed', {
    userId,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    errorCode: payment.error_code,
    errorDescription: payment.error_description,
  }, userId);

  // In a real app, you might want to:
  // 1. Send email notification to user
  // 2. Create retry mechanism
  // 3. Log the failure for support follow-up
}

async function handleSubscriptionActivated(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription notes');
    return;
  }

  try {
    // Update user profile with subscription details
    await db
      .update(profiles)
      .set({
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        subscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: subscription.current_end 
          ? new Date(subscription.current_end * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`✅ Subscription activated for user ${userId}`);

    // Track subscription activation
    trackEvent('subscription_activated', {
      userId,
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
    }, userId);

  } catch (error) {
    console.error('Failed to update subscription:', error);
    trackError('Subscription activation failed', {
      userId,
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription notes');
    return;
  }

  try {
    // Downgrade user to free tier
    await db
      .update(profiles)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        subscriptionCurrentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`✅ Subscription cancelled for user ${userId}`);

    // Track cancellation
    trackEvent('subscription_cancelled', {
      userId,
      subscriptionId: subscription.id,
      cancelledAt: new Date().toISOString(),
    }, userId);

  } catch (error) {
    console.error('Failed to handle subscription cancellation:', error);
    trackError('Subscription cancellation failed', {
      userId,
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleSubscriptionCharged(payment: any) {
  const subscriptionId = payment.subscription_id;
  
  if (!subscriptionId) {
    return;
  }

  console.log(`💰 Subscription charged: ${subscriptionId}`);

  // Track successful recurring payment
  trackEvent('subscription_charged', {
    subscriptionId,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
  });
}

async function handleSubscriptionPaused(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription notes');
    return;
  }

  try {
    // Update subscription status to paused
    await db
      .update(profiles)
      .set({
        subscriptionStatus: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`⏸️ Subscription paused for user ${userId}`);

    // Track pause
    trackEvent('subscription_paused', {
      userId,
      subscriptionId: subscription.id,
    }, userId);

  } catch (error) {
    console.error('Failed to handle subscription pause:', error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  const userId = subscription.notes?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription notes');
    return;
  }

  try {
    // Update subscription status to active
    await db
      .update(profiles)
      .set({
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`▶️ Subscription resumed for user ${userId}`);

    // Track resume
    trackEvent('subscription_resumed', {
      userId,
      subscriptionId: subscription.id,
    }, userId);

  } catch (error) {
    console.error('Failed to handle subscription resume:', error);
  }
}