/**
 * Global Payment Gateway System for Tripthesia
 * Supports multiple payment providers for worldwide coverage
 */

import Stripe from 'stripe';

// Initialize Stripe (primary global gateway)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// PayPal configuration (international backup)
export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  sandbox: process.env.NODE_ENV !== 'production',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com',
};

// Razorpay configuration (India regional)
let razorpay: any = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    console.warn('Razorpay not available - continuing without India regional support');
  }
}

// Global pricing configuration (USD primary)
export const GLOBAL_SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0, // $0
    stripePriceId: null,
    paypalPlanId: null,
    razorpayPlanId: null,
    features: [
      '2 trips per month',
      'Basic itinerary generation',
      'Standard support',
      'Export to PDF/ICS',
      'International payment support',
    ],
    limits: {
      tripsPerMonth: 2,
      activitiesPerDay: 5,
      daysPerTrip: 7,
    },
  },
  pro: {
    name: 'Pro',
    price: 800, // $8.00 (in cents)
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID,
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID,
    features: [
      '10 trips per month',
      'Advanced AI planning',
      'Real-time pricing',
      'Priority support',
      'Advanced customization',
      'Collaborative planning',
      'Global payment methods',
    ],
    limits: {
      tripsPerMonth: 10,
      activitiesPerDay: 12,
      daysPerTrip: 14,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 1500, // $15.00 (in cents)
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    paypalPlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID,
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID,
    features: [
      'Unlimited trips',
      'Premium AI models',
      'Real-time suggestions',
      'Dedicated support',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'All global payment methods',
    ],
    limits: {
      tripsPerMonth: -1, // unlimited
      activitiesPerDay: 20,
      daysPerTrip: 30,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof GLOBAL_SUBSCRIPTION_TIERS;

// Gateway regions configuration
export const PAYMENT_GATEWAY_REGIONS = {
  stripe: {
    regions: ['US', 'EU', 'CA', 'AU', 'UK', 'SG', 'JP'],
    primary: true,
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY'],
  },
  paypal: {
    regions: ['global'],
    backup: true,
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  },
  razorpay: {
    regions: ['IN'],
    regional: true,
    currencies: ['INR'],
  },
} as const;

// Currency conversion rates (should be updated via API)
export const CURRENCY_RATES = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  CAD: 1.25,
  AUD: 1.35,
  INR: 83.0,
  SGD: 1.32,
  JPY: 110.0,
} as const;

// Helper functions
export function getSubscriptionTier(tier: string): SubscriptionTier {
  return (tier as SubscriptionTier) || 'free';
}

export function getTierLimits(tier: SubscriptionTier) {
  return GLOBAL_SUBSCRIPTION_TIERS[tier].limits;
}

export function getTierFeatures(tier: SubscriptionTier) {
  return GLOBAL_SUBSCRIPTION_TIERS[tier].features;
}

export function getTierPrice(tier: SubscriptionTier, currency: string = 'USD'): number {
  const basePrice = GLOBAL_SUBSCRIPTION_TIERS[tier].price;
  const rate = CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES] || 1;
  return Math.round(basePrice * rate);
}

// Format amount for display in any currency
export function formatAmount(
  amountInCents: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

// Determine best payment gateway for user
export function getBestPaymentGateway(
  userCountry?: string,
  preferredCurrency?: string
): 'stripe' | 'paypal' | 'razorpay' {
  // India users prefer Razorpay
  if (userCountry === 'IN' && razorpay) {
    return 'razorpay';
  }
  
  // For most global users, Stripe is primary
  const stripeRegions = PAYMENT_GATEWAY_REGIONS.stripe.regions;
  if (userCountry && stripeRegions.includes(userCountry)) {
    return 'stripe';
  }
  
  // PayPal as global backup
  return 'paypal';
}

// Stripe functions
export async function createStripeCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string,
  currency: string = 'USD'
) {
  const tierConfig = GLOBAL_SUBSCRIPTION_TIERS[tier];
  const priceInCents = getTierPrice(tier, currency);
  
  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Will be collected
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Tripthesia ${tierConfig.name}`,
            description: 'AI-powered travel planning platform',
          },
          unit_amount: priceInCents,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      gateway: 'stripe',
    },
  });

  return session;
}

export async function createStripePortalSession(customerId: string, returnUrl: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portalSession;
}

// PayPal functions
export async function createPayPalSubscription(
  userId: string,
  tier: SubscriptionTier,
  currency: string = 'USD'
) {
  const tierConfig = GLOBAL_SUBSCRIPTION_TIERS[tier];
  const priceInCents = getTierPrice(tier, currency);
  const amount = (priceInCents / 100).toFixed(2);

  const subscriptionData = {
    plan_id: tierConfig.paypalPlanId,
    quantity: '1',
    application_context: {
      brand_name: 'Tripthesia',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
    },
    custom_id: userId,
  };

  // Implementation would use PayPal SDK
  return subscriptionData;
}

// Razorpay functions (for India)
export async function createRazorpaySubscription(
  userId: string,
  tier: SubscriptionTier,
  customerEmail?: string,
  customerName?: string
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured');
  }

  const tierConfig = GLOBAL_SUBSCRIPTION_TIERS[tier];
  const priceInPaise = getTierPrice(tier, 'INR') * 100; // Convert to paise

  const subscription = await razorpay.subscriptions.create({
    plan_id: tierConfig.razorpayPlanId,
    customer_notify: 1,
    total_count: 12, // 12 months
    notes: {
      userId,
      tier,
      gateway: 'razorpay',
    },
  });

  return subscription;
}

// Universal payment method names
export function getPaymentMethodName(
  method: string,
  gateway: 'stripe' | 'paypal' | 'razorpay'
): string {
  const methodMaps = {
    stripe: {
      card: 'Credit/Debit Card',
      sepa_debit: 'SEPA Direct Debit',
      ideal: 'iDEAL',
      sofort: 'SOFORT',
      bancontact: 'Bancontact',
      giropay: 'Giropay',
    },
    paypal: {
      paypal: 'PayPal',
      credit_card: 'Credit/Debit Card',
      bank_account: 'Bank Account',
    },
    razorpay: {
      card: 'Credit/Debit Card',
      netbanking: 'Net Banking',
      upi: 'UPI',
      wallet: 'Digital Wallet',
      emi: 'EMI',
    },
  };

  return methodMaps[gateway][method as keyof typeof methodMaps[typeof gateway]] || method;
}

// Webhook verification functions
export function verifyStripeWebhook(payload: string, signature: string): any {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    throw error;
  }
}

export function verifyRazorpayWebhook(
  payload: string,
  signature: string
): boolean {
  if (!razorpay) return false;
  
  try {
    return razorpay.webhooks.validateWebhookSignature(
      payload,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Razorpay webhook verification failed:', error);
    return false;
  }
}

// Error handling
export class PaymentError extends Error {
  constructor(
    message: string,
    public gateway: string,
    public code?: string,
    public orderId?: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Get user's preferred currency based on location
export function getPreferredCurrency(countryCode?: string): string {
  const currencyMap: Record<string, string> = {
    US: 'USD',
    CA: 'CAD',
    GB: 'GBP',
    EU: 'EUR',
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    AU: 'AUD',
    IN: 'INR',
    SG: 'SGD',
    JP: 'JPY',
  };

  return currencyMap[countryCode || 'US'] || 'USD';
}

export { razorpay };