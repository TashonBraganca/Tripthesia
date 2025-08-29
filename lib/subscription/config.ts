// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceUSD: 0,
    priceINR: 0,
    planId: null,
    planIdUSD: null,
    features: [
      '2 trips per month',
      'Basic AI trip planning',
      'Standard support',
      'Basic place search',
      'PDF export',
    ],
    limits: {
      tripsPerMonth: 2,
      activitiesPerDay: 5,
      daysPerTrip: 7,
      aiGenerationsPerTrip: 1,
      placesSearchPerDay: 20,
    },
    popular: false,
  },
  starter: {
    name: 'Starter',
    price: 80000, // ₹800 in paise
    priceUSD: 1000, // $10 in cents
    priceINR: 80000, // ₹800 in paise
    planId: process.env.RAZORPAY_STARTER_PLAN_ID,
    planIdUSD: process.env.RAZORPAY_STARTER_PLAN_USD_ID,
    features: [
      '10 trips per month',
      'Advanced AI planning',
      'Real-time pricing',
      'Mapbox integration',
      'Priority support',
      'Multiple export formats',
      'Trip sharing',
    ],
    limits: {
      tripsPerMonth: 10,
      activitiesPerDay: 12,
      daysPerTrip: 14,
      aiGenerationsPerTrip: 3,
      placesSearchPerDay: 100,
    },
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: 200000, // ₹2000 in paise
    priceUSD: 2000, // $20 in cents
    priceINR: 200000, // ₹2000 in paise
    planId: process.env.RAZORPAY_PRO_PLAN_ID,
    planIdUSD: process.env.RAZORPAY_PRO_PLAN_USD_ID,
    features: [
      '30 trips per month',
      'Premium AI with GPT-4',
      'Real-time pricing & booking',
      'Advanced maps & routes',
      'VIP support',
      'Collaborative planning',
      'Custom preferences',
      'Analytics dashboard',
      'API access',
    ],
    limits: {
      tripsPerMonth: 30,
      activitiesPerDay: 20,
      daysPerTrip: 30,
      aiGenerationsPerTrip: 5,
      placesSearchPerDay: 500,
    },
    popular: false,
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

export function getTierPrice(tier: SubscriptionTier, currency: 'INR' | 'USD' = 'INR') {
  const config = SUBSCRIPTION_TIERS[tier];
  return currency === 'USD' ? config.priceUSD : config.priceINR;
}

export function detectUserCurrency(userAgent?: string, acceptLanguage?: string): 'INR' | 'USD' {
  // Simple detection - can be enhanced
  if (acceptLanguage?.includes('hi') || acceptLanguage?.includes('en-IN')) {
    return 'INR';
  }
  return 'USD'; // Default to USD for international users
}

export function formatPrice(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from paise
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
  }
}

// Usage tracking helpers
export function canCreateTrip(
  tier: SubscriptionTier,
  currentUsage: number,
  subscriptionStatus?: string | null
): boolean {
  if (tier === 'free') {
    return currentUsage < SUBSCRIPTION_TIERS.free.limits.tripsPerMonth;
  }
  
  // For paid tiers, check if subscription is active
  if (subscriptionStatus !== 'active') {
    return false;
  }
  
  const limits = SUBSCRIPTION_TIERS[tier].limits;
  return currentUsage < limits.tripsPerMonth;
}

export function getUsagePercentage(
  tier: SubscriptionTier,
  currentUsage: number
): number {
  const limit = SUBSCRIPTION_TIERS[tier].limits.tripsPerMonth;
  return Math.min((currentUsage / limit) * 100, 100);
}

export function getTripsRemaining(
  tier: SubscriptionTier,
  currentUsage: number
): number {
  const limit = SUBSCRIPTION_TIERS[tier].limits.tripsPerMonth;
  return Math.max(0, limit - currentUsage);
}