const PaytmChecksum = require('paytmchecksum');

if (!process.env.PAYTM_MERCHANT_ID || !process.env.PAYTM_MERCHANT_KEY) {
  throw new Error('PAYTM_MERCHANT_ID and PAYTM_MERCHANT_KEY are required');
}

// Subscription tiers configuration (FREE UPI with Paytm!)
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '3 trips per month',
      'Basic itinerary generation',
      'Standard support', 
      'Export to PDF/ICS',
      'UPI payments (100% FREE!)',
    ],
    limits: {
      tripsPerMonth: 3,
      activitiesPerDay: 5,
      daysPerTrip: 7,
    },
  },
  pro: {
    name: 'Pro',
    price: 59900, // ₹599 in paise
    features: [
      'Unlimited trips',
      'Advanced AI planning',
      'Real-time pricing',
      'Priority support',
      'Advanced customization',
      'Collaborative planning',
      'All payment methods (UPI FREE!)',
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

// Paytm configuration
export const PAYTM_CONFIG = {
  MID: process.env.PAYTM_MERCHANT_ID!,
  WEBSITE: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
  INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
  CALLBACK_URL: `${process.env.NEXT_PUBLIC_APP_URL}/api/paytm/callback`,
  // Staging URL for testing
  PAYMENT_URL: 'https://securegw-stage.paytm.in/theia/processTransaction',
  // Production URL (use when going live)
  // PAYMENT_URL: 'https://securegw.paytm.in/theia/processTransaction',
};

// Create Paytm transaction
export async function createPaytmTransaction(
  userId: string,
  userEmail: string,
  userPhone: string,
  amount: number,
  orderId: string
) {
  const paytmParams = {
    MID: PAYTM_CONFIG.MID,
    WEBSITE: PAYTM_CONFIG.WEBSITE,
    INDUSTRY_TYPE_ID: PAYTM_CONFIG.INDUSTRY_TYPE_ID,
    ORDER_ID: orderId,
    CUST_ID: userId,
    TXN_AMOUNT: (amount / 100).toString(), // Convert paise to rupees
    CALLBACK_URL: PAYTM_CONFIG.CALLBACK_URL,
    EMAIL: userEmail,
    MOBILE_NO: userPhone,
  };

  try {
    const checksum = await PaytmChecksum.generateSignature(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY!
    );

    return {
      ...paytmParams,
      CHECKSUMHASH: checksum,
      PAYMENT_URL: PAYTM_CONFIG.PAYMENT_URL,
    };
  } catch (error) {
    console.error('Error generating Paytm checksum:', error);
    throw new Error('Failed to create Paytm transaction');
  }
}

// Verify Paytm response
export async function verifyPaytmResponse(paytmParams: any): Promise<boolean> {
  try {
    const isValidChecksum = PaytmChecksum.verifySignature(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY!,
      paytmParams.CHECKSUMHASH
    );

    return isValidChecksum;
  } catch (error) {
    console.error('Error verifying Paytm checksum:', error);
    return false;
  }
}

// Check transaction status with Paytm
export async function checkPaytmTransactionStatus(orderId: string) {
  const paytmParams = {
    MID: PAYTM_CONFIG.MID,
    ORDERID: orderId,
  };

  try {
    const checksum = await PaytmChecksum.generateSignature(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY!
    );

    const requestData = {
      ...paytmParams,
      CHECKSUMHASH: checksum,
    };

    // Use staging URL for testing
    const statusUrl = 'https://securegw-stage.paytm.in/merchant-status/getTxnStatus';
    
    const response = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking Paytm transaction status:', error);
    throw error;
  }
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

// Generate unique order ID
export function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORDER_${userId.slice(-8)}_${timestamp}_${random}`;
}

// Paytm payment methods
export const PAYTM_PAYMENT_METHODS = {
  UPI: 'UPI (100% FREE)',
  CC: 'Credit Card',
  DC: 'Debit Card',
  NB: 'Net Banking',
  PPI: 'Paytm Wallet',
  EMI: 'EMI',
};

// Get payment method display name
export function getPaymentMethodName(method: string): string {
  return PAYTM_PAYMENT_METHODS[method as keyof typeof PAYTM_PAYMENT_METHODS] || method;
}

// Paytm transaction statuses
export const PAYTM_STATUS = {
  SUCCESS: 'TXN_SUCCESS',
  FAILURE: 'TXN_FAILURE', 
  PENDING: 'PENDING',
} as const;

// Check if transaction was successful
export function isPaymentSuccessful(status: string): boolean {
  return status === PAYTM_STATUS.SUCCESS;
}

// Paytm test credentials and cards
export const PAYTM_TEST_DATA = {
  // Test credit cards (for staging environment)
  TEST_CARDS: {
    VISA: '4111111111111111',
    MASTERCARD: '5555555555554444',
    MAESTRO: '6759649826438453',
  },
  
  // Test UPI IDs
  TEST_UPI: {
    SUCCESS: 'paytmqr281370050@paytm',
    FAILURE: 'failure@paytm',
  },
  
  // Test amounts for different scenarios
  TEST_AMOUNTS: {
    SUCCESS: 100, // ₹1.00
    FAILURE: 101, // ₹1.01  
    PENDING: 102, // ₹1.02
  },
};

// Error handling
export class PaytmError extends Error {
  constructor(
    message: string,
    public code: string,
    public orderId?: string
  ) {
    super(message);
    this.name = 'PaytmError';
  }
}

// Validate Paytm configuration
export function validatePaytmConfig(): boolean {
  const required = [
    'PAYTM_MERCHANT_ID',
    'PAYTM_MERCHANT_KEY', 
    'PAYTM_WEBSITE',
    'PAYTM_INDUSTRY_TYPE',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required environment variable: ${key}`);
      return false;
    }
  }

  return true;
}