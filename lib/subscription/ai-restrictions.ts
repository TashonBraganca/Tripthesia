import { auth } from '@clerk/nextjs/server';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from './config';

// AI Feature access control
export interface AIFeatureAccess {
  canUseAIGenerator: boolean;
  canUseBudgetOptimizer: boolean;
  canUsePersonalizedSuggestions: boolean;
  canUseLocalInsights: boolean;
  canUseAdvancedAI: boolean;
  maxAIGenerationsPerTrip: number;
  maxConcurrentAIRequests: number;
  aiModel: 'gpt-4o-mini' | 'gpt-4' | 'basic';
  responseTimeLimit: number; // seconds
}

export interface UserSubscriptionInfo {
  tier: SubscriptionTier;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'trialing';
  currentUsage: {
    tripsThisMonth: number;
    aiGenerationsThisMonth: number;
    aiGenerationsToday: number;
  };
  limits: typeof SUBSCRIPTION_TIERS.free.limits;
  aiAccess: AIFeatureAccess;
}

// Define AI access per tier
const AI_TIER_ACCESS: Record<SubscriptionTier, AIFeatureAccess> = {
  free: {
    canUseAIGenerator: true,
    canUseBudgetOptimizer: false, // Premium feature
    canUsePersonalizedSuggestions: true,
    canUseLocalInsights: false, // Premium feature
    canUseAdvancedAI: false,
    maxAIGenerationsPerTrip: 1,
    maxConcurrentAIRequests: 1,
    aiModel: 'gpt-4o-mini',
    responseTimeLimit: 30,
  },
  starter: {
    canUseAIGenerator: true,
    canUseBudgetOptimizer: true,
    canUsePersonalizedSuggestions: true,
    canUseLocalInsights: true,
    canUseAdvancedAI: false,
    maxAIGenerationsPerTrip: 3,
    maxConcurrentAIRequests: 2,
    aiModel: 'gpt-4o-mini',
    responseTimeLimit: 45,
  },
  pro: {
    canUseAIGenerator: true,
    canUseBudgetOptimizer: true,
    canUsePersonalizedSuggestions: true,
    canUseLocalInsights: true,
    canUseAdvancedAI: true,
    maxAIGenerationsPerTrip: 5,
    maxConcurrentAIRequests: 3,
    aiModel: 'gpt-4',
    responseTimeLimit: 60,
  },
};

export function getAIAccess(tier: SubscriptionTier): AIFeatureAccess {
  return AI_TIER_ACCESS[tier];
}

// Check if user can access specific AI feature
export function canAccessAIFeature(
  tier: SubscriptionTier,
  feature: keyof AIFeatureAccess,
  subscriptionStatus: string = 'active'
): boolean {
  if (tier !== 'free' && subscriptionStatus !== 'active') {
    return false; // Paid features require active subscription
  }
  
  const access = AI_TIER_ACCESS[tier];
  return Boolean(access[feature]);
}

// AI usage tracking and limiting
export interface AIUsageTracker {
  userId: string;
  aiGenerationsToday: number;
  aiGenerationsThisMonth: number;
  currentAIRequests: number;
  lastResetDate: string;
}

// Mock database functions (would be replaced with actual DB calls)
async function getAIUsage(userId: string): Promise<AIUsageTracker> {
  // This would fetch from database
  return {
    userId,
    aiGenerationsToday: 0,
    aiGenerationsThisMonth: 0,
    currentAIRequests: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  };
}

async function updateAIUsage(usage: AIUsageTracker): Promise<void> {
  // This would update database
  console.log('Updating AI usage:', usage);
}

export async function checkAIRateLimit(
  userId: string,
  tier: SubscriptionTier,
  feature: keyof AIFeatureAccess
): Promise<{ allowed: boolean; reason?: string; remainingUsage?: number }> {
  const access = getAIAccess(tier);
  const usage = await getAIUsage(userId);
  
  // Check if feature is available for tier
  if (!access[feature]) {
    return {
      allowed: false,
      reason: `${feature} requires ${tier === 'free' ? 'Starter' : 'Pro'} subscription`,
    };
  }
  
  // Check concurrent requests
  if (usage.currentAIRequests >= access.maxConcurrentAIRequests) {
    return {
      allowed: false,
      reason: `Maximum concurrent AI requests (${access.maxConcurrentAIRequests}) reached. Please wait.`,
    };
  }
  
  // Check daily limits
  const dailyLimit = tier === 'free' ? 5 : tier === 'starter' ? 20 : 100;
  if (usage.aiGenerationsToday >= dailyLimit) {
    return {
      allowed: false,
      reason: `Daily AI generation limit (${dailyLimit}) reached. Upgrade for more usage.`,
      remainingUsage: 0,
    };
  }
  
  return {
    allowed: true,
    remainingUsage: dailyLimit - usage.aiGenerationsToday,
  };
}

