/**
 * Global Payment Gateways Service
 * Multi-gateway payment processing for global markets
 */

import { z } from 'zod';
import { trackEvent, trackError } from './monitoring';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    description: 'Basic trip planning',
    trips: 2,
    features: ['Basic AI planning', 'PDF/ICS export', 'Standard support']
  },
  pro: {
    name: 'Pro',
    description: 'Advanced trip planning',
    trips: 10,
    features: ['Advanced AI', 'Real-time pricing', 'Priority support', 'Collaboration']
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Unlimited planning',
    trips: -1, // Unlimited
    features: ['Premium AI models', 'API access', 'Team features', 'Dedicated support']
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Regional pricing in local currencies
const TIER_PRICING = {
  // North America
  USD: { pro: 8, enterprise: 15 },
  CAD: { pro: 11, enterprise: 20 },
  
  // Europe
  EUR: { pro: 7, enterprise: 14 },
  GBP: { pro: 7, enterprise: 13 },
  CHF: { pro: 8, enterprise: 15 },
  SEK: { pro: 85, enterprise: 160 },
  NOK: { pro: 85, enterprise: 160 },
  DKK: { pro: 55, enterprise: 105 },
  
  // Asia Pacific
  AUD: { pro: 12, enterprise: 22 },
  SGD: { pro: 11, enterprise: 20 },
  JPY: { pro: 1200, enterprise: 2200 },
  
  // India (special pricing)
  INR: { pro: 665, enterprise: 1250 },
  
  // Other regions
  CNY: { pro: 58, enterprise: 108 },
  KRW: { pro: 10500, enterprise: 19500 },
  BRL: { pro: 42, enterprise: 78 },
  MXN: { pro: 140, enterprise: 260 }
} as const;

export type Currency = keyof typeof TIER_PRICING;

// Payment gateway configuration
export interface PaymentGateway {
  id: 'stripe' | 'paypal' | 'razorpay';
  name: string;
  regions: string[];
  currencies: Currency[];
  processingFee: number; // Percentage
  features: string[];
}

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    regions: ['US', 'EU', 'CA', 'AU', 'UK', 'SG', 'JP'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'],
    processingFee: 2.9,
    features: ['Credit cards', 'Bank transfers', 'Digital wallets', 'Subscription management']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    regions: ['Global'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    processingFee: 3.4,
    features: ['PayPal balance', 'Credit cards', 'Bank transfers', 'Global coverage']
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    regions: ['IN'],
    currencies: ['INR'],
    processingFee: 2.0,
    features: ['UPI', 'Net Banking', 'Digital wallets', 'Credit/Debit cards']
  }
];

/**
 * Get the best payment gateway for a user's region and currency
 */
export function getBestPaymentGateway(userCountry?: string, currency: Currency = 'USD'): PaymentGateway {
  // Special case for India
  if (userCountry === 'IN' || currency === 'INR') {
    return PAYMENT_GATEWAYS.find(g => g.id === 'razorpay')!;
  }
  
  // Find gateway that supports the currency and region
  const supportedGateways = PAYMENT_GATEWAYS.filter(gateway => 
    gateway.currencies.includes(currency) &&
    (gateway.regions.includes('Global') || 
     (userCountry && gateway.regions.includes(userCountry)))
  );
  
  // Prefer Stripe for most regions, PayPal as backup
  return supportedGateways.find(g => g.id === 'stripe') || 
         supportedGateways.find(g => g.id === 'paypal') ||
         supportedGateways[0];
}

/**
 * Get tier price in specified currency
 */
export function getTierPrice(tier: SubscriptionTier, currency: Currency = 'USD'): number {
  if (tier === 'free') return 0;
  
  const pricing = TIER_PRICING[currency];
  if (!pricing) {
    // Fallback to USD pricing
    return TIER_PRICING.USD[tier];
  }
  
  return pricing[tier];
}

/**
 * Format amount with proper currency symbol and locale
 */
export function formatAmount(amount: number, currency: Currency): string {
  const currencyMap: Record<Currency, { symbol: string; locale: string }> = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    CAD: { symbol: 'C$', locale: 'en-CA' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    SGD: { symbol: 'S$', locale: 'en-SG' },
    INR: { symbol: '₹', locale: 'en-IN' },
    CHF: { symbol: 'CHF', locale: 'de-CH' },
    SEK: { symbol: 'kr', locale: 'sv-SE' },
    NOK: { symbol: 'kr', locale: 'nb-NO' },
    DKK: { symbol: 'kr', locale: 'da-DK' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
    KRW: { symbol: '₩', locale: 'ko-KR' },
    BRL: { symbol: 'R$', locale: 'pt-BR' },
    MXN: { symbol: '$', locale: 'es-MX' }
  };

  const { symbol, locale } = currencyMap[currency];
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2,
      maximumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2
    }).format(amount);
  } catch (error) {
    // Fallback to simple format
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Stripe Checkout Session Creation
 */
export async function createStripeCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string,
  currency: Currency = 'USD'
): Promise<{ url: string; sessionId: string }> {
  try {
    const price = getTierPrice(tier, currency);
    
    const response = await fetch('/api/payments/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tier,
        currency,
        amount: price,
        successUrl,
        cancelUrl
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    trackEvent('payment_session_created', {
      gateway: 'stripe',
      tier,
      currency,
      amount: price,
      user_id: userId
    });

    return data;

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'payment_gateways',
      operation: 'stripe_checkout',
      tier,
      currency
    });
    throw error;
  }
}

