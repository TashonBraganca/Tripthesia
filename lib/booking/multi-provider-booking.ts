'use client';

// Multi-Provider Booking System - Phase 10 Advanced Features
// Unified booking interface for flights, hotels, car rentals, and activities

interface BookingProvider {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'train' | 'bus';
  apiEndpoint: string;
  authConfig: {
    type: 'apikey' | 'oauth' | 'basic';
    credentials: any;
  };
  capabilities: {
    search: boolean;
    book: boolean;
    modify: boolean;
    cancel: boolean;
    realTimeInventory: boolean;
  };
  commission: number; // Percentage
  supportedCurrencies: string[];
  supportedRegions: string[];
}

interface BookingItem {
  id: string;
  providerId: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'train' | 'bus';
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    breakdown: {
      base: number;
      taxes: number;
      fees: number;
      commission: number;
    };
  };
  availability: {
    available: boolean;
    remaining: number;
    expiresAt: Date;
  };
  cancellation: {
    refundable: boolean;
    deadline?: Date;
    penalty?: number;
  };
  supplier: {
    name: string;
    logo?: string;
    rating?: number;
    reviewCount?: number;
  };
  deeplink: string;
  metadata: Record<string, any>;
}

interface BookingRequest {
  tripId: string;
  userId: string;
  items: {
    type: BookingItem['type'];
    searchCriteria: any;
    preferences: any;
  }[];
  totalBudget?: {
    amount: number;
    currency: string;
  };
  bookingWindow: {
    startDate: Date;
    endDate: Date;
  };
  travelerInfo: {
    adults: number;
    children: number;
    infants: number;
  };
  paymentMethod?: {
    type: 'credit_card' | 'debit_card' | 'paypal' | 'wallet';
    token: string;
  };
}

interface BookingResponse {
  requestId: string;
  results: BookingItem[];
  totalResults: number;
  searchTime: number;
  providers: string[];
  filters: {
    priceRange: { min: number; max: number };
    duration: { min: number; max: number };
    rating: { min: number; max: number };
    features: string[];
  };
  recommendations: {
    bestValue: string[];
    quickest: string[];
    mostPopular: string[];
  };
}

interface BookingConfirmation {
  bookingId: string;
  providerId: string;
  referenceNumber: string;
  status: 'confirmed' | 'pending' | 'failed' | 'cancelled';
  items: BookingItem[];
  totalPrice: {
    amount: number;
    currency: string;
    paid: number;
    remaining: number;
  };
  travelerDetails: any;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  confirmationEmail: string;
  vouchers: {
    type: 'pdf' | 'qr' | 'reference';
    url: string;
    validUntil: Date;
  }[];
  cancellationInfo: {
    deadline: Date;
    penalty: number;
    refundAmount: number;
  };
}

class MultiProviderBookingEngine {
  private providers: Map<string, BookingProvider> = new Map();
  private cache = new Map<string, { data: any; expires: Date }>();
  private activeSearches = new Map<string, AbortController>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Flight providers
    this.registerProvider({
      id: 'amadeus',
      name: 'Amadeus GDS',
      type: 'flight',
      apiEndpoint: 'https://api.amadeus.com/v2',
      authConfig: {
        type: 'oauth',
        credentials: {
          clientId: process.env.AMADEUS_CLIENT_ID,
          clientSecret: process.env.AMADEUS_CLIENT_SECRET,
        },
      },
      capabilities: {
        search: true,
        book: true,
        modify: true,
        cancel: true,
        realTimeInventory: true,
      },
      commission: 3.5,
      supportedCurrencies: ['USD', 'EUR', 'INR', 'GBP'],
      supportedRegions: ['global'],
    });

    this.registerProvider({
      id: 'skyscanner',
      name: 'Skyscanner',
      type: 'flight',
      apiEndpoint: 'https://partners.api.skyscanner.net/apiservices',
      authConfig: {
        type: 'apikey',
        credentials: { key: process.env.SKYSCANNER_API_KEY },
      },
      capabilities: {
        search: true,
        book: false,
        modify: false,
        cancel: false,
        realTimeInventory: true,
      },
      commission: 0, // Redirect-based
      supportedCurrencies: ['USD', 'EUR', 'INR', 'GBP'],
      supportedRegions: ['global'],
    });

