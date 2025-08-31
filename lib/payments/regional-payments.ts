/**
 * Regional Payment Methods for Tripthesia
 * Support for multiple payment processors across different regions
 */

import { Locale } from '../i18n/config';

export type PaymentProcessor = 
  | 'razorpay'      // India
  | 'stripe'        // Global
  | 'paypal'        // Global
  | 'alipay'        // China
  | 'wechat'        // China
  | 'sofort'        // Germany/EU
  | 'ideal'         // Netherlands
  | 'giropay'       // Germany
  | 'bancontact'    // Belgium
  | 'eps'           // Austria
  | 'p24'           // Poland
  | 'sepa'          // EU
  | 'klarna'        // EU/US
  | 'mercadopago'   // Latin America
  | 'payme'         // Israel
  | 'grabpay'       // Southeast Asia
  | 'gcash'         // Philippines
  | 'dana'          // Indonesia
  | 'truemoney'     // Thailand
  | 'fpx'           // Malaysia
  | 'duitnow'       // Malaysia
  | 'promptpay'     // Thailand
  | 'upi'           // India
  | 'netbanking'    // India
  | 'paytm'         // India
  | 'phonepe'       // India
  | 'googlepay'     // India/Global
  | 'applepay'      // Global
  | 'samsungpay'    // Global
  | 'cryptocurrency'; // Global

export interface PaymentMethod {
  id: PaymentProcessor;
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  type: 'card' | 'wallet' | 'bank' | 'bnpl' | 'crypto' | 'instant';
  currencies: string[];
  countries: string[];
  regions: string[];
  minAmount?: number;
  maxAmount?: number;
  fees: {
    percentage: number;
    fixed?: number;
    currency: string;
  };
  processingTime: string;
  refundSupported: boolean;
  recurringSupported: boolean;
  instantSettlement: boolean;
  trustScore: number; // 1-10
  popularity: number; // 1-10 for sorting
  enabled: boolean;
}

