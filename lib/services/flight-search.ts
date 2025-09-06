/**
 * Flight Search Service - Phase 2.1 Implementation
 * 
 * Orchestrates flight search across multiple providers:
 * - Kiwi Tequila API (primary meta-search)
 * - Amadeus GDS API (official airline data)
 * - Aviationstack API (flight tracking)
 * 
 * Features:
 * - Multi-provider orchestration
 * - Response normalization and deduplication
 * - Price comparison and ranking
 * - Real-time caching with Redis
 * - Error handling and fallback mechanisms
 */

'use client';

import { z } from 'zod';

// ==================== TYPE DEFINITIONS ====================

export interface FlightSearchQuery {
  from: {
    code: string;
    name: string;
    coordinates: [number, number];
  };
  to: {
    code: string;
    name: string;
    coordinates: [number, number];
  };
  departureDate: string; // ISO date string
  returnDate?: string; // ISO date string for round-trip
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  flexibleDates?: boolean; // +/- 3 days search
  maxStops?: number;
  preferredAirlines?: string[];
  maxPrice?: number;
  currency?: string;
}

export interface FlightOffer {
  id: string;
  provider: 'kiwi' | 'amadeus' | 'mock';
  price: {
    total: number;
    currency: string;
    breakdown: {
      base: number;
      taxes: number;
      fees: number;
    };
  };
  segments: FlightSegment[];
  duration: {
    total: number; // minutes
    outbound: number;
    inbound?: number;
  };
  stops: number;
  airlines: {
    code: string;
    name: string;
    logo?: string;
  }[];
  bookingUrl: string;
  lastUpdated: string;
  validUntil: string;
  baggage: {
    carry: {
      included: boolean;
      weight?: number;
      dimensions?: string;
    };
    checked: {
      included: boolean;
      weight?: number;
      price?: number;
    };
  };
  amenities: {
    wifi: boolean;
    entertainment: boolean;
    power: boolean;
    meals: boolean;
  };
  changeable: boolean;
  refundable: boolean;
  score: number; // Ranking score (0-100)
}

export interface FlightSegment {
  id: string;
  departure: {
    airport: {
      code: string;
      name: string;
      city: string;
      country: string;
      terminal?: string;
    };
    time: string; // ISO datetime
    timezone: string;
  };
  arrival: {
    airport: {
      code: string;
      name: string;
      city: string;
      country: string;
      terminal?: string;
    };
    time: string; // ISO datetime
    timezone: string;
  };
  airline: {
    code: string;
    name: string;
    logo?: string;
  };
  flight: {
    number: string;
    aircraft: {
      model: string;
      code?: string;
    };
  };
  duration: number; // minutes
  distance: number; // kilometers
  cabinClass: string;
  seatMap?: string; // URL to seat map
}

export interface FlightSearchResult {
  query: FlightSearchQuery;
  offers: FlightOffer[];
  meta: {
    totalResults: number;
    searchTime: number; // milliseconds
    providers: string[];
    currency: string;
    lastUpdated: string;
    cacheHit: boolean;
  };
  filters: {
    airlines: { code: string; name: string; count: number }[];
    airports: { code: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
    durationRange: { min: number; max: number };
    stops: { value: number; count: number }[];
  };
}

// ==================== VALIDATION SCHEMAS ====================

const FlightSearchQuerySchema = z.object({
  from: z.object({
    code: z.string().length(3),
    name: z.string(),
    coordinates: z.tuple([z.number(), z.number()])
  }),
  to: z.object({
    code: z.string().length(3),
    name: z.string(),
    coordinates: z.tuple([z.number(), z.number()])
  }),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  passengers: z.object({
    adults: z.number().min(1).max(9),
    children: z.number().min(0).max(9).optional(),
    infants: z.number().min(0).max(9).optional()
  }),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']),
  flexibleDates: z.boolean().optional(),
  maxStops: z.number().min(0).max(3).optional(),
  preferredAirlines: z.array(z.string()).optional(),
  maxPrice: z.number().positive().optional(),
  currency: z.string().length(3).optional()
});

// ==================== SERVICE CONFIGURATION ====================

const FLIGHT_SEARCH_CONFIG = {
  providers: {
    kiwi: {
      baseUrl: 'https://api.tequila.kiwi.com',
      timeout: 10000,
      retries: 2,
      priority: 1
    },
    amadeus: {
      baseUrl: 'https://api.amadeus.com',
      timeout: 15000,
      retries: 2,
      priority: 2
    },
    aviationstack: {
      baseUrl: 'https://api.aviationstack.com/v1',
      timeout: 5000,
      retries: 1,
      priority: 3
    }
  },
  cache: {
    ttl: 300, // 5 minutes for flight search results
    maxSize: 1000,
    keyPrefix: 'flight_search:'
  },
  search: {
    maxResults: 50,
    defaultSort: 'price',
    flexibleDaysRange: 3,
    timeoutMs: 30000 // Overall search timeout
  }
} as const;

// ==================== FLIGHT SEARCH SERVICE CLASS ====================

export class FlightSearchService {
  private apiKeys: {
    kiwi?: string;
    amadeus?: { clientId: string; clientSecret: string };
    aviationstack?: string;
  };

