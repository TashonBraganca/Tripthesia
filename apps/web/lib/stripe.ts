import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 trips per month',
      'Basic itinerary generation',
      'Standard support',
      'Export to PDF/ICS',
    ],
    limits: {
      tripsPerMonth: 3,
      activitiesPerDay: 5,
      daysPerTrip: 7,
    },
  },
  pro: {
    name: 'Pro',
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited trips',
      'Advanced AI planning',
      'Real-time pricing',
      'Priority support',
      'Advanced customization',
      'Collaborative planning',
    ],
    limits: {
      tripsPerMonth: -1, // unlimited
      activitiesPerDay: 15,
      daysPerTrip: 30,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Helper functions
export function getSubscriptionTier(tier: string): SubscriptionTier {
  return (tier as SubscriptionTier) || 'free';
}

export function getTierLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier].limits;
}

export function getTierFeatures(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier].features;
}

// Stripe webhook types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Will be filled by Clerk
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    automatic_tax: {
      enabled: true,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

// Create customer portal session
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });

  return subscriptions.data;
}

// Check if customer has active subscription
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  const subscriptions = await getCustomerSubscriptions(customerId);
  return subscriptions.length > 0;
}

// Get customer by user ID from metadata
export async function getCustomerByUserId(userId: string) {
  const customers = await stripe.customers.list({
    limit: 1,
    expand: ['data.subscriptions'],
  });

  return customers.data.find(customer => 
    customer.metadata?.userId === userId
  );
}

// Create customer
export async function createCustomer(
  userId: string,
  email: string,
  name?: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

// Usage tracking for metered billing (future feature)
export async function trackUsage(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
) {
  const usage = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: 'increment',
    }
  );

  return usage;
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}