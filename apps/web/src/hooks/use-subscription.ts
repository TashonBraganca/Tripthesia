import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SUBSCRIPTION_TIERS, SubscriptionTier, getTierLimits, getTierFeatures } from '@/lib/razorpay';

// Razorpay checkout function
function openRazorpayCheckout(data: any) {
  const { order, userDetails, tier } = data;
  
  // Ensure Razorpay SDK is loaded
  if (typeof window === 'undefined' || !window.Razorpay) {
    alert('Payment gateway is not available. Please refresh the page and try again.');
    return;
  }
  
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'Tripthesia',
    description: `${tier.name} Subscription - Unlimited AI Trip Planning`,
    order_id: order.id,
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
    },
    theme: {
      color: '#10b981'
    },
    handler: function (response: any) {
      // Payment successful, verify on backend
      fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          subscription_id: data.subscription?.id,
        }),
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          // Refresh the page to show updated subscription status
          window.location.reload();
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      })
      .catch(error => {
        console.error('Payment verification error:', error);
        alert('Payment verification failed. Please contact support.');
      });
    },
    modal: {
      ondismiss: function() {
        console.log('Payment modal closed');
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

interface UserSubscription {
  tier: SubscriptionTier;
  status?: string;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: Date;
}

interface UsageData {
  tripsThisMonth: number;
  tripsLimit: number;
  activitiesPerDay: number;
  daysPerTrip: number;
}

export function useSubscription() {
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  // Fetch subscription data
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<UserSubscription> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      return response.json();
    },
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch usage data
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage', user?.id],
    queryFn: async (): Promise<UsageData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      return response.json();
    },
    enabled: isLoaded && !!user && !!subscription,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create checkout session
  const createCheckoutMutation = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const response = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Open Razorpay checkout modal
      if (data.order && typeof window !== 'undefined') {
        openRazorpayCheckout(data);
      }
    },
  });

  // Create billing portal session (for Razorpay)
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/razorpay/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      });

      if (!response.ok) {
        throw new Error('Failed to access billing portal');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // For now, redirect to account page with subscription details
      if (typeof window !== 'undefined') {
        window.location.href = '/account?tab=subscription';
      }
    },
  });

  // Helper functions
  const tier = subscription?.tier || 'free';
  const limits = getTierLimits(tier);
  const features = getTierFeatures(tier);
  const isPro = tier === 'pro';
  const isFree = tier === 'free';

  // Usage checks
  const canCreateTrip = () => {
    if (isPro) return true;
    if (!usage) return true; // Assume allowed if usage data not loaded
    return usage.tripsThisMonth < limits.tripsPerMonth;
  };

  const getTripsRemaining = () => {
    if (isPro) return -1; // unlimited
    if (!usage) return limits.tripsPerMonth;
    return Math.max(0, limits.tripsPerMonth - usage.tripsThisMonth);
  };

  const getUsagePercentage = () => {
    if (isPro) return 0;
    if (!usage) return 0;
    return (usage.tripsThisMonth / limits.tripsPerMonth) * 100;
  };

  // Subscription actions
  const upgrade = (targetTier: SubscriptionTier = 'pro') => {
    createCheckoutMutation.mutate(targetTier);
  };

  const manageBilling = () => {
    createPortalMutation.mutate();
  };

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['usage', user?.id] });
  };

  return {
    // Data
    subscription,
    usage,
    tier,
    limits,
    features,
    
    // Status
    isLoading: isLoading || !isLoaded,
    usageLoading,
    error,
    isPro,
    isFree,
    
    // Usage checks
    canCreateTrip: canCreateTrip(),
    tripsRemaining: getTripsRemaining(),
    usagePercentage: getUsagePercentage(),
    
    // Actions
    upgrade,
    manageBilling,
    refreshSubscription,
    
    // Mutation states
    isUpgrading: createCheckoutMutation.isPending,
    isManagingBilling: createPortalMutation.isPending,
    upgradeError: createCheckoutMutation.error,
    billingError: createPortalMutation.error,
  };
}

// Helper hook for subscription-gated features
export function useFeatureAccess(feature: string) {
  const { tier, isPro } = useSubscription();
  
  const hasAccess = (requiredTier: SubscriptionTier = 'pro') => {
    if (requiredTier === 'free') return true;
    return isPro;
  };

  const getAccessMessage = (requiredTier: SubscriptionTier = 'pro') => {
    if (hasAccess(requiredTier)) return null;
    
    return {
      title: 'Upgrade Required',
      message: `This feature requires a ${requiredTier} subscription.`,
      action: 'Upgrade Now',
    };
  };

  return {
    hasAccess: hasAccess(),
    requiresPro: hasAccess('pro'),
    getAccessMessage,
  };
}

// Hook for tracking subscription events
export function useSubscriptionTracking() {
  const { user } = useUser();
  
  const trackUpgradeIntent = (tier: SubscriptionTier) => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('upgrade_intent', {
        tier,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const trackBillingAccess = () => {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('billing_portal_accessed', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return {
    trackUpgradeIntent,
    trackBillingAccess,
  };
}