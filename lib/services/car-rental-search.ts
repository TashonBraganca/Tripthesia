/**
 * Car Rental & Ride Services Search Service - Phase 2.4
 * 
 * Comprehensive car rental and ride-sharing integration with CarTrawler-style architecture:
 * - Multi-provider car rental aggregation (CarTrawler, Hertz, Avis, Enterprise)
 * - Ride-sharing integration (Uber, Lyft, local taxi services)
 * - Vehicle category filtering and comparison
 * - Location-based availability and pricing
 * - Insurance and additional services management
 * 
 * Supported Services:
 * - Car Rental: Global providers with airport/city pickup
 * - Ride Sharing: Uber, Lyft, and local taxi estimates
 * - Peer-to-peer: Turo, Zipcar integration
 * - Specialty: Luxury, electric, and commercial vehicles
 * 
 * Features:
 * - Real-time availability and pricing
 * - One-way and round-trip rentals
 * - Insurance options and additional services
 * - Multi-currency pricing support
 * - Carbon footprint calculation
 * - Integration with flight/hotel/transport bookings
 */

import { z } from 'zod';

// ==================== TYPE DEFINITIONS ====================

export type VehicleCategory = 
  | 'economy' 
  | 'compact' 
  | 'midsize' 
  | 'fullsize' 
  | 'luxury' 
  | 'suv' 
  | 'van' 
  | 'pickup' 
  | 'convertible'
  | 'electric';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid';

export type TransmissionType = 'manual' | 'automatic' | 'cvt';

export type RideType = 'economy' | 'comfort' | 'premium' | 'xl' | 'pool' | 'taxi';

export type ServiceType = 'car_rental' | 'ride_share' | 'taxi' | 'car_share';

export interface RentalLocation {
  id: string;
  name: string;
  type: 'airport' | 'city_center' | 'hotel' | 'train_station' | 'port';
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  country: string;
  countryCode: string;
  timezone: string;
  operatingHours: {
    [key: string]: { open: string; close: string } | 'closed';
  };
  contactInfo: {
    phone?: string;
    email?: string;
  };
  amenities: string[];
  accessibility: {
    wheelchairAccessible: boolean;
    shuttleService: boolean;
    afterHoursReturn: boolean;
  };
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: VehicleCategory;
  fuelType: FuelType;
  transmission: TransmissionType;
  passengers: number;
  doors: number;
  luggage: number;
  airConditioning: boolean;
  features: string[];
  imageUrl?: string;
  fuelConsumption?: {
    city: number; // L/100km or MPG
    highway: number;
    combined: number;
  };
  carbonEmissions?: number; // grams CO2 per km
}

export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  dailyPrice: number;
  currency: string;
  excess: number; // Deductible amount
  mandatory: boolean;
}

export interface AdditionalService {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'service' | 'driver_requirement';
  dailyPrice?: number;
  fixedPrice?: number;
  currency: string;
  availability: 'always' | 'on_request' | 'limited';
  restrictions?: string[];
}

export interface CarRentalOffer {
  id: string;
  provider: string;
  providerLogo?: string;
  vehicle: Vehicle;
  pickupLocation: RentalLocation;
  dropoffLocation: RentalLocation;
  pickupDateTime: string; // ISO datetime
  dropoffDateTime: string; // ISO datetime
  pricing: {
    basePrice: number;
    taxesAndFees: number;
    totalPrice: number;
    currency: string;
    breakdown: {
      dailyRate: number;
      days: number;
      taxes: number;
      fees: number;
      discount?: number;
    };
    pricePerDay: number;
    cancellationFee?: number;
  };
  mileage: {
    included: number; // kilometers or miles
    unit: 'km' | 'miles';
    extraCost: number; // per km/mile
    unlimited: boolean;
  };
  insuranceOptions: InsuranceOption[];
  additionalServices: AdditionalService[];
  terms: {
    minimumAge: number;
    licenseRequirements: string[];
    creditCardRequired: boolean;
    fuelPolicy: 'full_to_full' | 'full_to_empty' | 'pre_purchase';
    cancellationPolicy: string;
  };
  availability: {
    available: boolean;
    lastUpdated: string;
    vehicleCount?: number;
  };
  bookingInfo: {
    bookingUrl: string;
    confirmationRequired: boolean;
    paymentRequired: 'booking' | 'pickup' | 'both';
    cancellationDeadline?: string;
  };
  rating?: {
    provider: number;
    vehicle: number;
    location: number;
  };
  carbonFootprint?: {
    total: number; // grams CO2 for entire rental
    perKm: number; // grams CO2 per km
    offset: boolean; // carbon offset available
  };
}