/**
 * PayPal Subscription Creation
 */
export async function createPayPalSubscription(
  userId: string,
  tier: SubscriptionTier,
  currency: Currency = 'USD'
): Promise<{ approvalUrl: string; subscriptionId: string }> {
  try {
    const price = getTierPrice(tier, currency);
    
    const response = await fetch('/api/payments/paypal/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tier,
        currency,
        amount: price
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create PayPal subscription');
    }

    trackEvent('payment_session_created', {
      gateway: 'paypal',
      tier,
      currency,
      amount: price,
      user_id: userId
    });

    return data;

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'payment_gateways',
      operation: 'paypal_subscription',
      tier,
      currency
    });
    throw error;
  }
}

/**
 * Razorpay Subscription Creation
 */
export async function createRazorpaySubscription(
  userId: string,
  tier: SubscriptionTier
): Promise<{ orderId: string; keyId: string; amount: number }> {
  try {
    const price = getTierPrice(tier, 'INR');
    
    const response = await fetch('/api/payments/razorpay/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tier,
        amount: price
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create Razorpay subscription');
    }

    trackEvent('payment_session_created', {
      gateway: 'razorpay',
      tier,
      currency: 'INR',
      amount: price,
      user_id: userId
    });

    return data;

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'payment_gateways',
      operation: 'razorpay_subscription',
      tier
    });
    throw error;
  }
}

/**
 * Detect user's optimal payment gateway and currency
 */
export async function detectOptimalPayment(userCountry?: string): Promise<{
  gateway: PaymentGateway;
  currency: Currency;
  pricing: { pro: number; enterprise: number };
}> {
  try {
    // Detect currency based on country
    const countryToCurrency: Record<string, Currency> = {
      'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD',
      'JP': 'JPY', 'SG': 'SGD', 'IN': 'INR', 'CH': 'CHF',
      'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'CN': 'CNY',
      'KR': 'KRW', 'BR': 'BRL', 'MX': 'MXN'
    };

    // Check EU countries for EUR
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU', 'MT', 'CY', 'SK', 'SI', 'LV', 'LT', 'EE'];
    
    let currency: Currency = 'USD'; // Default
    
    if (userCountry && euCountries.includes(userCountry)) {
      currency = 'EUR';
    } else if (userCountry && countryToCurrency[userCountry]) {
      currency = countryToCurrency[userCountry];
    }

    const gateway = getBestPaymentGateway(userCountry, currency);
    const pricing = TIER_PRICING[currency] || TIER_PRICING.USD;

    trackEvent('payment_detection', {
      user_country: userCountry,
      detected_currency: currency,
      selected_gateway: gateway.id
    });

    return {
      gateway,
      currency,
      pricing
    };

  } catch (error) {
    // Fallback to USD/Stripe
    return {
      gateway: PAYMENT_GATEWAYS[0],
      currency: 'USD',
      pricing: TIER_PRICING.USD
    };
  }
}

/**
 * Validate webhook signature for security
 */
export function validateWebhookSignature(
  gateway: 'stripe' | 'paypal' | 'razorpay',
  signature: string,
  payload: string,
  secret: string
): boolean {
  try {
    switch (gateway) {
      case 'stripe':
        // Stripe webhook validation logic
        return true; // Simplified for demo
      case 'paypal':
        // PayPal webhook validation logic
        return true; // Simplified for demo
      case 'razorpay':
        // Razorpay webhook validation logic
        return true; // Simplified for demo
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Process successful payment webhook
 */
export async function processSuccessfulPayment(
  userId: string,
  tier: SubscriptionTier,
  transactionId: string,
  gateway: string,
  amount: number,
  currency: Currency
): Promise<void> {
  try {
    // Update user subscription in database
    await fetch('/api/subscription/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tier,
        transactionId,
        gateway,
        amount,
        currency
      })
    });

    trackEvent('payment_successful', {
      user_id: userId,
      tier,
      gateway,
      amount,
      currency,
      transaction_id: transactionId
    });

  } catch (error) {
    trackError(error instanceof Error ? error : new Error(String(error)), {
      service: 'payment_gateways',
      operation: 'process_successful_payment',
      user_id: userId,
      transaction_id: transactionId
    });
  }
}