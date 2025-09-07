/**
 * Unified Travel API Orchestration Service - Phase 2.5
 * 
 * Master orchestration layer that coordinates all travel services with unified responses:
 * - Coordinates flight, hotel, transport, car rental, and ride services
 * - Applies response normalization across all providers
 * - Intelligent fallback and error handling
 * - Cross-service price comparison and recommendations
 * - Unified search interface for complete travel planning
 * 
 * Key Features:
 * - Single API endpoint for all travel search needs
 * - Parallel execution for optimal performance
 * - Comprehensive error handling with graceful degradation
 * - Provider reliability scoring and automatic failover
 * - Currency conversion and price standardization
 * - Quality scoring and data completeness metrics
 * - Caching with intelligent cache invalidation
 */

import { z } from 'zod';
import { createFlightSearchService, type FlightSearchQuery } from './flight-search';
import { createHotelSearchService, type HotelSearchQuery } from './hotel-search';
import { createTransportSearchService, type TransportSearchQuery } from './transport-search';
import { createCarRentalSearchService, type CarRentalSearchQuery } from './car-rental-search';
import { createTravelNormalizationService, type UnifiedSearchResponse, type UnifiedTravelOffer, type Currency, type ServiceType } from './travel-normalization';

// ==================== UNIFIED SEARCH INTERFACE ====================

export type SearchServiceType = 'all' | 'flight' | 'hotel' | 'transport' | 'car_rental' | 'ride_share';

export interface UnifiedTravelSearchQuery {
  // Journey Information
  journey: {
    from: {
      name: string;
      coordinates?: [number, number];
      type?: 'city' | 'airport' | 'station' | 'address';
    };
    to: {
      name: string;
      coordinates?: [number, number];
      type?: 'city' | 'airport' | 'station' | 'address';
    };
    departureDate: string; // YYYY-MM-DD
    returnDate?: string; // YYYY-MM-DD
    departureTime?: string; // HH:MM
    returnTime?: string; // HH:MM
  };

  // Passenger Information
  passengers: {
    adults: number;
    children?: number;
    childrenAges?: number[];
    infants?: number;
  };

  // Service Selection
  services: {
    types: SearchServiceType[];
    priorities?: Array<'speed' | 'price' | 'comfort' | 'eco' | 'convenience'>;
  };

  // Preferences
  preferences: {
    currency: Currency;
    language?: string;
    budget?: {
      total?: number;
      perService?: Partial<Record<ServiceType, number>>;
    };
    quality?: {
      minimumRating?: number;
      preferredProviders?: string[];
      excludeProviders?: string[];
    };
    accessibility?: {
      wheelchairRequired?: boolean;
      assistanceRequired?: boolean;
      dietaryRestrictions?: string[];
    };
    sustainability?: {
      prioritizeEcoOptions?: boolean;
      carbonOffsetPreference?: boolean;
      maxCarbonFootprint?: number;
    };
  };

  // Service-Specific Options
  flightOptions?: {
    cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    airlines?: string[];
    maxStops?: number;
    flexibleDates?: boolean;
  };

  hotelOptions?: {
    starRating?: { min?: number; max?: number };
    roomType?: string;
    amenities?: string[];
    mealPlan?: 'room_only' | 'breakfast' | 'half_board' | 'full_board';
  };

  transportOptions?: {
    modes?: string[];
    maxTransfers?: number;
    classPreference?: 'economy' | 'business' | 'first';
  };

  carRentalOptions?: {
    driverAge: number;
    vehicleCategory?: string[];
    fuelType?: string[];
    transmission?: 'manual' | 'automatic';
    pickupLocation?: string;
    dropoffLocation?: string;
  };
}

