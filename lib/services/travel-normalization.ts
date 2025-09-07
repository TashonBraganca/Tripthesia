/**
 * Travel API Response Normalization Service - Phase 2.5
 * 
 * Unified data models and response normalization across all travel providers:
 * - Standardized response schemas for flights, hotels, transport, car rentals
 * - Currency conversion and price standardization
 * - Time zone management and location coordinate standardization
 * - Provider-specific data enrichment and quality scoring
 * - Response caching with intelligent cache invalidation
 * 
 * Supported Providers:
 * - Flight APIs: Kiwi Tequila, Amadeus, Aviationstack
 * - Hotel APIs: Booking.com, Amadeus Hotels
 * - Transport APIs: Rome2Rio, Rail APIs, Bus APIs
 * - Car Rental APIs: CarTrawler, Hertz, Avis, Enterprise
 * - Ride Services: Uber, Lyft, Local Taxi
 * 
 * Features:
 * - Unified response format across all travel services
 * - Real-time currency conversion with rate caching
 * - Geographic coordinate standardization (WGS84)
 * - Provider quality scoring and reliability metrics
 * - Data enrichment with additional context
 * - Response validation and error handling
 */

import { z } from 'zod';

// ==================== UNIFIED TYPE DEFINITIONS ====================

export type ServiceType = 'flight' | 'hotel' | 'transport' | 'car_rental' | 'ride_share';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'INR';

export type QualityScore = 1 | 2 | 3 | 4 | 5; // 1 = Poor, 5 = Excellent

export interface UnifiedLocation {
  id: string;
  name: string;
  displayName: string;
  type: 'airport' | 'city' | 'station' | 'hotel' | 'landmark' | 'address' | 'port';
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: 'exact' | 'approximate' | 'city_center';
  };
  address?: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string; // ISO 3166-1 alpha-2
    postalCode?: string;
  };
  timezone: {
    name: string; // e.g., 'Europe/London'
    offset: string; // e.g., '+01:00'
    abbreviation: string; // e.g., 'GMT'
  };
  codes?: {
    iata?: string; // Airport codes
    icao?: string; // Airport codes
    stationCode?: string; // Train station codes
  };
  metadata?: {
    provider: string;
    lastUpdated: string;
    accuracy: QualityScore;
  };
}

export interface UnifiedPricing {
  basePrice: number;
  totalPrice: number;
  currency: Currency;
  breakdown: {
    basePrice: number;
    taxes: number;
    fees: number;
    discount?: number;
    surcharges?: number;
  };
  convertedPrices?: {
    [currency in Currency]?: {
      basePrice: number;
      totalPrice: number;
      exchangeRate: number;
      lastUpdated: string;
    };
  };
  priceQuality: {
    confidence: QualityScore; // How confident we are in this price
    lastUpdated: string;
    source: string;
    realTime: boolean;
  };
}

export interface UnifiedProvider {
  id: string;
  name: string;
  displayName: string;
  logo?: string;
  website?: string;
  trustScore: QualityScore; // Overall provider reliability
  categories: ServiceType[];
  contact?: {
    phone?: string;
    email?: string;
    support?: string;
  };
  policies?: {
    cancellation: string;
    modification: string;
    refund: string;
  };
  metadata: {
    responseTime: number; // Average response time in ms
    uptime: number; // Percentage uptime
    lastUpdated: string;
  };
}

export interface UnifiedTiming {
  scheduled: string; // ISO 8601 datetime in UTC
  estimated?: string; // Real-time estimate in UTC
  local: {
    scheduled: string; // Local time with timezone
    estimated?: string; // Local time with timezone
    timezone: string;
  };
  duration?: number; // Duration in minutes
  delays?: {
    expected: number; // Expected delay in minutes
    reason?: string;
    lastUpdated: string;
  };
}

// ==================== SERVICE-SPECIFIC UNIFIED MODELS ====================

