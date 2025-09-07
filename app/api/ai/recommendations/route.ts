/**
 * AI Personalized Recommendations API - Phase 4.2
 * 
 * Provides AI-powered personalized travel recommendations using the AdvancedAIService
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withAISubscriptionCheck } from '@/lib/subscription/ai-restrictions';
import { 
  AdvancedAIService, 
  RecommendationRequestSchema, 
  RecommendationRequest 
} from '@/lib/ai/advanced-ai-service';

// Rate limiting for recommendations
const RECOMMENDATION_RATE_LIMIT = 20; // requests per hour per user
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
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
      const userKey = `${userId}_recommendations`;
      const userData = requestCounts.get(userKey);
      
      if (userData) {
        if (now < userData.resetTime) {
          if (userData.count >= RECOMMENDATION_RATE_LIMIT) {
            return NextResponse.json({
              success: false,
              error: 'Rate limit exceeded for recommendations',
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
      const recommendationRequest = RecommendationRequestSchema.parse({
        ...body,
        userId // Add userId to request
      });

      // Generate cache key
      const cacheKey = `${userId}_${JSON.stringify(recommendationRequest)}`;
      const cachedResponse = responseCache.get(cacheKey);
      
      // Return cached response if available and not expired
      if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_DURATION) {
        console.log('Returning cached recommendations');
        return NextResponse.json({
          success: true,
          ...cachedResponse.data,
          cached: true
        });
      }

      // Log request for analytics
      console.log('AI Recommendations Request:', {
        location: recommendationRequest.context.location,
        type: recommendationRequest.type,
        categories: recommendationRequest.preferences.categories,
        priceRange: recommendationRequest.preferences.priceRange,
        tier: userInfo.tier,
        userId: userInfo.tier // Don't expose actual userId
      });

      // Get recommendations using AdvancedAIService
      const startTime = Date.now();
      const response = await aiService.getRecommendations(recommendationRequest);
      const generationTime = Date.now() - startTime;

      if (!response.success) {
        return NextResponse.json({
          success: false,
          error: response.error || 'Failed to get recommendations',
          code: 'GENERATION_FAILED'
        }, { status: 500 });
      }

      // Prepare response data
      const responseData = {
        recommendations: response.data!.recommendations,
        insights: response.data!.insights,
        metadata: {
          ...response.data!.metadata,
          generationTime,
          tier: userInfo.tier,
          remainingRequests: RECOMMENDATION_RATE_LIMIT - (userData?.count || 1),
          upgradeAvailable: userInfo.tier !== 'pro',
          version: '4.2.0',
          enhanced: true
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
      console.error('AI Recommendations Error:', error);
      
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
    const userKey = `${userId}_recommendations`;
    const userData = requestCounts.get(userKey);
    
    let remainingRequests = RECOMMENDATION_RATE_LIMIT;
    let resetTime = null;
    
    if (userData && now < userData.resetTime) {
      remainingRequests = Math.max(0, RECOMMENDATION_RATE_LIMIT - userData.count);
      resetTime = new Date(userData.resetTime).toISOString();
    }

    return NextResponse.json({
      available: true,
      service: 'AI Personalized Recommendations',
      version: '4.2.0',
      capabilities: [
        'restaurant_recommendations',
        'activity_recommendations', 
        'accommodation_recommendations',
        'general_recommendations',
        'personalized_insights',
        'local_tips',
        'cultural_context',
        'budget_optimization'
      ],
      supportedTypes: ['restaurant', 'activity', 'accommodation', 'general'],
      rateLimits: {
        requestsPerHour: RECOMMENDATION_RATE_LIMIT,
        remainingRequests,
        resetTime,
        cacheMinutes: CACHE_DURATION / (60 * 1000)
      },
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GOOGLE_GEMINI_API_KEY
      }
    });

  } catch (error) {
    console.error('Recommendations service health check error:', error);
    return NextResponse.json({ 
      available: false, 
      reason: 'Service check failed' 
    });
  }
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