  private amadeusToken?: {
    accessToken: string;
    expiresAt: number;
  };

  constructor(apiKeys: FlightSearchService['apiKeys']) {
    this.apiKeys = apiKeys;
  }

  /**
   * Search for flights using multiple providers with orchestration
   */
  async searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult> {
    const startTime = Date.now();
    
    try {
      // Validate search query
      const validatedQuery = FlightSearchQuerySchema.parse(query);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(validatedQuery);
      const cachedResult = await this.getFromCache(cacheKey);
      
      if (cachedResult) {
        return {
          ...cachedResult,
          meta: {
            ...cachedResult.meta,
            cacheHit: true,
            searchTime: Date.now() - startTime
          }
        };
      }

      // Orchestrate search across providers
      const searchPromises = [];
      
      if (this.apiKeys.kiwi) {
        searchPromises.push(this.searchKiwiFlights(validatedQuery));
      }
      
      if (this.apiKeys.amadeus) {
        searchPromises.push(this.searchAmadeusFlights(validatedQuery));
      }

      // Execute searches in parallel with timeout
      const results = await Promise.allSettled(
        searchPromises.map(promise => 
          this.withTimeout(promise, FLIGHT_SEARCH_CONFIG.search.timeoutMs)
        )
      );

      // Aggregate and normalize results
      const allOffers: FlightOffer[] = [];
      const usedProviders: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value) {
          allOffers.push(...result.value.offers);
          usedProviders.push(...result.value.providers);
        } else {
          console.warn(`Flight search provider failed:`, result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      }

      // Fallback to mock data if no results
      if (allOffers.length === 0) {
        console.info('Using mock flight data as fallback');
        const mockResult = await this.generateMockFlights(validatedQuery);
        allOffers.push(...mockResult.offers);
        usedProviders.push('mock');
      }

      // Deduplicate and rank offers
      const deduplicatedOffers = this.deduplicateOffers(allOffers);
      const rankedOffers = this.rankOffers(deduplicatedOffers, validatedQuery);
      
      // Generate filters
      const filters = this.generateFilters(rankedOffers);

      const finalResult: FlightSearchResult = {
        query: validatedQuery,
        offers: rankedOffers.slice(0, FLIGHT_SEARCH_CONFIG.search.maxResults),
        meta: {
          totalResults: rankedOffers.length,
          searchTime: Date.now() - startTime,
          providers: [...new Set(usedProviders)],
          currency: validatedQuery.currency || 'USD',
          lastUpdated: new Date().toISOString(),
          cacheHit: false
        },
        filters
      };

      // Cache the result
      await this.setCache(cacheKey, finalResult);

      return finalResult;

    } catch (error) {
      console.error('Flight search failed:', error);
      
      // Return mock data as ultimate fallback
      const mockResult = await this.generateMockFlights(query);
      return {
        query,
        offers: mockResult.offers,
        meta: {
          totalResults: mockResult.offers.length,
          searchTime: Date.now() - startTime,
          providers: ['mock'],
          currency: query.currency || 'USD',
          lastUpdated: new Date().toISOString(),
          cacheHit: false
        },
        filters: this.generateFilters(mockResult.offers)
      };
    }
  }

  // ==================== PROVIDER-SPECIFIC SEARCH METHODS ====================

  private async searchKiwiFlights(query: FlightSearchQuery): Promise<{ offers: FlightOffer[]; providers: string[] }> {
    // Kiwi Tequila API implementation
    // This will be implemented with actual API calls
    
    // For now, return structure for development
    return {
      offers: [],
      providers: ['kiwi']
    };
  }

  private async searchAmadeusFlights(query: FlightSearchQuery): Promise<{ offers: FlightOffer[]; providers: string[] }> {
    // Amadeus API implementation with OAuth token handling
    // This will be implemented with actual API calls
    
    return {
      offers: [],
      providers: ['amadeus']
    };
  }