    // Hotel providers
    this.registerProvider({
      id: 'booking_com',
      name: 'Booking.com',
      type: 'hotel',
      apiEndpoint: 'https://distribution-xml.booking.com',
      authConfig: {
        type: 'basic',
        credentials: {
          username: process.env.BOOKING_USERNAME,
          password: process.env.BOOKING_PASSWORD,
        },
      },
      capabilities: {
        search: true,
        book: true,
        modify: true,
        cancel: true,
        realTimeInventory: true,
      },
      commission: 15,
      supportedCurrencies: ['USD', 'EUR', 'INR', 'GBP'],
      supportedRegions: ['global'],
    });

    // Car rental providers
    this.registerProvider({
      id: 'hertz',
      name: 'Hertz Car Rental',
      type: 'car',
      apiEndpoint: 'https://api.hertz.com/v1',
      authConfig: {
        type: 'apikey',
        credentials: { key: process.env.HERTZ_API_KEY },
      },
      capabilities: {
        search: true,
        book: true,
        modify: true,
        cancel: true,
        realTimeInventory: true,
      },
      commission: 8,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      supportedRegions: ['US', 'EU'],
    });

    // Activity providers
    this.registerProvider({
      id: 'viator',
      name: 'Viator (TripAdvisor)',
      type: 'activity',
      apiEndpoint: 'https://api.viator.com',
      authConfig: {
        type: 'apikey',
        credentials: { key: process.env.VIATOR_API_KEY },
      },
      capabilities: {
        search: true,
        book: true,
        modify: false,
        cancel: true,
        realTimeInventory: true,
      },
      commission: 12,
      supportedCurrencies: ['USD', 'EUR', 'INR', 'GBP'],
      supportedRegions: ['global'],
    });

