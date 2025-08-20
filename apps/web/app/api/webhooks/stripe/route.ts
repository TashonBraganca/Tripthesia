import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyWebhookSignature } from "@/lib/stripe";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackEvent, trackError } from "@/lib/monitoring";
import Stripe from "stripe";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`📝 Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    trackError('Stripe webhook failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: 'webhook',
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  const isActive = subscription.status === 'active';
  const tier = isActive ? 'pro' : 'free';

  try {
    // Update user profile with subscription status
    await db
      .update(profiles)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`✅ Updated subscription for user ${userId}: ${tier} (${subscription.status})`);

    // Track subscription change
    trackEvent('subscription_updated', {
      userId,
      tier,
      status: subscription.status,
      subscriptionId: subscription.id,
    }, userId);

  } catch (error) {
    console.error('Failed to update subscription:', error);
    trackError('Subscription update failed', {
      userId,
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    // Downgrade user to free tier
    await db
      .update(profiles)
      .set({
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    console.log(`✅ Canceled subscription for user ${userId}`);

    // Track cancellation
    trackEvent('subscription_canceled', {
      userId,
      subscriptionId: subscription.id,
      canceledAt: new Date().toISOString(),
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  
  if (!userId) {
    console.error('No client_reference_id found in checkout session');
    return;
  }

  console.log(`💳 Checkout completed for user ${userId}`);

  // Track successful checkout
  trackEvent('checkout_completed', {
    userId,
    sessionId: session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
  }, userId);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription as string;
  
  if (!subscription) {
    return;
  }

  console.log(`💰 Payment succeeded for subscription ${subscription}`);

  // Track successful payment
  trackEvent('payment_succeeded', {
    subscriptionId: subscription,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    invoiceId: invoice.id,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription as string;
  
  if (!subscription) {
    return;
  }

  console.log(`💸 Payment failed for subscription ${subscription}`);

  // Track failed payment
  trackEvent('payment_failed', {
    subscriptionId: subscription,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    invoiceId: invoice.id,
    attemptCount: invoice.attempt_count,
  });

  // In a real app, you might want to:
  // 1. Send email notification to user
  // 2. Temporarily disable premium features
  // 3. Set up retry logic
}