export async function trackAIUsage(userId: string, feature: string): Promise<void> {
  const usage = await getAIUsage(userId);
  
  // Reset daily counter if new day
  const today = new Date().toISOString().split('T')[0];
  if (usage.lastResetDate !== today) {
    usage.aiGenerationsToday = 0;
    usage.lastResetDate = today;
  }
  
  // Increment counters
  usage.aiGenerationsToday += 1;
  usage.aiGenerationsThisMonth += 1;
  usage.currentAIRequests += 1;
  
  await updateAIUsage(usage);
  
  // Decrement current requests after a delay (simulate request completion)
  setTimeout(async () => {
    usage.currentAIRequests = Math.max(0, usage.currentAIRequests - 1);
    await updateAIUsage(usage);
  }, 5000);
}

// Enhanced subscription middleware for AI features
export async function withAISubscriptionCheck(
  feature: keyof AIFeatureAccess,
  handler: (userInfo: UserSubscriptionInfo) => Promise<Response>
): Promise<Response> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock getting user subscription info (would be from database)
    const tier: SubscriptionTier = 'free'; // This would be fetched from user profile
    const subscriptionStatus = 'active';
    const usage = await getAIUsage(userId);
    
    const userInfo: UserSubscriptionInfo = {
      tier,
      subscriptionStatus: subscriptionStatus as any,
      currentUsage: {
        tripsThisMonth: 0, // Would be fetched from DB
        aiGenerationsThisMonth: usage.aiGenerationsThisMonth,
        aiGenerationsToday: usage.aiGenerationsToday,
      },
      limits: SUBSCRIPTION_TIERS[tier].limits,
      aiAccess: getAIAccess(tier),
    };

    // Check rate limits
    const rateCheck = await checkAIRateLimit(userId, tier, feature);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: rateCheck.reason,
          code: 'AI_LIMIT_EXCEEDED',
          upgradeRequired: tier === 'free',
          remainingUsage: rateCheck.remainingUsage,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Track usage
    await trackAIUsage(userId, feature);
    
    return await handler(userInfo);

  } catch (error) {
    console.error('AI subscription check error:', error);
    return new Response(
      JSON.stringify({ error: 'Subscription validation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Subscription upgrade prompts
export function getUpgradeMessage(
  currentTier: SubscriptionTier,
  requiredFeature: string
): {
  title: string;
  message: string;
  suggestedTier: SubscriptionTier;
  benefits: string[];
} {
  if (currentTier === 'free') {
    return {
      title: 'Upgrade to Starter',
      message: `${requiredFeature} requires a Starter subscription for advanced AI features.`,
      suggestedTier: 'starter',
      benefits: [
        '10 trips per month',
        'Advanced AI planning',
        'Budget optimization',
        'Local insights',
        'Real-time pricing',
        'Priority support',
      ],
    };
  } else if (currentTier === 'starter') {
    return {
      title: 'Upgrade to Pro',
      message: `${requiredFeature} requires Pro subscription for premium AI capabilities.`,
      suggestedTier: 'pro',
      benefits: [
        '30 trips per month',
        'Premium AI with GPT-4',
        'Advanced analytics',
        'API access',
        'Collaborative planning',
        'VIP support',
      ],
    };
  }
  
  return {
    title: 'Feature Available',
    message: 'This feature is included in your current subscription.',
    suggestedTier: currentTier,
    benefits: [],
  };
}

// Helper to check if user needs upgrade for feature
export function needsUpgradeForFeature(
  currentTier: SubscriptionTier,
  feature: keyof AIFeatureAccess
): boolean {
  const access = getAIAccess(currentTier);
  return !access[feature];
}

// Export feature availability check
export function getFeatureAvailability(tier: SubscriptionTier) {
  const access = getAIAccess(tier);
  const limits = SUBSCRIPTION_TIERS[tier].limits;
  
  return {
    tier,
    aiFeatures: {
      tripGeneration: {
        available: access.canUseAIGenerator,
        limit: access.maxAIGenerationsPerTrip,
        model: access.aiModel,
      },
      budgetOptimization: {
        available: access.canUseBudgetOptimizer,
        upgradeRequired: !access.canUseBudgetOptimizer,
      },
      personalizedSuggestions: {
        available: access.canUsePersonalizedSuggestions,
        maxConcurrent: access.maxConcurrentAIRequests,
      },
      localInsights: {
        available: access.canUseLocalInsights,
        upgradeRequired: !access.canUseLocalInsights,
      },
      advancedAI: {
        available: access.canUseAdvancedAI,
        description: 'GPT-4 powered responses with enhanced reasoning',
      },
    },
    generalLimits: limits,
    responseTime: access.responseTimeLimit,
  };
}