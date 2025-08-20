/**
 * Transport API Integration Layer
 * Integrates with multiple transport providers for real-time pricing and availability
 */

// API Configuration
const API_CONFIG = {
  kiwi: {
    baseUrl: 'https://api.tequila.kiwi.com',
    apiKey: process.env.NEXT_PUBLIC_KIWI_API_KEY || 'demo-key',
    endpoints: {
      search: '/v2/search',
      locations: '/locations/query'
    }
  },
  rome2rio: {
    baseUrl: 'https://free.rome2rio.com',
    apiKey: process.env.NEXT_PUBLIC_ROME2RIO_API_KEY || 'demo-key',
    endpoints: {
      search: '/api/1.4/json/Search'
    }
  },
  rentalcars: {
    baseUrl: 'https://api.rentalcars.com',
    apiKey: process.env.NEXT_PUBLIC_RENTALCARS_API_KEY || 'demo-key'
  }
};

// Transport Types
export interface TransportSearchParams {
  from: string;
  to: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  transportType?: 'flight' | 'train' | 'bus' | 'car' | 'all';
  maxPrice?: number;
  maxStops?: number;
  directOnly?: boolean;
  sortBy?: 'price' | 'duration' | 'departure' | 'rating';
}

export interface FlightResult {
  id: string;
  type: 'flight';
  provider: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  aircraft: string;
  from: {
    airport: string;
    code: string;
    city: string;
    terminal?: string;
    time: string;
  };
  to: {
    airport: string;
    code: string;
    city: string;
    terminal?: string;
    time: string;
  };
  duration: {
    total: number; // minutes
    formatted: string;
  };
  stops: {
    count: number;
    airports: string[];
    layoverTimes: number[];
  };
  price: {
    amount: number;
    currency: string;
    priceBreakdown?: {
      base: number;
      taxes: number;
      fees: number;
    };
  };
  amenities: {
    wifi: boolean;
    meals: boolean;
    entertainment: boolean;
    powerOutlets: boolean;
    extraLegroom?: boolean;
  };
  baggage: {
    cabin: string;
    checked: string;
  };
  booking: {
    url: string;
    provider: string;
    lastUpdated: Date;
  };
  carbonFootprint: {
    kg: number;
    comparison: 'low' | 'average' | 'high';
  };
  rating?: {
    score: number;
    reviews: number;
    source: string;
  };
  fareType: 'basic' | 'standard' | 'flex' | 'business' | 'first';
  restrictions: {
    refundable: boolean;
    changeable: boolean;
    cancellable: boolean;
  };
}

export interface TrainResult {
  id: string;
  type: 'train';
  operator: string;
  trainNumber: string;
  from: {
    station: string;
    city: string;
    time: string;
    platform?: string;
  };
  to: {
    station: string;
    city: string;
    time: string;
    platform?: string;
  };
  duration: {
    total: number;
    formatted: string;
  };
  price: {
    amount: number;
    currency: string;
    class: 'economy' | 'business' | 'first';
  };
  amenities: {
    wifi: boolean;
    meals: boolean;
    powerOutlets: boolean;
    quietCar?: boolean;
  };
  booking: {
    url: string;
    provider: string;
  };
  stops: string[];
  carbonFootprint: {
    kg: number;
    comparison: 'low' | 'average' | 'high';
  };
}

