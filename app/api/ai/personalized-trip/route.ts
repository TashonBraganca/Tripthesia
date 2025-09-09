/**
 * Phase 4.3.4: Personalized Trip Generation API
 * 
 * Advanced API endpoint that provides highly personalized trip generation
 * using user preferences, behavioral analytics, and recommendation engine insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withAISubscriptionCheck } from '@/lib/subscription/ai-restrictions';
import { 
  PersonalizedTripGenerator, 
  PersonalizedTripRequestSchema, 
  PersonalizedTripRequest 
} from '@/lib/ai/personalized-trip-generator';
import { withDatabase } from '@/lib/db';
import { userPreferences, userInteractions } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';

// Rate limiting for personalized generation (more resource intensive)
const RATE_LIMITS = {
  free: { requests: 2, window: 24 * 60 * 60 * 1000 }, // 2 per day
  starter: { requests: 5, window: 24 * 60 * 60 * 1000 }, // 5 per day
  pro: { requests: 20, window: 24 * 60 * 60 * 1000 } // 20 per day
};

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Legacy compatibility schema for backward compatibility
const LegacyRequestSchema = z.object({
  destination: z.string().min(1),
  duration: z.number().min(1).max(30),
  budget: z.number().min(0),
  currency: z.enum(['USD', 'INR']).default('INR'),
  travelers: z.number().min(1).max(20).default(1),
  personalized: z.boolean().default(true),
  interests: z.array(z.string()).optional(),
  tripType: z.string().optional()
});

// Enhanced request schema
const EnhancedRequestSchema = PersonalizedTripRequestSchema.extend({
  // Additional options for API
  includeAlternatives: z.boolean().default(true),
  includeLearningData: z.boolean().default(false), // Don't include by default for privacy
  responseFormat: z.enum(['full', 'compact', 'legacy']).default('full')
});

// Initialize personalized trip generator
let tripGenerator: PersonalizedTripGenerator;
try {
  tripGenerator = new PersonalizedTripGenerator();
} catch (error) {
  console.error('Failed to initialize PersonalizedTripGenerator:', error);
}

/**
 * POST /api/ai/personalized-trip
 * Generate a highly personalized trip itinerary
 */