export interface RideShareEstimate {
  id: string;
  service: 'uber' | 'lyft' | 'taxi' | 'local';
  provider: string;
  rideType: RideType;
  vehicleInfo: {
    category: string;
    description: string;
    capacity: number;
    features: string[];
  };
  pricing: {
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    currency: string;
    priceFactors: string[];
    surge?: {
      active: boolean;
      multiplier: number;
    };
  };
  timing: {
    estimatedPickupTime: number; // minutes
    estimatedDuration: number; // minutes
    distance: number; // kilometers
  };
  pickupLocation: {
    name: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    name: string;
    coordinates: [number, number];
  };
  availability: {
    available: boolean;
    reason?: string;
    alternatives?: string[];
  };
  bookingInfo?: {
    deepLink?: string;
    appRequired: boolean;
    advanceBooking: boolean;
  };
}

export interface CarRentalSearchQuery {
  pickupLocation: {
    name: string;
    coordinates?: [number, number];
    type?: 'airport' | 'city_center' | 'hotel' | 'address';
  };
  dropoffLocation?: {
    name: string;
    coordinates?: [number, number];
    type?: 'airport' | 'city_center' | 'hotel' | 'address';
  };
  pickupDateTime: string; // ISO datetime
  dropoffDateTime: string; // ISO datetime
  driverAge: number;
  preferences?: {
    vehicleCategories?: VehicleCategory[];
    fuelTypes?: FuelType[];
    transmissionType?: TransmissionType;
    features?: string[];
    priceRange?: {
      min?: number;
      max?: number;
      currency: string;
    };
    providers?: string[];
    excludeProviders?: string[];
  };
  requirements?: {
    childSeats?: number;
    wheelchairAccessible?: boolean;
    gps?: boolean;
    unlimitedMileage?: boolean;
    automaticTransmission?: boolean;
  };
  options?: {
    includeInsurance: boolean;
    includeRideSharing: boolean;
    includePeerToPeer: boolean;
    oneWayRental: boolean;
  };
}

export interface RideShareSearchQuery {
  pickupLocation: {
    name: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    name: string;
    coordinates: [number, number];
  };
  requestTime?: string; // ISO datetime, defaults to now
  passengers?: number;
  preferences?: {
    rideTypes?: RideType[];
    services?: string[];
    maxWaitTime?: number; // minutes
    priceRange?: {
      min?: number;
      max?: number;
      currency: string;
    };
  };
  options?: {
    includeScheduled: boolean;
    includePool: boolean;
    includeTaxi: boolean;
  };
}

export interface CarRentalSearchResponse {
  carRentals: CarRentalOffer[];
  rideShares?: RideShareEstimate[];
  alternatives: {
    cheapest?: CarRentalOffer;
    premium?: CarRentalOffer;
    ecoFriendly?: CarRentalOffer;
    mostPopular?: CarRentalOffer;
  };
  meta: {
    searchId: string;
    searchTime: number; // ms
    totalResults: number;
    providers: string[];
    coverage: {
      carRental: string[];
      rideShare: string[];
      peerToPeer: string[];
    };
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    cacheHit: boolean;
    warnings?: string[];
  };
}

