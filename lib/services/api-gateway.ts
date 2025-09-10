/**
 * Comprehensive API Gateway Service
 * 
 * Central coordination layer for all external API integrations
 * with the TripWizardContext state management system.
 */

import { APIManager, createAPIManager, APIError } from '@/lib/services/api-manager';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { TripFormData, WizardStep } from '@/contexts/TripWizardContext';
import { LocationData } from '@/lib/data/locations';

// ==================== TYPES ====================

interface APIGatewayConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  performanceMonitoring: boolean;
}

interface ServiceProviders {
  flights: APIManager;
  hotels: APIManager;
  activities: APIManager;
  transport: APIManager;
  places: APIManager;
  currency: APIManager;
}

interface TripSearchContext {
  formData: TripFormData;
  currentStep: WizardStep;
  preferences?: UserPreferences;
  budget?: BudgetConstraints;
}

interface UserPreferences {
  travelStyle: 'luxury' | 'budget' | 'mid-range';
  interests: string[];
  accessibility?: AccessibilityNeeds;
  dietary?: DietaryRestrictions;
}

interface BudgetConstraints {
  total: number;
  currency: string;
  allocation: {
    transport: number;
    accommodation: number;
    activities: number;
    food: number;
    misc: number;
  };
}

interface AccessibilityNeeds {
  mobility: boolean;
  vision: boolean;
  hearing: boolean;
  cognitive: boolean;
}

interface DietaryRestrictions {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  halal: boolean;
  kosher: boolean;
  allergies: string[];
}

interface GatewayResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    provider: string;
    responseTime: number;
    cached: boolean;
    apiVersion: string;
    requestId: string;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// ==================== API GATEWAY CLASS ====================

export class APIGatewayService {
  private config: APIGatewayConfig;
  private providers: ServiceProviders;
  private performanceMonitor: typeof PerformanceMonitor;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(config: Partial<APIGatewayConfig> = {}) {
    this.config = {
      maxConcurrentRequests: 10,
      requestTimeout: 15000,
      retryAttempts: 3,
      cacheEnabled: true,
      performanceMonitoring: true,
      ...config
    };

    this.performanceMonitor = PerformanceMonitor;
    this.providers = this.initializeProviders();
  }

  private initializeProviders(): ServiceProviders {
    return {
      flights: createAPIManager('rapidapi', process.env.RAPIDAPI_KEY, {
        timeout: 15000,
        retryAttempts: 2,
        rateLimitMax: 100
      }),
      hotels: createAPIManager('custom', undefined, {
        baseUrl: 'https://api.booking.com/v1',
        timeout: 12000,
        rateLimitMax: 200
      }),
      activities: createAPIManager('custom', undefined, {
        baseUrl: 'https://api.getyourguide.com/partner',
        timeout: 10000,
        rateLimitMax: 150
      }),
      transport: createAPIManager('openrouteservice', process.env.OPENROUTESERVICE_KEY),
      places: createAPIManager('custom', undefined, {
        baseUrl: 'https://maps.googleapis.com/maps/api',
        timeout: 8000,
        rateLimitMax: 300
      }),
      currency: createAPIManager('custom', undefined, {
        baseUrl: 'https://api.exchangerate-api.com/v4',
        timeout: 5000,
        rateLimitMax: 1000
      })
    };
  }

  // ==================== COMPREHENSIVE TRIP SEARCH ====================