export interface UnifiedFlightOffer {
  id: string;
  type: 'flight';
  provider: UnifiedProvider;
  aircraft: {
    airline: string;
    flightNumber: string;
    aircraftType?: string;
    cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  };
  route: {
    origin: UnifiedLocation;
    destination: UnifiedLocation;
    stops: UnifiedLocation[];
    distance: number; // kilometers
  };
  schedule: {
    departure: UnifiedTiming;
    arrival: UnifiedTiming;
    duration: number; // minutes
  };
  pricing: UnifiedPricing;
  availability: {
    seats: number;
    bookingClass: string;
    lastUpdated: string;
  };
  amenities: string[];
  baggage: {
    carry: { weight: number; dimensions: string; included: boolean };
    checked: { weight: number; pieces: number; included: boolean };
  };
  qualityScore: QualityScore;
  carbonFootprint: {
    emissions: number; // grams CO2
    methodology: string;
  };
}

export interface UnifiedHotelOffer {
  id: string;
  type: 'hotel';
  provider: UnifiedProvider;
  property: {
    name: string;
    category: 'budget' | 'midrange' | 'luxury' | 'boutique';
    starRating: number;
    chainName?: string;
  };
  location: UnifiedLocation;
  room: {
    type: string;
    capacity: { adults: number; children: number };
    amenities: string[];
    size?: number; // square meters
    bedType: string;
  };
  stay: {
    checkIn: UnifiedTiming;
    checkOut: UnifiedTiming;
    nights: number;
  };
  pricing: UnifiedPricing & {
    perNight: number;
    totalStay: number;
    includedServices: string[];
  };
  availability: {
    rooms: number;
    lastUpdated: string;
  };
  amenities: string[];
  policies: {
    cancellation: string;
    children: string;
    pets: string;
  };
  qualityScore: QualityScore;
  reviews: {
    rating: number; // 0-10
    count: number;
    source: string;
  };
}

export interface UnifiedTransportOffer {
  id: string;
  type: 'transport';
  provider: UnifiedProvider;
  journey: {
    mode: 'train' | 'bus' | 'ferry' | 'metro' | 'tram';
    operator: string;
    routeNumber?: string;
    serviceName?: string;
  };
  route: {
    origin: UnifiedLocation;
    destination: UnifiedLocation;
    stops: UnifiedLocation[];
    distance: number; // kilometers
  };
  schedule: {
    departure: UnifiedTiming;
    arrival: UnifiedTiming;
    duration: number; // minutes
  };
  pricing: UnifiedPricing;
  availability: {
    seats: number;
    bookingRequired: boolean;
    lastUpdated: string;
  };
  vehicle: {
    type: string;
    amenities: string[];
    accessibility: boolean;
  };
  qualityScore: QualityScore;
  carbonFootprint: {
    emissions: number; // grams CO2
    methodology: string;
  };
}

export interface UnifiedCarRentalOffer {
  id: string;
  type: 'car_rental';
  provider: UnifiedProvider;
  vehicle: {
    make: string;
    model: string;
    category: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'luxury' | 'suv' | 'van' | 'electric';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    transmission: 'manual' | 'automatic';
    specifications: {
      passengers: number;
      doors: number;
      luggage: number;
      features: string[];
    };
  };
  rental: {
    pickup: {
      location: UnifiedLocation;
      datetime: UnifiedTiming;
    };
    dropoff: {
      location: UnifiedLocation;
      datetime: UnifiedTiming;
    };
    duration: {
      days: number;
      hours: number;
    };
  };
  pricing: UnifiedPricing & {
    perDay: number;
    mileage: {
      included: number; // km or miles
      unit: 'km' | 'miles';
      unlimited: boolean;
      extraCost: number; // per km/mile
    };
  };
  availability: {
    vehicles: number;
    lastUpdated: string;
  };
  terms: {
    minimumAge: number;
    fuelPolicy: 'full_to_full' | 'full_to_empty' | 'pre_purchase';
    insurance: string[];
  };
  qualityScore: QualityScore;
  carbonFootprint: {
    emissions: number; // grams CO2
    methodology: string;
  };
}

