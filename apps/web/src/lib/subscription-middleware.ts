/**
 * Subscription Middleware for API Route Protection
 * Enforces subscription limits and validates user access
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { trackError, trackEvent } from './monitoring'

// Subscription tier schema
const SubscriptionTierSchema = z.enum(['free', 'pro', 'enterprise'])
type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>

// Subscription limits per tier
const SUBSCRIPTION_LIMITS = {
  free: {
    trips_per_month: 2,
    ai_requests_per_day: 10,
    export_per_month: 5,
    api_calls_per_day: 100,
  },
  pro: {
    trips_per_month: 10,
    ai_requests_per_day: 100,
    export_per_month: 50,
    api_calls_per_day: 1000,
  },
  enterprise: {
    trips_per_month: -1, // unlimited
    ai_requests_per_day: -1, // unlimited
    export_per_month: -1, // unlimited
    api_calls_per_day: -1, // unlimited
  },
} as const

// Middleware options schema
const MiddlewareOptionsSchema = z.object({
  requireAuth: z.boolean().default(true),
  requireSubscription: z.boolean().default(false),
  minimumTier: SubscriptionTierSchema.optional(),
  rateLimitKey: z.string().optional(),
  trackUsage: z.boolean().default(true),
})

type MiddlewareOptions = z.infer<typeof MiddlewareOptionsSchema>

/**
 * User subscription status (mock implementation)
 * In production, this would query the database
 */
async function getUserSubscriptionStatus(userId: string): Promise<{
  tier: SubscriptionTier
  active: boolean
  expiresAt?: Date
  usage: {
    trips_this_month: number
    ai_requests_today: number
    exports_this_month: number
    api_calls_today: number
  }
}> {
  // Mock implementation - replace with actual database query
  return {
    tier: 'free',
    active: true,
    usage: {
      trips_this_month: 1,
      ai_requests_today: 5,
      exports_this_month: 2,
      api_calls_today: 25,
    },
  }
}

/**
 * Check if user has exceeded their subscription limits
 */
function hasExceededLimits(
  tier: SubscriptionTier,
  usage: any,
  limitType: keyof typeof SUBSCRIPTION_LIMITS.free
): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier]
  const limit = limits[limitType]
  
  // -1 means unlimited
  if (limit === -1) return false
  
  const currentUsage = usage[limitType] || 0
  return currentUsage >= limit
}

/**
 * Subscription middleware factory
 */
