/**
 * Phase 4.3.5: Dynamic Learning and Feedback API
 * 
 * API endpoints for collecting user feedback, processing learning signals,
 * and providing insights for improved personalization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { DynamicLearningEngine, FeedbackSchema, UserFeedback } from '@/lib/ai/dynamic-learning-engine';

// Rate limiting for feedback (more generous than generation)
const RATE_LIMITS = {
  free: { requests: 50, window: 24 * 60 * 60 * 1000 }, // 50 per day
  starter: { requests: 150, window: 24 * 60 * 60 * 1000 }, // 150 per day
  pro: { requests: 500, window: 24 * 60 * 60 * 1000 } // 500 per day
};

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Batch feedback schema for multiple feedback items
const BatchFeedbackSchema = z.object({
  feedback: z.array(FeedbackSchema).min(1).max(10), // Max 10 feedback items per batch
  batchId: z.string().optional(),
  processingOptions: z.object({
    generateInsights: z.boolean().default(true),
    updatePreferences: z.boolean().default(true),
    recordBehavior: z.boolean().default(true)
  }).optional()
});

// Insights request schema
const InsightsRequestSchema = z.object({
  userId: z.string(),
  insightTypes: z.array(z.enum([
    'preference_evolution',
    'behavior_pattern',
    'prediction_accuracy',
    'recommendation_performance',
    'satisfaction_trend',
    'all'
  ])).default(['all']),
  timeRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional(),
  includeRecommendations: z.boolean().default(true)
});

// Initialize learning engine
let learningEngine: DynamicLearningEngine;
try {
  learningEngine = new DynamicLearningEngine();
} catch (error) {
  console.error('Failed to initialize DynamicLearningEngine:', error);
}

/**
 * POST /api/ai/feedback
 * Submit user feedback for learning and personalization improvement
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!learningEngine) {
      return NextResponse.json(
        { 
          error: 'Learning engine not available',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Check rate limits
    const rateLimitCheck = checkRateLimit(userId, 'free'); // Default to free tier for feedback
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetAt: rateLimitCheck.resetAt,
          maxRequests: rateLimitCheck.maxRequests
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const startTime = Date.now();

    // Check if it's batch feedback or single feedback
    let feedbackItems: UserFeedback[];
    let processingOptions = { generateInsights: true, updatePreferences: true, recordBehavior: true };

    try {
      // Try parsing as batch feedback first
      const batchData = BatchFeedbackSchema.parse(body);
      feedbackItems = batchData.feedback.map(fb => ({
        ...fb,
        userId // Ensure userId is set from auth
      }));
      processingOptions = batchData.processingOptions || processingOptions;
    } catch (batchError) {
      try {
        // Try parsing as single feedback
        const singleFeedback = FeedbackSchema.parse({ ...body, userId });
        feedbackItems = [singleFeedback];
      } catch (singleError) {
        return NextResponse.json(
          { 
            error: 'Invalid feedback format',
            code: 'INVALID_REQUEST',
            details: singleError instanceof z.ZodError ? 
              singleError.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              })) : []
          },
          { status: 400 }
        );
      }
    }

    // Process feedback items
    const results = [];
    const allInsights = [];
    const allUpdatedPreferences = {};

    for (const feedback of feedbackItems) {
      try {
        const result = await learningEngine.processFeedback(feedback);
        results.push({
          feedbackId: feedback.targetId,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          if (result.insights) {
            allInsights.push(...result.insights);
          }
          if (result.updatedPreferences) {
            Object.assign(allUpdatedPreferences, result.updatedPreferences);
          }
        }
      } catch (error) {
        console.error('Error processing individual feedback:', error);
        results.push({
          feedbackId: feedback.targetId,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }
    }

    // Increment rate limit counter
    incrementRateLimit(userId);

    // Build response
    const response = {
      success: results.every(r => r.success),
      processed: results.length,
      results,
      processingTime: Date.now() - startTime,
      metadata: {
        version: '4.3.5',
        batchSize: feedbackItems.length,
        timestamp: new Date().toISOString()
      }
    };

    // Add insights and preferences if requested and available
    if (processingOptions.generateInsights && allInsights.length > 0) {
      (response as any).insights = allInsights;
    }

    if (processingOptions.updatePreferences && Object.keys(allUpdatedPreferences).length > 0) {
      (response as any).updatedPreferences = allUpdatedPreferences;
    }

    // Log successful feedback processing
    console.log('Feedback processed:', {
      userId,
      feedbackCount: feedbackItems.length,
      insightsGenerated: allInsights.length,
      preferencesUpdated: Object.keys(allUpdatedPreferences).length,
      processingTime: response.processingTime
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Feedback processing error:', error);
    
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
        error: 'Failed to process feedback',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/feedback/insights
 * Get learning insights for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!learningEngine) {
      return NextResponse.json(
        { 
          error: 'Learning engine not available',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const insightTypes = url.searchParams.get('types')?.split(',') || ['all'];
    const includeRecommendations = url.searchParams.get('recommendations') !== 'false';

    const startTime = Date.now();

    // Generate insights for the user
    const result = await learningEngine.generateUserInsights(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to generate insights',
          code: 'INSIGHTS_GENERATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Filter insights by requested types
    let filteredInsights = result.insights || [];
    if (!insightTypes.includes('all')) {
      filteredInsights = filteredInsights.filter(insight => 
        insightTypes.includes(insight.insightType)
      );
    }

    const response = {
      success: true,
      insights: filteredInsights,
      summary: {
        totalInsights: filteredInsights.length,
        insightTypes: [...new Set(filteredInsights.map(i => i.insightType))],
        averageConfidence: filteredInsights.length > 0 
          ? filteredInsights.reduce((sum, i) => sum + i.confidence, 0) / filteredInsights.length 
          : 0
      },
      processingTime: Date.now() - startTime,
      metadata: {
        version: '4.3.5',
        userId,
        generatedAt: new Date().toISOString(),
        requestedTypes: insightTypes
      }
    };

    // Add recommendations if requested
    if (includeRecommendations && result.recommendations) {
      (response as any).recommendations = result.recommendations;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate learning insights',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/feedback/predict-satisfaction
 * Predict user satisfaction for a proposed itinerary
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!learningEngine) {
      return NextResponse.json(
        { 
          error: 'Learning engine not available',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { itinerary } = body;

    if (!itinerary) {
      return NextResponse.json(
        { 
          error: 'Itinerary data required',
          code: 'MISSING_ITINERARY'
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Predict satisfaction
    const prediction = await learningEngine.predictSatisfaction(userId, itinerary);

    const response = {
      success: true,
      prediction: {
        predictedRating: prediction.predictedRating,
        confidence: prediction.confidence,
        factors: prediction.factors,
        interpretation: interpretSatisfactionScore(prediction.predictedRating, prediction.confidence)
      },
      processingTime: Date.now() - startTime,
      metadata: {
        version: '4.3.5',
        userId,
        predictionAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Satisfaction prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to predict satisfaction',
        code: 'PREDICTION_ERROR'
      },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check rate limiting for feedback
 */