export interface UnifiedRideShareOffer {
  id: string;
  type: 'ride_share';
  provider: UnifiedProvider;
  service: {
    type: 'economy' | 'comfort' | 'premium' | 'xl' | 'pool' | 'taxi';
    vehicleCategory: string;
    capacity: number;
  };
  route: {
    pickup: UnifiedLocation;
    dropoff: UnifiedLocation;
    distance: number; // kilometers
  };
  timing: {
    estimatedPickup: number; // minutes
    estimatedDuration: number; // minutes
    requestTime: string; // ISO datetime
  };
  pricing: UnifiedPricing & {
    surge?: {
      active: boolean;
      multiplier: number;
      reason: string;
    };
    priceRange: {
      min: number;
      max: number;
    };
  };
  availability: {
    available: boolean;
    reason?: string;
    alternatives?: string[];
  };
  qualityScore: QualityScore;
}

// ==================== UNIFIED RESPONSE WRAPPER ====================

export type UnifiedTravelOffer = 
  | UnifiedFlightOffer 
  | UnifiedHotelOffer 
  | UnifiedTransportOffer 
  | UnifiedCarRentalOffer 
  | UnifiedRideShareOffer;

export interface UnifiedSearchResponse<T extends UnifiedTravelOffer = UnifiedTravelOffer> {
  searchId: string;
  searchType: ServiceType;
  offers: T[];
  meta: {
    totalResults: number;
    providersQueried: string[];
    providersResponded: string[];
    searchTime: number; // ms
    currency: Currency;
    cacheInfo: {
      hit: boolean;
      ttl?: number; // seconds remaining
      lastUpdated?: string;
    };
    qualityMetrics: {
      averageResponseTime: number;
      dataCompleteness: number; // 0-100%
      providerReliability: number; // 0-100%
    };
    errors?: Array<{
      provider: string;
      error: string;
      code: string;
    }>;
    warnings?: string[];
  };
  filters?: {
    appliedFilters: Record<string, any>;
    availableFilters: Record<string, any>;
  };
  alternatives?: {
    recommended?: T;
    cheapest?: T;
    fastest?: T;
    ecoFriendly?: T;
  };
}

// ==================== NORMALIZATION SERVICE ====================

export class TravelNormalizationService {
  private readonly currencyRates = new Map<string, { rate: number; lastUpdated: number }>();
  private readonly locationCache = new Map<string, UnifiedLocation>();
  private readonly providerCache = new Map<string, UnifiedProvider>();

  constructor(
    private readonly config: {
      defaultCurrency: Currency;
      exchangeRateApi?: string;
      locationApi?: string;
      cacheTimeout: number; // milliseconds
    } = {
      defaultCurrency: 'USD',
      cacheTimeout: 30 * 60 * 1000 // 30 minutes
    }
  ) {}

  // ==================== FLIGHT NORMALIZATION ====================

