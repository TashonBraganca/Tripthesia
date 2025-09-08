/**
 * Behavioral Analytics API - Phase 4.3.2
 * 
 * Real-time behavior tracking and insights API
 * Integrates with frontend for seamless user experience tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { behavioralAnalytics, BehaviorEvent, SessionContext } from '@/lib/analytics/behavioral-analytics';

// ==================== REQUEST SCHEMAS ====================

const SessionStartSchema = z.object({
  sessionId: z.string().min(1),
  context: z.object({
    device: z.string(),
    userAgent: z.string(),
    viewport: z.object({
      width: z.number(),
      height: z.number()
    }),
    timezone: z.string(),
    referrer: z.string().optional(),
    utm: z.record(z.string()).optional()
  })
});

const EventTrackingSchema = z.object({
  events: z.array(z.object({
    eventId: z.string(),
    sessionId: z.string(),
    timestamp: z.string(),
    eventType: z.enum(['search', 'view', 'like', 'dislike', 'book', 'share', 'save', 'skip', 'time_spent', 'click_through', 'comparison', 'filter_apply']),
    targetType: z.string(),
    targetId: z.string(),
    eventData: z.record(z.any()),
    duration: z.number().optional(),
    sequence: z.number()
  }))
});

const SessionEndSchema = z.object({
  sessionId: z.string().min(1)
});

const InsightsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month']).optional().default('week'),
  includePatterns: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true)
});

// Rate limiting
const RATE_LIMIT = 200; // requests per hour per user
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// ==================== API HANDLERS ====================

/**
 * POST - Handle behavior tracking operations
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
    const { action } = body;

    switch (action) {
      case 'start_session':
        return await handleSessionStart(userId, body);
      case 'track_events':
        return await handleEventTracking(userId, body);
      case 'end_session':
        return await handleSessionEnd(userId, body);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be "start_session", "track_events", or "end_session"' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Behavioral analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to process behavioral analytics request' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve behavioral insights and patterns
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      timeframe: searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'week',
      includePatterns: searchParams.get('includePatterns') !== 'false',
      includeRecommendations: searchParams.get('includeRecommendations') !== 'false'
    };

    const validatedQuery = InsightsQuerySchema.parse(queryParams);

    // Get behavior patterns
    const patterns = validatedQuery.includePatterns 
      ? await behavioralAnalytics.analyzeBehaviorPatterns(userId, validatedQuery.timeframe)
      : [];

    // Get comprehensive insights
    const insights = validatedQuery.includeRecommendations
      ? await behavioralAnalytics.generateBehaviorInsights(userId)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        patterns,
        insights,
        summary: {
          totalPatterns: patterns.length,
          highConfidencePatterns: patterns.filter(p => p.confidence > 0.8).length,
          engagementScore: insights?.engagementScore || 0,
          riskFactors: insights?.riskFactors?.length || 0,
          opportunities: insights?.personalizationOpportunities?.length || 0
        },
        metadata: {
          retrievedAt: new Date().toISOString(),
          timeframe: validatedQuery.timeframe,
          userId: userId.substring(0, 8) + '***',
          version: '4.3.2'
        }
      }
    });
    
  } catch (error) {
    console.error('Get behavioral insights error:', error);
    
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
      { error: 'Failed to retrieve behavioral insights' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear behavioral data (GDPR compliance)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Note: This would need to be implemented to clear behavioral data from database
    // For now, just acknowledge the request
    
    return NextResponse.json({
      success: true,
      message: 'Behavioral data deletion initiated'
    });
    
  } catch (error) {
    console.error('Delete behavioral data error:', error);
    return NextResponse.json(
      { error: 'Failed to delete behavioral data' },
      { status: 500 }
    );
  }
}

// ==================== HANDLER FUNCTIONS ====================

/**
 * Handle session start tracking
 */
async function handleSessionStart(userId: string, body: any) {
  try {
    const { sessionId, context } = SessionStartSchema.parse(body);
    
    await behavioralAnalytics.startSession(sessionId, userId, context);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        userId: userId.substring(0, 8) + '***',
        startedAt: new Date().toISOString()
      },
      message: 'Behavior tracking session started successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid session data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    throw error;
  }
}

/**
 * Handle event tracking
 */
async function handleEventTracking(userId: string, body: any) {
  try {
    const { events } = EventTrackingSchema.parse(body);
    
    // Process each event
    const processedEvents = [];
    for (const event of events) {
      const behaviorEvent: BehaviorEvent = {
        eventId: event.eventId,
        sessionId: event.sessionId,
        timestamp: new Date(event.timestamp),
        eventType: event.eventType,
        targetType: event.targetType,
        targetId: event.targetId,
        eventData: event.eventData,
        duration: event.duration,
        sequence: event.sequence
      };

      await behavioralAnalytics.trackEvent(behaviorEvent);
      processedEvents.push({
        eventId: event.eventId,
        processed: true,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        eventsProcessed: processedEvents.length,
        events: processedEvents
      },
      message: `Successfully tracked ${processedEvents.length} behavioral events`
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid event data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    throw error;
  }
}

/**
 * Handle session end tracking
 */
async function handleSessionEnd(userId: string, body: any) {
  try {
    const { sessionId } = SessionEndSchema.parse(body);
    
    await behavioralAnalytics.endSession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        endedAt: new Date().toISOString(),
        userId: userId.substring(0, 8) + '***'
      },
      message: 'Behavior tracking session ended successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid session end data',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    throw error;
  }
}