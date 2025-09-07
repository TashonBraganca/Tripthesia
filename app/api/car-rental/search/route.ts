/**
 * Car Rental & Ride Services Search API Route - Phase 2.4
 * 
 * Comprehensive car rental and ride-sharing search with CarTrawler-style architecture:
 * - Multi-provider car rental aggregation (CarTrawler, Hertz, Avis, Enterprise)
 * - Ride-sharing integration (Uber, Lyft, local taxi services)
 * - Vehicle category filtering and price comparison
 * - Location-based availability and real-time pricing
 * - Insurance options and additional services management
 * 
 * Features:
 * - One-way and round-trip rental support
 * - Driver age validation and surcharges
 * - Vehicle category and feature filtering
 * - Comprehensive rate limiting and monitoring
 * - Real-time availability checking
 * - Insurance and additional services integration
 * - Ride-sharing estimates for short distances
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createCarRentalSearchService, CarRentalSearchQuery } from '@/lib/services/car-rental-search';
import { APIMonitor } from '@/lib/monitoring/api-monitor';

// ==================== REQUEST VALIDATION ====================

const CarRentalSearchRequestSchema = z.object({
  pickupLocation: z.object({
    name: z.string().min(2, 'Pickup location name must be at least 2 characters').max(100, 'Pickup location name too long'),
    coordinates: z.tuple([
      z.number().min(-180).max(180, 'Invalid longitude'),
      z.number().min(-90).max(90, 'Invalid latitude')
    ]).optional(),
    type: z.enum(['airport', 'city_center', 'hotel', 'address']).optional()
  }),
  dropoffLocation: z.object({
    name: z.string().min(2, 'Dropoff location name must be at least 2 characters').max(100, 'Dropoff location name too long'),
    coordinates: z.tuple([
      z.number().min(-180).max(180, 'Invalid longitude'),
      z.number().min(-90).max(90, 'Invalid latitude')
    ]).optional(),
    type: z.enum(['airport', 'city_center', 'hotel', 'address']).optional()
  }).optional(),
  pickupDateTime: z.string().datetime('Pickup date must be a valid ISO datetime'),
  dropoffDateTime: z.string().datetime('Dropoff date must be a valid ISO datetime'),
  driverAge: z.number().int().min(18, 'Driver must be at least 18 years old').max(99, 'Invalid driver age'),
  preferences: z.object({
    vehicleCategories: z.array(z.enum(['economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van', 'pickup', 'convertible', 'electric'])).max(10, 'Too many vehicle categories').optional(),
    fuelTypes: z.array(z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid'])).max(5, 'Too many fuel types').optional(),
    transmissionType: z.enum(['manual', 'automatic', 'cvt']).optional(),
    features: z.array(z.string().max(50, 'Feature name too long')).max(20, 'Too many features').optional(),
    priceRange: z.object({
      min: z.number().positive('Minimum price must be positive').optional(),
      max: z.number().positive('Maximum price must be positive').optional(),
      currency: z.string().length(3, 'Currency must be 3 letters').regex(/^[A-Z]{3}$/, 'Currency must be uppercase')
    }).optional(),
    providers: z.array(z.string().max(50, 'Provider name too long')).max(20, 'Too many providers').optional(),
    excludeProviders: z.array(z.string().max(50, 'Provider name too long')).max(20, 'Too many excluded providers').optional()
  }).optional(),
  requirements: z.object({
    childSeats: z.number().int().min(0, 'Child seats cannot be negative').max(8, 'Maximum 8 child seats allowed').optional(),
    wheelchairAccessible: z.boolean().optional(),
    gps: z.boolean().optional(),
    unlimitedMileage: z.boolean().optional(),
    automaticTransmission: z.boolean().optional()
  }).optional(),
  options: z.object({
    includeInsurance: z.boolean().optional().default(true),
    includeRideSharing: z.boolean().optional().default(false),
    includePeerToPeer: z.boolean().optional().default(false),
    oneWayRental: z.boolean().optional().default(false)
  }).optional().default({})
});

// ==================== RATE LIMITING ====================

const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15, // 15 car rental searches per 15 minutes per IP
  message: 'Too many car rental search requests, please try again later'
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
  console.log('[Car Rental API Request]', {
    timestamp: new Date().toISOString(),
    ...logData
  });
}

// ==================== API HANDLERS ====================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Car Rental & Ride Services Search API',
    version: '2.4.0',
    endpoints: {
      'POST /api/car-rental/search': 'Search for car rentals and ride services',
      'GET /api/car-rental/providers': 'Get available car rental providers',
      'GET /api/car-rental/categories': 'Get vehicle categories and features',
      'GET /api/car-rental/locations/{query}': 'Search rental locations'
    },
    supportedVehicles: ['economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van', 'pickup', 'convertible', 'electric'],
    supportedServices: ['car_rental', 'ride_share', 'taxi', 'car_share'],
    supportedRegions: ['Europe', 'North America', 'Asia Pacific', 'Australia'],
    features: [
      'multi-provider-aggregation',
      'real-time-availability',
      'price-comparison',
      'insurance-options',
      'additional-services',
      'ride-sharing-integration',
      'one-way-rentals',
      'airport-city-pickup'
    ],
    providers: {
      carRental: ['CarTrawler', 'Hertz', 'Avis', 'Enterprise', 'Budget', 'Europcar'],
      rideShare: ['Uber', 'Lyft', 'Local Taxi Services'],
      peerToPeer: ['Turo', 'Zipcar', 'Car2Go']
    },
    documentation: 'https://docs.tripthesia.com/api/car-rental'
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
        message: 'Please sign in to search for car rentals and ride services',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Extract client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      await logApiRequest({
        requestId,
        endpoint: '/api/car-rental/search',
        method: 'POST',
        clientIP,
        userId,
        duration: Date.now() - startTime,
        status: 429,
        error: 'Rate limit exceeded'
      });
      
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: RATE_LIMIT_CONFIG.message,
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000),
        code: 'RATE_LIMIT_EXCEEDED'
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

    // Validate car rental search parameters
    let validatedQuery: CarRentalSearchQuery;
    try {
      validatedQuery = CarRentalSearchRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          message: 'Invalid car rental search parameters',
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

    // Additional business logic validations
    const pickupDate = new Date(validatedQuery.pickupDateTime);
    const dropoffDate = new Date(validatedQuery.dropoffDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      return NextResponse.json({
        error: 'Invalid pickup date',
        message: 'Pickup date cannot be in the past',
        code: 'INVALID_PICKUP_DATE'
      }, { status: 400 });
    }

    if (dropoffDate <= pickupDate) {
      return NextResponse.json({
        error: 'Invalid dropoff date',
        message: 'Dropoff date must be after pickup date',
        code: 'INVALID_DROPOFF_DATE'
      }, { status: 400 });
    }

    // Maximum rental duration validation (90 days)
    const daysDiff = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return NextResponse.json({
        error: 'Invalid rental duration',
        message: 'Maximum rental duration is 90 days',
        code: 'RENTAL_TOO_LONG'
      }, { status: 400 });
    }

    // Minimum rental duration validation (1 hour)
    const hoursDiff = (dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 1) {
      return NextResponse.json({
        error: 'Invalid rental duration',
        message: 'Minimum rental duration is 1 hour',
        code: 'RENTAL_TOO_SHORT'
      }, { status: 400 });
    }

    // Driver age validation for specific categories
    if (validatedQuery.preferences?.vehicleCategories?.includes('luxury') && validatedQuery.driverAge < 25) {
      return NextResponse.json({
        error: 'Driver age restriction',
        message: 'Minimum age 25 required for luxury vehicle rentals',
        code: 'AGE_RESTRICTION_LUXURY'
      }, { status: 400 });
    }

    // Price range validation
    if (validatedQuery.preferences?.priceRange) {
      const { min, max } = validatedQuery.preferences.priceRange;
      if (min && max && min >= max) {
        return NextResponse.json({
          error: 'Invalid price range',
          message: 'Minimum price must be less than maximum price',
          code: 'INVALID_PRICE_RANGE'
        }, { status: 400 });
      }
    }

    // Same pickup/dropoff validation for one-way rentals
    if (!validatedQuery.options?.oneWayRental && validatedQuery.dropoffLocation) {
      if (validatedQuery.pickupLocation.name.toLowerCase().trim() === 
          validatedQuery.dropoffLocation.name.toLowerCase().trim()) {
        // This is fine for round-trip rentals
      }
    }

    // Track API usage for monitoring
    try {
      const apiMonitor = new APIMonitor();
      await apiMonitor.trackUsage({
        apiName: 'car-rental/search',
        endpoint: '/api/car-rental/search',
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

    // Create car rental search service and perform search
    const carRentalSearchService = createCarRentalSearchService({
      // API keys will be provided by user later for real integration
      // carTrawler: { apiKey: process.env.CARTRAWLER_API_KEY || '' },
      // hertz: { apiKey: process.env.HERTZ_API_KEY || '' },
      // avis: { apiKey: process.env.AVIS_API_KEY || '' },
      // uber: { apiKey: process.env.UBER_API_KEY || '' },
      // lyft: { apiKey: process.env.LYFT_API_KEY || '' }
    });

    const searchResults = await carRentalSearchService.searchCarRentals(validatedQuery);

    // Enhanced logging with rental metadata
    await logApiRequest({
      requestId,
      endpoint: '/api/car-rental/search',
      method: 'POST',
      clientIP,
      userId,
      duration: Date.now() - startTime,
      status: 200,
      metadata: {
        pickupLocation: validatedQuery.pickupLocation.name,
        dropoffLocation: validatedQuery.dropoffLocation?.name || 'Same as pickup',
        pickupDate: validatedQuery.pickupDateTime,
        dropoffDate: validatedQuery.dropoffDateTime,
        rentalDays: daysDiff,
        driverAge: validatedQuery.driverAge,
        vehicleCategories: validatedQuery.preferences?.vehicleCategories || 'all',
        oneWayRental: validatedQuery.options?.oneWayRental || false,
        includeRideSharing: validatedQuery.options?.includeRideSharing || false,
        rentalOffersFound: searchResults.carRentals.length,
        rideShareOffersFound: searchResults.rideShares?.length || 0,
        providers: searchResults.meta.providers,
        cacheHit: searchResults.meta.cacheHit,
        searchTime: searchResults.meta.searchTime
      }
    });

    // Return enhanced search results
    return NextResponse.json({
      success: true,
      requestId,
      data: searchResults,
      meta: {
        ...searchResults.meta,
        requestProcessingTime: Date.now() - startTime,
        apiVersion: '2.4.0',
        timestamp: new Date().toISOString(),
        features: [
          'multi-provider-aggregation',
          'real-time-availability',
          'price-comparison',
          'insurance-options',
          'ride-sharing-integration',
          'one-way-rentals'
        ],
        rentalPeriod: {
          days: daysDiff,
          hours: Math.round(hoursDiff * 10) / 10,
          type: validatedQuery.options?.oneWayRental ? 'one-way' : 'round-trip'
        }
      }
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': (RATE_LIMIT_CONFIG.maxRequests - (rateLimitStore.get(clientIP)?.count || 0)).toString(),
        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_CONFIG.windowMs) / 1000).toString(),
        'Cache-Control': 'public, max-age=1800', // 30 minutes client-side cache
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    console.error('Car rental search API error:', {
      requestId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });

    // Log error
    await logApiRequest({
      requestId,
      endpoint: '/api/car-rental/search',
      method: 'POST',
      clientIP: request.headers.get('x-forwarded-for') || 'unknown',
      userId: null,
      duration: Date.now() - startTime,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return error response
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while searching for car rentals',
      code: 'INTERNAL_ERROR',
      requestId,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'X-Request-ID': requestId,
        'Content-Type': 'application/json'
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'false'
    }
  });
}