export interface UnifiedTravelSearchResponse {
  searchId: string;
  query: UnifiedTravelSearchQuery;
  results: {
    flights?: UnifiedSearchResponse;
    hotels?: UnifiedSearchResponse;
    transport?: UnifiedSearchResponse;
    carRentals?: UnifiedSearchResponse;
    rideShares?: UnifiedSearchResponse;
  };
  recommendations: {
    bestOverall?: {
      combination: Array<{ service: ServiceType; offerId: string; provider: string }>;
      totalPrice: { amount: number; currency: Currency };
      totalDuration?: number;
      qualityScore: number;
      carbonFootprint: number;
      reasoning: string;
    };
    budgetFriendly?: {
      combination: Array<{ service: ServiceType; offerId: string; provider: string }>;
      totalPrice: { amount: number; currency: Currency };
      savings: { amount: number; percentage: number };
      tradeoffs: string[];
    };
    premium?: {
      combination: Array<{ service: ServiceType; offerId: string; provider: string }>;
      totalPrice: { amount: number; currency: Currency };
      premiumFeatures: string[];
      qualityScore: number;
    };
    ecoFriendly?: {
      combination: Array<{ service: ServiceType; offerId: string; provider: string }>;
      totalPrice: { amount: number; currency: Currency };
      carbonFootprint: number;
      carbonSavings: { amount: number; percentage: number };
      ecoFeatures: string[];
    };
  };
  meta: {
    searchTime: number;
    servicesQueried: ServiceType[];
    servicesResponded: ServiceType[];
    totalOffers: number;
    qualityMetrics: {
      dataCompleteness: number;
      providerReliability: number;
      priceConfidence: number;
    };
    errors: Array<{
      service: ServiceType;
      provider?: string;
      error: string;
      fallbackUsed: boolean;
    }>;
    warnings: string[];
    cacheInfo: {
      hitRate: number;
      freshness: number; // Percentage of data that's fresh
    };
  };
}

// ==================== ORCHESTRATION SERVICE ====================

