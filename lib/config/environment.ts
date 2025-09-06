/**
 * Environment validation and configuration utilities
 * Part of Phase 0: API Key Collection & Infrastructure Setup
 */

import { z } from 'zod';

// Environment validation schemas
export const CoreEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  UPSTASH_REDIS_REST_URL: z.string().min(1, 'Redis URL is required'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Redis token is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk public key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
});

export const FlightAPISchema = z.object({
  KIWI_TEQUILA_API_KEY: z.string().optional(),
  AMADEUS_CLIENT_ID: z.string().optional(),
  AMADEUS_CLIENT_SECRET: z.string().optional(),
  AVIATIONSTACK_API_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
});

export const HotelAPISchema = z.object({
  BOOKING_COM_API_KEY: z.string().optional(),
});

export const TransportAPISchema = z.object({
  ROME2RIO_API_KEY: z.string().optional(),
  CARTRAWLER_API_KEY: z.string().optional(),
});

export const MapsAPISchema = z.object({
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export const POIAPISchema = z.object({
  OPENTRIPMAP_API_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),
  YELP_API_KEY: z.string().optional(),
});

export const AIAPISchema = z.object({
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
});

export const AffiliateAPISchema = z.object({
  TRAVELPAYOUTS_API_KEY: z.string().optional(),
  BOOKING_AFFILIATE_ID: z.string().optional(),
  EXPEDIA_PARTNER_ID: z.string().optional(),
  AGODA_PARTNER_ID: z.string().optional(),
});

export const PaymentSchema = z.object({
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_STARTER_PLAN_ID: z.string().optional(),
  RAZORPAY_PRO_PLAN_ID: z.string().optional(),
});

export const MonitoringSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

// Complete environment schema
export const EnvironmentSchema = CoreEnvironmentSchema
  .merge(FlightAPISchema)
  .merge(HotelAPISchema)
  .merge(TransportAPISchema)
  .merge(MapsAPISchema)
  .merge(POIAPISchema)
  .merge(AIAPISchema)
  .merge(AffiliateAPISchema)
  .merge(PaymentSchema)
  .merge(MonitoringSchema);

export type Environment = z.infer<typeof EnvironmentSchema>;

// Environment validation with detailed error reporting
export function validateEnvironment() {
  try {
    const env = EnvironmentSchema.parse(process.env);
    
    // Additional validation logic
    const warnings: string[] = [];
    const criticalMissing: string[] = [];
    
    // Check flight APIs
    if (!env.KIWI_TEQUILA_API_KEY && !env.AMADEUS_CLIENT_ID) {
      criticalMissing.push('No flight search APIs configured (KIWI_TEQUILA_API_KEY or AMADEUS_CLIENT_ID)');
    }
    
    // Check maps APIs
    if (!env.MAPBOX_ACCESS_TOKEN && !env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      warnings.push('No maps APIs configured - map features will be limited');
    }
    
    // Check AI APIs
    if (!env.GOOGLE_GEMINI_API_KEY) {
      warnings.push('Google Gemini API not configured - using OpenAI only');
    }
    
    // Check affiliate APIs
    if (!env.TRAVELPAYOUTS_API_KEY && !env.BOOKING_AFFILIATE_ID) {
      warnings.push('No affiliate APIs configured - no commission tracking');
    }
    
    // Check payment configuration
    if (!env.RAZORPAY_KEY_ID && env.NODE_ENV === 'production') {
      warnings.push('Payment APIs not configured for production');
    }
    
    return {
      success: true,
      env,
      warnings,
      criticalMissing,
      isProduction: env.NODE_ENV === 'production',
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Environment validation failed',
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    
    return {
      success: false,
      error: 'Unknown environment validation error',
      details: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// API availability checker
export class APIAvailabilityChecker {
  private static instance: APIAvailabilityChecker;
  private availabilityCache = new Map<string, { available: boolean; lastChecked: number }>();
  
  public static getInstance(): APIAvailabilityChecker {
    if (!APIAvailabilityChecker.instance) {
      APIAvailabilityChecker.instance = new APIAvailabilityChecker();
    }
    return APIAvailabilityChecker.instance;
  }
  
  async checkAPIAvailability(apiName: string, testEndpoint: string, apiKey?: string): Promise<boolean> {
    const cacheKey = `${apiName}_availability`;
    const cached = this.availabilityCache.get(cacheKey);
    
    // Cache for 5 minutes
    if (cached && Date.now() - cached.lastChecked < 5 * 60 * 1000) {
      return cached.available;
    }
    
    try {
      const headers: HeadersInit = {
        'User-Agent': 'Tripthesia/1.0',
      };
      
      if (apiKey) {
        headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      }
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const available = response.ok || response.status === 401; // 401 means API is up but needs auth
      
      this.availabilityCache.set(cacheKey, {
        available,
        lastChecked: Date.now(),
      });
      
      return available;
      
    } catch (error) {
      console.warn(`API ${apiName} availability check failed:`, error);
      
      this.availabilityCache.set(cacheKey, {
        available: false,
        lastChecked: Date.now(),
      });
      
      return false;
    }
  }
  
  async checkAllAPIs(): Promise<Record<string, boolean>> {
    const env = process.env;
    const checks: Promise<[string, boolean]>[] = [];
    
    // Flight APIs
    if (env.KIWI_TEQUILA_API_KEY) {
      checks.push(
        this.checkAPIAvailability('kiwi_tequila', 'https://api.tequila.kiwi.com/v2/locations/query', env.KIWI_TEQUILA_API_KEY)
          .then(available => ['kiwi_tequila', available])
      );
    }
    
    if (env.AMADEUS_CLIENT_ID) {
      checks.push(
        this.checkAPIAvailability('amadeus', 'https://api.amadeus.com/v1/reference-data/locations')
          .then(available => ['amadeus', available])
      );
    }
    
    // Maps APIs
    if (env.MAPBOX_ACCESS_TOKEN) {
      checks.push(
        this.checkAPIAvailability('mapbox', `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${env.MAPBOX_ACCESS_TOKEN}`)
          .then(available => ['mapbox', available])
      );
    }
    
    // POI APIs
    if (env.OPENTRIPMAP_API_KEY) {
      checks.push(
        this.checkAPIAvailability('opentripmap', `https://api.opentripmap.com/0.1/en/places/autosuggest?name=test&apikey=${env.OPENTRIPMAP_API_KEY}`)
          .then(available => ['opentripmap', available])
      );
    }
    
    if (env.FOURSQUARE_API_KEY) {
      checks.push(
        this.checkAPIAvailability('foursquare', 'https://api.foursquare.com/v3/places/search', env.FOURSQUARE_API_KEY)
          .then(available => ['foursquare', available])
      );
    }
    
    // AI APIs
    if (env.GOOGLE_GEMINI_API_KEY) {
      checks.push(
        this.checkAPIAvailability('gemini', `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_GEMINI_API_KEY}`)
          .then(available => ['gemini', available])
      );
    }
    
    if (env.OPENAI_API_KEY) {
      checks.push(
        this.checkAPIAvailability('openai', 'https://api.openai.com/v1/models', `Bearer ${env.OPENAI_API_KEY}`)
          .then(available => ['openai', available])
      );
    }
    
    const results = await Promise.all(checks);
    return Object.fromEntries(results);
  }
}

// Configuration helpers
export function getAPIConfiguration() {
  const env = process.env;
  
  return {
    flight: {
      primary: env.KIWI_TEQUILA_API_KEY ? 'kiwi_tequila' : env.AMADEUS_CLIENT_ID ? 'amadeus' : null,
      fallback: env.AMADEUS_CLIENT_ID && env.KIWI_TEQUILA_API_KEY ? 'amadeus' : null,
      tracking: env.AVIATIONSTACK_API_KEY ? 'aviationstack' : null,
    },
    
    hotel: {
      primary: env.BOOKING_COM_API_KEY ? 'booking_com' : env.AMADEUS_CLIENT_ID ? 'amadeus' : null,
      fallback: env.AMADEUS_CLIENT_ID && env.BOOKING_COM_API_KEY ? 'amadeus' : null,
    },
    
    transport: {
      multiModal: env.ROME2RIO_API_KEY ? 'rome2rio' : null,
      carRental: env.CARTRAWLER_API_KEY ? 'cartrawler' : null,
    },
    
    maps: {
      primary: env.MAPBOX_ACCESS_TOKEN ? 'mapbox' : env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'google' : null,
      fallback: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && env.MAPBOX_ACCESS_TOKEN ? 'google' : null,
    },
    
    poi: {
      attractions: env.OPENTRIPMAP_API_KEY ? 'opentripmap' : null,
      businesses: env.FOURSQUARE_API_KEY ? 'foursquare' : null,
      restaurants: env.YELP_API_KEY ? 'yelp' : null,
    },
    
    ai: {
      primary: env.GOOGLE_GEMINI_API_KEY ? 'gemini' : 'openai',
      fallback: env.GOOGLE_GEMINI_API_KEY && env.OPENAI_API_KEY ? 'openai' : null,
    },
    
    affiliate: {
      flights: env.TRAVELPAYOUTS_API_KEY ? 'travelpayouts' : null,
      hotels: env.BOOKING_AFFILIATE_ID ? 'booking' : null,
    },
  };
}

export { CoreEnvironmentSchema as default };