    console.log(`🏪 Initialized ${this.providers.size} booking providers`);
  }

  registerProvider(provider: BookingProvider): void {
    this.providers.set(provider.id, provider);
  }

  // Main search method
  async searchBookings(request: BookingRequest): Promise<BookingResponse> {
    const startTime = Date.now();
    const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const results: BookingItem[] = [];
      const searchPromises: Promise<BookingItem[]>[] = [];
      const activeProviders: string[] = [];

      // Create abort controller for this search
      const abortController = new AbortController();
      this.activeSearches.set(requestId, abortController);

      // Search across relevant providers
      for (const item of request.items) {
        const relevantProviders = Array.from(this.providers.values()).filter(
          provider => provider.type === item.type
        );

        for (const provider of relevantProviders) {
          activeProviders.push(provider.id);
          searchPromises.push(
            this.searchProvider(provider, item, request, abortController.signal)
          );
        }
      }

      // Wait for all searches with timeout
      const searchResults = await Promise.allSettled(
        searchPromises.map(promise => 
          Promise.race([
            promise,
            new Promise<BookingItem[]>((_, reject) => 
              setTimeout(() => reject(new Error('Search timeout')), 15000)
            )
          ])
        )
      );

      // Collect successful results
      searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          console.warn('Provider search failed:', result.reason);
        }
      });

      // Sort and rank results
      const rankedResults = this.rankResults(results, request);
      const searchTime = Date.now() - startTime;

      // Generate recommendations
      const recommendations = this.generateRecommendations(rankedResults);

      // Calculate filters
      const filters = this.calculateFilters(rankedResults);

      const response: BookingResponse = {
        requestId,
        results: rankedResults,
        totalResults: rankedResults.length,
        searchTime,
        providers: [...new Set(activeProviders)],
        filters,
        recommendations,
      };

      // Cache results
      this.cache.set(requestId, {
        data: response,
        expires: new Date(Date.now() + 300000), // 5 minutes
      });

      console.log(`🔍 Search completed: ${rankedResults.length} results in ${searchTime}ms`);
      return response;

    } catch (error) {
      console.error('Multi-provider search failed:', error);
      throw error;
    } finally {
      this.activeSearches.delete(requestId);
    }
  }

  // Search individual provider
  private async searchProvider(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    try {
      // Check cache first
      const cacheKey = `${provider.id}_${JSON.stringify(item.searchCriteria)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > new Date()) {
        return cached.data;
      }

      let results: BookingItem[] = [];

      switch (provider.id) {
        case 'amadeus':
          results = await this.searchAmadeus(provider, item, request, signal);
          break;
        case 'skyscanner':
          results = await this.searchSkyscanner(provider, item, request, signal);
          break;
        case 'booking_com':
          results = await this.searchBookingCom(provider, item, request, signal);
          break;
        case 'hertz':
          results = await this.searchHertz(provider, item, request, signal);
          break;
        case 'viator':
          results = await this.searchViator(provider, item, request, signal);
          break;
        default:
          results = await this.searchGenericProvider(provider, item, request, signal);
      }

      // Cache results
      this.cache.set(cacheKey, {
        data: results,
        expires: new Date(Date.now() + 180000), // 3 minutes
      });

      return results;

    } catch (error) {
      if (signal.aborted) {
        throw new Error('Search cancelled');
      }
      console.error(`Provider ${provider.id} search failed:`, error);
      return [];
    }
  }

  private async searchAmadeus(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    // Simulate Amadeus flight search
    if (item.type !== 'flight') return [];

    const { origin, destination, departureDate, returnDate, adults = 1 } = item.searchCriteria;
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    if (signal.aborted) throw new Error('Cancelled');

    // Generate mock flight results
    const flights: BookingItem[] = [];
    const airlines = ['AA', 'DL', 'UA', 'BA', 'LH', 'AF'];
    const basePrice = 300 + Math.random() * 800;

    for (let i = 0; i < 5 + Math.floor(Math.random() * 8); i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const priceVariation = 0.8 + Math.random() * 0.4; // ±20% price variation
      const price = Math.round(basePrice * priceVariation);

      flights.push({
        id: `amadeus_flight_${i}_${Date.now()}`,
        providerId: provider.id,
        type: 'flight',
        title: `${airline} ${Math.floor(1000 + Math.random() * 9000)}`,
        description: `${origin} to ${destination}`,
        price: {
          amount: price,
          currency: 'USD',
          breakdown: {
            base: Math.round(price * 0.8),
            taxes: Math.round(price * 0.15),
            fees: Math.round(price * 0.05),
            commission: Math.round(price * provider.commission / 100),
          },
        },
        availability: {
          available: true,
          remaining: Math.floor(1 + Math.random() * 9),
          expiresAt: new Date(Date.now() + 1800000), // 30 minutes
        },
        cancellation: {
          refundable: Math.random() > 0.3,
          deadline: new Date(Date.now() + 86400000), // 24 hours
          penalty: Math.random() > 0.5 ? Math.round(price * 0.1) : 0,
        },
        supplier: {
          name: `${airline} Airlines`,
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: Math.floor(100 + Math.random() * 5000),
        },
        deeplink: `https://amadeus.com/book?flight=${airline}${i}`,
        metadata: {
          duration: Math.floor(120 + Math.random() * 480), // 2-10 hours
          stops: Math.random() > 0.6 ? Math.floor(1 + Math.random() * 2) : 0,
          aircraft: `${airline}-${Math.floor(100 + Math.random() * 899)}`,
        },
      });
    }

    return flights;
  }

  private async searchSkyscanner(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    // Simulate Skyscanner search (similar to Amadeus but different pricing/results)
    if (item.type !== 'flight') return [];
    
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    if (signal.aborted) throw new Error('Cancelled');

    // Generate mock results with different pricing strategy
    return this.generateMockFlights(provider, item, 'skyscanner', 0.9); // Slightly cheaper
  }

  private async searchBookingCom(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    if (item.type !== 'hotel') return [];
    
    const { destination, checkIn, checkOut, rooms = 1, adults = 2 } = item.searchCriteria;
    
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 2000));
    
    if (signal.aborted) throw new Error('Cancelled');

    const hotels: BookingItem[] = [];
    const hotelNames = ['Grand Plaza', 'City Center Inn', 'Luxury Resort', 'Budget Stay', 'Boutique Hotel'];
    const basePrice = 80 + Math.random() * 300;

    for (let i = 0; i < 8 + Math.floor(Math.random() * 12); i++) {
      const hotelName = hotelNames[Math.floor(Math.random() * hotelNames.length)];
      const priceVariation = 0.7 + Math.random() * 0.6; // More price variation for hotels
      const price = Math.round(basePrice * priceVariation * rooms);

      hotels.push({
        id: `booking_hotel_${i}_${Date.now()}`,
        providerId: provider.id,
        type: 'hotel',
        title: `${hotelName} ${destination}`,
        description: `${Math.floor(3 + Math.random() * 2)}-star hotel in ${destination}`,
        price: {
          amount: price,
          currency: 'USD',
          breakdown: {
            base: Math.round(price * 0.85),
            taxes: Math.round(price * 0.12),
            fees: Math.round(price * 0.03),
            commission: Math.round(price * provider.commission / 100),
          },
        },
        availability: {
          available: true,
          remaining: Math.floor(1 + Math.random() * 5),
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        cancellation: {
          refundable: Math.random() > 0.4,
          deadline: new Date(new Date(checkIn).getTime() - 86400000), // 1 day before
          penalty: Math.random() > 0.6 ? Math.round(price * 0.15) : 0,
        },
        supplier: {
          name: hotelName,
          rating: 2.5 + Math.random() * 2.5,
          reviewCount: Math.floor(50 + Math.random() * 2000),
        },
        deeplink: `https://booking.com/hotel?id=${i}`,
        metadata: {
          amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'].slice(0, Math.floor(1 + Math.random() * 5)),
          location: `${Math.random() * 10} km from center`,
          checkIn: '15:00',
          checkOut: '12:00',
        },
      });
    }

    return hotels;
  }

  private async searchHertz(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    if (item.type !== 'car') return [];
    
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1200));
    
    if (signal.aborted) throw new Error('Cancelled');

    const cars: BookingItem[] = [];
    const carTypes = ['Economy', 'Compact', 'Intermediate', 'Full Size', 'Premium', 'Luxury'];
    const brands = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes'];

    for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) {
      const carType = carTypes[Math.floor(Math.random() * carTypes.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const dailyRate = 30 + Math.random() * 100 + (i * 15);

      cars.push({
        id: `hertz_car_${i}_${Date.now()}`,
        providerId: provider.id,
        type: 'car',
        title: `${brand} ${carType}`,
        description: `${carType} car rental`,
        price: {
          amount: Math.round(dailyRate),
          currency: 'USD',
          breakdown: {
            base: Math.round(dailyRate * 0.8),
            taxes: Math.round(dailyRate * 0.15),
            fees: Math.round(dailyRate * 0.05),
            commission: Math.round(dailyRate * provider.commission / 100),
          },
        },
        availability: {
          available: true,
          remaining: Math.floor(2 + Math.random() * 8),
          expiresAt: new Date(Date.now() + 7200000), // 2 hours
        },
        cancellation: {
          refundable: true,
          deadline: new Date(Date.now() + 172800000), // 2 days
          penalty: 0,
        },
        supplier: {
          name: 'Hertz',
          rating: 4.1 + Math.random() * 0.8,
          reviewCount: Math.floor(500 + Math.random() * 3000),
        },
        deeplink: `https://hertz.com/book?car=${i}`,
        metadata: {
          transmission: Math.random() > 0.3 ? 'Automatic' : 'Manual',
          fuelType: Math.random() > 0.1 ? 'Gasoline' : 'Electric',
          seats: Math.floor(2 + Math.random() * 6),
          features: ['AC', 'GPS', 'Bluetooth'].slice(0, Math.floor(1 + Math.random() * 3)),
        },
      });
    }

    return cars;
  }

  private async searchViator(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    if (item.type !== 'activity') return [];
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1800));
    
    if (signal.aborted) throw new Error('Cancelled');

    const activities: BookingItem[] = [];
    const activityTypes = ['City Tour', 'Museum Visit', 'Adventure Activity', 'Food Experience', 'Cultural Experience'];
    const { destination } = item.searchCriteria;

    for (let i = 0; i < 6 + Math.floor(Math.random() * 10); i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const price = 25 + Math.random() * 200;

      activities.push({
        id: `viator_activity_${i}_${Date.now()}`,
        providerId: provider.id,
        type: 'activity',
        title: `${activityType} in ${destination}`,
        description: `Experience the best of ${destination} with this ${activityType.toLowerCase()}`,
        price: {
          amount: Math.round(price),
          currency: 'USD',
          breakdown: {
            base: Math.round(price * 0.88),
            taxes: Math.round(price * 0.08),
            fees: Math.round(price * 0.04),
            commission: Math.round(price * provider.commission / 100),
          },
        },
        availability: {
          available: true,
          remaining: Math.floor(5 + Math.random() * 20),
          expiresAt: new Date(Date.now() + 1800000), // 30 minutes
        },
        cancellation: {
          refundable: Math.random() > 0.2,
          deadline: new Date(Date.now() + 259200000), // 3 days
          penalty: Math.random() > 0.7 ? Math.round(price * 0.05) : 0,
        },
        supplier: {
          name: `${destination} Tours`,
          rating: 3.8 + Math.random() * 1.2,
          reviewCount: Math.floor(20 + Math.random() * 1500),
        },
        deeplink: `https://viator.com/activity?id=${i}`,
        metadata: {
          duration: `${Math.floor(1 + Math.random() * 8)} hours`,
          groupSize: `Up to ${Math.floor(6 + Math.random() * 20)} people`,
          includes: ['Guide', 'Transport', 'Entry Fees'].slice(0, Math.floor(1 + Math.random() * 3)),
          language: ['English', 'Spanish', 'French'][Math.floor(Math.random() * 3)],
        },
      });
    }

    return activities;
  }

  private async searchGenericProvider(
    provider: BookingProvider,
    item: BookingRequest['items'][0],
    request: BookingRequest,
    signal: AbortSignal
  ): Promise<BookingItem[]> {
    // Generic provider search fallback
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    if (signal.aborted) throw new Error('Cancelled');

    return [];
  }

  private generateMockFlights(provider: BookingProvider, item: any, prefix: string, priceMultiplier = 1): BookingItem[] {
    const { origin, destination } = item.searchCriteria;
    const flights: BookingItem[] = [];
    const airlines = ['AA', 'DL', 'UA', 'WN', 'B6'];
    const basePrice = (250 + Math.random() * 600) * priceMultiplier;

    for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const price = Math.round(basePrice * (0.85 + Math.random() * 0.3));

      flights.push({
        id: `${prefix}_flight_${i}_${Date.now()}`,
        providerId: provider.id,
        type: 'flight',
        title: `${airline} ${Math.floor(1000 + Math.random() * 9000)}`,
        description: `${origin} to ${destination}`,
        price: {
          amount: price,
          currency: 'USD',
          breakdown: {
            base: Math.round(price * 0.82),
            taxes: Math.round(price * 0.13),
            fees: Math.round(price * 0.05),
            commission: Math.round(price * provider.commission / 100),
          },
        },
        availability: {
          available: true,
          remaining: Math.floor(1 + Math.random() * 8),
          expiresAt: new Date(Date.now() + 1800000),
        },
        cancellation: {
          refundable: Math.random() > 0.4,
          deadline: new Date(Date.now() + 86400000),
          penalty: Math.random() > 0.5 ? Math.round(price * 0.12) : 0,
        },
        supplier: {
          name: `${airline} Airlines`,
          rating: 3.2 + Math.random() * 1.6,
          reviewCount: Math.floor(80 + Math.random() * 4000),
        },
        deeplink: `https://${prefix}.com/book?flight=${airline}${i}`,
        metadata: {
          duration: Math.floor(90 + Math.random() * 420),
          stops: Math.random() > 0.7 ? Math.floor(1 + Math.random() * 2) : 0,
          aircraft: `${airline}-${Math.floor(100 + Math.random() * 899)}`,
        },
      });
    }

    return flights;
  }

  // Result ranking and filtering
  private rankResults(results: BookingItem[], request: BookingRequest): BookingItem[] {
    return results.sort((a, b) => {
      // Multi-criteria ranking
      let scoreA = 0;
      let scoreB = 0;

      // Price score (40% weight)
      const priceA = a.price.amount;
      const priceB = b.price.amount;
      const minPrice = Math.min(priceA, priceB);
      const maxPrice = Math.max(priceA, priceB);
      
      scoreA += (1 - (priceA - minPrice) / (maxPrice - minPrice + 1)) * 40;
      scoreB += (1 - (priceB - minPrice) / (maxPrice - minPrice + 1)) * 40;

      // Rating score (30% weight)
      const ratingA = a.supplier.rating || 3;
      const ratingB = b.supplier.rating || 3;
      scoreA += (ratingA / 5) * 30;
      scoreB += (ratingB / 5) * 30;

      // Availability score (20% weight)
      scoreA += (a.availability.remaining / 10) * 20;
      scoreB += (b.availability.remaining / 10) * 20;

      // Cancellation policy score (10% weight)
      scoreA += (a.cancellation.refundable ? 10 : 0);
      scoreB += (b.cancellation.refundable ? 10 : 0);

      return scoreB - scoreA;
    });
  }

  private generateRecommendations(results: BookingItem[]): BookingResponse['recommendations'] {
    if (results.length === 0) {
      return { bestValue: [], quickest: [], mostPopular: [] };
    }

    // Best value: price vs rating optimization
    const bestValue = results
      .sort((a, b) => {
        const valueA = (a.supplier.rating || 3) / a.price.amount;
        const valueB = (b.supplier.rating || 3) / b.price.amount;
        return valueB - valueA;
      })
      .slice(0, 3)
      .map(item => item.id);

    // Quickest: shortest duration/earliest availability
    const quickest = results
      .filter(item => item.metadata?.duration)
      .sort((a, b) => (a.metadata?.duration || 999) - (b.metadata?.duration || 999))
      .slice(0, 3)
      .map(item => item.id);

    // Most popular: highest review count and rating
    const mostPopular = results
      .sort((a, b) => {
        const popularityA = (a.supplier.reviewCount || 0) * (a.supplier.rating || 3);
        const popularityB = (b.supplier.reviewCount || 0) * (b.supplier.rating || 3);
        return popularityB - popularityA;
      })
      .slice(0, 3)
      .map(item => item.id);

    return { bestValue, quickest, mostPopular };
  }

  private calculateFilters(results: BookingItem[]): BookingResponse['filters'] {
    if (results.length === 0) {
      return {
        priceRange: { min: 0, max: 0 },
        duration: { min: 0, max: 0 },
        rating: { min: 0, max: 5 },
        features: [],
      };
    }

    const prices = results.map(r => r.price.amount);
    const durations = results.map(r => r.metadata?.duration || 0).filter(d => d > 0);
    const ratings = results.map(r => r.supplier.rating || 3);
    const features = results.flatMap(r => r.metadata?.amenities || r.metadata?.features || []);

    return {
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      duration: {
        min: durations.length > 0 ? Math.min(...durations) : 0,
        max: durations.length > 0 ? Math.max(...durations) : 0,
      },
      rating: {
        min: Math.min(...ratings),
        max: Math.max(...ratings),
      },
      features: [...new Set(features)].slice(0, 20), // Top 20 unique features
    };
  }

  // Booking confirmation
  async confirmBooking(
    itemIds: string[],
    travelerDetails: any,
    paymentInfo: any
  ): Promise<BookingConfirmation> {
    try {
      // Validate items are still available
      const items: BookingItem[] = [];
      for (const itemId of itemIds) {
        // In a real implementation, re-check availability
        // For now, simulate booking confirmation
      }

      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalPrice = items.reduce((sum, item) => sum + item.price.amount, 0);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const confirmation: BookingConfirmation = {
        bookingId,
        providerId: 'multi_provider',
        referenceNumber: `TR${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'confirmed',
        items,
        totalPrice: {
          amount: totalPrice,
          currency: 'USD',
          paid: totalPrice,
          remaining: 0,
        },
        travelerDetails,
        paymentStatus: 'paid',
        confirmationEmail: travelerDetails.email,
        vouchers: [
          {
            type: 'pdf',
            url: `/api/booking/${bookingId}/voucher.pdf`,
            validUntil: new Date(Date.now() + 31536000000), // 1 year
          },
        ],
        cancellationInfo: {
          deadline: new Date(Date.now() + 86400000), // 24 hours
          penalty: totalPrice * 0.1,
          refundAmount: totalPrice * 0.9,
        },
      };

      console.log(`✅ Booking confirmed: ${bookingId} for $${totalPrice}`);
      return confirmation;

    } catch (error) {
      console.error('Booking confirmation failed:', error);
      throw error;
    }
  }

  // Cancel search
  cancelSearch(requestId: string): void {
    const abortController = this.activeSearches.get(requestId);
    if (abortController) {
      abortController.abort();
      this.activeSearches.delete(requestId);
      console.log(`🚫 Search cancelled: ${requestId}`);
    }
  }

  // Get provider capabilities
  getProviderCapabilities(providerId?: string): BookingProvider[] {
    if (providerId) {
      const provider = this.providers.get(providerId);
      return provider ? [provider] : [];
    }
    return Array.from(this.providers.values());
  }

  // Health check
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'down';
    providers: { id: string; status: string }[];
    cacheSize: number;
    activeSearches: number;
  } {
    return {
      status: 'healthy',
      providers: Array.from(this.providers.values()).map(p => ({
        id: p.id,
        status: 'operational', // Would check actual status
      })),
      cacheSize: this.cache.size,
      activeSearches: this.activeSearches.size,
    };
  }
}

// Singleton instance
const bookingEngine = new MultiProviderBookingEngine();

export { bookingEngine, MultiProviderBookingEngine };
export type { 
  BookingProvider, 
  BookingItem, 
  BookingRequest, 
  BookingResponse, 
  BookingConfirmation 
};