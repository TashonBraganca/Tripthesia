/**
 * Data Transformation Layer
 * 
 * Normalizes and transforms data from different API providers
 * into consistent formats for the application.
 */

import { LocationData } from '@/lib/data/locations';

// ==================== NORMALIZED DATA TYPES ====================

export interface NormalizedFlight {
  id: string;
  type: 'flight';
  provider: string;
  airline: {
    code: string;
    name: string;
    logo?: string;
  };
  aircraft?: {
    code: string;
    name: string;
  };
  flight: {
    number: string;
    departure: {
      airport: {
        code: string;
        name: string;
        city: string;
        country: string;
        terminal?: string;
        gate?: string;
      };
      time: string; // ISO string
      localTime: string;
      timezone: string;
    };
    arrival: {
      airport: {
        code: string;
        name: string;
        city: string;
        country: string;
        terminal?: string;
        gate?: string;
      };
      time: string; // ISO string
      localTime: string;
      timezone: string;
    };
  };
  duration: {
    total: number; // minutes
    formatted: string; // "2h 45m"
  };
  price: {
    base: number;
    taxes: number;
    total: number;
    currency: string;
    formatted: string; // "$299"
    perPerson?: number;
  };
  stops: {
    count: number;
    airports: string[];
    durations: number[]; // layover durations in minutes
  };
  cabin: 'economy' | 'premium_economy' | 'business' | 'first';
  baggage: {
    carry: {
      included: boolean;
      weight?: string;
      size?: string;
    };
    checked: {
      included: boolean;
      count?: number;
      weight?: string;
      additionalFee?: number;
    };
  };
  amenities: string[];
  cancellation: {
    allowed: boolean;
    fee?: number;
    deadline?: string;
  };
  booking: {
    url: string;
    deepLink?: string;
    referenceCode?: string;
  };
  score: number; // 0-10 based on price, convenience, airline rating
  metadata: {
    searchTime: number;
    cached: boolean;
    updatedAt: string;
  };
}

export interface NormalizedHotel {
  id: string;
  type: 'hotel';
  provider: string;
  name: string;
  brand?: string;
  category: 'hotel' | 'resort' | 'hostel' | 'apartment' | 'bnb' | 'guesthouse';
  starRating: number; // 1-5
  rating: {
    score: number; // 0-10
    count: number;
    breakdown?: {
      cleanliness: number;
      comfort: number;
      location: number;
      facilities: number;
      staff: number;
      value: number;
    };
  };
  location: {
    address: string;
    coordinates: [number, number]; // [lng, lat]
    neighborhood?: string;
    city: string;
    country: string;
    distanceFromCenter?: number; // km
    nearbyAttractions?: Array<{
      name: string;
      distance: number;
      type: string;
    }>;
  };
  price: {
    base: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    formatted: string;
    perNight: number;
    perPerson?: number;
    breakdown?: {
      [date: string]: number;
    };
  };
  room: {
    type: string;
    size?: string;
    beds: {
      type: string;
      count: number;
    }[];
    occupancy: {
      adults: number;
      children?: number;
    };
    view?: string;
  };
  amenities: {
    general: string[];
    room: string[];
    bathroom: string[];
    technology: string[];
    food: string[];
    recreation: string[];
    accessibility?: string[];
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: {
      allowed: boolean;
      deadline?: string;
      fee?: number;
      policy?: string;
    };
    children?: string;
    pets?: string;
    smoking?: string;
  };
  images: Array<{
    url: string;
    caption?: string;
    type: 'exterior' | 'interior' | 'room' | 'amenity' | 'food' | 'other';
  }>;
  booking: {
    url: string;
    available: boolean;
    instantBook?: boolean;
    requiresApproval?: boolean;
  };
  sustainability?: {
    certified: boolean;
    practices: string[];
    score?: number;
  };
  metadata: {
    searchTime: number;
    cached: boolean;
    updatedAt: string;
  };
}