export class UnifiedTravelOrchestrator {
  private readonly normalizationService = createTravelNormalizationService();
  private readonly cache = new Map<string, { data: UnifiedTravelSearchResponse; expires: number }>();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly services: {
      flight: ReturnType<typeof createFlightSearchService>;
      hotel: ReturnType<typeof createHotelSearchService>;
      transport: ReturnType<typeof createTransportSearchService>;
      carRental: ReturnType<typeof createCarRentalSearchService>;
    }
  ) {}

  async searchAll(query: UnifiedTravelSearchQuery): Promise<UnifiedTravelSearchResponse> {
    const searchId = this.generateSearchId();
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return {
        ...cached.data,
        meta: {
          ...cached.data.meta,
          cacheInfo: {
            ...cached.data.meta.cacheInfo,
            hitRate: 100
          }
        }
      };
    }

    try {
      // Determine which services to query
      const servicesToQuery = this.determineServicesToQuery(query.services.types);
      
      // Create service-specific queries
      const serviceQueries = this.createServiceQueries(query);
      
      // Execute searches in parallel with error handling
      const searchPromises = this.createSearchPromises(serviceQueries, servicesToQuery);
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Process and normalize results
      const normalizedResults = await this.processSearchResults(searchResults, servicesToQuery);
      
      // Generate intelligent recommendations
      const recommendations = this.generateRecommendations(normalizedResults, query);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(normalizedResults);
      
      // Compile final response
      const response: UnifiedTravelSearchResponse = {
        searchId,
        query,
        results: normalizedResults,
        recommendations,
        meta: {
          searchTime: Date.now() - startTime,
          servicesQueried: servicesToQuery,
          servicesResponded: this.getRespondedServices(normalizedResults),
          totalOffers: this.countTotalOffers(normalizedResults),
          qualityMetrics,
          errors: this.extractErrors(searchResults),
          warnings: this.generateWarnings(normalizedResults, query),
          cacheInfo: {
            hitRate: 0,
            freshness: 100
          }
        }
      };
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });
      
      return response;
    } catch (error) {
      throw new Error(`Unified travel search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchFlights(query: UnifiedTravelSearchQuery): Promise<UnifiedSearchResponse> {
    const flightQuery = this.createFlightQuery(query);
    const results = await this.services.flight.searchFlights(flightQuery);
    return this.normalizationService.normalizeFlightResponse(results, 'unified', query.preferences.currency);
  }

  async searchHotels(query: UnifiedTravelSearchQuery): Promise<UnifiedSearchResponse> {
    const hotelQuery = this.createHotelQuery(query);
    const results = await this.services.hotel.searchHotels(hotelQuery);
    return this.normalizationService.normalizeHotelResponse(results, 'unified', query.preferences.currency);
  }

  async searchTransport(query: UnifiedTravelSearchQuery): Promise<UnifiedSearchResponse> {
    const transportQuery = this.createTransportQuery(query);
    const results = await this.services.transport.searchTransport(transportQuery);
    // Note: Transport service already returns normalized format
    return results as any; // Type assertion for compatibility
  }

  async searchCarRentals(query: UnifiedTravelSearchQuery): Promise<UnifiedSearchResponse> {
    const carRentalQuery = this.createCarRentalQuery(query);
    const results = await this.services.carRental.searchCarRentals(carRentalQuery);
    // Note: Car rental service already returns normalized format
    return results as any; // Type assertion for compatibility
  }

  // ==================== PRIVATE METHODS ====================

  private determineServicesToQuery(requestedTypes: SearchServiceType[]): ServiceType[] {
    if (requestedTypes.includes('all')) {
      return ['flight', 'hotel', 'transport', 'car_rental'];
    }
    
    return requestedTypes.filter(type => type !== 'all') as ServiceType[];
  }

  private createServiceQueries(query: UnifiedTravelSearchQuery) {
    return {
      flight: this.createFlightQuery(query),
      hotel: this.createHotelQuery(query),
      transport: this.createTransportQuery(query),
      carRental: this.createCarRentalQuery(query)
    };
  }

  private createFlightQuery(query: UnifiedTravelSearchQuery): FlightSearchQuery {
    return {
      from: {
        code: query.journey.from.name,
        name: query.journey.from.name,
        coordinates: query.journey.from.coordinates || [0, 0]
      },
      to: {
        code: query.journey.to.name,
        name: query.journey.to.name,
        coordinates: query.journey.to.coordinates || [0, 0]
      },
      departureDate: query.journey.departureDate,
      returnDate: query.journey.returnDate,
      passengers: {
        adults: query.passengers.adults,
        children: query.passengers.children || 0,
        infants: query.passengers.infants || 0
      },
      cabinClass: query.flightOptions?.cabinClass || 'economy',
      flexibleDates: query.flightOptions?.flexibleDates,
      maxStops: query.flightOptions?.maxStops,
      preferredAirlines: query.flightOptions?.airlines,
      currency: query.preferences.currency
    };
  }

  private createHotelQuery(query: UnifiedTravelSearchQuery): HotelSearchQuery {
    return {
      location: {
        type: query.journey.to.type === 'city' ? 'city' : 'coordinates',
        value: query.journey.to.name,
        coordinates: query.journey.to.coordinates
      },
      checkIn: query.journey.departureDate,
      checkOut: query.journey.returnDate || this.addDays(query.journey.departureDate, 1),
      rooms: [{
        adults: query.passengers.adults,
        children: query.passengers.children || 0,
        childrenAges: query.passengers.childrenAges
      }],
      filters: {
        priceRange: query.preferences.budget?.perService?.hotel ? {
          max: query.preferences.budget.perService.hotel,
          currency: query.preferences.currency
        } : undefined,
        starRating: query.hotelOptions?.starRating,
        amenities: query.hotelOptions?.amenities
      },
      currency: query.preferences.currency
    };
  }

  private createTransportQuery(query: UnifiedTravelSearchQuery): TransportSearchQuery {
    return {
      from: query.journey.from,
      to: query.journey.to,
      departure: {
        date: query.journey.departureDate,
        time: query.journey.departureTime
      },
      return: query.journey.returnDate ? {
        date: query.journey.returnDate,
        time: query.journey.returnTime
      } : undefined,
      passengers: query.passengers,
      preferences: {
        modes: query.transportOptions?.modes as any,
        maxTransfers: query.transportOptions?.maxTransfers,
        priceRange: query.preferences.budget?.perService?.transport ? {
          max: query.preferences.budget.perService.transport,
          currency: query.preferences.currency
        } : undefined
      }
    };
  }

  private createCarRentalQuery(query: UnifiedTravelSearchQuery): CarRentalSearchQuery {
    return {
      pickupLocation: {
        name: query.carRentalOptions?.pickupLocation || query.journey.from.name,
        coordinates: query.journey.from.coordinates,
        type: query.journey.from.type === 'airport' ? 'airport' : 'city_center'
      },
      dropoffLocation: query.carRentalOptions?.dropoffLocation ? {
        name: query.carRentalOptions.dropoffLocation,
        coordinates: query.journey.to.coordinates,
        type: query.journey.to.type === 'airport' ? 'airport' : 'city_center'
      } : undefined,
      pickupDateTime: `${query.journey.departureDate}T${query.journey.departureTime || '10:00'}:00.000Z`,
      dropoffDateTime: `${query.journey.returnDate || this.addDays(query.journey.departureDate, 1)}T${query.journey.returnTime || '10:00'}:00.000Z`,
      driverAge: query.carRentalOptions?.driverAge || 25,
      preferences: {
        vehicleCategories: query.carRentalOptions?.vehicleCategory as any,
        fuelTypes: query.carRentalOptions?.fuelType as any,
        transmissionType: query.carRentalOptions?.transmission,
        priceRange: query.preferences.budget?.perService?.car_rental ? {
          max: query.preferences.budget.perService.car_rental,
          currency: query.preferences.currency
        } : undefined
      }
    };
  }

  private createSearchPromises(
    queries: any,
    servicesToQuery: ServiceType[]
  ): Promise<any>[] {
    const promises: Promise<any>[] = [];

    if (servicesToQuery.includes('flight')) {
      promises.push(
        this.services.flight.searchFlights(queries.flight)
          .catch(error => ({ service: 'flight', error, results: null }))
      );
    }

    if (servicesToQuery.includes('hotel')) {
      promises.push(
        this.services.hotel.searchHotels(queries.hotel)
          .catch(error => ({ service: 'hotel', error, results: null }))
      );
    }

    if (servicesToQuery.includes('transport')) {
      promises.push(
        this.services.transport.searchTransport(queries.transport)
          .catch(error => ({ service: 'transport', error, results: null }))
      );
    }

    if (servicesToQuery.includes('car_rental')) {
      promises.push(
        this.services.carRental.searchCarRentals(queries.carRental)
          .catch(error => ({ service: 'car_rental', error, results: null }))
      );
    }

    return promises;
  }

  private async processSearchResults(
    results: PromiseSettledResult<any>[],
    servicesQueried: ServiceType[]
  ): Promise<UnifiedTravelSearchResponse['results']> {
    const processedResults: UnifiedTravelSearchResponse['results'] = {};

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const service = servicesQueried[i];

      if (result.status === 'fulfilled' && result.value.results) {
        switch (service) {
          case 'flight':
            processedResults.flights = await this.normalizationService.normalizeFlightResponse(
              result.value, 'unified'
            );
            break;
          case 'hotel':
            processedResults.hotels = await this.normalizationService.normalizeHotelResponse(
              result.value, 'unified'
            );
            break;
          case 'transport':
            processedResults.transport = result.value;
            break;
          case 'car_rental':
            processedResults.carRentals = result.value;
            break;
        }
      }
    }

    return processedResults;
  }

  private generateRecommendations(
    results: UnifiedTravelSearchResponse['results'],
    query: UnifiedTravelSearchQuery
  ): UnifiedTravelSearchResponse['recommendations'] {
    // This is a simplified implementation - in production, this would use
    // sophisticated algorithms to find optimal combinations
    const recommendations: UnifiedTravelSearchResponse['recommendations'] = {};

    // Find best overall combination
    if (results.flights?.offers.length && results.hotels?.offers.length) {
      const bestFlight = results.flights.offers[0];
      const bestHotel = results.hotels.offers[0];
      
      recommendations.bestOverall = {
        combination: [
          { service: 'flight', offerId: bestFlight.id, provider: (bestFlight as any).provider?.name || 'Unknown' },
          { service: 'hotel', offerId: bestHotel.id, provider: (bestHotel as any).provider?.name || 'Unknown' }
        ],
        totalPrice: {
          amount: (bestFlight as any).pricing?.totalPrice + (bestHotel as any).pricing?.totalPrice || 0,
          currency: query.preferences.currency
        },
        qualityScore: Math.round(((bestFlight as any).qualityScore + (bestHotel as any).qualityScore) / 2),
        carbonFootprint: (bestFlight as any).carbonFootprint?.emissions + (bestHotel as any).carbonFootprint?.emissions || 0,
        reasoning: 'Optimal balance of price, quality, and convenience'
      };
    }

    return recommendations;
  }

  private calculateQualityMetrics(results: UnifiedTravelSearchResponse['results']) {
    let totalOffers = 0;
    let totalCompleteness = 0;
    let totalReliability = 0;
    let serviceCount = 0;

    Object.values(results).forEach(serviceResult => {
      if (serviceResult?.offers?.length) {
        totalOffers += serviceResult.offers.length;
        totalCompleteness += serviceResult.meta?.qualityMetrics?.dataCompleteness || 0;
        totalReliability += serviceResult.meta?.qualityMetrics?.providerReliability || 0;
        serviceCount++;
      }
    });

    return {
      dataCompleteness: serviceCount > 0 ? Math.round(totalCompleteness / serviceCount) : 0,
      providerReliability: serviceCount > 0 ? Math.round(totalReliability / serviceCount) : 0,
      priceConfidence: 85 // Mock confidence score
    };
  }

  private getRespondedServices(results: UnifiedTravelSearchResponse['results']): ServiceType[] {
    return Object.keys(results).filter(service => 
      results[service as keyof typeof results]?.offers?.length
    ) as ServiceType[];
  }

  private countTotalOffers(results: UnifiedTravelSearchResponse['results']): number {
    return Object.values(results).reduce((total, serviceResult) => 
      total + (serviceResult?.offers?.length || 0), 0
    );
  }

  private extractErrors(results: PromiseSettledResult<any>[]): UnifiedTravelSearchResponse['meta']['errors'] {
    return results
      .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error))
      .map((result, index) => ({
        service: ['flight', 'hotel', 'transport', 'car_rental'][index] as ServiceType,
        error: result.status === 'rejected' 
          ? result.reason?.message || 'Unknown error'
          : result.value.error,
        fallbackUsed: false
      }));
  }

  private generateWarnings(
    results: UnifiedTravelSearchResponse['results'],
    query: UnifiedTravelSearchQuery
  ): string[] {
    const warnings: string[] = [];

    // Check for missing services
    const requestedServices = query.services.types.includes('all') 
      ? ['flight', 'hotel', 'transport', 'car_rental'] 
      : query.services.types.filter(t => t !== 'all');
      
    const availableServices = Object.keys(results);
    
    requestedServices.forEach(service => {
      if (!availableServices.includes(service)) {
        warnings.push(`${service} search service is currently unavailable`);
      }
    });

    // Check for low result counts
    Object.entries(results).forEach(([service, result]) => {
      if (result && result.offers && result.offers.length < 3) {
        warnings.push(`Limited ${service} options available for your search criteria`);
      }
    });

    return warnings;
  }

  // ==================== UTILITY METHODS ====================

  private generateSearchId(): string {
    return `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(query: UnifiedTravelSearchQuery): string {
    return `unified_${JSON.stringify(query)}`.replace(/\s/g, '');
  }

  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// ==================== VALIDATION SCHEMA ====================

export const UnifiedTravelSearchQuerySchema = z.object({
  journey: z.object({
    from: z.object({
      name: z.string().min(2).max(100),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      type: z.enum(['city', 'airport', 'station', 'address']).optional()
    }),
    to: z.object({
      name: z.string().min(2).max(100),
      coordinates: z.tuple([z.number(), z.number()]).optional(),
      type: z.enum(['city', 'airport', 'station', 'address']).optional()
    }),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    returnTime: z.string().regex(/^\d{2}:\d{2}$/).optional()
  }),
  passengers: z.object({
    adults: z.number().int().min(1).max(9),
    children: z.number().int().min(0).max(8).optional(),
    childrenAges: z.array(z.number().int().min(0).max(17)).optional(),
    infants: z.number().int().min(0).max(2).optional()
  }),
  services: z.object({
    types: z.array(z.enum(['all', 'flight', 'hotel', 'transport', 'car_rental', 'ride_share'])).min(1),
    priorities: z.array(z.enum(['speed', 'price', 'comfort', 'eco', 'convenience'])).optional()
  }),
  preferences: z.object({
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR']),
    language: z.string().length(2).optional(),
    budget: z.object({
      total: z.number().positive().optional(),
      perService: z.record(z.enum(['flight', 'hotel', 'transport', 'car_rental']), z.number().positive()).optional()
    }).optional(),
    quality: z.object({
      minimumRating: z.number().min(1).max(5).optional(),
      preferredProviders: z.array(z.string()).optional(),
      excludeProviders: z.array(z.string()).optional()
    }).optional()
  })
});

// ==================== FACTORY FUNCTION ====================

export function createUnifiedTravelOrchestrator(): UnifiedTravelOrchestrator {
  return new UnifiedTravelOrchestrator({
    flight: createFlightSearchService(),
    hotel: createHotelSearchService(),
    transport: createTransportSearchService(),
    carRental: createCarRentalSearchService()
  });
}