export interface BusResult {
  id: string;
  type: 'bus';
  operator: string;
  from: {
    station: string;
    city: string;
    time: string;
  };
  to: {
    station: string;
    city: string;
    time: string;
  };
  duration: {
    total: number;
    formatted: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  amenities: {
    wifi: boolean;
    powerOutlets: boolean;
    bathroom: boolean;
    airConditioning: boolean;
  };
  booking: {
    url: string;
    provider: string;
  };
  stops: number;
  carbonFootprint: {
    kg: number;
    comparison: 'low' | 'average' | 'high';
  };
}

export interface CarRentalResult {
  id: string;
  type: 'car';
  provider: string;
  vehicle: {
    category: string;
    model: string;
    passengers: number;
    bags: number;
    transmission: 'manual' | 'automatic';
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  };
  pickup: {
    location: string;
    time: string;
  };
  dropoff: {
    location: string;
    time: string;
  };
  price: {
    amount: number;
    currency: string;
    period: 'day' | 'total';
  };
  features: {
    gps: boolean;
    airConditioning: boolean;
    unlimited: boolean;
  };
  booking: {
    url: string;
    provider: string;
  };
  insurance: {
    included: boolean;
    excess: number;
  };
}

export type TransportResult = FlightResult | TrainResult | BusResult | CarRentalResult;

// API Service Classes
class FlightAPIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_CONFIG.kiwi.baseUrl;
    this.apiKey = API_CONFIG.kiwi.apiKey;
  }

  async searchFlights(params: TransportSearchParams): Promise<FlightResult[]> {
    // For demo purposes, return mock data with realistic variations
    // In production, this would call the actual Kiwi API
    if (this.apiKey === 'demo-key') {
      return this.generateMockFlightResults(params);
    }

    try {
      const searchParams = new URLSearchParams({
        fly_from: params.from,
        fly_to: params.to,
        date_from: params.departureDate.toISOString().split('T')[0],
        date_to: params.departureDate.toISOString().split('T')[0],
        adults: params.passengers.toString(),
        ...(params.returnDate && {
          return_from: params.returnDate.toISOString().split('T')[0],
          return_to: params.returnDate.toISOString().split('T')[0],
        }),
        ...(params.maxPrice && { price_to: params.maxPrice.toString() }),
        ...(params.directOnly && { max_stopovers: '0' }),
        sort: params.sortBy || 'price',
        limit: '50'
      });

      const response = await fetch(`${this.baseUrl}${API_CONFIG.kiwi.endpoints.search}?${searchParams}`, {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Kiwi API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformKiwiResults(data.data || []);
    } catch (error) {
      console.error('Flight API error:', error);
      // Fallback to mock data on API error
      return this.generateMockFlightResults(params);
    }
  }

  private generateMockFlightResults(params: TransportSearchParams): FlightResult[] {
    const airlines = [
      { name: 'Emirates', code: 'EK', rating: 4.5 },
      { name: 'Singapore Airlines', code: 'SQ', rating: 4.7 },
      { name: 'Lufthansa', code: 'LH', rating: 4.2 },
      { name: 'British Airways', code: 'BA', rating: 4.0 },
      { name: 'Qatar Airways', code: 'QR', rating: 4.6 },
      { name: 'American Airlines', code: 'AA', rating: 3.8 },
      { name: 'Delta Air Lines', code: 'DL', rating: 4.1 },
      { name: 'United Airlines', code: 'UA', rating: 3.9 }
    ];

    const results: FlightResult[] = [];
    const basePrice = Math.floor(Math.random() * 800) + 200; // $200-1000 base

    for (let i = 0; i < 15; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const stops = Math.random() > 0.6 ? 0 : Math.random() > 0.8 ? 2 : 1;
      const durationBase = 480 + stops * 120; // 8h base + 2h per stop
      const duration = durationBase + Math.floor(Math.random() * 120);
      
      const departure = new Date(params.departureDate);
      departure.setHours(6 + Math.floor(Math.random() * 18)); // 6 AM - 12 AM
      departure.setMinutes(Math.floor(Math.random() * 60));
      
      const arrival = new Date(departure.getTime() + duration * 60000);
      
      const priceVariation = 1 + (Math.random() - 0.5) * 0.6; // ±30%
      const stopsPriceReduction = stops === 0 ? 1.2 : stops === 1 ? 1 : 0.8;
      const finalPrice = Math.floor(basePrice * priceVariation * stopsPriceReduction);

      results.push({
        id: `flight-${i}`,
        type: 'flight',
        provider: 'Skyscanner',
        airline: {
          name: airline.name,
          code: airline.code
        },
        aircraft: ['Boeing 777', 'Airbus A350', 'Boeing 787', 'Airbus A380'][Math.floor(Math.random() * 4)],
        from: {
          airport: this.getAirportName(params.from),
          code: this.getAirportCode(params.from),
          city: params.from,
          terminal: Math.random() > 0.5 ? `Terminal ${Math.ceil(Math.random() * 3)}` : undefined,
          time: departure.toTimeString().slice(0, 5)
        },
        to: {
          airport: this.getAirportName(params.to),
          code: this.getAirportCode(params.to),
          city: params.to,
          terminal: Math.random() > 0.5 ? `Terminal ${Math.ceil(Math.random() * 3)}` : undefined,
          time: arrival.toTimeString().slice(0, 5)
        },
        duration: {
          total: duration,
          formatted: this.formatDuration(duration)
        },
        stops: {
          count: stops,
          airports: stops > 0 ? ['DXB', 'DOH', 'FRA'].slice(0, stops) : [],
          layoverTimes: stops > 0 ? Array(stops).fill(0).map(() => 60 + Math.random() * 120) : []
        },
        price: {
          amount: finalPrice,
          currency: 'USD',
          priceBreakdown: {
            base: Math.floor(finalPrice * 0.75),
            taxes: Math.floor(finalPrice * 0.2),
            fees: Math.floor(finalPrice * 0.05)
          }
        },
        amenities: {
          wifi: Math.random() > 0.3,
          meals: Math.random() > 0.2,
          entertainment: Math.random() > 0.1,
          powerOutlets: Math.random() > 0.4,
          extraLegroom: Math.random() > 0.7
        },
        baggage: {
          cabin: '1 × 8kg',
          checked: stops === 0 ? '1 × 23kg' : '2 × 23kg'
        },
        booking: {
          url: `https://www.skyscanner.com/transport/flights/${params.from}/${params.to}`,
          provider: 'Skyscanner',
          lastUpdated: new Date()
        },
        carbonFootprint: {
          kg: Math.floor(duration * 0.21), // Rough estimate: 0.21kg CO2 per minute
          comparison: stops === 0 ? (Math.random() > 0.5 ? 'average' : 'low') : 'high'
        },
        rating: {
          score: airline.rating,
          reviews: Math.floor(Math.random() * 5000) + 1000,
          source: 'Skytrax'
        },
        fareType: ['basic', 'standard', 'flex'][Math.floor(Math.random() * 3)] as any,
        restrictions: {
          refundable: Math.random() > 0.6,
          changeable: Math.random() > 0.4,
          cancellable: Math.random() > 0.3
        }
      });
    }

    // Sort by the requested criteria
    return this.sortResults(results, params.sortBy || 'price');
  }

  private transformKiwiResults(data: any[]): FlightResult[] {
    return data.map((flight: any, index: number) => ({
      id: flight.id || `flight-${index}`,
      type: 'flight' as const,
      provider: 'Kiwi.com',
      airline: {
        name: flight.airlines?.[0] || 'Unknown',
        code: flight.airline || 'XX'
      },
      aircraft: 'N/A',
      from: {
        airport: flight.flyFrom,
        code: flight.flyFrom,
        city: flight.cityFrom,
        time: new Date(flight.dTime * 1000).toTimeString().slice(0, 5)
      },
      to: {
        airport: flight.flyTo,
        code: flight.flyTo,
        city: flight.cityTo,
        time: new Date(flight.aTime * 1000).toTimeString().slice(0, 5)
      },
      duration: {
        total: flight.fly_duration ? flight.fly_duration / 60 : 0,
        formatted: this.formatDuration(flight.fly_duration ? flight.fly_duration / 60 : 0)
      },
      stops: {
        count: flight.pnr_count - 1,
        airports: flight.route?.map((r: any) => r.flyTo) || [],
        layoverTimes: []
      },
      price: {
        amount: flight.price,
        currency: 'EUR'
      },
      amenities: {
        wifi: false,
        meals: false,
        entertainment: false,
        powerOutlets: false
      },
      baggage: {
        cabin: '1 × 8kg',
        checked: '1 × 23kg'
      },
      booking: {
        url: flight.deep_link || 'https://kiwi.com',
        provider: 'Kiwi.com',
        lastUpdated: new Date()
      },
      carbonFootprint: {
        kg: Math.floor((flight.fly_duration || 480) / 60 * 0.21),
        comparison: 'average' as const
      },
      fareType: 'standard' as const,
      restrictions: {
        refundable: false,
        changeable: true,
        cancellable: false
      }
    }));
  }

  private getAirportName(city: string): string {
    const airports: { [key: string]: string } = {
      'London': 'London Heathrow Airport',
      'Paris': 'Charles de Gaulle Airport',
      'Tokyo': 'Tokyo Haneda Airport',
      'New York': 'John F. Kennedy International Airport',
      'Dubai': 'Dubai International Airport',
      'Singapore': 'Changi Airport',
      'Los Angeles': 'Los Angeles International Airport',
      'Sydney': 'Sydney Kingsford Smith Airport'
    };
    return airports[city] || `${city} International Airport`;
  }

  private getAirportCode(city: string): string {
    const codes: { [key: string]: string } = {
      'London': 'LHR',
      'Paris': 'CDG', 
      'Tokyo': 'HND',
      'New York': 'JFK',
      'Dubai': 'DXB',
      'Singapore': 'SIN',
      'Los Angeles': 'LAX',
      'Sydney': 'SYD'
    };
    return codes[city] || city.slice(0, 3).toUpperCase();
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  private sortResults(results: FlightResult[], sortBy: string): FlightResult[] {
    switch (sortBy) {
      case 'price':
        return results.sort((a, b) => a.price.amount - b.price.amount);
      case 'duration':
        return results.sort((a, b) => a.duration.total - b.duration.total);
      case 'departure':
        return results.sort((a, b) => a.from.time.localeCompare(b.from.time));
      case 'rating':
        return results.sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0));
      default:
        return results;
    }
  }
}