export interface NormalizedActivity {
  id: string;
  type: 'activity';
  provider: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  location: {
    name: string;
    address?: string;
    coordinates?: [number, number];
    city: string;
    country: string;
    meetingPoint?: string;
    transportation?: string;
  };
  duration: {
    min: number; // minutes
    max?: number;
    formatted: string; // "2-3 hours"
    fullDay?: boolean;
  };
  price: {
    adult: number;
    child?: number;
    senior?: number;
    currency: string;
    formatted: string;
    includes: string[];
    excludes?: string[];
  };
  schedule: {
    availability: 'daily' | 'selected_days' | 'seasonal';
    times?: string[];
    days?: string[];
    seasons?: string[];
    advanceBooking?: number; // days
  };
  group: {
    minSize?: number;
    maxSize?: number;
    private?: boolean;
    shared?: boolean;
  };
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
  ageRestriction: {
    min?: number;
    max?: number;
    childFriendly: boolean;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    mobilityImpaired: boolean;
    visualImpaired: boolean;
    hearingImpaired: boolean;
    notes?: string;
  };
  rating: {
    score: number; // 0-10
    count: number;
    breakdown?: {
      value: number;
      guide: number;
      organization: number;
      safety: number;
    };
  };
  highlights: string[];
  includes: string[];
  whatToBring: string[];
  images: Array<{
    url: string;
    caption?: string;
  }>;
  booking: {
    url: string;
    instantConfirmation: boolean;
    mobileTicket: boolean;
    cancellation: {
      allowed: boolean;
      deadline?: string;
      refund?: number; // percentage
    };
  };
  metadata: {
    searchTime: number;
    cached: boolean;
    updatedAt: string;
  };
}

export interface NormalizedTransport {
  id: string;
  type: 'transport';
  provider: string;
  mode: 'car' | 'train' | 'bus' | 'subway' | 'taxi' | 'rideshare' | 'bike' | 'walk' | 'ferry';
  route: {
    origin: {
      name: string;
      coordinates: [number, number];
      address?: string;
    };
    destination: {
      name: string;
      coordinates: [number, number];
      address?: string;
    };
    waypoints?: Array<{
      name: string;
      coordinates: [number, number];
    }>;
  };
  schedule?: {
    departure: string; // ISO string
    arrival: string; // ISO string
    frequency?: number; // minutes between services
  };
  duration: {
    total: number; // minutes
    driving?: number;
    walking?: number;
    waiting?: number;
    formatted: string;
  };
  distance: {
    total: number; // meters
    driving?: number;
    walking?: number;
    formatted: string; // "25.3 km"
  };
  price: {
    amount: number;
    currency: string;
    formatted: string;
    priceType: 'fixed' | 'metered' | 'estimate';
    breakdown?: {
      base: number;
      distance: number;
      time: number;
      surcharge?: number;
    };
  };
  instructions?: Array<{
    type: 'turn' | 'continue' | 'merge' | 'exit' | 'arrive';
    instruction: string;
    distance?: number;
    duration?: number;
    maneuver?: string;
  }>;
  comfort: {
    level: 'basic' | 'comfort' | 'premium' | 'luxury';
    features: string[];
    capacity?: number;
    accessibility?: boolean;
  };
  environmental: {
    emissions?: number; // kg CO2
    efficiency?: string;
    sustainable: boolean;
  };
  booking?: {
    url: string;
    phone?: string;
    app?: string;
    advanceBooking: boolean;
    realTimeTracking: boolean;
  };
  metadata: {
    searchTime: number;
    cached: boolean;
    updatedAt: string;
    realTime: boolean;
  };
}

// ==================== TRANSFORMATION UTILITIES ====================

export class DataTransformer {
  