export const paymentMethods: Record<PaymentProcessor, PaymentMethod> = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    displayName: 'Credit/Debit Card',
    description: 'Secure card payments powered by Stripe',
    type: 'card',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'HKD', 'INR'],
    countries: ['US', 'GB', 'CA', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'IE', 'NO', 'DK', 'SE', 'FI', 'PL', 'CZ', 'PT', 'JP', 'SG', 'HK', 'IN', 'BR', 'MX'],
    regions: ['US', 'EU', 'APAC', 'LATAM'],
    fees: {
      percentage: 2.9,
      fixed: 0.30,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: false,
    trustScore: 10,
    popularity: 10,
    enabled: true
  },

  razorpay: {
    id: 'razorpay',
    name: 'Razorpay',
    displayName: 'UPI, Cards, Net Banking',
    description: 'All-in-one payment solution for India',
    type: 'wallet',
    currencies: ['INR'],
    countries: ['IN'],
    regions: ['IN'],
    fees: {
      percentage: 2.0,
      currency: 'INR'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: true,
    trustScore: 9,
    popularity: 10,
    enabled: true
  },

  paypal: {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    description: 'Pay with your PayPal account or card',
    type: 'wallet',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'HKD', 'SGD', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'MXN', 'BRL', 'TWD', 'PHP', 'THB', 'TRY'],
    countries: ['US', 'GB', 'CA', 'AU', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'IE', 'NO', 'DK', 'SE', 'FI', 'PL', 'CZ', 'PT', 'JP', 'SG', 'HK', 'BR', 'MX', 'IN'],
    regions: ['US', 'EU', 'APAC', 'LATAM'],
    fees: {
      percentage: 3.49,
      fixed: 0.49,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: false,
    trustScore: 9,
    popularity: 8,
    enabled: true
  },

  alipay: {
    id: 'alipay',
    name: 'Alipay',
    displayName: '支付宝 Alipay',
    description: 'China\'s leading digital wallet',
    type: 'wallet',
    currencies: ['CNY', 'USD', 'EUR'],
    countries: ['CN', 'HK', 'MO'],
    regions: ['CN'],
    fees: {
      percentage: 0.55,
      currency: 'CNY'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: true,
    trustScore: 9,
    popularity: 10,
    enabled: false // Requires special setup
  },

  wechat: {
    id: 'wechat',
    name: 'WeChat Pay',
    displayName: '微信支付 WeChat Pay',
    description: 'Popular Chinese mobile payment',
    type: 'wallet',
    currencies: ['CNY', 'USD', 'EUR'],
    countries: ['CN', 'HK', 'MO'],
    regions: ['CN'],
    fees: {
      percentage: 0.6,
      currency: 'CNY'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: true,
    trustScore: 9,
    popularity: 10,
    enabled: false // Requires special setup
  },

  sofort: {
    id: 'sofort',
    name: 'SOFORT',
    displayName: 'SOFORT Banking',
    description: 'Instant bank transfer in Germany',
    type: 'bank',
    currencies: ['EUR'],
    countries: ['DE', 'AT', 'CH', 'BE', 'NL'],
    regions: ['EU'],
    fees: {
      percentage: 1.4,
      currency: 'EUR'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: false,
    trustScore: 8,
    popularity: 8,
    enabled: true
  },

  ideal: {
    id: 'ideal',
    name: 'iDEAL',
    displayName: 'iDEAL',
    description: 'Netherlands\' most popular payment method',
    type: 'bank',
    currencies: ['EUR'],
    countries: ['NL'],
    regions: ['EU'],
    fees: {
      percentage: 0.29,
      currency: 'EUR'
    },
    processingTime: 'Instant',
    refundSupported: false,
    recurringSupported: false,
    instantSettlement: false,
    trustScore: 9,
    popularity: 10,
    enabled: true
  },

  klarna: {
    id: 'klarna',
    name: 'Klarna',
    displayName: 'Buy Now, Pay Later',
    description: 'Split your payment into installments',
    type: 'bnpl',
    currencies: ['USD', 'EUR', 'GBP', 'SEK', 'DKK', 'NOK'],
    countries: ['US', 'GB', 'DE', 'AT', 'NL', 'BE', 'FI', 'NO', 'SE', 'DK'],
    regions: ['US', 'EU'],
    fees: {
      percentage: 3.29,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: false,
    trustScore: 8,
    popularity: 7,
    enabled: true
  },

  mercadopago: {
    id: 'mercadopago',
    name: 'Mercado Pago',
    displayName: 'Mercado Pago',
    description: 'Leading payment platform in Latin America',
    type: 'wallet',
    currencies: ['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU'],
    countries: ['AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY'],
    regions: ['LATAM'],
    fees: {
      percentage: 4.99,
      currency: 'USD'
    },
    processingTime: '1-2 business days',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: false,
    trustScore: 8,
    popularity: 9,
    enabled: false // Requires setup
  },

  upi: {
    id: 'upi',
    name: 'UPI',
    displayName: 'UPI (Unified Payments Interface)',
    description: 'India\'s instant payment system',
    type: 'instant',
    currencies: ['INR'],
    countries: ['IN'],
    regions: ['IN'],
    fees: {
      percentage: 0,
      currency: 'INR'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: true,
    trustScore: 10,
    popularity: 10,
    enabled: true
  },

  googlepay: {
    id: 'googlepay',
    name: 'Google Pay',
    displayName: 'Google Pay',
    description: 'Fast, secure payments with Google',
    type: 'wallet',
    currencies: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD'],
    countries: ['US', 'GB', 'CA', 'AU', 'IN', 'SG', 'FR', 'DE', 'ES', 'IT'],
    regions: ['US', 'EU', 'APAC', 'IN'],
    fees: {
      percentage: 2.9,
      fixed: 0.30,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: false,
    trustScore: 9,
    popularity: 8,
    enabled: true
  },

  applepay: {
    id: 'applepay',
    name: 'Apple Pay',
    displayName: 'Apple Pay',
    description: 'Secure payments with Touch ID or Face ID',
    type: 'wallet',
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'DKK', 'NOK', 'PLN', 'CZK', 'HUF', 'SGD', 'HKD'],
    countries: ['US', 'GB', 'CA', 'AU', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'IE', 'NO', 'DK', 'SE', 'FI', 'PL', 'CZ', 'HU', 'JP', 'SG', 'HK'],
    regions: ['US', 'EU', 'APAC'],
    fees: {
      percentage: 2.9,
      fixed: 0.30,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: true,
    instantSettlement: false,
    trustScore: 10,
    popularity: 8,
    enabled: true
  },

  // Add more payment methods as needed
  samsungpay: {
    id: 'samsungpay',
    name: 'Samsung Pay',
    displayName: 'Samsung Pay',
    description: 'Mobile payments with Samsung devices',
    type: 'wallet',
    currencies: ['USD', 'EUR', 'GBP', 'KRW', 'CNY', 'INR'],
    countries: ['US', 'GB', 'KR', 'CN', 'IN', 'SG', 'AU', 'BR', 'ES', 'FR'],
    regions: ['US', 'EU', 'APAC'],
    fees: {
      percentage: 2.9,
      fixed: 0.30,
      currency: 'USD'
    },
    processingTime: 'Instant',
    refundSupported: true,
    recurringSupported: false,
    instantSettlement: false,
    trustScore: 8,
    popularity: 6,
    enabled: true
  },

  cryptocurrency: {
    id: 'cryptocurrency',
    name: 'Cryptocurrency',
    displayName: 'Bitcoin & Crypto',
    description: 'Pay with Bitcoin, Ethereum, and other cryptocurrencies',
    type: 'crypto',
    currencies: ['BTC', 'ETH', 'USDC', 'USDT'],
    countries: ['US', 'GB', 'CA', 'AU', 'DE', 'NL', 'CH', 'SE', 'NO', 'DK', 'FI', 'SG', 'HK', 'JP'],
    regions: ['US', 'EU', 'APAC'],
    fees: {
      percentage: 1.0,
      currency: 'USD'
    },
    processingTime: '10-60 minutes',
    refundSupported: false,
    recurringSupported: false,
    instantSettlement: false,
    trustScore: 6,
    popularity: 4,
    enabled: false // Enable when crypto support is added
  },

  // Placeholder entries for other methods
  giropay: { id: 'giropay', name: 'Giropay', displayName: 'Giropay', description: 'German bank transfer', type: 'bank', currencies: ['EUR'], countries: ['DE'], regions: ['EU'], fees: { percentage: 1.2, currency: 'EUR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 7, enabled: true },
  bancontact: { id: 'bancontact', name: 'Bancontact', displayName: 'Bancontact', description: 'Belgium\'s leading payment method', type: 'bank', currencies: ['EUR'], countries: ['BE'], regions: ['EU'], fees: { percentage: 1.4, currency: 'EUR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 9, enabled: true },
  eps: { id: 'eps', name: 'EPS', displayName: 'EPS', description: 'Austrian online bank transfer', type: 'bank', currencies: ['EUR'], countries: ['AT'], regions: ['EU'], fees: { percentage: 1.8, currency: 'EUR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 8, enabled: true },
  p24: { id: 'p24', name: 'Przelewy24', displayName: 'Przelewy24', description: 'Poland\'s most popular online payment', type: 'bank', currencies: ['EUR', 'PLN'], countries: ['PL'], regions: ['EU'], fees: { percentage: 2.2, currency: 'EUR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 9, enabled: true },
  sepa: { id: 'sepa', name: 'SEPA', displayName: 'SEPA Direct Debit', description: 'European bank account debits', type: 'bank', currencies: ['EUR'], countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'IE', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'], regions: ['EU'], fees: { percentage: 0.8, currency: 'EUR' }, processingTime: '3-5 business days', refundSupported: true, recurringSupported: true, instantSettlement: false, trustScore: 9, popularity: 7, enabled: false },
  payme: { id: 'payme', name: 'PayMe', displayName: 'PayMe', description: 'Israel digital wallet', type: 'wallet', currencies: ['ILS'], countries: ['IL'], regions: ['ME'], fees: { percentage: 2.5, currency: 'ILS' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 7, popularity: 8, enabled: false },
  grabpay: { id: 'grabpay', name: 'GrabPay', displayName: 'GrabPay', description: 'Southeast Asia super app payments', type: 'wallet', currencies: ['SGD', 'MYR', 'THB', 'PHP', 'VND', 'IDR'], countries: ['SG', 'MY', 'TH', 'PH', 'VN', 'ID'], regions: ['APAC'], fees: { percentage: 2.0, currency: 'USD' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 9, enabled: false },
  gcash: { id: 'gcash', name: 'GCash', displayName: 'GCash', description: 'Philippines\' leading e-wallet', type: 'wallet', currencies: ['PHP'], countries: ['PH'], regions: ['APAC'], fees: { percentage: 1.5, currency: 'PHP' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 8, popularity: 10, enabled: false },
  dana: { id: 'dana', name: 'DANA', displayName: 'DANA', description: 'Indonesia digital wallet', type: 'wallet', currencies: ['IDR'], countries: ['ID'], regions: ['APAC'], fees: { percentage: 1.8, currency: 'IDR' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 8, popularity: 9, enabled: false },
  truemoney: { id: 'truemoney', name: 'TrueMoney', displayName: 'TrueMoney Wallet', description: 'Thailand digital wallet', type: 'wallet', currencies: ['THB'], countries: ['TH'], regions: ['APAC'], fees: { percentage: 2.2, currency: 'THB' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 8, popularity: 8, enabled: false },
  fpx: { id: 'fpx', name: 'FPX', displayName: 'FPX Online Banking', description: 'Malaysia real-time online banking', type: 'bank', currencies: ['MYR'], countries: ['MY'], regions: ['APAC'], fees: { percentage: 1.5, currency: 'MYR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 9, enabled: false },
  duitnow: { id: 'duitnow', name: 'DuitNow', displayName: 'DuitNow QR', description: 'Malaysia instant payment', type: 'instant', currencies: ['MYR'], countries: ['MY'], regions: ['APAC'], fees: { percentage: 0, currency: 'MYR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: true, trustScore: 8, popularity: 8, enabled: false },
  promptpay: { id: 'promptpay', name: 'PromptPay', displayName: 'PromptPay', description: 'Thailand instant payment system', type: 'instant', currencies: ['THB'], countries: ['TH'], regions: ['APAC'], fees: { percentage: 0, currency: 'THB' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: true, trustScore: 9, popularity: 9, enabled: false },
  netbanking: { id: 'netbanking', name: 'Net Banking', displayName: 'Net Banking', description: 'Indian internet banking', type: 'bank', currencies: ['INR'], countries: ['IN'], regions: ['IN'], fees: { percentage: 1.5, currency: 'INR' }, processingTime: 'Instant', refundSupported: false, recurringSupported: false, instantSettlement: false, trustScore: 8, popularity: 8, enabled: true },
  paytm: { id: 'paytm', name: 'Paytm', displayName: 'Paytm Wallet', description: 'India\'s popular digital wallet', type: 'wallet', currencies: ['INR'], countries: ['IN'], regions: ['IN'], fees: { percentage: 2.0, currency: 'INR' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 8, popularity: 9, enabled: true },
  phonepe: { id: 'phonepe', name: 'PhonePe', displayName: 'PhonePe', description: 'Fast UPI payments in India', type: 'wallet', currencies: ['INR'], countries: ['IN'], regions: ['IN'], fees: { percentage: 0, currency: 'INR' }, processingTime: 'Instant', refundSupported: true, recurringSupported: false, instantSettlement: true, trustScore: 9, popularity: 9, enabled: true }
};

// Get available payment methods for a region/country/currency
export function getAvailablePaymentMethods(options: {
  country?: string;
  region?: string;
  currency?: string;
  locale?: Locale;
  amount?: number;
}): PaymentMethod[] {
  const { country, region, currency, amount } = options;

  return Object.values(paymentMethods)
    .filter(method => {
      // Check if method is enabled
      if (!method.enabled) return false;

      // Check country
      if (country && !method.countries.includes(country)) return false;

      // Check region
      if (region && !method.regions.includes(region)) return false;

      // Check currency
      if (currency && !method.currencies.includes(currency)) return false;

      // Check amount limits
      if (amount) {
        if (method.minAmount && amount < method.minAmount) return false;
        if (method.maxAmount && amount > method.maxAmount) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by popularity (higher first), then trust score
      if (a.popularity !== b.popularity) {
        return b.popularity - a.popularity;
      }
      return b.trustScore - a.trustScore;
    });
}

// Get recommended payment methods for a locale
export function getRecommendedPaymentMethods(
  locale: Locale,
  currency: string,
  amount?: number
): PaymentMethod[] {
  // Map locale to country codes for better recommendations
  const localeToCountryMap: Record<Locale, string[]> = {
    'en': ['US', 'GB', 'CA', 'AU'],
    'es': ['ES', 'MX', 'AR', 'CO'],
    'fr': ['FR', 'BE', 'CH', 'CA'],
    'de': ['DE', 'AT', 'CH'],
    'it': ['IT', 'CH'],
    'pt': ['PT', 'BR'],
    'ja': ['JP'],
    'ko': ['KR'],
    'zh': ['CN', 'HK', 'TW', 'SG'],
    'ar': ['SA', 'AE', 'EG'],
    'hi': ['IN'],
    'ru': ['RU']
  };

  const countries = localeToCountryMap[locale] || ['US'];
  const primaryCountry = countries[0];

  return getAvailablePaymentMethods({
    country: primaryCountry,
    currency,
    locale,
    amount
  });
}

// Calculate payment fees
export function calculatePaymentFee(
  method: PaymentMethod,
  amount: number,
  currency: string
): {
  percentage: number;
  fixed: number;
  total: number;
  totalWithFee: number;
} {
  const percentageFee = (amount * method.fees.percentage) / 100;
  const fixedFee = method.fees.fixed || 0;
  const totalFee = percentageFee + fixedFee;

  return {
    percentage: percentageFee,
    fixed: fixedFee,
    total: totalFee,
    totalWithFee: amount + totalFee
  };
}

// Get payment method by ID
export function getPaymentMethod(id: PaymentProcessor): PaymentMethod | undefined {
  return paymentMethods[id];
}

// Check if payment method is available for specific requirements
export function isPaymentMethodAvailable(
  methodId: PaymentProcessor,
  requirements: {
    country?: string;
    currency?: string;
    amount?: number;
    recurring?: boolean;
    refunds?: boolean;
  }
): boolean {
  const method = paymentMethods[methodId];
  
  if (!method || !method.enabled) return false;

  const { country, currency, amount, recurring, refunds } = requirements;

  if (country && !method.countries.includes(country)) return false;
  if (currency && !method.currencies.includes(currency)) return false;
  if (amount && method.minAmount && amount < method.minAmount) return false;
  if (amount && method.maxAmount && amount > method.maxAmount) return false;
  if (recurring && !method.recurringSupported) return false;
  if (refunds && !method.refundSupported) return false;

  return true;
}

// Get payment methods grouped by type
export function getPaymentMethodsByType(
  availableMethods: PaymentMethod[]
): Record<PaymentMethod['type'], PaymentMethod[]> {
  const grouped: Record<PaymentMethod['type'], PaymentMethod[]> = {
    card: [],
    wallet: [],
    bank: [],
    bnpl: [],
    crypto: [],
    instant: []
  };

  availableMethods.forEach(method => {
    grouped[method.type].push(method);
  });

  return grouped;
}