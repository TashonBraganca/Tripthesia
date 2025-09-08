/**
 * Intelligent Recommendations API - Phase 4.3.3
 * 
 * Advanced recommendation API using hybrid algorithms
 * Provides personalized travel recommendations based on user behavior and preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { 
  intelligentRecommendationEngine, 
  RecommendationContext,
  RecommendationOptions 
} from '@/lib/recommendations/recommendation-engine';

// ==================== REQUEST SCHEMAS ====================

const RecommendationRequestSchema = z.object({
  context: z.object({
    currentLocation: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    travelDates: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    budget: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string()
    }).optional(),
    travelStyle: z.string().optional(),
    groupSize: z.number().optional(),
    previousBookings: z.array(z.string()).optional(),
    searchQuery: z.string().optional()
  }).optional().default({}),
  options: z.object({
    maxResults: z.number().min(1).max(50).optional().default(20),
    minScore: z.number().min(0).max(1).optional().default(0.1),
    diversityFactor: z.number().min(0).max(1).optional().default(0.3),
    includeExplanations: z.boolean().optional().default(true),
    excludeInteracted: z.boolean().optional().default(true),
    boostFreshContent: z.boolean().optional().default(true),
    geographicRadius: z.number().min(1000).max(100000).optional().default(50000)
  }).optional().default({})
});

const QuickRecommendationsSchema = z.object({
  type: z.enum(['destinations', 'activities', 'trips']).optional().default('destinations'),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  limit: z.number().min(1).max(20).optional().default(10)
});

const SimilarItemsSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['destination', 'activity', 'hotel', 'flight', 'trip', 'itinerary']),
  limit: z.number().min(1).max(20).optional().default(10)
});

// Rate limiting
const RATE_LIMIT = 50; // requests per hour per user
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// ==================== API HANDLERS ====================

/**
 * POST - Generate personalized recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const userKey = userId;
    const userData = requestCounts.get(userKey);
    
    if (userData && now < userData.resetTime && userData.count >= RATE_LIMIT) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      }, { status: 429 });
    }
    
    // Update rate limiting counter
    if (userData && now < userData.resetTime) {
      userData.count++;
    } else {
      requestCounts.set(userKey, {
        count: 1,
        resetTime: now + 60 * 60 * 1000 // 1 hour
      });
    }

    const body = await request.json();
    const validatedData = RecommendationRequestSchema.parse(body);

    // Build recommendation context
    const context: RecommendationContext = {
      userId,
      ...validatedData.context,
      travelDates: validatedData.context.travelDates ? {
        start: new Date(validatedData.context.travelDates.start),
        end: new Date(validatedData.context.travelDates.end)
      } : undefined
    };

    // Generate recommendations
    const startTime = Date.now();
    const recommendations = await intelligentRecommendationEngine.generateRecommendations(
      context,
      validatedData.options
    );
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context: {
          userId: userId.substring(0, 8) + '***',
          requestedAt: new Date().toISOString(),
          processingTimeMs: processingTime,
          filters: validatedData.options
        },
        meta: {
          totalResults: recommendations.length,
          highConfidenceResults: recommendations.filter(r => r.confidence > 0.8).length,
          sources: [...new Set(recommendations.map(r => r.source))],
          averageScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length || 0,
          averageConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('Recommendation generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

/**
 * GET - Quick recommendations and cached results
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('type') || 'personalized';

    switch (requestType) {
      case 'quick':
        return await handleQuickRecommendations(userId, searchParams);
      case 'similar':
        return await handleSimilarItems(userId, searchParams);
      case 'cached':
        return await handleCachedRecommendations(userId, searchParams);
      case 'personalized':
      default:
        return await handlePersonalizedRecommendations(userId, searchParams);
    }
    
  } catch (error) {
    console.error('Get recommendations error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to retrieve recommendations' },
      { status: 500 }
    );
  }
}

// ==================== HANDLER FUNCTIONS ====================

/**
 * Handle quick recommendations request
 */