  async searchComprehensiveTrip(
    context: TripSearchContext,
    options: {
      includeFlights?: boolean;
      includeHotels?: boolean;
      includeActivities?: boolean;
      includeTransport?: boolean;
    } = {}
  ): Promise<GatewayResponse<ComprehensiveTripData>> {
    const requestId = this.generateRequestId('comprehensive-search');
    const timerKey = 'comprehensive-trip-search';
    
    try {
      this.performanceMonitor.startTimer(timerKey, 'Comprehensive Trip Search', {
        destination: context.formData.to?.name,
        dates: context.formData.dates,
        travelers: context.formData.travelers
      });

      // Parallel search across all services
      const searchPromises: Promise<any>[] = [];
      const searchOptions = {
        includeFlights: true,
        includeHotels: true,
        includeActivities: true,
        includeTransport: true,
        ...options
      };

      if (searchOptions.includeFlights && context.formData.from && context.formData.to) {
        searchPromises.push(this.searchFlights(context));
      }

      if (searchOptions.includeHotels && context.formData.to) {
        searchPromises.push(this.searchHotels(context));
      }

      if (searchOptions.includeActivities && context.formData.to) {
        searchPromises.push(this.searchActivities(context));
      }

      if (searchOptions.includeTransport && context.formData.from && context.formData.to) {
        searchPromises.push(this.searchLocalTransport(context));
      }

      // Execute searches with proper error handling
      const results = await Promise.allSettled(searchPromises);
      
      // Process results and handle partial failures
      const tripData = this.aggregateTripResults(results, searchOptions);
      
      const responseTime = this.performanceMonitor.endTimer(timerKey) || 0;

      return {
        success: true,
        data: tripData,
        metadata: {
          provider: 'api-gateway',
          responseTime,
          cached: false,
          apiVersion: '3.0.0',
          requestId
        }
      };

    } catch (error) {
      const responseTime = this.performanceMonitor.endTimer(timerKey) || 0;
      console.error('[APIGateway] Comprehensive search failed:', error);

      return {
        success: false,
        data: {} as ComprehensiveTripData,
        metadata: {
          provider: 'api-gateway',
          responseTime,
          cached: false,
          apiVersion: '3.0.0',
          requestId
        },
        error: {
          code: 'COMPREHENSIVE_SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: error instanceof APIError ? error.retryable : false
        }
      };
    }
  }

  // ==================== INDIVIDUAL SERVICE METHODS ====================

  async searchFlights(context: TripSearchContext): Promise<FlightSearchResult> {
    const { formData } = context;
    
    if (!formData.from || !formData.to) {
      throw new APIError('Missing flight search parameters', 400, 'api-gateway', false);
    }

    const searchQuery = {
      from: {
        code: formData.from.code || this.extractAirportCode(formData.from.name),
        name: formData.from.name,
        coordinates: formData.from.coordinates || [0, 0]
      },
      to: {
        code: formData.to.code || this.extractAirportCode(formData.to.name),
        name: formData.to.name,
        coordinates: formData.to.coordinates || [0, 0]
      },
      departureDate: formData.dates.startDate,
      returnDate: formData.dates.endDate,
      passengers: {
        adults: Math.max(1, formData.travelers - 1),
        children: formData.travelers > 3 ? 1 : 0,
        infants: 0
      },
      cabinClass: this.determineCabinClass(context.preferences?.travelStyle),
      currency: 'USD'
    };

    const cacheKey = `flights:${JSON.stringify(searchQuery)}`;
    
    try {
      const result = await this.providers.flights.request<any>(
        '/flights/search',
        {
          method: 'POST',
          body: JSON.stringify(searchQuery)
        },
        cacheKey
      );

      return {
        flights: result.flights || [],
        metadata: {
          provider: result.provider || 'unknown',
          searchTime: result.searchTime || 0,
          resultsCount: result.flights?.length || 0
        }
      };
    } catch (error) {
      console.error('[APIGateway] Flight search failed:', error);
      return {
        flights: [],
        metadata: {
          provider: 'error',
          searchTime: 0,
          resultsCount: 0
        }
      };
    }
  }

