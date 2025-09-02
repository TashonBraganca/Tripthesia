/**
 * AI Route Planning API Endpoint
 * Provides intelligent route recommendations using GPT-5 Mini
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AIRoutePlanner, type RouteQuery } from '@/lib/ai/route-planner';
import { GoogleMapsProvider } from '@/lib/services/google-maps-provider';
import { POIDetector } from '@/lib/services/poi-detector';

// Rate limiting and caching
const RATE_LIMIT = {
  requests: 10, // requests per hour per user
  window: 3600000, // 1 hour in milliseconds
};

// Request validation schema
const RouteRequestSchema = z.object({
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  vehicleType: z.enum(['car', 'motorcycle', 'rv', 'electric']).default('car'),
  travelDates: z.object({
    start: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
    end: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  }),
  preferences: z.object({
    scenic: z.boolean().default(false),
    fastest: z.boolean().default(true),
    budget: z.enum(['low', 'medium', 'high']).default('medium'),
    interests: z.array(z.string()).default([]),
    avoidTolls: z.boolean().default(false),
    avoidHighways: z.boolean().default(false),
  }).default({}),
  travelers: z.object({
    adults: z.number().min(1).max(20).default(2),
    children: z.number().min(0).max(20).default(0),
    pets: z.boolean().default(false),
  }).default({}),
  timeConstraints: z.object({
    maxDrivingHoursPerDay: z.number().min(1).max(16).default(8),
    preferredDepartureTime: z.string().optional(),
    mustArriveBefore: z.string().optional(),
  }).optional(),
});

// Error response helper
function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      endpoint: '/api/ai/route-planning'
    },
    { status }
  );
}

// Success response helper
function createSuccessResponse(data: any) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      endpoint: '/api/ai/route-planning'
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    }
  );
}

// Rate limiting check (simplified - would use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize limit
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT.window });
    return { allowed: true };
  }
  
  if (userLimit.count >= RATE_LIMIT.requests) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }
  
  userLimit.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return createErrorResponse('Authentication required', 401);
    }

    // Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toISOString() : undefined;
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${RATE_LIMIT.requests} requests per hour`,
          resetTime,
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return createErrorResponse('Invalid JSON in request body');
    }

    let validatedRequest: RouteQuery;
    try {
      validatedRequest = RouteRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      return createErrorResponse('Invalid request format');
    }

    // Validate date range
    const startDate = new Date(validatedRequest.travelDates.start);
    const endDate = new Date(validatedRequest.travelDates.end);
    
    if (startDate >= endDate) {
      return createErrorResponse('End date must be after start date');
    }
    
    if (startDate < new Date()) {
      return createErrorResponse('Start date cannot be in the past');
    }

    // Initialize services
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!openAIApiKey) {
      return createErrorResponse('AI service temporarily unavailable', 503);
    }

    if (!googleMapsApiKey) {
      return createErrorResponse('Maps service temporarily unavailable', 503);
    }

    const mapsProvider = new GoogleMapsProvider(googleMapsApiKey);
    const poiDetector = new POIDetector(mapsProvider);
    const aiPlanner = new AIRoutePlanner(openAIApiKey, mapsProvider, poiDetector);

    // Generate route recommendations
    const startTime = Date.now();
    const routeRecommendation = await aiPlanner.planRoute(validatedRequest);
    const processingTime = Date.now() - startTime;

    // Add metadata to response
    const responseData = {
      ...routeRecommendation,
      metadata: {
        processingTime,
        requestId: `route_${userId}_${Date.now()}`,
        version: '1.0',
        model: 'gpt-4o-mini', // Current model (placeholder for GPT-5 Mini)
        cached: false,
      }
    };

    // Log successful request (would be enhanced with proper logging in production)
    console.log(`AI Route Planning Success: User ${userId}, ${processingTime}ms`);

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('AI Route Planning Error:', error);

    // Determine error type and response
    if (error instanceof Error) {
      if (error.message.includes('OpenAI')) {
        return createErrorResponse('AI service temporarily unavailable. Please try again later.', 503);
      }
      
      if (error.message.includes('Google Maps')) {
        return createErrorResponse('Maps service temporarily unavailable. Please try again later.', 503);
      }
      
      if (error.message.includes('timeout')) {
        return createErrorResponse('Request timeout. Please try with a simpler route.', 408);
      }
    }

    return createErrorResponse('Internal server error. Please try again later.', 500);
  }
}

// GET method for endpoint health check
export async function GET() {
  const healthData = {
    status: 'healthy',
    endpoint: '/api/ai/route-planning',
    version: '1.0',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      googleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    rateLimit: {
      requests: RATE_LIMIT.requests,
      window: `${RATE_LIMIT.window / 1000 / 60} minutes`,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(healthData, { status: 200 });
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}