  /**
   * Transform flight data from various providers
   */
  static transformFlight(rawData: any, provider: string): NormalizedFlight {
    switch (provider.toLowerCase()) {
      case 'rapidapi':
      case 'skyscanner':
        return this.transformSkyscannerFlight(rawData);
      
      case 'amadeus':
        return this.transformAmadeusFlight(rawData);
      
      case 'aviationstack':
        return this.transformAviationstackFlight(rawData);
      
      case 'mock':
      case 'enhanced-mock':
        return this.transformMockFlight(rawData);
      
      default:
        return this.transformGenericFlight(rawData, provider);
    }
  }

  /**
   * Transform hotel data from various providers
   */
  static transformHotel(rawData: any, provider: string): NormalizedHotel {
    switch (provider.toLowerCase()) {
      case 'booking.com':
      case 'booking':
        return this.transformBookingHotel(rawData);
      
      case 'expedia':
        return this.transformExpediaHotel(rawData);
      
      case 'mock':
        return this.transformMockHotel(rawData);
      
      default:
        return this.transformGenericHotel(rawData, provider);
    }
  }

  /**
   * Transform activity data from various providers
   */
  static transformActivity(rawData: any, provider: string): NormalizedActivity {
    switch (provider.toLowerCase()) {
      case 'getyourguide':
        return this.transformGetYourGuideActivity(rawData);
      
      case 'viator':
        return this.transformViatorActivity(rawData);
      
      case 'mock':
        return this.transformMockActivity(rawData);
      
      default:
        return this.transformGenericActivity(rawData, provider);
    }
  }

  /**
   * Transform transport data from various providers
   */
  static transformTransport(rawData: any, provider: string): NormalizedTransport {
    switch (provider.toLowerCase()) {
      case 'openrouteservice':
        return this.transformOpenRouteServiceTransport(rawData);
      
      case 'google':
      case 'googlemaps':
        return this.transformGoogleTransport(rawData);
      
      case 'mock':
        return this.transformMockTransport(rawData);
      
      default:
        return this.transformGenericTransport(rawData, provider);
    }
  }

  // ==================== PROVIDER-SPECIFIC TRANSFORMERS ====================

  private static transformSkyscannerFlight(data: any): NormalizedFlight {
    return {
      id: data.id || `skyscanner-${Date.now()}`,
      type: 'flight',
      provider: 'skyscanner',
      airline: {
        code: this.extractAirlineCode(data.airline) || 'XX',
        name: data.airline || 'Unknown Airline',
        logo: data.airlineLogo
      },
      aircraft: data.aircraft ? {
        code: data.aircraft.code,
        name: data.aircraft.name
      } : undefined,
      flight: {
        number: data.flightNumber || 'N/A',
        departure: {
          airport: {
            code: data.departure?.airport || 'XXX',
            name: data.departure?.airportName || '',
            city: data.departure?.city || '',
            country: data.departure?.country || '',
            terminal: data.departure?.terminal,
            gate: data.departure?.gate
          },
          time: this.parseDateTime(data.departure?.time),
          localTime: data.departure?.time || '',
          timezone: data.departure?.timezone || 'UTC'
        },
        arrival: {
          airport: {
            code: data.arrival?.airport || 'XXX',
            name: data.arrival?.airportName || '',
            city: data.arrival?.city || '',
            country: data.arrival?.country || '',
            terminal: data.arrival?.terminal,
            gate: data.arrival?.gate
          },
          time: this.parseDateTime(data.arrival?.time),
          localTime: data.arrival?.time || '',
          timezone: data.arrival?.timezone || 'UTC'
        }
      },
      duration: {
        total: this.parseDuration(data.duration) || 0,
        formatted: data.duration || '0h 0m'
      },
      price: {
        base: data.price || 0,
        taxes: data.taxes || 0,
        total: data.price || 0,
        currency: data.currency || 'USD',
        formatted: this.formatPrice(data.price, data.currency),
        perPerson: data.price || 0
      },
      stops: {
        count: data.stops || 0,
        airports: data.stopAirports || [],
        durations: data.layoverDurations || []
      },
      cabin: this.normalizeCabinClass(data.cabinClass),
      baggage: {
        carry: {
          included: data.baggage?.carry !== false,
          weight: data.baggage?.carryWeight,
          size: data.baggage?.carrySize
        },
        checked: {
          included: data.baggage?.checked !== false,
          count: data.baggage?.checkedCount,
          weight: data.baggage?.checkedWeight,
          additionalFee: data.baggage?.checkedFee
        }
      },
      amenities: data.amenities || [],
      cancellation: {
        allowed: data.cancellation?.allowed || false,
        fee: data.cancellation?.fee,
        deadline: data.cancellation?.deadline
      },
      booking: {
        url: data.bookingLink || '',
        deepLink: data.deepLink,
        referenceCode: data.referenceCode
      },
      score: this.calculateFlightScore(data),
      metadata: {
        searchTime: data.searchTime || 0,
        cached: data.cached || false,
        updatedAt: new Date().toISOString()
      }
    };
  }