async function handleQuickRecommendations(userId: string, searchParams: URLSearchParams) {
  const queryParams = {
    type: searchParams.get('recommendationType') as 'destinations' | 'activities' | 'trips' || 'destinations',
    location: searchParams.get('lat') && searchParams.get('lng') ? {
      lat: parseFloat(searchParams.get('lat')!),
      lng: parseFloat(searchParams.get('lng')!)
    } : undefined,
    limit: parseInt(searchParams.get('limit') || '10')
  };

  const validatedQuery = QuickRecommendationsSchema.parse(queryParams);

  // Generate basic context for quick recommendations
  const context: RecommendationContext = {
    userId,
    currentLocation: validatedQuery.location
  };

  const options: RecommendationOptions = {
    maxResults: validatedQuery.limit,
    minScore: 0.2, // Higher threshold for quick recs
    diversityFactor: 0.5, // More diversity for quick recs
    includeExplanations: false, // Skip explanations for speed
    excludeInteracted: true,
    boostFreshContent: true
  };

  const recommendations = await intelligentRecommendationEngine.generateRecommendations(
    context,
    options
  );

  return NextResponse.json({
    success: true,
    data: {
      recommendations,
      type: 'quick',
      generatedAt: new Date().toISOString()
    }
  });
}

/**
 * Handle similar items request
 */
async function handleSimilarItems(userId: string, searchParams: URLSearchParams) {
  const queryParams = {
    itemId: searchParams.get('itemId')!,
    itemType: searchParams.get('itemType') as any,
    limit: parseInt(searchParams.get('limit') || '10')
  };

  const validatedQuery = SimilarItemsSchema.parse(queryParams);

  // For now, return a placeholder response
  // In a full implementation, this would use item-to-item similarity
  return NextResponse.json({
    success: true,
    data: {
      recommendations: [],
      type: 'similar',
      basedOn: {
        itemId: validatedQuery.itemId,
        itemType: validatedQuery.itemType
      },
      message: 'Similar items functionality coming soon'
    }
  });
}

/**
 * Handle cached recommendations request
 */
async function handleCachedRecommendations(userId: string, searchParams: URLSearchParams) {
  // This would retrieve cached recommendations from the database
  // For now, return empty results
  return NextResponse.json({
    success: true,
    data: {
      recommendations: [],
      type: 'cached',
      message: 'No cached recommendations available'
    }
  });
}

/**
 * Handle personalized recommendations with simple context
 */
async function handlePersonalizedRecommendations(userId: string, searchParams: URLSearchParams) {
  const context: RecommendationContext = {
    userId,
    currentLocation: searchParams.get('lat') && searchParams.get('lng') ? {
      lat: parseFloat(searchParams.get('lat')!),
      lng: parseFloat(searchParams.get('lng')!)
    } : undefined,
    budget: searchParams.get('minBudget') && searchParams.get('maxBudget') ? {
      min: parseFloat(searchParams.get('minBudget')!),
      max: parseFloat(searchParams.get('maxBudget')!),
      currency: searchParams.get('currency') || 'USD'
    } : undefined,
    travelStyle: searchParams.get('travelStyle') || undefined,
    searchQuery: searchParams.get('query') || undefined
  };

  const options: RecommendationOptions = {
    maxResults: parseInt(searchParams.get('limit') || '20'),
    minScore: parseFloat(searchParams.get('minScore') || '0.1'),
    diversityFactor: parseFloat(searchParams.get('diversity') || '0.3'),
    includeExplanations: searchParams.get('explain') !== 'false',
    excludeInteracted: searchParams.get('excludeInteracted') !== 'false',
    boostFreshContent: searchParams.get('boostFresh') !== 'false'
  };

  const recommendations = await intelligentRecommendationEngine.generateRecommendations(
    context,
    options
  );

  return NextResponse.json({
    success: true,
    data: {
      recommendations,
      context: {
        userId: userId.substring(0, 8) + '***',
        hasLocation: !!context.currentLocation,
        hasBudget: !!context.budget,
        hasTravelStyle: !!context.travelStyle,
        hasQuery: !!context.searchQuery
      },
      meta: {
        totalResults: recommendations.length,
        averageScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length || 0,
        sources: [...new Set(recommendations.map(r => r.source))]
      }
    }
  });
}