export function withSubscription(options: MiddlewareOptions = {}) {
  const validatedOptions = MiddlewareOptionsSchema.parse(options)

  return function subscriptionMiddleware(
    handler: (req: NextRequest, context: { userId: string; subscription: any }) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Check authentication if required
        if (validatedOptions.requireAuth) {
          const { userId } = auth()
          
          if (!userId) {
            trackEvent('api_auth_failed', {
              endpoint: req.nextUrl.pathname,
              reason: 'no_user_id',
            })
            
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }

          // Get user details
          const user = await currentUser()
          if (!user) {
            trackEvent('api_auth_failed', {
              endpoint: req.nextUrl.pathname,
              reason: 'user_not_found',
            })
            
            return NextResponse.json(
              { error: 'User not found' },
              { status: 401 }
            )
          }

          // Get subscription status
          const subscription = await getUserSubscriptionStatus(userId)

          // Check if subscription is required and active
          if (validatedOptions.requireSubscription && !subscription.active) {
            trackEvent('api_subscription_required', {
              endpoint: req.nextUrl.pathname,
              user_id: userId,
              tier: subscription.tier,
            })
            
            return NextResponse.json(
              { 
                error: 'Active subscription required',
                subscription_status: subscription 
              },
              { status: 402 }
            )
          }

          // Check minimum tier requirement
          if (validatedOptions.minimumTier) {
            const tierOrder = { free: 0, pro: 1, enterprise: 2 }
            const userTierLevel = tierOrder[subscription.tier]
            const requiredTierLevel = tierOrder[validatedOptions.minimumTier]
            
            if (userTierLevel < requiredTierLevel) {
              trackEvent('api_tier_insufficient', {
                endpoint: req.nextUrl.pathname,
                user_id: userId,
                current_tier: subscription.tier,
                required_tier: validatedOptions.minimumTier,
              })
              
              return NextResponse.json(
                { 
                  error: `${validatedOptions.minimumTier} subscription required`,
                  current_tier: subscription.tier,
                  required_tier: validatedOptions.minimumTier 
                },
                { status: 403 }
              )
            }
          }

          // Check rate limits based on subscription tier
          if (validatedOptions.rateLimitKey) {
            const limitType = validatedOptions.rateLimitKey as keyof typeof SUBSCRIPTION_LIMITS.free
            
            if (hasExceededLimits(subscription.tier, subscription.usage, limitType)) {
              trackEvent('api_rate_limit_exceeded', {
                endpoint: req.nextUrl.pathname,
                user_id: userId,
                tier: subscription.tier,
                limit_type: limitType,
                current_usage: subscription.usage[limitType],
                limit: SUBSCRIPTION_LIMITS[subscription.tier][limitType],
              })
              
              return NextResponse.json(
                { 
                  error: 'Rate limit exceeded',
                  limit_type: limitType,
                  current_usage: subscription.usage[limitType],
                  limit: SUBSCRIPTION_LIMITS[subscription.tier][limitType],
                  tier: subscription.tier 
                },
                { status: 429 }
              )
            }
          }

          // Track successful API access
          if (validatedOptions.trackUsage) {
            trackEvent('api_access_granted', {
              endpoint: req.nextUrl.pathname,
              user_id: userId,
              tier: subscription.tier,
              method: req.method,
            })
          }

          // Call the actual handler with context
          return await handler(req, { userId, subscription })

        } else {
          // No auth required, call handler without context
          return await handler(req, { userId: '', subscription: null })
        }

      } catch (error) {
        trackError(error instanceof Error ? error : new Error(String(error)), {
          endpoint: req.nextUrl.pathname,
          middleware: 'subscription',
        })

        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * Convenience middleware functions for common use cases
 */
export const withAuth = withSubscription({ requireAuth: true })

export const withProSubscription = withSubscription({
  requireAuth: true,
  requireSubscription: true,
  minimumTier: 'pro',
})

export const withProAccess = withProSubscription

export const withEnterpriseSubscription = withSubscription({
  requireAuth: true,
  requireSubscription: true,
  minimumTier: 'enterprise',
})

export const withRateLimit = (limitType: string) => withSubscription({
  requireAuth: true,
  rateLimitKey: limitType,
})

/**
 * Utility functions for subscription management
 */
export const subscriptionUtils = {
  /**
   * Get user's remaining quota for a specific limit type
   */
  async getRemainingQuota(userId: string, limitType: keyof typeof SUBSCRIPTION_LIMITS.free) {
    const subscription = await getUserSubscriptionStatus(userId)
    const limits = SUBSCRIPTION_LIMITS[subscription.tier]
    const limit = limits[limitType]
    
    if (limit === -1) return -1 // unlimited
    
    const currentUsage = subscription.usage[limitType] || 0
    return Math.max(0, limit - currentUsage)
  },

  /**
   * Check if user can perform an action
   */
  async canPerformAction(userId: string, actionType: keyof typeof SUBSCRIPTION_LIMITS.free): Promise<boolean> {
    const remaining = await this.getRemainingQuota(userId, actionType)
    return remaining !== 0
  },

  /**
   * Get subscription limits for a tier
   */
  getLimitsForTier(tier: SubscriptionTier) {
    return SUBSCRIPTION_LIMITS[tier]
  },

  /**
   * Format usage statistics for display
   */
  formatUsageStats(usage: any, tier: SubscriptionTier) {
    const limits = SUBSCRIPTION_LIMITS[tier]
    
    return Object.entries(limits).reduce((formatted, [key, limit]) => {
      const current = usage[key] || 0
      formatted[key] = {
        current,
        limit: limit === -1 ? 'unlimited' : limit,
        percentage: limit === -1 ? 0 : Math.round((current / limit) * 100),
        remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - current),
      }
      return formatted
    }, {} as Record<string, any>)
  },
}

// Export types and constants
export type { SubscriptionTier, MiddlewareOptions }
export { SUBSCRIPTION_LIMITS, SubscriptionTierSchema }