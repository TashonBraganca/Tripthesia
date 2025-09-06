/**
 * Hotel Search API Route - Phase 2.2
 * 
 * Comprehensive hotel search with multiple provider integration:
 * - Booking.com Partner API (primary inventory)
 * - Amadeus Hotel APIs (additional coverage)
 * - Response normalization and price comparison
 * - Deep linking and affiliate commission tracking
 * - Review and rating integration
 * 
 * Features:
 * - Location-based search validation
 * - Date range and room configuration validation
 * - Advanced filtering and sorting
 * - Rate limiting and monitoring
 * - Caching support with Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createHotelSearchService, HotelSearchQuery } from '@/lib/services/hotel-search';
import { APIMonitor } from '@/lib/monitoring/api-monitor';

// ==================== REQUEST VALIDATION ====================

const HotelSearchRequestSchema = z.object({
  location: z.object({
    type: z.enum(['city', 'landmark', 'coordinates', 'hotel_name']),
    value: z.string().min(1).max(100),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90)
    ]).optional(),
    radius: z.number().positive().max(50).optional(),
    countryCode: z.string().length(2).regex(/^[A-Z]{2}$/).optional()
  }),
  checkIn: z.string().datetime('Invalid check-in date format'),
  checkOut: z.string().datetime('Invalid check-out date format'),
  rooms: z.array(z.object({
    adults: z.number().int().min(1).max(10, 'Maximum 10 adults per room'),
    children: z.number().int().min(0).max(10, 'Maximum 10 children per room').optional(),
    childrenAges: z.array(z.number().int().min(0).max(17)).optional()
  })).min(1, 'At least one room required').max(10, 'Maximum 10 rooms allowed'),
  filters: z.object({
    priceRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
      currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional()
    }).optional(),
    starRating: z.object({
      min: z.number().int().min(1).max(5).optional(),
      max: z.number().int().min(1).max(5).optional()
    }).optional(),
    amenities: z.array(z.string().max(50)).max(20).optional(),
    propertyType: z.array(z.enum(['hotel', 'apartment', 'hostel', 'resort', 'villa'])).optional(),
    guestRating: z.object({
      min: z.number().min(0).max(10).optional()
    }).optional(),
    accessibility: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    freeCancellation: z.boolean().optional(),
    breakfastIncluded: z.boolean().optional(),
    payAtProperty: z.boolean().optional()
  }).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'stars', 'popularity']).optional().default('price'),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional().default('USD'),
  language: z.string().length(2).regex(/^[a-z]{2}$/).optional().default('en')
});

// ==================== RATE LIMITING ====================

const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15, // 15 hotel searches per 15 minutes per IP
  message: 'Too many hotel search requests, please try again later'
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Simple logging function
async function logApiRequest(logData: any) {
  console.log('[Hotel API Request]', logData);
}

// ==================== API HANDLERS ====================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Hotel Search API',
    version: '2.2.0',
    endpoints: {
      'POST /api/hotels/search': 'Search for hotels',
      'GET /api/hotels/details/{id}': 'Get hotel details',
      'GET /api/hotels/amenities': 'Get available amenities list'
    },
    documentation: 'https://docs.tripthesia.com/api/hotels'
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Authentication check
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please sign in to search for hotels'
      }, { status: 401 });
    }

    // Extract client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      await logApiRequest({
        requestId,
        endpoint: '/api/hotels/search',
        method: 'POST',
        clientIP,
        duration: Date.now() - startTime,
        status: 429,
        error: 'Rate limit exceeded'
      });
      
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: RATE_LIMIT_CONFIG.message,
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)
      }, { status: 429 });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      }, { status: 400 });
    }

    // Validate hotel search parameters
    let validatedQuery: HotelSearchQuery;
    try {
      validatedQuery = HotelSearchRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Invalid hotel search parameters',
          details: error.errors
        }, { status: 400 });
      }
      throw error;
    }

    // Additional business logic validations
    const checkIn = new Date(validatedQuery.checkIn);
    const checkOut = new Date(validatedQuery.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return NextResponse.json({
        error: 'Invalid check-in date',
        message: 'Check-in date cannot be in the past'
      }, { status: 400 });
    }

    if (checkOut <= checkIn) {
      return NextResponse.json({
        error: 'Invalid check-out date',
        message: 'Check-out date must be after check-in date'
      }, { status: 400 });
    }

    // Maximum stay validation (30 days)
    const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return NextResponse.json({
        error: 'Invalid stay duration',
        message: 'Maximum stay duration is 30 days'
      }, { status: 400 });
    }

    // Room configuration validation
    for (const room of validatedQuery.rooms) {
      if (room.childrenAges && room.childrenAges.length !== (room.children || 0)) {
        return NextResponse.json({
          error: 'Invalid room configuration',
          message: 'Children ages must match number of children'
        }, { status: 400 });
      }
    }

    // Price range validation
    if (validatedQuery.filters?.priceRange) {
      const { min, max } = validatedQuery.filters.priceRange;
      if (min && max && min >= max) {
        return NextResponse.json({
          error: 'Invalid price range',
          message: 'Minimum price must be less than maximum price'
        }, { status: 400 });
      }
    }

    // Star rating validation
    if (validatedQuery.filters?.starRating) {
      const { min, max } = validatedQuery.filters.starRating;
      if (min && max && min > max) {
        return NextResponse.json({
          error: 'Invalid star rating range',
          message: 'Minimum star rating must be less than or equal to maximum'
        }, { status: 400 });
      }
    }

    // Track API usage for monitoring
    try {
      const apiMonitor = new APIMonitor();
      await apiMonitor.trackUsage({
        apiName: 'hotels/search',
        endpoint: '/api/hotels/search',
        method: 'POST',
        timestamp: Date.now(),
        responseTime: 0, // Will be updated after response
        status: 200,
        success: true,
        requestId,
        userId: userId
      });
    } catch (monitorError) {
      console.warn('API monitoring failed:', monitorError);
    }

    // Create hotel search service and perform search
    const hotelSearchService = createHotelSearchService();
    const searchResults = await hotelSearchService.searchHotels(validatedQuery);

    // Log successful request
    await logApiRequest({
      requestId,
      endpoint: '/api/hotels/search',
      method: 'POST',
      clientIP,
      duration: Date.now() - startTime,
      status: 200,
      metadata: {
        location: validatedQuery.location.value,
        checkIn: validatedQuery.checkIn,
        checkOut: validatedQuery.checkOut,
        nights: searchResults.meta.dates.nights,
        rooms: validatedQuery.rooms.length,
        totalGuests: validatedQuery.rooms.reduce((sum, room) => sum + room.adults + (room.children || 0), 0),
        resultsCount: searchResults.offers.length,
        providers: searchResults.meta.providers,
        cacheHit: searchResults.meta.cacheHit
      }
    });

    // Return search results with additional metadata
    return NextResponse.json({
      success: true,
      requestId,
      data: searchResults,
      meta: {
        ...searchResults.meta,
        requestProcessingTime: Date.now() - startTime,
        apiVersion: '2.2.0',
        features: ['multi-provider', 'booking-integration', 'amadeus-hotels', 'price-comparison', 'affiliate-tracking']
      }
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': (RATE_LIMIT_CONFIG.maxRequests - (rateLimitStore.get(clientIP)?.count || 0)).toString(),
        'Cache-Control': 'public, max-age=1800' // 30 minutes client-side cache
      }
    });

  } catch (error) {
    console.error('Hotel search API error:', error);

    // Log error
    await logApiRequest({
      requestId,
      endpoint: '/api/hotels/search',
      method: 'POST',
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      duration: Date.now() - startTime,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return error response
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while searching for hotels',
      requestId,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'X-Request-ID': requestId
      }
    });
  }
}

// ==================== OPTIONS HANDLER FOR CORS ====================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}