  async searchHotels(context: TripSearchContext): Promise<HotelSearchResult> {
    const { formData } = context;
    
    if (!formData.to) {
      throw new APIError('Missing hotel search parameters', 400, 'api-gateway', false);
    }

    const searchQuery = {
      destination: formData.to.name,
      coordinates: formData.to.coordinates,
      checkIn: formData.dates.startDate,
      checkOut: formData.dates.endDate,
      guests: formData.travelers,
      rooms: Math.ceil(formData.travelers / 2),
      starRating: this.determineStarRating(context.preferences?.travelStyle),
      maxPrice: context.budget?.allocation.accommodation
    };

    const cacheKey = `hotels:${JSON.stringify(searchQuery)}`;
    
    try {
      const result = await this.providers.hotels.request<any>(
        '/search',
        {
          method: 'POST',
          body: JSON.stringify(searchQuery)
        },
        cacheKey
      );

      return {
        hotels: result.hotels || [],
        metadata: {
          provider: 'booking.com',
          searchTime: 0,
          resultsCount: result.hotels?.length || 0
        }
      };
    } catch (error) {
      console.error('[APIGateway] Hotel search failed:', error);
      return this.generateMockHotels(context);
    }
  }

  async searchActivities(context: TripSearchContext): Promise<ActivitySearchResult> {
    const { formData } = context;
    
    if (!formData.to) {
      throw new APIError('Missing activity search parameters', 400, 'api-gateway', false);
    }

    const searchQuery = {
      destination: formData.to.name,
      coordinates: formData.to.coordinates,
      startDate: formData.dates.startDate,
      endDate: formData.dates.endDate,
      travelers: formData.travelers,
      interests: context.preferences?.interests || [],
      accessibility: context.preferences?.accessibility,
      maxPrice: context.budget?.allocation.activities
    };

    const cacheKey = `activities:${JSON.stringify(searchQuery)}`;
    
    try {
      const result = await this.providers.activities.request<any>(
        '/activities/search',
        {
          method: 'POST',
          body: JSON.stringify(searchQuery)
        },
        cacheKey
      );

      return {
        activities: result.activities || [],
        metadata: {
          provider: 'getyourguide',
          searchTime: 0,
          resultsCount: result.activities?.length || 0
        }
      };
    } catch (error) {
      console.error('[APIGateway] Activity search failed:', error);
      return this.generateMockActivities(context);
    }
  }

  async searchLocalTransport(context: TripSearchContext): Promise<TransportSearchResult> {
    const { formData } = context;
    
    const searchQuery = {
      origin: formData.from?.coordinates,
      destination: formData.to?.coordinates,
      date: formData.dates.startDate,
      travelers: formData.travelers,
      preferences: context.preferences
    };

    const cacheKey = `transport:${JSON.stringify(searchQuery)}`;
    
    try {
      const result = await this.providers.transport.request<any>(
        '/directions/v2/driving-car',
        {
          method: 'POST',
          body: JSON.stringify({
            coordinates: [searchQuery.origin, searchQuery.destination],
            format: 'json',
            instructions: true
          })
        },
        cacheKey
      );

      return {
        options: this.transformTransportResults(result),
        metadata: {
          provider: 'openrouteservice',
          searchTime: 0,
          resultsCount: result.routes?.length || 0
        }
      };
    } catch (error) {
      console.error('[APIGateway] Transport search failed:', error);
      return this.generateMockTransport(context);
    }
  }

  // ==================== DATA TRANSFORMATION ====================

