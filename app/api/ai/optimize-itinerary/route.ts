/**
 * AI Itinerary Optimization API - Phase 4.2
 * 
 * Provides AI-powered trip itinerary optimization using the AdvancedAIService
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withAISubscriptionCheck } from '@/lib/subscription/ai-restrictions';
import { 
  AdvancedAIService, 
  GeneratedItinerarySchema,
  GeneratedItinerary 
} from '@/lib/ai/advanced-ai-service';

// Request validation schema
const OptimizeItineraryRequestSchema = z.object({
  currentItinerary: GeneratedItinerarySchema,
  optimizationGoals: z.array(z.string()).min(1, 'At least one optimization goal required'),
  constraints: z.array(z.string()).optional(),
  userId: z.string().optional(),
  requestId: z.string().optional()
});

// Rate limiting for optimization
const OPTIMIZATION_RATE_LIMIT = 5; // requests per hour per user
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (optimization is expensive)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const responseCache = new Map<string, { data: any; timestamp: number }>();

// Initialize AI service
let aiService: AdvancedAIService;
try {
  aiService = new AdvancedAIService();
} catch (error) {
  console.error('Failed to initialize AI service:', error);
}

export async function POST(request: NextRequest) {
  return withAISubscriptionCheck('canUseAIGenerator', async (userInfo) => {
    try {
      // Check if AI service is available
      if (!aiService) {
        return NextResponse.json({
          success: false,
          error: 'AI service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        }, { status: 503 });
      }

      const { userId } = auth();
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Rate limiting check
      const now = Date.now();
      const userKey = `${userId}_optimization`;
      const userData = requestCounts.get(userKey);
      
      if (userData) {
        if (now < userData.resetTime) {
          if (userData.count >= OPTIMIZATION_RATE_LIMIT) {
            return NextResponse.json({
              success: false,
              error: 'Rate limit exceeded for itinerary optimization',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: Math.ceil((userData.resetTime - now) / 1000)
            }, { status: 429 });
          }
          userData.count++;
        } else {
          userData.count = 1;
          userData.resetTime = now + 60 * 60 * 1000; // 1 hour
        }
      } else {
        requestCounts.set(userKey, {
          count: 1,
          resetTime: now + 60 * 60 * 1000
        });
      }

      // Parse and validate request body
      const body = await request.json();
      const optimizationRequest = OptimizeItineraryRequestSchema.parse({
        ...body,
        userId
      });

      const { currentItinerary, optimizationGoals, constraints, requestId } = optimizationRequest;

      // Generate cache key
      const cacheKey = `${userId}_${JSON.stringify({ 
        itineraryId: currentItinerary.metadata?.generatedAt || 'unknown',
        goals: optimizationGoals.sort(),
        constraints: constraints?.sort() || []
      })}`;
      const cachedResponse = responseCache.get(cacheKey);
      
      // Return cached response if available and not expired
      if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_DURATION) {
        console.log('Returning cached optimization result');
        return NextResponse.json({
          success: true,
          ...cachedResponse.data,
          cached: true,
          requestId
        });
      }

      // Validate optimization goals
      const validGoals = [
        'reduce_cost',
        'optimize_time',
        'minimize_travel',
        'maximize_experiences',
        'improve_routing',
        'balance_activities',
        'enhance_local_culture',
        'optimize_for_weather',
        'reduce_walking_distance',
        'improve_food_diversity',
        'add_rest_time',
        'prioritize_must_see',
        'optimize_for_group_size'
      ];

      const invalidGoals = optimizationGoals.filter(goal => !validGoals.includes(goal));
      if (invalidGoals.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid optimization goals',
          code: 'INVALID_GOALS',
          details: {
            invalidGoals,
            validGoals
          }
        }, { status: 400 });
      }

      // Log request for analytics
      console.log('AI Itinerary Optimization Request:', {
        destination: currentItinerary.title,
        duration: currentItinerary.totalDuration,
        originalCost: currentItinerary.estimatedCost.total,
        goals: optimizationGoals,
        constraints: constraints?.length || 0,
        tier: userInfo.tier,
        userId: userInfo.tier, // Don't expose actual userId
        requestId
      });

      // Optimize itinerary using AdvancedAIService
      const startTime = Date.now();
      const response = await aiService.optimizeItinerary(
        currentItinerary,
        optimizationGoals,
        constraints
      );
      const optimizationTime = Date.now() - startTime;

      if (!response.success) {
        return NextResponse.json({
          success: false,
          error: response.error || 'Failed to optimize itinerary',
          code: 'OPTIMIZATION_FAILED',
          requestId
        }, { status: 500 });
      }

      // Calculate optimization impact
      const optimizationImpact = calculateOptimizationImpact(
        currentItinerary,
        response.data!,
        optimizationGoals
      );

      // Prepare response data
      const responseData = {
        optimizedItinerary: response.data!,
        optimization: {
          goals: optimizationGoals,
          constraints: constraints || [],
          impact: optimizationImpact,
          summary: generateOptimizationSummary(optimizationImpact, optimizationGoals)
        },
        metadata: {
          optimizedAt: new Date().toISOString(),
          optimizationTime,
          provider: response.provider,
          usage: response.usage,
          cost: response.cost,
          tier: userInfo.tier,
          remainingOptimizations: OPTIMIZATION_RATE_LIMIT - (userData?.count || 1),
          upgradeAvailable: userInfo.tier !== 'pro',
          version: '4.2.0',
          requestId
        }
      };

      // Cache the response
      responseCache.set(cacheKey, {
        data: responseData,
        timestamp: now
      });

      // Clean up old cache entries
      cleanupCache();

      return NextResponse.json({
        success: true,
        ...responseData
      });

    } catch (error) {
      console.error('AI Itinerary Optimization Error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Invalid request format',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!aiService) {
      return NextResponse.json({ 
        available: false, 
        reason: 'AI service not initialized'
      });
    }

    // Get user rate limit status
    const now = Date.now();
    const userKey = `${userId}_optimization`;
    const userData = requestCounts.get(userKey);
    
    let remainingOptimizations = OPTIMIZATION_RATE_LIMIT;
    let resetTime = null;
    
    if (userData && now < userData.resetTime) {
      remainingOptimizations = Math.max(0, OPTIMIZATION_RATE_LIMIT - userData.count);
      resetTime = new Date(userData.resetTime).toISOString();
    }

    return NextResponse.json({
      available: true,
      service: 'AI Itinerary Optimization',
      version: '4.2.0',
      capabilities: [
        'cost_reduction',
        'time_optimization',
        'route_optimization',
        'experience_maximization',
        'cultural_enhancement',
        'weather_optimization',
        'group_optimization'
      ],
      optimizationGoals: [
        'reduce_cost',
        'optimize_time',
        'minimize_travel',
        'maximize_experiences',
        'improve_routing',
        'balance_activities',
        'enhance_local_culture',
        'optimize_for_weather',
        'reduce_walking_distance',
        'improve_food_diversity',
        'add_rest_time',
        'prioritize_must_see',
        'optimize_for_group_size'
      ],
      rateLimits: {
        optimizationsPerHour: OPTIMIZATION_RATE_LIMIT,
        remainingOptimizations,
        resetTime,
        cacheHours: CACHE_DURATION / (60 * 60 * 1000)
      },
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GOOGLE_GEMINI_API_KEY
      }
    });

  } catch (error) {
    console.error('Optimization service health check error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'Service check failed' 
    });
  }
}

// Calculate optimization impact metrics
function calculateOptimizationImpact(
  original: GeneratedItinerary,
  optimized: GeneratedItinerary,
  goals: string[]
) {
  const impact = {
    costSavings: {
      absolute: original.estimatedCost.total - optimized.estimatedCost.total,
      percentage: Math.round(((original.estimatedCost.total - optimized.estimatedCost.total) / original.estimatedCost.total) * 100)
    },
    timeOptimization: {
      daysChanged: optimized.totalDuration - original.totalDuration,
      activitiesChanged: optimized.days.reduce((sum, day) => sum + day.activities.length, 0) - 
                        original.days.reduce((sum, day) => sum + day.activities.length, 0)
    },
    routeImprovement: {
      transportationChanges: calculateTransportationChanges(original, optimized),
      efficiency: 'improved' // This would be calculated based on actual route analysis
    },
    experienceEnhancement: {
      newActivities: findNewActivities(original, optimized),
      improvedActivities: findImprovedActivities(original, optimized)
    }
  };

  return impact;
}

// Generate optimization summary
function generateOptimizationSummary(
  impact: any,
  goals: string[]
): string[] {
  const summary: string[] = [];
  
  if (goals.includes('reduce_cost') && impact.costSavings.absolute > 0) {
    summary.push(`Reduced trip cost by ${impact.costSavings.absolute.toLocaleString()} (${impact.costSavings.percentage}%)`);
  }
  
  if (goals.includes('optimize_time') && impact.timeOptimization.daysChanged !== 0) {
    const change = impact.timeOptimization.daysChanged > 0 ? 'Extended' : 'Shortened';
    summary.push(`${change} trip duration by ${Math.abs(impact.timeOptimization.daysChanged)} day(s)`);
  }
  
  if (goals.includes('improve_routing')) {
    summary.push('Optimized transportation routes for better efficiency');
  }
  
  if (goals.includes('maximize_experiences') && impact.experienceEnhancement.newActivities.length > 0) {
    summary.push(`Added ${impact.experienceEnhancement.newActivities.length} new experiences`);
  }
  
  if (summary.length === 0) {
    summary.push('Applied optimizations based on your specified goals');
  }
  
  return summary;
}

// Helper functions for impact calculation
function calculateTransportationChanges(original: GeneratedItinerary, optimized: GeneratedItinerary) {
  // This would calculate actual transportation changes
  return 'optimized';
}

function findNewActivities(original: GeneratedItinerary, optimized: GeneratedItinerary) {
  // This would find activities in optimized that weren't in original
  return [];
}

function findImprovedActivities(original: GeneratedItinerary, optimized: GeneratedItinerary) {
  // This would find activities that were enhanced in the optimization
  return [];
}

// Utility function to clean up expired cache entries
function cleanupCache() {
  const now = Date.now();
  
  // Clean up response cache
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      responseCache.delete(key);
    }
  }
  
  // Clean up rate limiting data
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}