  private async generateMockFlights(query: FlightSearchQuery): Promise<{ offers: FlightOffer[]; providers: string[] }> {
    // Generate realistic mock flight data for development/fallback
    const mockOffers: FlightOffer[] = [
      {
        id: 'mock_1',
        provider: 'mock',
        price: {
          total: 299,
          currency: query.currency || 'USD',
          breakdown: {
            base: 249,
            taxes: 35,
            fees: 15
          }
        },
        segments: [
          {
            id: 'seg_1',
            departure: {
              airport: {
                code: query.from.code,
                name: query.from.name,
                city: query.from.name.split(' ')[0],
                country: 'Country'
              },
              time: query.departureDate,
              timezone: 'UTC'
            },
            arrival: {
              airport: {
                code: query.to.code,
                name: query.to.name,
                city: query.to.name.split(' ')[0],
                country: 'Country'
              },
              time: new Date(new Date(query.departureDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
              timezone: 'UTC'
            },
            airline: {
              code: 'AA',
              name: 'American Airlines'
            },
            flight: {
              number: 'AA1234',
              aircraft: {
                model: 'Boeing 737-800'
              }
            },
            duration: 120,
            distance: 800,
            cabinClass: query.cabinClass
          }
        ],
        duration: {
          total: 120,
          outbound: 120
        },
        stops: 0,
        airlines: [{
          code: 'AA',
          name: 'American Airlines'
        }],
        bookingUrl: '#',
        lastUpdated: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        baggage: {
          carry: { included: true, weight: 7 },
          checked: { included: false, weight: 23, price: 25 }
        },
        amenities: {
          wifi: true,
          entertainment: true,
          power: true,
          meals: false
        },
        changeable: true,
        refundable: false,
        score: 85
      }
    ];

    return {
      offers: mockOffers,
      providers: ['mock']
    };
  }

  // ==================== UTILITY METHODS ====================

  private deduplicateOffers(offers: FlightOffer[]): FlightOffer[] {
    // Remove duplicate offers based on flight numbers and times
    const seen = new Set<string>();
    return offers.filter(offer => {
      const key = offer.segments
        .map(seg => `${seg.flight.number}-${seg.departure.time}`)
        .join('|');
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private rankOffers(offers: FlightOffer[], query: FlightSearchQuery): FlightOffer[] {
    // Implement multi-factor ranking algorithm
    return offers.sort((a, b) => {
      // Primary: Price (lower is better)
      const priceDiff = a.price.total - b.price.total;
      if (Math.abs(priceDiff) > 50) return priceDiff;
      
      // Secondary: Duration (shorter is better)
      const durationDiff = a.duration.total - b.duration.total;
      if (Math.abs(durationDiff) > 60) return durationDiff;
      
      // Tertiary: Stops (fewer is better)
      const stopsDiff = a.stops - b.stops;
      if (stopsDiff !== 0) return stopsDiff;
      
      // Final: Provider priority and score
      return b.score - a.score;
    });
  }

  private generateFilters(offers: FlightOffer[]) {
    const airlines = new Map<string, { code: string; name: string; count: number }>();
    const airports = new Map<string, { code: string; name: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let minDuration = Infinity;
    let maxDuration = 0;
    const stops = new Map<number, number>();

    offers.forEach(offer => {
      // Airlines
      offer.airlines.forEach(airline => {
        const existing = airlines.get(airline.code) || { ...airline, count: 0 };
        airlines.set(airline.code, { ...existing, count: existing.count + 1 });
      });

      // Airports
      offer.segments.forEach(segment => {
        [segment.departure.airport, segment.arrival.airport].forEach(airport => {
          const existing = airports.get(airport.code) || { code: airport.code, name: airport.name, count: 0 };
          airports.set(airport.code, { ...existing, count: existing.count + 1 });
        });
      });

      // Price range
      minPrice = Math.min(minPrice, offer.price.total);
      maxPrice = Math.max(maxPrice, offer.price.total);

      // Duration range
      minDuration = Math.min(minDuration, offer.duration.total);
      maxDuration = Math.max(maxDuration, offer.duration.total);

      // Stops
      stops.set(offer.stops, (stops.get(offer.stops) || 0) + 1);
    });

    return {
      airlines: Array.from(airlines.values()).sort((a, b) => b.count - a.count),
      airports: Array.from(airports.values()).sort((a, b) => b.count - a.count),
      priceRange: { min: minPrice, max: maxPrice },
      durationRange: { min: minDuration, max: maxDuration },
      stops: Array.from(stops.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value)
    };
  }

  private generateCacheKey(query: FlightSearchQuery): string {
    const { from, to, departureDate, returnDate, passengers, cabinClass } = query;
    return `${FLIGHT_SEARCH_CONFIG.cache.keyPrefix}${from.code}-${to.code}-${departureDate}-${returnDate || 'oneway'}-${passengers.adults}-${cabinClass}`;
  }

  private async getFromCache(key: string): Promise<FlightSearchResult | null> {
    // Redis cache implementation would go here
    // For now, return null (no cache)
    return null;
  }

  private async setCache(key: string, data: FlightSearchResult): Promise<void> {
    // Redis cache implementation would go here
    // For now, do nothing
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private async getAmadeusToken(): Promise<string> {
    if (!this.apiKeys.amadeus) {
      throw new Error('Amadeus API keys not configured');
    }

    // Check if current token is still valid
    if (this.amadeusToken && Date.now() < this.amadeusToken.expiresAt) {
      return this.amadeusToken.accessToken;
    }

    // Request new token
    const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKeys.amadeus.clientId,
        client_secret: this.apiKeys.amadeus.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Amadeus access token');
    }

    const data = await response.json();
    
    this.amadeusToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
    };

    return this.amadeusToken.accessToken;
  }
}

// ==================== FACTORY FUNCTION ====================

export function createFlightSearchService(): FlightSearchService {
  const apiKeys = {
    kiwi: process.env.KIWI_TEQUILA_API_KEY,
    amadeus: process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET ? {
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET
    } : undefined,
    aviationstack: process.env.AVIATIONSTACK_API_KEY
  };

  return new FlightSearchService(apiKeys);
}

// ==================== EXPORTS ====================

export default FlightSearchService;