  private static transformMockFlight(data: any): NormalizedFlight {
    return {
      id: data.id || `mock-${Date.now()}`,
      type: 'flight',
      provider: 'mock',
      airline: {
        code: this.extractAirlineCode(data.airline) || 'MK',
        name: data.airline || 'Mock Airlines'
      },
      flight: {
        number: data.flightNumber || 'MK001',
        departure: {
          airport: {
            code: data.departure?.airport || 'XXX',
            name: `${data.departure?.airport} Airport`,
            city: data.departure?.city || '',
            country: ''
          },
          time: this.parseDateTime(data.departure?.time),
          localTime: data.departure?.time || '',
          timezone: 'UTC'
        },
        arrival: {
          airport: {
            code: data.arrival?.airport || 'XXX',
            name: `${data.arrival?.airport} Airport`,
            city: data.arrival?.city || '',
            country: ''
          },
          time: this.parseDateTime(data.arrival?.time),
          localTime: data.arrival?.time || '',
          timezone: 'UTC'
        }
      },
      duration: {
        total: this.parseDuration(data.duration) || 0,
        formatted: data.duration || '0h 0m'
      },
      price: {
        base: data.price || 0,
        taxes: Math.round((data.price || 0) * 0.15),
        total: data.price || 0,
        currency: data.currency || 'USD',
        formatted: this.formatPrice(data.price, data.currency),
        perPerson: data.price || 0
      },
      stops: {
        count: data.stops || 0,
        airports: [],
        durations: []
      },
      cabin: 'economy',
      baggage: {
        carry: { included: data.baggage?.carry !== false },
        checked: { included: data.baggage?.checked !== false }
      },
      amenities: ['WiFi', 'Entertainment'],
      cancellation: { allowed: true },
      booking: {
        url: data.bookingLink || 'https://example.com/book'
      },
      score: data.score || 5,
      metadata: {
        searchTime: 0,
        cached: false,
        updatedAt: new Date().toISOString()
      }
    };
  }

