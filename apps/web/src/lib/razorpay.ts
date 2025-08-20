/**
 * Razorpay Integration for Indian Market
 * Handles UPI, Net Banking, and local payment methods
 */

import { z } from 'zod';
import { trackEvent, trackError } from './monitoring';

// Razorpay order schema
const RazorpayOrderSchema = z.object({
  id: z.string(),
  entity: z.literal('order'),
  amount: z.number(),
  amount_paid: z.number(),
  amount_due: z.number(),
  currency: z.literal('INR'),
  receipt: z.string().optional(),
  status: z.enum(['created', 'attempted', 'paid']),
  created_at: z.number()
});

export type RazorpayOrder = z.infer<typeof RazorpayOrderSchema>;

// Payment verification schema
const PaymentVerificationSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string()
});

export type PaymentVerification = z.infer<typeof PaymentVerificationSchema>;

/**
 * Razorpay Service Class
 * Handles order creation and payment verification
 */
export class RazorpayService {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!this.keyId || !this.keySecret) {
      console.warn('Razorpay credentials not configured');
    }
  }

  /**
   * Create a new order
   */
  async createOrder(amount: number, currency: string = 'INR', receipt?: string): Promise<RazorpayOrder> {
    try {
      const response = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const order = await response.json();
      
      trackEvent('razorpay_order_created', {
        order_id: order.id,
        amount: amount,
        currency: currency
      });

      return RazorpayOrderSchema.parse(order);

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'razorpay',
        operation: 'create_order',
        amount,
        currency
      });
      throw error;
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(verification: PaymentVerification): Promise<boolean> {
    try {
      const response = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      trackEvent('razorpay_payment_verified', {
        order_id: verification.razorpay_order_id,
        payment_id: verification.razorpay_payment_id,
        success: result.verified
      });

      return result.verified;

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'razorpay',
        operation: 'verify_payment',
        order_id: verification.razorpay_order_id
      });
      return false;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<RazorpayOrder | null> {
    try {
      const response = await fetch(`/api/razorpay/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const order = await response.json();
      return RazorpayOrderSchema.parse(order);

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'razorpay',
        operation: 'get_order',
        order_id: orderId
      });
      return null;
    }
  }

  /**
   * Get Razorpay key for frontend
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Create subscription (for recurring payments)
   */
  async createSubscription(planId: string, customerId: string): Promise<any> {
    try {
      const response = await fetch('/api/razorpay/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          customer_id: customerId,
          total_count: 12, // 12 months
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const subscription = await response.json();
      
      trackEvent('razorpay_subscription_created', {
        subscription_id: subscription.id,
        plan_id: planId,
        customer_id: customerId
      });

      return subscription;

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'razorpay',
        operation: 'create_subscription',
        plan_id: planId
      });
      throw error;
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();

/**
 * Client-side Razorpay checkout
 */
export interface RazorpayOptions {
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: PaymentVerification) => void;
  modal?: {
    ondismiss: () => void;
  };
}

/**
 * Open Razorpay checkout modal
 */
export function openRazorpayCheckout(options: RazorpayOptions): void {
  if (typeof window === 'undefined') {
    console.error('Razorpay checkout can only be opened in browser');
    return;
  }

  // Load Razorpay script if not already loaded
  if (!(window as any).Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      openCheckoutModal(options);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      trackError(new Error('Razorpay script load failed'), {
        service: 'razorpay',
        operation: 'script_load'
      });
    };
    document.head.appendChild(script);
  } else {
    openCheckoutModal(options);
  }
}

function openCheckoutModal(options: RazorpayOptions): void {
  const rzp = new (window as any).Razorpay({
    key: razorpayService.getKeyId(),
    ...options,
    handler: (response: PaymentVerification) => {
      trackEvent('razorpay_payment_completed', {
        order_id: options.order_id,
        payment_id: response.razorpay_payment_id
      });
      options.handler(response);
    },
    modal: {
      ondismiss: () => {
        trackEvent('razorpay_checkout_dismissed', {
          order_id: options.order_id
        });
        options.modal?.ondismiss?.();
      }
    }
  });

  rzp.open();
}

/**
 * Format INR amount for display
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Convert amount to paise (smallest currency unit)
 */
export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert paise to rupees
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}