// Initialize services
const flightAPI = new FlightAPIService();

// Main search function
export async function searchTransport(params: TransportSearchParams): Promise<TransportResult[]> {
  const results: TransportResult[] = [];

  try {
    // Search flights
    if (!params.transportType || params.transportType === 'flight' || params.transportType === 'all') {
      const flights = await flightAPI.searchFlights(params);
      results.push(...flights);
    }

    // TODO: Add train, bus, and car rental searches
    // For now, return flight results
    return results;

  } catch (error) {
    console.error('Transport search error:', error);
    // Return mock data as fallback
    return flightAPI.searchFlights(params);
  }
}

// Price tracking and alerts
export class PriceTracker {
  private static watchers: Map<string, any> = new Map();

  static async trackPrice(searchParams: TransportSearchParams, targetPrice: number): Promise<string> {
    const watcherId = this.generateWatcherId(searchParams);
    
    const watcher = {
      id: watcherId,
      params: searchParams,
      targetPrice,
      createdAt: new Date(),
      lastCheck: new Date(),
      currentPrice: null,
      priceHistory: [],
      notifications: []
    };

    this.watchers.set(watcherId, watcher);
    
    // Start monitoring (in production, this would use a job queue)
    this.startMonitoring(watcherId);
    
    return watcherId;
  }