// ==================== VALIDATION SCHEMAS ====================

export const CarRentalSearchQuerySchema = z.object({
  pickupLocation: z.object({
    name: z.string().min(2).max(100),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    type: z.enum(['airport', 'city_center', 'hotel', 'address']).optional()
  }),
  dropoffLocation: z.object({
    name: z.string().min(2).max(100),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    type: z.enum(['airport', 'city_center', 'hotel', 'address']).optional()
  }).optional(),
  pickupDateTime: z.string().datetime('Invalid pickup date format'),
  dropoffDateTime: z.string().datetime('Invalid dropoff date format'),
  driverAge: z.number().int().min(18, 'Driver must be at least 18').max(99, 'Invalid driver age'),
  preferences: z.object({
    vehicleCategories: z.array(z.enum(['economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van', 'pickup', 'convertible', 'electric'])).optional(),
    fuelTypes: z.array(z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid'])).optional(),
    transmissionType: z.enum(['manual', 'automatic', 'cvt']).optional(),
    features: z.array(z.string().max(50)).max(20).optional(),
    priceRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
      currency: z.string().length(3).regex(/^[A-Z]{3}$/)
    }).optional(),
    providers: z.array(z.string().max(50)).optional(),
    excludeProviders: z.array(z.string().max(50)).optional()
  }).optional(),
  requirements: z.object({
    childSeats: z.number().int().min(0).max(8).optional(),
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

// ==================== MOCK DATA ====================

const MOCK_RENTAL_LOCATIONS: RentalLocation[] = [
  {
    id: 'lhr_airport',
    name: 'London Heathrow Airport',
    type: 'airport',
    address: 'Terminal 2, Heathrow Airport, London TW6 1EW, UK',
    coordinates: [-0.4543, 51.4700],
    country: 'United Kingdom',
    countryCode: 'GB',
    timezone: 'Europe/London',
    operatingHours: {
      'Mon': { open: '06:00', close: '23:00' },
      'Tue': { open: '06:00', close: '23:00' },
      'Wed': { open: '06:00', close: '23:00' },
      'Thu': { open: '06:00', close: '23:00' },
      'Fri': { open: '06:00', close: '23:00' },
      'Sat': { open: '06:00', close: '23:00' },
      'Sun': { open: '06:00', close: '23:00' }
    },
    contactInfo: {
      phone: '+44 20 8759 4321',
      email: 'lhr@cartrawler.com'
    },
    amenities: ['free_shuttle', 'meet_and_greet', 'premium_location'],
    accessibility: {
      wheelchairAccessible: true,
      shuttleService: true,
      afterHoursReturn: true
    }
  },
  {
    id: 'london_city_center',
    name: 'London City Center',
    type: 'city_center',
    address: '123 Oxford Street, London W1C 1AN, UK',
    coordinates: [-0.1419, 51.5151],
    country: 'United Kingdom',
    countryCode: 'GB',
    timezone: 'Europe/London',
    operatingHours: {
      'Mon': { open: '08:00', close: '20:00' },
      'Tue': { open: '08:00', close: '20:00' },
      'Wed': { open: '08:00', close: '20:00' },
      'Thu': { open: '08:00', close: '20:00' },
      'Fri': { open: '08:00', close: '20:00' },
      'Sat': { open: '09:00', close: '18:00' },
      'Sun': { open: '10:00', close: '16:00' }
    },
    contactInfo: {
      phone: '+44 20 7629 9999'
    },
    amenities: ['valet_service', 'city_location', 'public_transport'],
    accessibility: {
      wheelchairAccessible: true,
      shuttleService: false,
      afterHoursReturn: false
    }
  }
];

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'ford_fiesta_economy',
    make: 'Ford',
    model: 'Fiesta',
    category: 'economy',
    fuelType: 'petrol',
    transmission: 'manual',
    passengers: 5,
    doors: 5,
    luggage: 1,
    airConditioning: true,
    features: ['bluetooth', 'usb_port', 'manual_windows'],
    fuelConsumption: {
      city: 6.5,
      highway: 4.8,
      combined: 5.4
    },
    carbonEmissions: 125
  },
  {
    id: 'vw_golf_compact',
    make: 'Volkswagen',
    model: 'Golf',
    category: 'compact',
    fuelType: 'diesel',
    transmission: 'automatic',
    passengers: 5,
    doors: 5,
    luggage: 1,
    airConditioning: true,
    features: ['gps', 'bluetooth', 'cruise_control', 'electric_windows'],
    fuelConsumption: {
      city: 5.2,
      highway: 3.8,
      combined: 4.3
    },
    carbonEmissions: 108
  },
  {
    id: 'tesla_model3_electric',
    make: 'Tesla',
    model: 'Model 3',
    category: 'electric',
    fuelType: 'electric',
    transmission: 'automatic',
    passengers: 5,
    doors: 4,
    luggage: 1,
    airConditioning: true,
    features: ['autopilot', 'premium_audio', 'glass_roof', 'supercharging', 'smartphone_app'],
    carbonEmissions: 0
  },
  {
    id: 'bmw_x5_luxury_suv',
    make: 'BMW',
    model: 'X5',
    category: 'luxury',
    fuelType: 'hybrid',
    transmission: 'automatic',
    passengers: 7,
    doors: 5,
    luggage: 3,
    airConditioning: true,
    features: ['leather_seats', 'premium_sound', 'panoramic_roof', 'all_wheel_drive', 'adaptive_cruise'],
    fuelConsumption: {
      city: 8.5,
      highway: 6.2,
      combined: 7.1
    },
    carbonEmissions: 162
  }
];

// ==================== SERVICE IMPLEMENTATION ====================

export class CarRentalSearchService {
  private readonly cache = new Map<string, { data: CarRentalSearchResponse; expires: number }>();
  private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour

  constructor(
    private readonly providers: {
      carTrawler?: { apiKey: string; baseUrl?: string };
      hertz?: { apiKey: string; baseUrl?: string };
      avis?: { apiKey: string; baseUrl?: string };
      uber?: { apiKey: string; baseUrl?: string };
      lyft?: { apiKey: string; baseUrl?: string };
    } = {}
  ) {}

  async searchCarRentals(query: CarRentalSearchQuery): Promise<CarRentalSearchResponse> {
    const searchId = this.generateSearchId(query);
    const cacheKey = this.getCacheKey(query);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return {
        ...cached.data,
        meta: {
          ...cached.data.meta,
          cacheHit: true
        }
      };
    }

    const startTime = Date.now();
    
    try {
      // Generate mock car rental offers
      const carRentals = await this.generateCarRentalOffers(query);
      
      // Generate ride sharing estimates if requested
      let rideShares: RideShareEstimate[] = [];
      if (query.options?.includeRideSharing) {
        rideShares = await this.generateRideShareEstimates(query);
      }
      
      // Sort offers by price and value
      const sortedRentals = this.sortCarRentalOffers(carRentals, query.preferences);
      
      // Generate alternatives
      const alternatives = this.generateAlternatives(sortedRentals);
      
      const response: CarRentalSearchResponse = {
        carRentals: sortedRentals,
        rideShares: rideShares.length > 0 ? rideShares : undefined,
        alternatives,
        meta: {
          searchId,
          searchTime: Date.now() - startTime,
          totalResults: sortedRentals.length,
          providers: ['CarTrawler', 'Hertz', 'Avis', 'Enterprise', 'Budget'],
          coverage: {
            carRental: ['Europe', 'North America', 'Asia Pacific'],
            rideShare: ['Uber', 'Lyft', 'Local Taxi'],
            peerToPeer: ['Turo', 'Zipcar']
          },
          priceRange: {
            min: Math.min(...sortedRentals.map(r => r.pricing.totalPrice)),
            max: Math.max(...sortedRentals.map(r => r.pricing.totalPrice)),
            currency: query.preferences?.priceRange?.currency || 'USD'
          },
          cacheHit: false,
          warnings: []
        }
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;
    } catch (error) {
      throw new Error(`Car rental search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateCarRentalOffers(query: CarRentalSearchQuery): Promise<CarRentalOffer[]> {
    const offers: CarRentalOffer[] = [];
    const pickupDate = new Date(query.pickupDateTime);
    const dropoffDate = new Date(query.dropoffDateTime);
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate offers for different vehicle categories
    const categories = query.preferences?.vehicleCategories || ['economy', 'compact', 'midsize', 'luxury'];
    const providers = ['CarTrawler', 'Hertz', 'Avis', 'Enterprise', 'Budget'];
    
    for (const category of categories) {
      const vehicle = this.getVehicleForCategory(category);
      if (!vehicle) continue;
      
      for (const provider of providers.slice(0, 3)) { // Limit to 3 providers per category
        const basePrice = this.calculateBasePrice(category, days, query.driverAge);
        const taxes = basePrice * 0.15; // 15% taxes
        const fees = 25; // Fixed fees
        const totalPrice = basePrice + taxes + fees;
        
        const offer: CarRentalOffer = {
          id: `${provider.toLowerCase()}_${vehicle.id}_${Date.now()}`,
          provider,
          vehicle,
          pickupLocation: this.getPickupLocation(query.pickupLocation.name),
          dropoffLocation: query.dropoffLocation ? 
            this.getDropoffLocation(query.dropoffLocation.name) : 
            this.getPickupLocation(query.pickupLocation.name),
          pickupDateTime: query.pickupDateTime,
          dropoffDateTime: query.dropoffDateTime,
          pricing: {
            basePrice,
            taxesAndFees: taxes + fees,
            totalPrice,
            currency: query.preferences?.priceRange?.currency || 'USD',
            breakdown: {
              dailyRate: basePrice / days,
              days,
              taxes,
              fees,
              discount: Math.random() > 0.7 ? basePrice * 0.1 : undefined
            },
            pricePerDay: totalPrice / days,
            cancellationFee: totalPrice * 0.15
          },
          mileage: {
            included: days < 7 ? 150 * days : 200 * days,
            unit: 'km',
            extraCost: 0.25,
            unlimited: days >= 7
          },
          insuranceOptions: this.generateInsuranceOptions(totalPrice),
          additionalServices: this.generateAdditionalServices(),
          terms: {
            minimumAge: category === 'luxury' ? 25 : 21,
            licenseRequirements: ['valid_license', 'credit_card'],
            creditCardRequired: true,
            fuelPolicy: 'full_to_full',
            cancellationPolicy: 'Free cancellation up to 48 hours before pickup'
          },
          availability: {
            available: Math.random() > 0.1,
            lastUpdated: new Date().toISOString(),
            vehicleCount: Math.floor(Math.random() * 5) + 1
          },
          bookingInfo: {
            bookingUrl: `https://booking.cartrawler.com/${provider.toLowerCase()}`,
            confirmationRequired: true,
            paymentRequired: 'pickup',
            cancellationDeadline: new Date(pickupDate.getTime() - 48 * 60 * 60 * 1000).toISOString()
          },
          rating: {
            provider: 3.5 + Math.random() * 1.5,
            vehicle: 3.8 + Math.random() * 1.2,
            location: 4.0 + Math.random() * 1.0
          },
          carbonFootprint: vehicle.carbonEmissions ? {
            total: vehicle.carbonEmissions * days * 100, // Assume 100km per day
            perKm: vehicle.carbonEmissions,
            offset: provider === 'Enterprise' || provider === 'Hertz'
          } : undefined
        };
        
        offers.push(offer);
      }
    }
    
    return offers.filter(offer => offer.availability.available);
  }

  private async generateRideShareEstimates(query: CarRentalSearchQuery): Promise<RideShareEstimate[]> {
    if (!query.pickupLocation.coordinates || !query.dropoffLocation?.coordinates) {
      return [];
    }
    
    const estimates: RideShareEstimate[] = [];
    const distance = this.calculateDistance(query.pickupLocation.coordinates, query.dropoffLocation.coordinates);
    const duration = Math.max(distance * 2, 15); // Minimum 15 minutes
    
    // Only show ride sharing for short distances (< 50km)
    if (distance > 50) {
      return [];
    }
    
    const services = [
      { service: 'uber' as const, provider: 'Uber', rideType: 'economy' as const },
      { service: 'uber' as const, provider: 'Uber', rideType: 'comfort' as const },
      { service: 'lyft' as const, provider: 'Lyft', rideType: 'economy' as const },
      { service: 'taxi' as const, provider: 'Local Taxi', rideType: 'taxi' as const }
    ];
    
    for (const { service, provider, rideType } of services) {
      const basePrice = this.calculateRidePrice(distance, rideType);
      const surgeActive = Math.random() > 0.8;
      const surgeMultiplier = surgeActive ? 1.2 + Math.random() * 0.8 : 1;
      
      estimates.push({
        id: `${service}_${rideType}_${Date.now()}`,
        service,
        provider,
        rideType,
        vehicleInfo: {
          category: this.getRideVehicleCategory(rideType),
          description: this.getRideDescription(rideType),
          capacity: this.getRideCapacity(rideType),
          features: this.getRideFeatures(rideType)
        },
        pricing: {
          estimatedPrice: Math.round(basePrice * surgeMultiplier * 100) / 100,
          priceRange: {
            min: Math.round(basePrice * surgeMultiplier * 0.9 * 100) / 100,
            max: Math.round(basePrice * surgeMultiplier * 1.1 * 100) / 100
          },
          currency: query.preferences?.priceRange?.currency || 'USD',
          priceFactors: ['distance', 'time', 'demand'],
          surge: surgeActive ? {
            active: true,
            multiplier: Math.round(surgeMultiplier * 100) / 100
          } : undefined
        },
        timing: {
          estimatedPickupTime: Math.floor(Math.random() * 8) + 2, // 2-10 minutes
          estimatedDuration: Math.round(duration),
          distance
        },
        pickupLocation: {
          name: query.pickupLocation.name,
          coordinates: query.pickupLocation.coordinates
        },
        dropoffLocation: {
          name: query.dropoffLocation.name,
          coordinates: query.dropoffLocation.coordinates
        },
        availability: {
          available: Math.random() > 0.2,
          reason: Math.random() > 0.8 ? 'High demand in area' : undefined,
          alternatives: Math.random() > 0.5 ? ['Try again in 5 minutes', 'Consider nearby pickup point'] : undefined
        },
        bookingInfo: {
          deepLink: `${service}://ride?pickup=${query.pickupLocation.coordinates[1]},${query.pickupLocation.coordinates[0]}&destination=${query.dropoffLocation.coordinates[1]},${query.dropoffLocation.coordinates[0]}`,
          appRequired: service !== 'taxi',
          advanceBooking: service === 'uber'
        }
      });
    }
    
    return estimates.filter(estimate => estimate.availability.available);
  }

  private sortCarRentalOffers(offers: CarRentalOffer[], preferences?: CarRentalSearchQuery['preferences']): CarRentalOffer[] {
    return offers.sort((a, b) => {
      // Primary sort by price
      const priceDiff = a.pricing.totalPrice - b.pricing.totalPrice;
      if (Math.abs(priceDiff) > 20) return priceDiff;
      
      // Secondary sort by rating
      const ratingDiff = (b.rating?.provider || 0) - (a.rating?.provider || 0);
      if (Math.abs(ratingDiff) > 0.2) return ratingDiff;
      
      // Tertiary sort by vehicle category preference
      if (preferences?.vehicleCategories) {
        const aIndex = preferences.vehicleCategories.indexOf(a.vehicle.category);
        const bIndex = preferences.vehicleCategories.indexOf(b.vehicle.category);
        if (aIndex !== -1 && bIndex === -1) return -1;
        if (bIndex !== -1 && aIndex === -1) return 1;
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      }
      
      return 0;
    });
  }

  private generateAlternatives(offers: CarRentalOffer[]) {
    return {
      cheapest: offers.reduce((prev, current) => 
        prev.pricing.totalPrice < current.pricing.totalPrice ? prev : current, offers[0]
      ),
      premium: offers.find(offer => offer.vehicle.category === 'luxury') || 
              offers.reduce((prev, current) => 
                prev.pricing.totalPrice > current.pricing.totalPrice ? prev : current, offers[0]
              ),
      ecoFriendly: offers.find(offer => offer.vehicle.fuelType === 'electric' || offer.vehicle.fuelType === 'hybrid') || 
                  offers.reduce((prev, current) => 
                    (prev.carbonFootprint?.perKm || 999) < (current.carbonFootprint?.perKm || 999) ? prev : current, offers[0]
                  ),
      mostPopular: offers.find(offer => offer.vehicle.category === 'compact' || offer.vehicle.category === 'midsize') || offers[0]
    };
  }

  // ==================== HELPER METHODS ====================

  private generateSearchId(query: CarRentalSearchQuery): string {
    return `car_rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(query: CarRentalSearchQuery): string {
    return `car_rental_${JSON.stringify(query)}`.replace(/\s/g, '');
  }

  private getVehicleForCategory(category: VehicleCategory): Vehicle | null {
    return MOCK_VEHICLES.find(v => v.category === category) || MOCK_VEHICLES[0];
  }

  private getPickupLocation(name: string): RentalLocation {
    return MOCK_RENTAL_LOCATIONS.find(loc => 
      loc.name.toLowerCase().includes(name.toLowerCase())
    ) || MOCK_RENTAL_LOCATIONS[0];
  }

  private getDropoffLocation(name: string): RentalLocation {
    return this.getPickupLocation(name);
  }

  private calculateBasePrice(category: VehicleCategory, days: number, driverAge: number): number {
    const basePrices: Record<VehicleCategory, number> = {
      economy: 25,
      compact: 35,
      midsize: 45,
      fullsize: 55,
      luxury: 85,
      suv: 65,
      van: 75,
      pickup: 70,
      convertible: 95,
      electric: 50
    };
    
    let dailyRate = basePrices[category] || 35;
    
    // Young driver surcharge
    if (driverAge < 25) {
      dailyRate *= 1.2;
    }
    
    // Volume discount
    if (days > 7) {
      dailyRate *= 0.9;
    } else if (days > 3) {
      dailyRate *= 0.95;
    }
    
    return Math.round(dailyRate * days);
  }

  private calculateDistance(from: [number, number], to: [number, number]): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (to[1] - from[1]) * Math.PI / 180;
    const dLon = (to[0] - from[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from[1] * Math.PI / 180) * Math.cos(to[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateRidePrice(distance: number, rideType: RideType): number {
    const baseFares: Record<RideType, { base: number; perKm: number }> = {
      economy: { base: 3.5, perKm: 1.2 },
      comfort: { base: 4.5, perKm: 1.5 },
      premium: { base: 6.0, perKm: 2.0 },
      xl: { base: 5.0, perKm: 1.8 },
      pool: { base: 2.5, perKm: 0.9 },
      taxi: { base: 3.0, perKm: 1.3 }
    };
    
    const fare = baseFares[rideType];
    return fare.base + (distance * fare.perKm);
  }

  private generateInsuranceOptions(basePrice: number): InsuranceOption[] {
    return [
      {
        id: 'basic_protection',
        name: 'Basic Protection',
        description: 'Collision Damage Waiver with standard excess',
        coverage: ['collision_damage', 'theft_protection'],
        dailyPrice: Math.round(basePrice * 0.08),
        currency: 'USD',
        excess: 1500,
        mandatory: false
      },
      {
        id: 'full_protection',
        name: 'Full Protection',
        description: 'Comprehensive coverage with reduced excess',
        coverage: ['collision_damage', 'theft_protection', 'liability', 'personal_accident'],
        dailyPrice: Math.round(basePrice * 0.15),
        currency: 'USD',
        excess: 500,
        mandatory: false
      },
      {
        id: 'premium_protection',
        name: 'Premium Protection',
        description: 'Complete peace of mind with zero excess',
        coverage: ['collision_damage', 'theft_protection', 'liability', 'personal_accident', 'roadside_assistance'],
        dailyPrice: Math.round(basePrice * 0.25),
        currency: 'USD',
        excess: 0,
        mandatory: false
      }
    ];
  }

  private generateAdditionalServices(): AdditionalService[] {
    return [
      {
        id: 'gps',
        name: 'GPS Navigation',
        description: 'Satellite navigation system',
        type: 'equipment',
        dailyPrice: 8,
        currency: 'USD',
        availability: 'always'
      },
      {
        id: 'child_seat',
        name: 'Child Seat',
        description: 'Safety seat for children',
        type: 'equipment',
        dailyPrice: 12,
        currency: 'USD',
        availability: 'on_request',
        restrictions: ['age_0_4', 'weight_limit_18kg']
      },
      {
        id: 'additional_driver',
        name: 'Additional Driver',
        description: 'Add extra authorized driver',
        type: 'driver_requirement',
        dailyPrice: 15,
        currency: 'USD',
        availability: 'always',
        restrictions: ['valid_license', 'age_25_plus']
      }
    ];
  }

  private getRideVehicleCategory(rideType: RideType): string {
    const categories: Record<RideType, string> = {
      economy: 'Compact Car',
      comfort: 'Mid-size Sedan',
      premium: 'Luxury Vehicle',
      xl: 'SUV or Van',
      pool: 'Shared Ride',
      taxi: 'Licensed Taxi'
    };
    return categories[rideType];
  }

  private getRideDescription(rideType: RideType): string {
    const descriptions: Record<RideType, string> = {
      economy: 'Affordable everyday rides',
      comfort: 'Extra legroom and newer vehicles',
      premium: 'High-end vehicles with premium features',
      xl: 'Larger vehicles for up to 6 passengers',
      pool: 'Share with others going your way',
      taxi: 'Licensed taxi service'
    };
    return descriptions[rideType];
  }

  private getRideCapacity(rideType: RideType): number {
    const capacities: Record<RideType, number> = {
      economy: 4,
      comfort: 4,
      premium: 4,
      xl: 6,
      pool: 4,
      taxi: 4
    };
    return capacities[rideType];
  }

  private getRideFeatures(rideType: RideType): string[] {
    const features: Record<RideType, string[]> = {
      economy: ['basic_service'],
      comfort: ['extra_legroom', 'newer_vehicle'],
      premium: ['luxury_interior', 'premium_sound', 'wifi'],
      xl: ['spacious', 'luggage_space'],
      pool: ['shared_ride', 'eco_friendly'],
      taxi: ['licensed_driver', 'meter_fare']
    };
    return features[rideType];
  }
}

// ==================== FACTORY FUNCTION ====================

export function createCarRentalSearchService(config?: {
  carTrawler?: { apiKey: string; baseUrl?: string };
  hertz?: { apiKey: string; baseUrl?: string };
  avis?: { apiKey: string; baseUrl?: string };
  uber?: { apiKey: string; baseUrl?: string };
  lyft?: { apiKey: string; baseUrl?: string };
}): CarRentalSearchService {
  return new CarRentalSearchService(config);
}