  private aggregateTripResults(
    results: PromiseSettledResult<any>[],
    options: any
  ): ComprehensiveTripData {
    const tripData: ComprehensiveTripData = {
      flights: [],
      hotels: [],
      activities: [],
      transport: [],
      summary: {
        totalResults: 0,
        averagePrice: 0,
        searchTime: 0,
        providersUsed: []
      }
    };

    let totalSearchTime = 0;
    const providersUsed = new Set<string>();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        
        if (index === 0 && options.includeFlights) { // Flights
          tripData.flights = data.flights;
          providersUsed.add(data.metadata?.provider || 'unknown');
          totalSearchTime += data.metadata?.searchTime || 0;
        } else if (index === 1 && options.includeHotels) { // Hotels
          tripData.hotels = data.hotels;
          providersUsed.add(data.metadata?.provider || 'unknown');
          totalSearchTime += data.metadata?.searchTime || 0;
        } else if (index === 2 && options.includeActivities) { // Activities
          tripData.activities = data.activities;
          providersUsed.add(data.metadata?.provider || 'unknown');
          totalSearchTime += data.metadata?.searchTime || 0;
        } else if (index === 3 && options.includeTransport) { // Transport
          tripData.transport = data.options;
          providersUsed.add(data.metadata?.provider || 'unknown');
          totalSearchTime += data.metadata?.searchTime || 0;
        }
      }
    });

    tripData.summary = {
      totalResults: tripData.flights.length + tripData.hotels.length + 
                    tripData.activities.length + tripData.transport.length,
      averagePrice: this.calculateAveragePrice(tripData),
      searchTime: totalSearchTime,
      providersUsed: Array.from(providersUsed)
    };

    return tripData;
  }

  // ==================== UTILITY METHODS ====================

  private extractAirportCode(cityName: string): string {
    // Simple mapping - in production, use a proper airport database
    const airportCodes: Record<string, string> = {
      'New York': 'JFK',
      'London': 'LHR',
      'Paris': 'CDG',
      'Tokyo': 'NRT',
      'Los Angeles': 'LAX',
      'Chicago': 'ORD',
      'Dubai': 'DXB',
      'Singapore': 'SIN'
    };
    
    return airportCodes[cityName] || 'XXX';
  }

  private determineCabinClass(travelStyle?: string): string {
    switch (travelStyle) {
      case 'luxury': return 'business';
      case 'budget': return 'economy';
      default: return 'economy';
    }
  }

  private determineStarRating(travelStyle?: string): number {
    switch (travelStyle) {
      case 'luxury': return 5;
      case 'mid-range': return 4;
      case 'budget': return 3;
      default: return 4;
    }
  }

  private transformTransportResults(openRouteResult: any): TransportOption[] {
    if (!openRouteResult.routes) return [];
    
    return openRouteResult.routes.map((route: any, index: number) => ({
      id: `route-${index}`,
      type: 'driving',
      provider: 'openrouteservice',
      duration: Math.round(route.summary.duration / 60), // Convert to minutes
      distance: Math.round(route.summary.distance / 1000), // Convert to km
      price: this.estimateDrivingCost(route.summary.distance),
      currency: 'USD',
      instructions: route.segments?.map((seg: any) => seg.steps).flat() || []
    }));
  }

  private estimateDrivingCost(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    const costPerKm = 0.15; // $0.15 per km estimation
    return Math.round(distanceKm * costPerKm * 100) / 100;
  }

  private calculateAveragePrice(tripData: ComprehensiveTripData): number {
    const prices: number[] = [];
    
    tripData.flights.forEach(flight => prices.push(flight.price));
    tripData.hotels.forEach(hotel => prices.push(hotel.price));
    tripData.activities.forEach(activity => prices.push(activity.price));
    tripData.transport.forEach(transport => prices.push(transport.price));
    
    if (prices.length === 0) return 0;
    return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  }

  private generateRequestId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== MOCK DATA GENERATORS ====================

  private generateMockHotels(context: TripSearchContext): HotelSearchResult {
    const hotelNames = [
      'Grand Plaza Hotel', 'Luxury Resort & Spa', 'City Center Inn', 'Budget Comfort Lodge',
      'Boutique Design Hotel', 'Seaside Resort', 'Mountain View Lodge', 'Urban Suites'
    ];

    const hotels = Array.from({ length: 6 }, (_, i) => ({
      id: `hotel-${i + 1}`,
      name: hotelNames[i % hotelNames.length],
      starRating: Math.floor(Math.random() * 3) + 3,
      price: 150 + Math.random() * 300,
      currency: 'USD',
      location: {
        address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        coordinates: context.formData.to?.coordinates || [0, 0]
      },
      amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'].slice(0, Math.floor(Math.random() * 4) + 1),
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 1000) + 100,
      images: [`https://picsum.photos/400/300?random=${i + 1}`]
    }));

    return {
      hotels,
      metadata: {
        provider: 'mock',
        searchTime: 500,
        resultsCount: hotels.length
      }
    };
  }

  private generateMockActivities(context: TripSearchContext): ActivitySearchResult {
    const activityTypes = [
      'City Tour', 'Museum Visit', 'Food Experience', 'Adventure Sports',
      'Cultural Experience', 'Nature Walk', 'Art Gallery', 'Local Market Tour'
    ];

    const activities = Array.from({ length: 8 }, (_, i) => ({
      id: `activity-${i + 1}`,
      name: `${activityTypes[i % activityTypes.length]} in ${context.formData.to?.name}`,
      description: `Experience the best of ${context.formData.to?.name} with this curated activity`,
      price: 25 + Math.random() * 200,
      currency: 'USD',
      duration: Math.floor(Math.random() * 6) + 2, // 2-8 hours
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 500) + 50,
      category: activityTypes[i % activityTypes.length].toLowerCase().replace(/\s+/g, '-'),
      images: [`https://picsum.photos/400/300?random=${i + 10}`],
      availability: true
    }));

    return {
      activities,
      metadata: {
        provider: 'mock',
        searchTime: 400,
        resultsCount: activities.length
      }
    };
  }

  private generateMockTransport(context: TripSearchContext): TransportSearchResult {
    const options: TransportOption[] = [
      {
        id: 'drive-1',
        type: 'driving',
        provider: 'mock',
        duration: 180 + Math.random() * 120, // 3-5 hours
        distance: 250 + Math.random() * 200, // 250-450 km
        price: 45 + Math.random() * 30,
        currency: 'USD',
        instructions: ['Head north on Main St', 'Take highway exit', 'Continue for 3 hours']
      },
      {
        id: 'train-1',
        type: 'train',
        provider: 'mock',
        duration: 150 + Math.random() * 60, // 2.5-3.5 hours
        distance: 0, // Not applicable for train
        price: 65 + Math.random() * 40,
        currency: 'USD',
        instructions: ['Board at Central Station', 'Direct service', 'Arrive at destination']
      }
    ];

    return {
      options,
      metadata: {
        provider: 'mock',
        searchTime: 200,
        resultsCount: options.length
      }
    };
  }

  // ==================== CLEANUP ====================

  dispose(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }
}

