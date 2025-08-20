/**
 * PayTM Integration (Placeholder)
 * Note: PayTM is primarily for Indian market and has been largely replaced by other solutions
 */

export interface PaytmConfig {
  merchantId: string;
  merchantKey: string;
  website: string;
  industryType: string;
  channelId: string;
  environment: 'staging' | 'production';
}

export interface PaytmOrderRequest {
  orderId: string;
  customerId: string;
  amount: string;
  email?: string;
  mobile?: string;
}

export interface PaytmOrderResponse {
  orderId: string;
  txnToken: string;
  amount: string;
  checksum: string;
}

/**
 * PayTM Service Class
 * Note: This is a placeholder implementation
 * PayTM has complex integration requirements and is being phased out
 */
export class PaytmService {
  private config: PaytmConfig;

  constructor(config: PaytmConfig) {
    this.config = config;
  }

  /**
   * Create PayTM order
   * Note: Simplified implementation for compatibility
   */
  async createOrder(request: PaytmOrderRequest): Promise<PaytmOrderResponse> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Generate checksum using PayTM's checksum utility
    // 2. Call PayTM's initiate transaction API
    // 3. Return the transaction token and order details

    console.warn('PayTM integration is deprecated. Consider using Razorpay or Stripe instead.');

    return {
      orderId: request.orderId,
      txnToken: 'dummy_token_' + Date.now(),
      amount: request.amount,
      checksum: 'dummy_checksum'
    };
  }

  /**
   * Verify PayTM transaction
   */
  async verifyTransaction(orderId: string, txnId: string): Promise<boolean> {
    // Placeholder implementation
    console.warn('PayTM transaction verification not implemented');
    return false;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(orderId: string): Promise<any> {
    // Placeholder implementation
    console.warn('PayTM transaction status check not implemented');
    return { status: 'unknown' };
  }
}

// Export a default instance with dummy config
export const paytmService = new PaytmService({
  merchantId: process.env.PAYTM_MERCHANT_ID || 'DUMMY_MERCHANT_ID',
  merchantKey: process.env.PAYTM_MERCHANT_KEY || 'DUMMY_MERCHANT_KEY',
  website: 'WEBSTAGING',
  industryType: 'Retail',
  channelId: 'WEB',
  environment: 'staging'
});

/**
 * PayTM constants
 */
export const PAYTM_CONSTANTS = {
  STAGING_URL: 'https://securegw-stage.paytm.in',
  PRODUCTION_URL: 'https://securegw.paytm.in',
  TRANSACTION_URL: '/theia/processTransaction',
  STATUS_QUERY_URL: '/merchant-status/getTxnStatus',
  REFUND_URL: '/refund/apply'
};

/**
 * Generate PayTM form data (for frontend)
 */
export function generatePaytmFormData(orderResponse: PaytmOrderResponse): Record<string, string> {
  return {
    MID: process.env.PAYTM_MERCHANT_ID || 'DUMMY_MERCHANT_ID',
    ORDER_ID: orderResponse.orderId,
    TXN_AMOUNT: orderResponse.amount,
    CUST_ID: 'CUSTOMER_ID',
    INDUSTRY_TYPE_ID: 'Retail',
    WEBSITE: 'WEBSTAGING',
    CHANNEL_ID: 'WEB',
    CHECKSUMHASH: orderResponse.checksum,
    txnToken: orderResponse.txnToken,
    CALLBACK_URL: `${process.env.NEXT_PUBLIC_APP_URL}/api/paytm/callback`
  };
}