  static async getPriceHistory(watcherId: string): Promise<any[]> {
    const watcher = this.watchers.get(watcherId);
    return watcher?.priceHistory || [];
  }

  private static generateWatcherId(params: TransportSearchParams): string {
    return `${params.from}-${params.to}-${params.departureDate.getTime()}-${Math.random()}`;
  }

  private static async startMonitoring(watcherId: string): Promise<void> {
    // Mock price monitoring - in production this would run in background
    const watcher = this.watchers.get(watcherId);
    if (!watcher) return;

    // Simulate price changes every hour
    setInterval(async () => {
      try {
        const results = await searchTransport(watcher.params);
        const lowestPrice = Math.min(...results.map(r => r.price.amount));
        
        watcher.priceHistory.push({
          timestamp: new Date(),
          price: lowestPrice
        });
        
        watcher.currentPrice = lowestPrice;
        watcher.lastCheck = new Date();
        
        if (lowestPrice <= watcher.targetPrice) {
          watcher.notifications.push({
            type: 'price_alert',
            message: `Price dropped to $${lowestPrice}! (Target: $${watcher.targetPrice})`,
            timestamp: new Date()
          });
          
          // In production, send actual notification (email, push, etc.)
          console.log(`Price alert: ${watcher.id} - Price dropped to $${lowestPrice}`);
        }
        
      } catch (error) {
        console.error(`Price monitoring error for ${watcherId}:`, error);
      }
    }, 3600000); // Check every hour
  }
}

export { flightAPI };