import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription tiers configuration (same as before but with Razorpay plan IDs)
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    planId: null,
    features: [
      '3 trips per month',
      'Basic itinerary generation', 
      'Standard support',
      'Export to PDF/ICS',
      'UPI, Cards & NetBanking support',
    ],
    limits: {
      tripsPerMonth: 3,
      activitiesPerDay: 5,
      daysPerTrip: 7,
    },
  },
  pro: {
    name: 'Pro',
    price: 59900, // ₹599 in paise (Razorpay uses paise, not cents)
    planId: process.env.RAZORPAY_PRO_PLAN_ID,
    features: [
      'Unlimited trips',
      'Advanced AI planning',
      'Real-time pricing',
      'Priority support',
      'Advanced customization',
      'Collaborative planning',
      'All payment methods (UPI/Cards/Wallets)',
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

// Razorpay webhook types
export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: any;
    order: any;
    subscription: any;
  };
  created_at: number;
}

// Create Razorpay order for subscription
export async function createSubscriptionOrder(
  userId: string,
  planId: string,
  customerEmail?: string,
  customerName?: string
) {
  // First create a subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 12, // 12 months
    notes: {
      userId,
      tier: 'pro',
    },
  });

  return subscription;
}

// Create a one-time order (for immediate payment before subscription)
export async function createOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
) {
  const order = await razorpay.orders.create({
    amount: amount, // amount in paise
    currency,
    receipt,
    notes,
  });

  return order;
}

// Create subscription plan (admin function)
export async function createSubscriptionPlan() {
  const plan = await razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: 'Tripthesia Pro',
      amount: 59900, // ₹599 in paise
      currency: 'INR',
      description: 'Unlimited AI trip planning with premium features',
    },
    notes: {
      tier: 'pro',
    },
  });

  return plan;
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, true);
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.pause(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.resume(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

// Get all payments for a subscription
export async function getSubscriptionPayments(subscriptionId: string) {
  try {
    const payments = await razorpay.subscriptions.fetchPayments(subscriptionId);
    return payments;
  } catch (error) {
    console.error('Error fetching subscription payments:', error);
    return null;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    return razorpay.webhooks.validateWebhookSignature(payload, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Check if payment is successful
export function isPaymentSuccessful(payment: any): boolean {
  return payment.status === 'captured' || payment.status === 'authorized';
}

// Format amount for display (convert paise to rupees)
export function formatAmount(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

// Get payment method display name
export function getPaymentMethodName(method: string): string {
  const methods: Record<string, string> = {
    card: 'Credit/Debit Card',
    netbanking: 'Net Banking',
    upi: 'UPI',
    wallet: 'Digital Wallet',
    emi: 'EMI',
    paylater: 'Pay Later',
  };
  
  return methods[method] || method;
}

// Create customer (if needed)
export async function createCustomer(
  name: string,
  email: string,
  contact?: string,
  notes?: Record<string, string>
) {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact,
      notes,
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Get customer details
export async function getCustomer(customerId: string) {
  try {
    const customer = await razorpay.customers.fetch(customerId);
    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}