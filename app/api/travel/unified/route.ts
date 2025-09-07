/**
 * Unified Travel Search API Route - Phase 2.5
 * 
 * Master API endpoint that orchestrates all travel services with normalized responses:
 * - Single endpoint for flights, hotels, transport, car rentals, and ride services
 * - Unified request/response format across all providers
 * - Intelligent cross-service recommendations and price comparison
 * - Advanced error handling with graceful service degradation
 * - Multi-currency support and real-time currency conversion
 * - Comprehensive quality scoring and data completeness metrics
 * 
 * Features:
 * - Parallel execution of all travel services for optimal performance
 * - Smart caching with service-specific TTL management
 * - Provider reliability scoring and automatic failover
 * - Comprehensive business logic validation
 * - Rate limiting with service-aware quotas
 * - Real-time monitoring and performance tracking
 * - Currency conversion and price standardization
 * - Accessibility and sustainability preference handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { withCache } from '@/lib/cache/cache-middleware';
import { createPerformanceOptimizer, measurePerformance } from '@/lib/cache/performance-optimizer';
import { 
  createUnifiedTravelOrchestrator, 
  UnifiedTravelSearchQuerySchema,
  type UnifiedTravelSearchQuery 
} from '@/lib/services/unified-travel-orchestrator';
import { APIMonitor } from '@/lib/monitoring/api-monitor';

// ==================== REQUEST VALIDATION ====================

const UnifiedSearchRequestSchema = UnifiedTravelSearchQuerySchema.extend({
  // Additional API-specific options
  options: z.object({
    includeAlternatives: z.boolean().optional().default(true),
    includeRecommendations: z.boolean().optional().default(true),
    includePriceBreakdown: z.boolean().optional().default(true),
    includeProviderDetails: z.boolean().optional().default(false),
    maxResultsPerService: z.number().int().min(1).max(50).optional().default(10),
    timeout: z.number().int().min(5000).max(30000).optional().default(15000)
  }).optional().default({}),
  
  // Client information
  client: z.object({
    userAgent: z.string().optional(),
    ipCountry: z.string().length(2).optional(),
    sessionId: z.string().optional()
  }).optional()
});

// ==================== RATE LIMITING ====================

const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 comprehensive searches per 15 minutes per IP
  message: 'Too many comprehensive travel searches, please try again later'
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

// Enhanced logging function
async function logApiRequest(logData: any) {
  console.log('[Unified Travel API Request]', {
    timestamp: new Date().toISOString(),
    ...logData
  });
}

// ==================== API HANDLERS ====================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Unified Travel Search API',
    version: '2.5.0',
    description: 'Comprehensive travel search orchestrating flights, hotels, transport, and car rentals',
    endpoints: {
      'POST /api/travel/unified': 'Comprehensive travel search across all services',
      'GET /api/travel/unified/status': 'Service health and provider status',
      'GET /api/travel/unified/currencies': 'Supported currencies and exchange rates',
      'GET /api/travel/unified/providers': 'Available providers and their capabilities'
    },
    supportedServices: ['flight', 'hotel', 'transport', 'car_rental', 'ride_share'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'],
    features: [
      'unified-search-interface',
      'cross-service-recommendations',
      'real-time-price-comparison',
      'multi-currency-support',
      'provider-reliability-scoring',
      'intelligent-caching',
      'accessibility-support',
      'sustainability-metrics',
      'comprehensive-error-handling'
    ],
    limits: {
      maxSearchesPerWindow: RATE_LIMIT_CONFIG.maxRequests,
      windowDuration: `${RATE_LIMIT_CONFIG.windowMs / 60000} minutes`,
      maxPassengers: 9,
      maxChildren: 8,
      maxResultsPerService: 50,
      searchTimeout: 30
    },
    qualityScoring: {
      dataCompleteness: 'Percentage of complete data fields across all results',
      providerReliability: 'Average provider trust score and uptime',
      priceConfidence: 'Confidence level in pricing accuracy',
      responseTime: 'Average response time across all services'
    },
    documentation: 'https://docs.tripthesia.com/api/travel/unified'
  });
}

async function handleUnifiedTravelSearch(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const performanceOptimizer = createPerformanceOptimizer();
  
  try {
    // Authentication check
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please sign in to access comprehensive travel search',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Extract client information for rate limiting and analytics
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const country = request.headers.get('cf-ipcountry') || 'unknown';

    // Rate limiting with enhanced tracking
    if (!checkRateLimit(`${clientIP}_${userId}`)) {
      await logApiRequest({
        requestId,
        endpoint: '/api/travel/unified',
        method: 'POST',
        clientIP,
        userId,
        userAgent,
        country,
        duration: Date.now() - startTime,
        status: 429,
        error: 'Rate limit exceeded'
      });
      
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: RATE_LIMIT_CONFIG.message,
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000),
        code: 'RATE_LIMIT_EXCEEDED',
        limits: {
          current: rateLimitStore.get(`${clientIP}_${userId}`)?.count || 0,
          max: RATE_LIMIT_CONFIG.maxRequests,
          windowMs: RATE_LIMIT_CONFIG.windowMs,
          resetAt: new Date(Date.now() + RATE_LIMIT_CONFIG.windowMs).toISOString()
        }
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_CONFIG.windowMs) / 1000).toString()
        }
      });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    // Add client information to request
    requestBody.client = {
      userAgent,
      ipCountry: country,
      sessionId: requestBody.client?.sessionId
    };

    // Validate unified travel search parameters
    let validatedQuery: UnifiedTravelSearchQuery & { options?: any; client?: any };
    try {
      validatedQuery = UnifiedSearchRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Invalid unified travel search parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, { status: 400 });
      }
      throw error;
    }

    // Advanced business logic validations
    const departureDate = new Date(validatedQuery.journey.departureDate);
    const returnDate = validatedQuery.journey.returnDate ? new Date(validatedQuery.journey.returnDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date validations
    if (departureDate < today) {
      return NextResponse.json({
        error: 'Invalid departure date',
        message: 'Departure date cannot be in the past',
        code: 'INVALID_DEPARTURE_DATE'
      }, { status: 400 });
    }

    if (returnDate && returnDate <= departureDate) {
      return NextResponse.json({
        error: 'Invalid return date',
        message: 'Return date must be after departure date',
        code: 'INVALID_RETURN_DATE'
      }, { status: 400 });
    }

    // Maximum advance booking validation (1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (departureDate > oneYearFromNow) {
      return NextResponse.json({
        error: 'Invalid departure date',
        message: 'Cannot search more than 1 year in advance',
        code: 'DEPARTURE_TOO_FAR'
      }, { status: 400 });
    }

    // Passenger validation
    const totalPassengers = validatedQuery.passengers.adults + 
                           (validatedQuery.passengers.children || 0) + 
                           (validatedQuery.passengers.infants || 0);
    
    if (totalPassengers > 15) {
      return NextResponse.json({
        error: 'Too many passengers',
        message: 'Maximum 15 passengers allowed per search',
        code: 'TOO_MANY_PASSENGERS'
      }, { status: 400 });
    }

    // Children ages validation
    if (validatedQuery.passengers.childrenAges && 
        validatedQuery.passengers.childrenAges.length !== (validatedQuery.passengers.children || 0)) {
      return NextResponse.json({
        error: 'Invalid passenger configuration',
        message: 'Number of children ages must match number of children',
        code: 'CHILDREN_AGES_MISMATCH'
      }, { status: 400 });
    }

    // Service type validation
    if (validatedQuery.services.types.length === 0) {
      return NextResponse.json({
        error: 'No services requested',
        message: 'At least one travel service must be requested',
        code: 'NO_SERVICES_REQUESTED'
      }, { status: 400 });
    }

    // Budget validation
    if (validatedQuery.preferences.budget?.total && 
        validatedQuery.preferences.budget.total < 10) {
      return NextResponse.json({
        error: 'Invalid budget',
        message: 'Minimum budget of $10 required',
        code: 'BUDGET_TOO_LOW'
      }, { status: 400 });
    }

    // Same origin/destination validation
    if (validatedQuery.journey.from.name.toLowerCase().trim() === 
        validatedQuery.journey.to.name.toLowerCase().trim()) {
      return NextResponse.json({
        error: 'Invalid route',
        message: 'Origin and destination cannot be the same',
        code: 'SAME_ORIGIN_DESTINATION'
      }, { status: 400 });
    }

    // Track API usage for comprehensive monitoring
    try {
      const apiMonitor = new APIMonitor();
      await apiMonitor.trackUsage({
        apiName: 'travel/unified',
        endpoint: '/api/travel/unified',
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

    // Create unified travel orchestrator and perform comprehensive search with performance monitoring
    const travelOrchestrator = createUnifiedTravelOrchestrator();
    const searchResults = await measurePerformance(
      () => travelOrchestrator.searchAll(validatedQuery),
      'search_result_time',
      { endpoint: '/api/travel/unified', userId }
    );

    // Enhanced logging with comprehensive metadata
    await logApiRequest({
      requestId,
      endpoint: '/api/travel/unified',
      method: 'POST',
      clientIP,
      userId,
      userAgent,
      country,
      duration: Date.now() - startTime,
      status: 200,
      metadata: {
        journey: {
          from: validatedQuery.journey.from.name,
          to: validatedQuery.journey.to.name,
          departureDate: validatedQuery.journey.departureDate,
          returnDate: validatedQuery.journey.returnDate
        },
        passengers: totalPassengers,
        servicesRequested: validatedQuery.services.types,
        servicesResponded: searchResults.meta.servicesResponded,
        totalOffers: searchResults.meta.totalOffers,
        currency: validatedQuery.preferences.currency,
        budget: validatedQuery.preferences.budget?.total,
        searchTime: searchResults.meta.searchTime,
        cacheHitRate: searchResults.meta.cacheInfo.hitRate,
        qualityMetrics: searchResults.meta.qualityMetrics,
        hasRecommendations: !!searchResults.recommendations.bestOverall,
        errorCount: searchResults.meta.errors.length,
        warningCount: searchResults.meta.warnings.length
      }
    });

    // Return comprehensive unified search results
    return NextResponse.json({
      success: true,
      requestId,
      data: searchResults,
      meta: {
        ...searchResults.meta,
        requestProcessingTime: Date.now() - startTime,
        apiVersion: '2.5.0',
        timestamp: new Date().toISOString(),
        clientInfo: {
          country,
          userAgent: userAgent.split(' ')[0], // Truncated for privacy
          sessionId: validatedQuery.client?.sessionId
        },
        features: [
          'unified-search-orchestration',
          'cross-service-normalization',
          'intelligent-recommendations',
          'multi-currency-support',
          'quality-scoring',
          'comprehensive-error-handling'
        ]
      }
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': (RATE_LIMIT_CONFIG.maxRequests - (rateLimitStore.get(`${clientIP}_${userId}`)?.count || 0)).toString(),
        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_CONFIG.windowMs) / 1000).toString(),
        'X-Search-Time': searchResults.meta.searchTime.toString(),
        'X-Total-Offers': searchResults.meta.totalOffers.toString(),
        'X-Quality-Score': Math.round(searchResults.meta.qualityMetrics.dataCompleteness).toString(),
        'Cache-Control': 'public, max-age=900', // 15 minutes client-side cache
        'Vary': 'Accept-Encoding, Accept-Language'
      }
    });

  } catch (error) {
    console.error('Unified travel search API error:', {
      requestId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });

    // Log comprehensive error information
    await logApiRequest({
      requestId,
      endpoint: '/api/travel/unified',
      method: 'POST',
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      userId: null,
      duration: Date.now() - startTime,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return detailed error response for debugging
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while performing unified travel search',
      code: 'INTERNAL_ERROR',
      requestId,
      timestamp: new Date().toISOString(),
      support: {
        message: 'Please contact support with the request ID for assistance',
        email: 'support@tripthesia.com',
        docs: 'https://docs.tripthesia.com/api/travel/unified'
      }
    }, { 
      status: 500,
      headers: {
        'X-Request-ID': requestId,
        'Content-Type': 'application/json'
      }
    });
  }
}

// Export the cached POST handler
export const POST = withCache(handleUnifiedTravelSearch, {
  enableStaleWhileRevalidate: true,
  enableRequestDeduplication: true,
  enablePerformanceMonitoring: true,
  defaultTTL: 300, // 5 minutes for comprehensive travel search
  includePatterns: [/\/api\/travel\/unified/]
});

// ==================== OPTIONS HANDLER FOR CORS ====================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Session-ID',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Expose-Headers': 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-Search-Time, X-Total-Offers, X-Quality-Score'
    }
  });
}