// ==================== TYPES DEFINITIONS ====================

interface ComprehensiveTripData {
  flights: FlightOption[];
  hotels: HotelOption[];
  activities: ActivityOption[];
  transport: TransportOption[];
  summary: {
    totalResults: number;
    averagePrice: number;
    searchTime: number;
    providersUsed: string[];
  };
}

interface FlightSearchResult {
  flights: FlightOption[];
  metadata: {
    provider: string;
    searchTime: number;
    resultsCount: number;
  };
}

interface HotelSearchResult {
  hotels: HotelOption[];
  metadata: {
    provider: string;
    searchTime: number;
    resultsCount: number;
  };
}

interface ActivitySearchResult {
  activities: ActivityOption[];
  metadata: {
    provider: string;
    searchTime: number;
    resultsCount: number;
  };
}

interface TransportSearchResult {
  options: TransportOption[];
  metadata: {
    provider: string;
    searchTime: number;
    resultsCount: number;
  };
}

interface FlightOption {
  id: string;
  airline: string;
  price: number;
  currency: string;
  duration: string;
  departure: any;
  arrival: any;
  stops: number;
}

interface HotelOption {
  id: string;
  name: string;
  starRating: number;
  price: number;
  currency: string;
  location: any;
  amenities: string[];
  rating: number;
  reviewCount: number;
  images: string[];
}

interface ActivityOption {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  rating: number;
  reviewCount: number;
  category: string;
  images: string[];
  availability: boolean;
}

interface TransportOption {
  id: string;
  type: string;
  provider: string;
  duration: number;
  distance: number;
  price: number;
  currency: string;
  instructions: string[];
}

// ==================== SINGLETON INSTANCE ====================

export const apiGateway = new APIGatewayService({
  performanceMonitoring: true,
  cacheEnabled: true,
  maxConcurrentRequests: 15,
  requestTimeout: 20000
});

export default APIGatewayService;