  private static transformMockHotel(data: any): NormalizedHotel {
    return {
      id: data.id || `hotel-${Date.now()}`,
      type: 'hotel',
      provider: 'mock',
      name: data.name || 'Mock Hotel',
      category: 'hotel',
      starRating: data.starRating || 4,
      rating: {
        score: data.rating || 8.5,
        count: data.reviewCount || 100
      },
      location: {
        address: data.location?.address || '123 Main St',
        coordinates: data.location?.coordinates || [0, 0],
        city: data.location?.city || '',
        country: data.location?.country || ''
      },
      price: {
        base: data.price || 0,
        taxes: Math.round((data.price || 0) * 0.12),
        fees: 0,
        total: data.price || 0,
        currency: data.currency || 'USD',
        formatted: this.formatPrice(data.price, data.currency),
        perNight: data.price || 0
      },
      room: {
        type: 'Standard Room',
        beds: [{ type: 'double', count: 1 }],
        occupancy: { adults: 2 }
      },
      amenities: {
        general: data.amenities || ['WiFi', 'Pool'],
        room: ['Air Conditioning'],
        bathroom: ['Private Bathroom'],
        technology: ['WiFi', 'TV'],
        food: ['Restaurant'],
        recreation: ['Pool']
      },
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: { allowed: true }
      },
      images: data.images?.map((url: string) => ({ url, type: 'exterior' as const })) || [],
      booking: {
        url: 'https://example.com/book',
        available: true
      },
      metadata: {
        searchTime: 0,
        cached: false,
        updatedAt: new Date().toISOString()
      }
    };
  }

  private static transformMockActivity(data: any): NormalizedActivity {
    return {
      id: data.id || `activity-${Date.now()}`,
      type: 'activity',
      provider: 'mock',
      name: data.name || 'Mock Activity',
      description: data.description || 'An exciting activity',
      category: data.category || 'sightseeing',
      tags: data.tags || ['popular', 'recommended'],
      location: {
        name: data.location?.name || 'Unknown Location',
        city: data.location?.city || '',
        country: data.location?.country || ''
      },
      duration: {
        min: (data.duration || 2) * 60, // Convert hours to minutes
        formatted: `${data.duration || 2} hours`
      },
      price: {
        adult: data.price || 0,
        currency: data.currency || 'USD',
        formatted: this.formatPrice(data.price, data.currency),
        includes: ['Guide', 'Entry fees']
      },
      schedule: {
        availability: 'daily'
      },
      group: {
        maxSize: 20
      },
      difficulty: 'easy',
      ageRestriction: {
        childFriendly: true
      },
      accessibility: {
        wheelchairAccessible: false,
        mobilityImpaired: false,
        visualImpaired: false,
        hearingImpaired: false
      },
      rating: {
        score: data.rating || 8.0,
        count: data.reviewCount || 50
      },
      highlights: ['Amazing views', 'Expert guide'],
      includes: ['Professional guide', 'Entry fees'],
      whatToBring: ['Comfortable shoes', 'Camera'],
      images: data.images?.map((url: string) => ({ url })) || [],
      booking: {
        url: 'https://example.com/book',
        instantConfirmation: true,
        mobileTicket: true,
        cancellation: { allowed: true, refund: 100 }
      },
      metadata: {
        searchTime: 0,
        cached: false,
        updatedAt: new Date().toISOString()
      }
    };
  }

  private static transformMockTransport(data: any): NormalizedTransport {
    return {
      id: data.id || `transport-${Date.now()}`,
      type: 'transport',
      provider: 'mock',
      mode: data.type === 'driving' ? 'car' : 'train',
      route: {
        origin: {
          name: 'Origin',
          coordinates: [0, 0]
        },
        destination: {
          name: 'Destination',
          coordinates: [0, 0]
        }
      },
      duration: {
        total: data.duration || 120,
        formatted: this.formatDuration(data.duration || 120)
      },
      distance: {
        total: (data.distance || 100) * 1000, // Convert km to meters
        formatted: `${data.distance || 100} km`
      },
      price: {
        amount: data.price || 0,
        currency: data.currency || 'USD',
        formatted: this.formatPrice(data.price, data.currency),
        priceType: 'estimate'
      },
      instructions: data.instructions?.map((inst: string) => ({
        type: 'continue' as const,
        instruction: inst
      })) || [],
      comfort: {
        level: 'comfort',
        features: ['Air Conditioning']
      },
      environmental: {
        sustainable: data.type !== 'driving'
      },
      metadata: {
        searchTime: 0,
        cached: false,
        updatedAt: new Date().toISOString(),
        realTime: false
      }
    };
  }

  // Generic transformers for unknown providers
  private static transformGenericFlight(data: any, provider: string): NormalizedFlight {
    return this.transformMockFlight({ ...data, provider });
  }

  private static transformGenericHotel(data: any, provider: string): NormalizedHotel {
    return this.transformMockHotel({ ...data, provider });
  }

  private static transformGenericActivity(data: any, provider: string): NormalizedActivity {
    return this.transformMockActivity({ ...data, provider });
  }

  private static transformGenericTransport(data: any, provider: string): NormalizedTransport {
    return this.transformMockTransport({ ...data, provider });
  }

  // ==================== UTILITY METHODS ====================

  private static extractAirlineCode(airlineName: string): string | undefined {
    if (!airlineName) return undefined;
    
    // Extract from format like "Delta Airlines (DL)" or just return first 2 chars
    const match = airlineName.match(/\(([A-Z]{2})\)/);
    if (match) return match[1];
    
    const codes: Record<string, string> = {
      'Delta Airlines': 'DL',
      'United Airlines': 'UA',
      'American Airlines': 'AA',
      'British Airways': 'BA',
      'Emirates': 'EK',
      'Lufthansa': 'LH'
    };
    
    return codes[airlineName] || airlineName.substring(0, 2).toUpperCase();
  }

  private static parseDateTime(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private static parseDuration(duration: string | number): number {
    if (typeof duration === 'number') return duration;
    if (!duration) return 0;
    
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)m/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;
    
    return hours * 60 + minutes;
  }

  private static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  private static formatPrice(amount: number, currency: string = 'USD'): string {
    if (!amount) return 'Free';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    });
    
    return formatter.format(amount);
  }

  private static normalizeCabinClass(cabin: string): 'economy' | 'premium_economy' | 'business' | 'first' {
    if (!cabin) return 'economy';
    
    const lower = cabin.toLowerCase();
    if (lower.includes('first')) return 'first';
    if (lower.includes('business')) return 'business';
    if (lower.includes('premium')) return 'premium_economy';
    return 'economy';
  }

  private static calculateFlightScore(data: any): number {
    let score = 5.0; // Base score
    
    // Price factor (lower is better)
    if (data.price < 300) score += 1;
    else if (data.price > 800) score -= 1;
    
    // Stops factor (fewer is better)
    if (data.stops === 0) score += 1.5;
    else if (data.stops > 1) score -= 1;
    
    // Duration factor
    const duration = this.parseDuration(data.duration);
    if (duration < 180) score += 0.5; // Less than 3 hours
    else if (duration > 600) score -= 0.5; // More than 10 hours
    
    // Airline reputation (mock implementation)
    const premiumAirlines = ['Emirates', 'Singapore Airlines', 'Qatar Airways'];
    if (premiumAirlines.some(airline => data.airline?.includes(airline))) {
      score += 1;
    }
    
    return Math.max(0, Math.min(10, score));
  }

  // Additional provider-specific transformers would go here...
  private static transformAmadeusFlight(data: any): NormalizedFlight {
    // Implementation for Amadeus API format
    return this.transformGenericFlight(data, 'amadeus');
  }

  private static transformAviationstackFlight(data: any): NormalizedFlight {
    // Implementation for Aviationstack API format
    return this.transformGenericFlight(data, 'aviationstack');
  }

  private static transformBookingHotel(data: any): NormalizedHotel {
    // Implementation for Booking.com API format
    return this.transformGenericHotel(data, 'booking.com');
  }

  private static transformExpediaHotel(data: any): NormalizedHotel {
    // Implementation for Expedia API format
    return this.transformGenericHotel(data, 'expedia');
  }

  private static transformGetYourGuideActivity(data: any): NormalizedActivity {
    // Implementation for GetYourGuide API format
    return this.transformGenericActivity(data, 'getyourguide');
  }

  private static transformViatorActivity(data: any): NormalizedActivity {
    // Implementation for Viator API format
    return this.transformGenericActivity(data, 'viator');
  }

  private static transformOpenRouteServiceTransport(data: any): NormalizedTransport {
    // Implementation for OpenRouteService API format
    return this.transformGenericTransport(data, 'openrouteservice');
  }

  private static transformGoogleTransport(data: any): NormalizedTransport {
    // Implementation for Google Maps API format
    return this.transformGenericTransport(data, 'google');
  }
}

export default DataTransformer;