function checkRateLimit(userId: string, tier: string): {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  resetAt: number;
} {
  const limits = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = Date.now();
  
  const userKey = `${userId}_feedback`;
  let userData = requestCounts.get(userKey);
  
  if (!userData || userData.resetAt <= now) {
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
  const userKey = `${userId}_feedback`;
  const userData = requestCounts.get(userKey);
  
  if (userData) {
    userData.count += 1;
    requestCounts.set(userKey, userData);
  }
}

/**
 * Interpret satisfaction prediction score
 */
function interpretSatisfactionScore(rating: number, confidence: number): {
  level: string;
  description: string;
  recommendation: string;
} {
  const level = rating >= 4.5 ? 'excellent' : 
                rating >= 4.0 ? 'very_good' :
                rating >= 3.5 ? 'good' :
                rating >= 3.0 ? 'fair' : 'poor';
  
  const descriptions = {
    excellent: 'User is predicted to be highly satisfied with this itinerary',
    very_good: 'User is predicted to be very satisfied with this itinerary',
    good: 'User is predicted to be satisfied with this itinerary',
    fair: 'User satisfaction is predicted to be moderate',
    poor: 'User is predicted to have low satisfaction with this itinerary'
  };
  
  const recommendations = {
    excellent: 'Proceed with confidence - this itinerary aligns well with user preferences',
    very_good: 'Good match - minor adjustments could make it even better',
    good: 'Solid choice - consider small optimizations based on factors',
    fair: 'Consider modifications to better match user preferences',
    poor: 'Significant changes recommended to improve user satisfaction'
  };
  
  let description = descriptions[level as keyof typeof descriptions];
  let recommendation = recommendations[level as keyof typeof recommendations];
  
  if (confidence < 0.5) {
    description += ' (low confidence - limited user data)';
    recommendation = 'Prediction confidence is low due to limited user data. Consider gathering more feedback.';
  }
  
  return { level, description, recommendation };
}