export async function POST(request: NextRequest) {
  return withAISubscriptionCheck('canUseAIGenerator', async (userInfo) => {
    try {
      // Get userId from auth
      const { userId } = auth();
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const startTime = Date.now();
      
      // Check if personalized trip generator is available
      if (!tripGenerator) {
        return NextResponse.json(
          { 
            error: 'Personalized trip generation service not available',
            code: 'SERVICE_UNAVAILABLE',
            fallback: '/api/ai/generate-trip'
          },
          { status: 503 }
        );
      }

      // Check rate limits
      const rateLimitCheck = checkRateLimit(userId, userInfo.tier);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            resetAt: rateLimitCheck.resetAt,
            maxRequests: rateLimitCheck.maxRequests,
            upgradeAvailable: userInfo.tier !== 'pro'
          },
          { status: 429 }
        );
      }

      // Parse and validate request body
      const body = await request.json();
      
      let parsedRequest: PersonalizedTripRequest;
      
      try {
        // Try enhanced schema first
        parsedRequest = EnhancedRequestSchema.parse(body);
      } catch (enhancedError) {
        try {
          // Fall back to legacy schema and convert
          const legacyRequest = LegacyRequestSchema.parse(body);
          parsedRequest = convertLegacyToPersonalized(legacyRequest, userId);
        } catch (legacyError) {
          return NextResponse.json(
            { 
              error: 'Invalid request format',
              code: 'INVALID_REQUEST',
              details: enhancedError instanceof z.ZodError ? 
                enhancedError.errors.map(e => ({
                  field: e.path.join('.'),
                  message: e.message
                })) : []
            },
            { status: 400 }
          );
        }
      }

      // Add session ID if not provided
      if (!parsedRequest.sessionId) {
        parsedRequest.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Log request for analytics
      console.log('Personalized Trip Generation Request:', {
        destination: parsedRequest.destination,
        duration: Math.ceil((new Date(parsedRequest.endDate).getTime() - new Date(parsedRequest.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        budget: parsedRequest.budget.total,
        personalizationLevel: parsedRequest.personalizationLevel,
        tier: userInfo.tier,
        userId: userId
      });

      // Generate personalized trip
      const result = await tripGenerator.generatePersonalizedTrip(parsedRequest);
      
      if (!result.success) {
        return NextResponse.json({
          error: result.error || 'Failed to generate personalized trip',
          code: 'GENERATION_FAILED',
          processingTime: result.processingTime,
          fallback: '/api/ai/generate-trip'
        }, { status: 500 });
      }

      // Increment rate limit counter
      incrementRateLimit(userId);

      // Prepare response based on format requested
      const responseData = formatResponse(
        result.data!,
        (body as any).responseFormat || 'full',
        userInfo,
        {
          processingTime: result.processingTime,
          remainingRequests: rateLimitCheck.maxRequests - rateLimitCheck.currentCount - 1
        }
      );

      // Track successful generation
      await trackPersonalizedGeneration(parsedRequest, result.data!, userInfo, userId);

      return NextResponse.json(responseData);

    } catch (error) {
      console.error('Personalized trip generation error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate personalized trip itinerary',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/ai/personalized-trip
 * Get service status and user's personalization capabilities
 */
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const status = {
      available: !!tripGenerator,
      version: '4.3.4',
      service: 'PersonalizedTripGenerator',
      features: [
        'user-preference-integration',
        'behavioral-analytics',
        'recommendation-engine',
        'multiple-personalization-levels',
        'alternative-generation',
        'learning-feedback-loop'
      ],
      capabilities: {
        maxDays: 30,
        supportedCurrencies: ['USD', 'INR'],
        personalizationLevels: ['basic', 'moderate', 'advanced'],
        personalizationSources: [
          'user-preferences',
          'behavioral-analytics', 
          'preference-inference',
          'recommendation-engine'
        ]
      },
      requirements: {
        userPreferences: 'optional-but-recommended',
        behavioralData: 'automatically-collected',
        minimumInteractions: 0
      }
    };

    // Add user-specific info if available
    try {
      const userStats = await getUserPersonalizationStats(userId);
      return NextResponse.json({
        ...status,
        userStats
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return NextResponse.json(status);
    }

  } catch (error) {
    console.error('Personalized trip service health check error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'Service check failed',
      version: '4.3.4'
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check rate limiting for personalized generation
 */
function checkRateLimit(userId: string, tier: string): {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  resetAt: number;
} {
  const limits = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = Date.now();
  
  const userKey = `${userId}_personalized`;
  let userData = requestCounts.get(userKey);
  
  if (!userData || userData.resetAt <= now) {
    // Reset or initialize counter
    userData = {
      count: 0,
      resetAt: now + limits.window
    };
    requestCounts.set(userKey, userData);
  }
  
  return {
    allowed: userData.count < limits.requests,
    currentCount: userData.count,
    maxRequests: limits.requests,
    resetAt: userData.resetAt
  };
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(userId: string): void {
  const userKey = `${userId}_personalized`;
  const userData = requestCounts.get(userKey);
  
  if (userData) {
    userData.count += 1;
    requestCounts.set(userKey, userData);
  }
}

/**
 * Convert legacy request to personalized request format
 */
function convertLegacyToPersonalized(
  legacy: z.infer<typeof LegacyRequestSchema>,
  userId: string
): PersonalizedTripRequest {
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + (legacy.duration - 1) * 24 * 60 * 60 * 1000);

  return {
    destination: legacy.destination,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    travelers: {
      adults: legacy.travelers,
      children: 0
    },
    budget: {
      total: legacy.budget,
      currency: legacy.currency
    },
    userId,
    sessionId: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    personalizationLevel: legacy.personalized ? 'moderate' : 'basic',
    includePreferences: legacy.personalized,
    includeBehavioralData: legacy.personalized,
    includeRecommendations: legacy.personalized,
    explicitPreferences: legacy.tripType || legacy.interests ? {
      tripType: legacy.tripType as any,
      interests: legacy.interests
    } : undefined
  };
}

/**
 * Format response based on requested format
 */
function formatResponse(data: any, format: string, userInfo: any, metadata: any) {
  const base = {
    success: true,
    data,
    metadata: {
      ...metadata,
      version: '4.3.4',
      tier: userInfo.tier,
      personalized: true,
      generatedAt: new Date().toISOString()
    }
  };

  switch (format) {
    case 'compact':
      return {
        ...base,
        data: {
          baseItinerary: data.baseItinerary,
          personalizationScore: data.personalizationData.personalizationScore,
          recommendationsCount: data.personalizationData.recommendationsApplied.length,
          alternatives: data.alternatives.map((alt: any) => ({
            title: alt.title,
            description: alt.description
          }))
        }
      };
      
    case 'legacy':
      // Convert to legacy format for backward compatibility
      return {
        ...data.baseItinerary,
        metadata: {
          ...base.metadata,
          personalizationData: {
            score: data.personalizationData.personalizationScore,
            sources: data.metadata.personalizationSources,
            adaptations: data.personalizationData.adaptationsCount
          }
        }
      };
      
    default: // full
      return base;
  }
}

/**
 * Track successful personalized generation for analytics
 */
async function trackPersonalizedGeneration(
  request: PersonalizedTripRequest,
  result: any,
  userInfo: any,
  userId: string
): Promise<void> {
  try {
    // TODO: Implement when database schema is ready
    console.log('Tracking personalized generation:', {
      userId,
      destination: request.destination,
      personalizationScore: result.personalizationData.personalizationScore,
      tier: userInfo.tier
    });
  } catch (error) {
    console.error('Error tracking personalized generation:', error);
  }
}

/**
 * Get user's personalization statistics
 */
async function getUserPersonalizationStats(userId: string): Promise<any> {
  try {
    return await withDatabase(async (database) => {
      // Get preference count  
      const preferences = await database
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      // Get recent interactions
      const recentInteractions = await database
        .select()
        .from(userInteractions)
        .where(eq(userInteractions.userId, userId))
        .orderBy(desc(userInteractions.timestamp))
        .limit(10);

      // Get personalized generations count (using available enum values)
      const personalizedGenerations = recentInteractions.filter(
        i => i.targetType === 'destination' && i.contextData && (i.contextData as any).personalizationLevel
      ).length;

      return {
        preferencesCount: preferences.length,
        recentInteractionsCount: recentInteractions.length,
        personalizedGenerationsCount: personalizedGenerations,
        lastActivity: recentInteractions[0]?.timestamp,
        personalizationReadiness: calculatePersonalizationReadiness(
          preferences.length,
          recentInteractions.length
        )
      };
    });
  } catch (error) {
    console.error('Error fetching user personalization stats:', error);
    return {
      preferencesCount: 0,
      recentInteractionsCount: 0,
      personalizedGenerationsCount: 0,
      personalizationReadiness: 'basic'
    };
  }
}

/**
 * Calculate how ready the system is to personalize for this user
 */
function calculatePersonalizationReadiness(
  preferencesCount: number,
  interactionsCount: number
): 'basic' | 'moderate' | 'advanced' {
  if (preferencesCount >= 10 && interactionsCount >= 20) {
    return 'advanced';
  } else if (preferencesCount >= 5 && interactionsCount >= 10) {
    return 'moderate';
  }
  return 'basic';
}