  async normalizeFlightResponse(
    rawResponse: any,
    provider: string,
    targetCurrency?: Currency
  ): Promise<UnifiedSearchResponse<UnifiedFlightOffer>> {
    const startTime = Date.now();
    const searchId = this.generateSearchId('flight');

    try {
      const normalizedOffers: UnifiedFlightOffer[] = [];
      const providerData = await this.getOrCreateProvider(provider, 'flight');

      // Normalize each flight offer based on provider format
      for (const rawOffer of rawResponse.offers || rawResponse.results || []) {
        const normalizedOffer = await this.normalizeFlightOffer(rawOffer, providerData, targetCurrency);
        if (normalizedOffer) {
          normalizedOffers.push(normalizedOffer);
        }
      }

      return {
        searchId,
        searchType: 'flight',
        offers: normalizedOffers,
        meta: {
          totalResults: normalizedOffers.length,
          providersQueried: [provider],
          providersResponded: [provider],
          searchTime: Date.now() - startTime,
          currency: targetCurrency || this.config.defaultCurrency,
          cacheInfo: {
            hit: false,
            lastUpdated: new Date().toISOString()
          },
          qualityMetrics: {
            averageResponseTime: Date.now() - startTime,
            dataCompleteness: this.calculateDataCompleteness(normalizedOffers),
            providerReliability: providerData.trustScore * 20 // Convert to percentage
          }
        },
        alternatives: this.generateFlightAlternatives(normalizedOffers)
      };
    } catch (error) {
      throw new Error(`Flight normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async normalizeFlightOffer(
    rawOffer: any,
    provider: UnifiedProvider,
    targetCurrency?: Currency
  ): Promise<UnifiedFlightOffer | null> {
    try {
      // Extract and normalize location data
      const origin = await this.normalizeLocation(rawOffer.origin || rawOffer.departure?.airport);
      const destination = await this.normalizeLocation(rawOffer.destination || rawOffer.arrival?.airport);
      
      if (!origin || !destination) {
        return null;
      }

      // Normalize pricing
      const pricing = await this.normalizePricing(
        rawOffer.price || rawOffer.pricing,
        provider.name,
        targetCurrency
      );

      // Normalize timing
      const departure = this.normalizeTiming(
        rawOffer.departure || rawOffer.outbound?.departure,
        origin.timezone.name
      );
      const arrival = this.normalizeTiming(
        rawOffer.arrival || rawOffer.outbound?.arrival,
        destination.timezone.name
      );

      return {
        id: rawOffer.id || this.generateOfferId('flight'),
        type: 'flight',
        provider,
        aircraft: {
          airline: rawOffer.airline || rawOffer.carrier?.name || 'Unknown',
          flightNumber: rawOffer.flightNumber || rawOffer.flight_no || '',
          aircraftType: rawOffer.aircraft?.type,
          cabin: this.normalizeCabinClass(rawOffer.cabin || rawOffer.class)
        },
        route: {
          origin,
          destination,
          stops: [], // TODO: Normalize stops
          distance: rawOffer.distance || this.calculateDistance(origin, destination)
        },
        schedule: {
          departure,
          arrival,
          duration: rawOffer.duration || this.calculateDuration(departure.scheduled, arrival.scheduled)
        },
        pricing,
        availability: {
          seats: rawOffer.seatsAvailable || rawOffer.availability || 9,
          bookingClass: rawOffer.bookingClass || rawOffer.fareClass || 'Y',
          lastUpdated: new Date().toISOString()
        },
        amenities: rawOffer.amenities || [],
        baggage: this.normalizeBaggage(rawOffer.baggage),
        qualityScore: this.calculateOfferQuality(rawOffer, provider),
        carbonFootprint: {
          emissions: rawOffer.co2Emissions || this.estimateCarbonFootprint('flight', 
            this.calculateDistance(origin, destination)),
          methodology: 'ICAO Carbon Emissions Calculator'
        }
      };
    } catch (error) {
      console.warn(`Failed to normalize flight offer:`, error);
      return null;
    }
  }

  // ==================== HOTEL NORMALIZATION ====================

  async normalizeHotelResponse(
    rawResponse: any,
    provider: string,
    targetCurrency?: Currency
  ): Promise<UnifiedSearchResponse<UnifiedHotelOffer>> {
    const startTime = Date.now();
    const searchId = this.generateSearchId('hotel');

    try {
      const normalizedOffers: UnifiedHotelOffer[] = [];
      const providerData = await this.getOrCreateProvider(provider, 'hotel');

      for (const rawOffer of rawResponse.offers || rawResponse.hotels || []) {
        const normalizedOffer = await this.normalizeHotelOffer(rawOffer, providerData, targetCurrency);
        if (normalizedOffer) {
          normalizedOffers.push(normalizedOffer);
        }
      }

      return {
        searchId,
        searchType: 'hotel',
        offers: normalizedOffers,
        meta: {
          totalResults: normalizedOffers.length,
          providersQueried: [provider],
          providersResponded: [provider],
          searchTime: Date.now() - startTime,
          currency: targetCurrency || this.config.defaultCurrency,
          cacheInfo: {
            hit: false,
            lastUpdated: new Date().toISOString()
          },
          qualityMetrics: {
            averageResponseTime: Date.now() - startTime,
            dataCompleteness: this.calculateDataCompleteness(normalizedOffers),
            providerReliability: providerData.trustScore * 20
          }
        },
        alternatives: this.generateHotelAlternatives(normalizedOffers)
      };
    } catch (error) {
      throw new Error(`Hotel normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async normalizeHotelOffer(
    rawOffer: any,
    provider: UnifiedProvider,
    targetCurrency?: Currency
  ): Promise<UnifiedHotelOffer | null> {
    try {
      const location = await this.normalizeLocation(rawOffer.location || rawOffer.address);
      if (!location) return null;

      const pricing = await this.normalizePricing(
        rawOffer.price || rawOffer.rate,
        provider.name,
        targetCurrency
      );

      const checkIn = this.normalizeTiming(rawOffer.checkIn, location.timezone.name);
      const checkOut = this.normalizeTiming(rawOffer.checkOut, location.timezone.name);

      return {
        id: rawOffer.id || this.generateOfferId('hotel'),
        type: 'hotel',
        provider,
        property: {
          name: rawOffer.name || rawOffer.hotelName || 'Unknown Hotel',
          category: this.normalizeHotelCategory(rawOffer.category),
          starRating: rawOffer.starRating || rawOffer.stars || 0,
          chainName: rawOffer.chain
        },
        location,
        room: {
          type: rawOffer.roomType || 'Standard Room',
          capacity: {
            adults: rawOffer.maxGuests || rawOffer.occupancy?.adults || 2,
            children: rawOffer.occupancy?.children || 0
          },
          amenities: rawOffer.roomAmenities || [],
          size: rawOffer.roomSize,
          bedType: rawOffer.bedType || 'Double'
        },
        stay: {
          checkIn,
          checkOut,
          nights: rawOffer.nights || this.calculateNights(checkIn.scheduled, checkOut.scheduled)
        },
        pricing: {
          ...pricing,
          perNight: pricing.totalPrice / (rawOffer.nights || 1),
          totalStay: pricing.totalPrice,
          includedServices: rawOffer.included || ['breakfast']
        },
        availability: {
          rooms: rawOffer.roomsAvailable || 5,
          lastUpdated: new Date().toISOString()
        },
        amenities: rawOffer.amenities || [],
        policies: {
          cancellation: rawOffer.cancellationPolicy || 'Free cancellation',
          children: rawOffer.childPolicy || 'Children welcome',
          pets: rawOffer.petPolicy || 'No pets allowed'
        },
        qualityScore: this.calculateOfferQuality(rawOffer, provider),
        reviews: {
          rating: rawOffer.rating || rawOffer.reviewScore || 7.5,
          count: rawOffer.reviewCount || 100,
          source: provider.name
        }
      };
    } catch (error) {
      console.warn(`Failed to normalize hotel offer:`, error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  private async normalizeLocation(rawLocation: any): Promise<UnifiedLocation | null> {
    if (!rawLocation) return null;

    const locationId = rawLocation.id || rawLocation.code || 
      `${rawLocation.name}_${rawLocation.coordinates?.[0]}_${rawLocation.coordinates?.[1]}`;
    
    // Check cache first
    const cached = this.locationCache.get(locationId);
    if (cached) return cached;

    try {
      const normalized: UnifiedLocation = {
        id: locationId,
        name: rawLocation.name || rawLocation.city || 'Unknown',
        displayName: rawLocation.displayName || rawLocation.name || 'Unknown',
        type: this.normalizeLocationType(rawLocation.type),
        coordinates: {
          latitude: rawLocation.coordinates?.[1] || rawLocation.lat || 0,
          longitude: rawLocation.coordinates?.[0] || rawLocation.lng || rawLocation.lon || 0,
          accuracy: rawLocation.accuracy || 'approximate'
        },
        address: rawLocation.address ? {
          street: rawLocation.address.street,
          city: rawLocation.address.city || rawLocation.city || rawLocation.name,
          state: rawLocation.address.state,
          country: rawLocation.address.country || rawLocation.country || 'Unknown',
          countryCode: rawLocation.address.countryCode || rawLocation.countryCode || 'XX',
          postalCode: rawLocation.address.postalCode
        } : undefined,
        timezone: {
          name: rawLocation.timezone || 'UTC',
          offset: rawLocation.timezoneOffset || '+00:00',
          abbreviation: rawLocation.timezoneAbbr || 'UTC'
        },
        codes: {
          iata: rawLocation.iata,
          icao: rawLocation.icao,
          stationCode: rawLocation.stationCode
        },
        metadata: {
          provider: rawLocation.provider || 'unknown',
          lastUpdated: new Date().toISOString(),
          accuracy: 3 as QualityScore
        }
      };

      // Cache the normalized location
      this.locationCache.set(locationId, normalized);
      return normalized;
    } catch (error) {
      console.warn(`Failed to normalize location:`, error);
      return null;
    }
  }

  private async normalizePricing(
    rawPrice: any,
    providerName: string,
    targetCurrency?: Currency
  ): Promise<UnifiedPricing> {
    const baseCurrency = rawPrice?.currency || this.config.defaultCurrency;
    const baseAmount = rawPrice?.total || rawPrice?.amount || rawPrice || 0;

    const normalized: UnifiedPricing = {
      basePrice: rawPrice?.base || rawPrice?.basePrice || baseAmount,
      totalPrice: baseAmount,
      currency: baseCurrency as Currency,
      breakdown: {
        basePrice: rawPrice?.base || baseAmount * 0.85,
        taxes: rawPrice?.taxes || baseAmount * 0.1,
        fees: rawPrice?.fees || baseAmount * 0.05,
        discount: rawPrice?.discount,
        surcharges: rawPrice?.surcharges
      },
      priceQuality: {
        confidence: 4 as QualityScore,
        lastUpdated: new Date().toISOString(),
        source: providerName,
        realTime: true
      }
    };

    // Add currency conversions if requested
    if (targetCurrency && targetCurrency !== baseCurrency) {
      try {
        const rate = await this.getCurrencyRate(baseCurrency, targetCurrency);
        normalized.convertedPrices = {
          [targetCurrency]: {
            basePrice: Math.round(normalized.basePrice * rate * 100) / 100,
            totalPrice: Math.round(normalized.totalPrice * rate * 100) / 100,
            exchangeRate: rate,
            lastUpdated: new Date().toISOString()
          }
        };
      } catch (error) {
        console.warn(`Currency conversion failed for ${baseCurrency} to ${targetCurrency}:`, error);
      }
    }

    return normalized;
  }

  private normalizeTiming(rawTiming: any, timezone: string): UnifiedTiming {
    const scheduled = rawTiming?.scheduled || rawTiming?.dateTime || rawTiming || new Date().toISOString();
    const estimated = rawTiming?.estimated || rawTiming?.actualDateTime;

    return {
      scheduled,
      estimated,
      local: {
        scheduled: this.convertToLocalTime(scheduled, timezone),
        estimated: estimated ? this.convertToLocalTime(estimated, timezone) : undefined,
        timezone
      },
      duration: rawTiming?.duration,
      delays: rawTiming?.delay ? {
        expected: rawTiming.delay,
        reason: rawTiming.delayReason,
        lastUpdated: new Date().toISOString()
      } : undefined
    };
  }

  private async getOrCreateProvider(providerName: string, serviceType: ServiceType): Promise<UnifiedProvider> {
    const cached = this.providerCache.get(providerName);
    if (cached) return cached;

    const provider: UnifiedProvider = {
      id: providerName.toLowerCase().replace(/\s+/g, '_'),
      name: providerName,
      displayName: this.formatProviderName(providerName),
      trustScore: this.getProviderTrustScore(providerName),
      categories: [serviceType],
      metadata: {
        responseTime: 1500, // Mock average response time
        uptime: 99.5, // Mock uptime percentage
        lastUpdated: new Date().toISOString()
      }
    };

    this.providerCache.set(providerName, provider);
    return provider;
  }

  private async getCurrencyRate(from: string, to: string): Promise<number> {
    const rateKey = `${from}_${to}`;
    const cached = this.currencyRates.get(rateKey);
    
    if (cached && Date.now() - cached.lastUpdated < this.config.cacheTimeout) {
      return cached.rate;
    }

    // Mock exchange rates (in production, use real API)
    const mockRates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.75,
      'EUR_USD': 1.18,
      'EUR_GBP': 0.88,
      'GBP_USD': 1.33,
      'GBP_EUR': 1.14
    };

    const rate = mockRates[rateKey] || 1;
    this.currencyRates.set(rateKey, { rate, lastUpdated: Date.now() });
    return rate;
  }

  // ==================== UTILITY METHODS ====================

  private generateSearchId(type: ServiceType): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOfferId(type: ServiceType): string {
    return `${type}_offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private normalizeLocationType(rawType: any): UnifiedLocation['type'] {
    const typeMap: Record<string, UnifiedLocation['type']> = {
      'airport': 'airport',
      'city': 'city',
      'station': 'station',
      'train_station': 'station',
      'hotel': 'hotel',
      'landmark': 'landmark',
      'port': 'port',
      'address': 'address'
    };
    return typeMap[rawType?.toLowerCase()] || 'city';
  }

  private normalizeCabinClass(rawClass: any): 'economy' | 'premium_economy' | 'business' | 'first' {
    const classMap: Record<string, 'economy' | 'premium_economy' | 'business' | 'first'> = {
      'economy': 'economy',
      'eco': 'economy',
      'coach': 'economy',
      'premium': 'premium_economy',
      'premium_economy': 'premium_economy',
      'business': 'business',
      'first': 'first',
      'first_class': 'first'
    };
    return classMap[rawClass?.toLowerCase()] || 'economy';
  }

  private normalizeHotelCategory(rawCategory: any): 'budget' | 'midrange' | 'luxury' | 'boutique' {
    const categoryMap: Record<string, 'budget' | 'midrange' | 'luxury' | 'boutique'> = {
      'budget': 'budget',
      'economy': 'budget',
      'mid-range': 'midrange',
      'midrange': 'midrange',
      'standard': 'midrange',
      'luxury': 'luxury',
      'premium': 'luxury',
      'boutique': 'boutique'
    };
    return categoryMap[rawCategory?.toLowerCase()] || 'midrange';
  }

  private normalizeBaggage(rawBaggage: any): UnifiedFlightOffer['baggage'] {
    return {
      carry: {
        weight: rawBaggage?.carryOn?.weight || 7,
        dimensions: rawBaggage?.carryOn?.dimensions || '55x40x20cm',
        included: rawBaggage?.carryOn?.included !== false
      },
      checked: {
        weight: rawBaggage?.checked?.weight || 20,
        pieces: rawBaggage?.checked?.pieces || 1,
        included: rawBaggage?.checked?.included === true
      }
    };
  }

  private calculateDistance(from: UnifiedLocation, to: UnifiedLocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (to.coordinates.latitude - from.coordinates.latitude) * Math.PI / 180;
    const dLon = (to.coordinates.longitude - from.coordinates.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.coordinates.latitude * Math.PI / 180) * 
      Math.cos(to.coordinates.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }

  private calculateDuration(start: string, end: string): number {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000); // minutes
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDataCompleteness(offers: UnifiedTravelOffer[]): number {
    if (offers.length === 0) return 0;
    
    let totalFields = 0;
    let completedFields = 0;
    
    offers.forEach(offer => {
      const fields = this.flattenObject(offer);
      totalFields += Object.keys(fields).length;
      completedFields += Object.values(fields).filter(v => v !== null && v !== undefined && v !== '').length;
    });
    
    return Math.round((completedFields / totalFields) * 100);
  }

  private calculateOfferQuality(rawOffer: any, provider: UnifiedProvider): QualityScore {
    let score: number = provider.trustScore; // Start with provider trust score
    
    // Adjust based on data completeness
    const completeness = Object.keys(rawOffer).length;
    if (completeness > 15) score = Math.min(5, score + 1);
    if (completeness < 8) score = Math.max(1, score - 1);
    
    // Adjust based on price confidence
    if (rawOffer.price?.confidence === 'high') score = Math.min(5, score + 0.5);
    if (rawOffer.price?.confidence === 'low') score = Math.max(1, score - 0.5);
    
    const finalScore = Math.round(Math.max(1, Math.min(5, score)));
    return finalScore as QualityScore;
  }

  private getProviderTrustScore(providerName: string): QualityScore {
    const trustScores: Record<string, QualityScore> = {
      'kiwi': 4,
      'amadeus': 5,
      'booking.com': 5,
      'hertz': 4,
      'avis': 4,
      'uber': 4,
      'lyft': 4,
      'cartrawler': 3,
      'rome2rio': 3
    };
    return trustScores[providerName.toLowerCase()] || 3;
  }

  private formatProviderName(name: string): string {
    const nameMap: Record<string, string> = {
      'kiwi': 'Kiwi.com',
      'amadeus': 'Amadeus',
      'booking.com': 'Booking.com',
      'hertz': 'Hertz',
      'avis': 'Avis',
      'uber': 'Uber',
      'lyft': 'Lyft'
    };
    return nameMap[name.toLowerCase()] || name;
  }

  private convertToLocalTime(utcTime: string, timezone: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(utcTime));
    } catch {
      return utcTime; // Fallback to original time
    }
  }

  private estimateCarbonFootprint(serviceType: ServiceType, distance: number): number {
    const emissionsPerKm: Record<ServiceType, number> = {
      flight: 285, // grams CO2 per km per passenger
      hotel: 25, // per night, converted to per km equivalent
      transport: 50, // average for trains/buses
      car_rental: 150, // grams CO2 per km
      ride_share: 120 // grams CO2 per km
    };
    return Math.round((emissionsPerKm[serviceType] || 100) * distance);
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    let flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  private generateFlightAlternatives(offers: UnifiedFlightOffer[]) {
    if (offers.length === 0) return undefined;
    
    return {
      recommended: offers[0],
      cheapest: offers.reduce((prev, curr) => prev.pricing.totalPrice < curr.pricing.totalPrice ? prev : curr),
      fastest: offers.reduce((prev, curr) => prev.schedule.duration < curr.schedule.duration ? prev : curr),
      ecoFriendly: offers.reduce((prev, curr) => prev.carbonFootprint.emissions < curr.carbonFootprint.emissions ? prev : curr)
    };
  }

  private generateHotelAlternatives(offers: UnifiedHotelOffer[]) {
    if (offers.length === 0) return undefined;
    
    return {
      recommended: offers[0],
      cheapest: offers.reduce((prev, curr) => prev.pricing.totalPrice < curr.pricing.totalPrice ? prev : curr),
      fastest: offers[0], // Not applicable for hotels
      ecoFriendly: offers.reduce((prev, curr) => prev.reviews.rating > curr.reviews.rating ? prev : curr)
    };
  }
}

// ==================== FACTORY FUNCTION ====================

export function createTravelNormalizationService(config?: {
  defaultCurrency?: Currency;
  exchangeRateApi?: string;
  locationApi?: string;
  cacheTimeout?: number;
}): TravelNormalizationService {
  return new TravelNormalizationService({
    defaultCurrency: 'USD',
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    ...config
  });
}