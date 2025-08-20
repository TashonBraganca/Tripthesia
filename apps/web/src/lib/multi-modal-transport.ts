/**
 * Multi-Modal Transport Services
 * Extends transport-apis.ts with train, bus, and car rental integrations
 */

import { 
  TransportSearchParams, 
  TrainResult, 
  BusResult, 
  CarRentalResult 
} from './transport-apis';

// Train API Service
class TrainAPIService {
  private baseUrl = 'https://api.trainline.eu';
  private apiKey = process.env.NEXT_PUBLIC_TRAINLINE_API_KEY || 'demo-key';

  async searchTrains(params: TransportSearchParams): Promise<TrainResult[]> {
    // For demo purposes, return mock data
    if (this.apiKey === 'demo-key') {
      return this.generateMockTrainResults(params);
    }

    try {
      // In production, integrate with actual train APIs like:
      // - Trainline API
      // - Rail Europe API  
      // - National railway APIs (SNCF, Deutsche Bahn, etc.)
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: params.from,
          destination: params.to,
          departure_date: params.departureDate.toISOString().split('T')[0],
          passengers: params.passengers
        })
      });

      const data = await response.json();
      return this.transformTrainResults(data);
    } catch (error) {
      console.error('Train API error:', error);
      return this.generateMockTrainResults(params);
    }
  }

  private generateMockTrainResults(params: TransportSearchParams): TrainResult[] {
    const operators = [
      { name: 'Eurostar', routes: ['London-Paris', 'London-Brussels', 'Paris-Amsterdam'] },
      { name: 'TGV', routes: ['Paris-Lyon', 'Paris-Marseille', 'Lyon-Nice'] },
      { name: 'AVE', routes: ['Madrid-Barcelona', 'Madrid-Seville', 'Barcelona-Valencia'] },
      { name: 'ICE', routes: ['Berlin-Munich', 'Frankfurt-Hamburg', 'Cologne-Berlin'] },
      { name: 'Frecciarossa', routes: ['Rome-Milan', 'Naples-Florence', 'Venice-Bologna'] },
      { name: 'Shinkansen', routes: ['Tokyo-Osaka', 'Tokyo-Kyoto', 'Osaka-Hiroshima'] }
    ];

    const results: TrainResult[] = [];
    const route = `${params.from}-${params.to}`;
    const relevantOperators = operators.filter(op => 
      op.routes.some(r => r.toLowerCase().includes(params.from.toLowerCase()) || 
                         r.toLowerCase().includes(params.to.toLowerCase()))
    );

    const operatorsToUse = relevantOperators.length > 0 ? relevantOperators : [operators[0]];

    operatorsToUse.forEach((operator, opIndex) => {
      for (let i = 0; i < 8; i++) {
        const departure = new Date(params.departureDate);
        departure.setHours(6 + i * 2); // Every 2 hours from 6 AM
        departure.setMinutes(Math.floor(Math.random() * 60));

        const duration = 180 + Math.floor(Math.random() * 300); // 3-8 hours
        const arrival = new Date(departure.getTime() + duration * 60000);

        const basePrice = 50 + Math.floor(Math.random() * 200); // €50-250
        const classes = ['economy', 'business', 'first'] as const;
        const selectedClass = classes[Math.floor(Math.random() * classes.length)];
        const classMultiplier = selectedClass === 'first' ? 2.5 : selectedClass === 'business' ? 1.8 : 1;

        results.push({
          id: `train-${opIndex}-${i}`,
          type: 'train',
          operator: operator.name,
          trainNumber: `${operator.name.slice(0, 2).toUpperCase()}${String(1000 + i).slice(-3)}`,
          from: {
            station: `${params.from} Central Station`,
            city: params.from,
            time: departure.toTimeString().slice(0, 5),
            platform: `Platform ${Math.ceil(Math.random() * 12)}`
          },
          to: {
            station: `${params.to} Central Station`, 
            city: params.to,
            time: arrival.toTimeString().slice(0, 5),
            platform: `Platform ${Math.ceil(Math.random() * 12)}`
          },
          duration: {
            total: duration,
            formatted: this.formatDuration(duration)
          },
          price: {
            amount: Math.floor(basePrice * classMultiplier),
            currency: 'EUR',
            class: selectedClass
          },
          amenities: {
            wifi: Math.random() > 0.2,
            meals: selectedClass !== 'economy' || Math.random() > 0.5,
            powerOutlets: Math.random() > 0.1,
            quietCar: Math.random() > 0.6
          },
          booking: {
            url: `https://www.trainline.eu/search/${params.from}/${params.to}`,
            provider: 'Trainline'
          },
          stops: this.generateTrainStops(params.from, params.to, Math.floor(Math.random() * 4)),
          carbonFootprint: {
            kg: Math.floor(duration * 0.041), // Trains: ~0.041kg CO2 per minute
            comparison: 'low'
          }
        });
      }
    });

    return results.sort((a, b) => a.price.amount - b.price.amount);
  }

  private generateTrainStops(from: string, to: string, numStops: number): string[] {
    const possibleStops = [
      'Central Junction', 'International Hub', 'Metro Station', 
      'Railway Plaza', 'Transit Center', 'Express Terminal'
    ];
    return possibleStops.slice(0, numStops);
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  private transformTrainResults(data: any): TrainResult[] {
    // Transform API response to our TrainResult format
    return [];
  }
}

// Bus API Service
class BusAPIService {
  private baseUrl = 'https://api.flixbus.com';
  private apiKey = process.env.NEXT_PUBLIC_FLIXBUS_API_KEY || 'demo-key';

  async searchBuses(params: TransportSearchParams): Promise<BusResult[]> {
    if (this.apiKey === 'demo-key') {
      return this.generateMockBusResults(params);
    }

    try {
      // Integrate with bus APIs like:
      // - FlixBus API
      // - Megabus API
      // - Greyhound API
      // - Regional bus operators
      
      const response = await fetch(`${this.baseUrl}/mobile/v1/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return this.transformBusResults(data);
    } catch (error) {
      console.error('Bus API error:', error);
      return this.generateMockBusResults(params);
    }
  }

  private generateMockBusResults(params: TransportSearchParams): BusResult[] {
    const operators = [
      'FlixBus', 'Megabus', 'Greyhound', 'National Express', 
      'Eurolines', 'RegioJet', 'Student Agency'
    ];

    const results: BusResult[] = [];
    const basePrice = 15 + Math.floor(Math.random() * 60); // $15-75

    for (let i = 0; i < 10; i++) {
      const departure = new Date(params.departureDate);
      departure.setHours(5 + i * 2.5); // Every 2.5 hours from 5 AM
      departure.setMinutes(Math.floor(Math.random() * 60));

      const duration = 240 + Math.floor(Math.random() * 600); // 4-14 hours
      const arrival = new Date(departure.getTime() + duration * 60000);
      const operator = operators[Math.floor(Math.random() * operators.length)];
      const priceVariation = 0.7 + Math.random() * 0.6; // ±30%

      results.push({
        id: `bus-${i}`,
        type: 'bus',
        operator,
        from: {
          station: `${params.from} Bus Terminal`,
          city: params.from,
          time: departure.toTimeString().slice(0, 5)
        },
        to: {
          station: `${params.to} Bus Station`,
          city: params.to,
          time: arrival.toTimeString().slice(0, 5)
        },
        duration: {
          total: duration,
          formatted: this.formatDuration(duration)
        },
        price: {
          amount: Math.floor(basePrice * priceVariation),
          currency: 'USD'
        },
        amenities: {
          wifi: Math.random() > 0.3,
          powerOutlets: Math.random() > 0.4,
          bathroom: Math.random() > 0.1,
          airConditioning: Math.random() > 0.2
        },
        booking: {
          url: `https://www.flixbus.com/bus-routes/${params.from.toLowerCase()}-${params.to.toLowerCase()}`,
          provider: operator
        },
        stops: Math.floor(Math.random() * 6), // 0-5 stops
        carbonFootprint: {
          kg: Math.floor(duration * 0.089), // Buses: ~0.089kg CO2 per minute
          comparison: 'average'
        }
      });
    }

    return results.sort((a, b) => a.price.amount - b.price.amount);
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  private transformBusResults(data: any): BusResult[] {
    return [];
  }
}

// Car Rental API Service
class CarRentalAPIService {
  private baseUrl = 'https://api.rentalcars.com';
  private apiKey = process.env.NEXT_PUBLIC_RENTALCARS_API_KEY || 'demo-key';

  async searchCarRentals(params: TransportSearchParams): Promise<CarRentalResult[]> {
    if (this.apiKey === 'demo-key') {
      return this.generateMockCarRentalResults(params);
    }

    try {
      // Integrate with car rental APIs like:
      // - RentalCars.com API
      // - Expedia Car Rentals API
      // - Individual rental company APIs (Hertz, Avis, etc.)
      
      const response = await fetch(`${this.baseUrl}/v3/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return this.transformCarRentalResults(data);
    } catch (error) {
      console.error('Car rental API error:', error);
      return this.generateMockCarRentalResults(params);
    }
  }

  private generateMockCarRentalResults(params: TransportSearchParams): CarRentalResult[] {
    const providers = [
      'Hertz', 'Avis', 'Enterprise', 'Budget', 'Europcar', 
      'Sixt', 'National', 'Alamo', 'Thrifty'
    ];

    const vehicleCategories = [
      {
        category: 'Economy',
        models: ['Toyota Yaris', 'Ford Fiesta', 'Nissan Micra'],
        passengers: 4,
        bags: 2,
        basePrice: 25
      },
      {
        category: 'Compact',
        models: ['Toyota Corolla', 'Ford Focus', 'Volkswagen Golf'],
        passengers: 5,
        bags: 3,
        basePrice: 35
      },
      {
        category: 'Mid-size',
        models: ['Toyota Camry', 'Ford Fusion', 'Nissan Altima'],
        passengers: 5,
        bags: 4,
        basePrice: 45
      },
      {
        category: 'Full-size',
        models: ['Toyota Avalon', 'Ford Taurus', 'Chevrolet Impala'],
        passengers: 5,
        bags: 4,
        basePrice: 55
      },
      {
        category: 'SUV',
        models: ['Toyota RAV4', 'Ford Escape', 'Honda CR-V'],
        passengers: 7,
        bags: 5,
        basePrice: 70
      },
      {
        category: 'Luxury',
        models: ['BMW 3 Series', 'Mercedes C-Class', 'Audi A4'],
        passengers: 5,
        bags: 3,
        basePrice: 90
      }
    ];

    const results: CarRentalResult[] = [];
    
    // Calculate trip duration in days
    const endDate = params.returnDate || new Date(params.departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const days = Math.ceil((endDate.getTime() - params.departureDate.getTime()) / (1000 * 60 * 60 * 24));

    providers.forEach((provider, providerIndex) => {
      vehicleCategories.forEach((vehicle, vehicleIndex) => {
        const model = vehicle.models[Math.floor(Math.random() * vehicle.models.length)];
        const priceVariation = 0.8 + Math.random() * 0.4; // ±20%
        const dailyPrice = Math.floor(vehicle.basePrice * priceVariation);
        const totalPrice = dailyPrice * days;

        results.push({
          id: `car-${providerIndex}-${vehicleIndex}`,
          type: 'car',
          provider,
          vehicle: {
            category: vehicle.category,
            model,
            passengers: vehicle.passengers,
            bags: vehicle.bags,
            transmission: Math.random() > 0.3 ? 'automatic' : 'manual',
            fuelType: Math.random() > 0.85 ? 'electric' : 
                     Math.random() > 0.7 ? 'hybrid' : 
                     Math.random() > 0.5 ? 'diesel' : 'petrol'
          },
          pickup: {
            location: `${params.from} Airport`,
            time: '10:00'
          },
          dropoff: {
            location: `${params.to} Airport`,
            time: '10:00'
          },
          price: {
            amount: totalPrice,
            currency: 'USD',
            period: 'total'
          },
          features: {
            gps: Math.random() > 0.4,
            airConditioning: Math.random() > 0.2,
            unlimited: Math.random() > 0.3
          },
          booking: {
            url: `https://www.rentalcars.com/search?location=${params.from}`,
            provider
          },
          insurance: {
            included: Math.random() > 0.5,
            excess: Math.floor(Math.random() * 1000) + 500 // $500-1500
          }
        });
      });
    });

    return results.sort((a, b) => a.price.amount - b.price.amount);
  }

  private transformCarRentalResults(data: any): CarRentalResult[] {
    return [];
  }
}

// Unified Multi-Modal Search Service
export class MultiModalTransportService {
  private trainAPI = new TrainAPIService();
  private busAPI = new BusAPIService();
  private carRentalAPI = new CarRentalAPIService();

  async searchAllModes(params: TransportSearchParams): Promise<{
    trains: TrainResult[];
    buses: BusResult[];
    carRentals: CarRentalResult[];
  }> {
    try {
      // Search all transport modes in parallel
      const [trains, buses, carRentals] = await Promise.all([
        this.trainAPI.searchTrains(params),
        this.busAPI.searchBuses(params),
        this.carRentalAPI.searchCarRentals(params)
      ]);

      return { trains, buses, carRentals };
    } catch (error) {
      console.error('Multi-modal search error:', error);
      // Return empty results on error
      return { trains: [], buses: [], carRentals: [] };
    }
  }

  async searchByMode(mode: 'train' | 'bus' | 'car', params: TransportSearchParams) {
    switch (mode) {
      case 'train':
        return this.trainAPI.searchTrains(params);
      case 'bus':
        return this.busAPI.searchBuses(params);
      case 'car':
        return this.carRentalAPI.searchCarRentals(params);
      default:
        throw new Error(`Unsupported transport mode: ${mode}`);
    }
  }

  // Compare all transport options for a route
  async compareTransportOptions(params: TransportSearchParams) {
    const results = await this.searchAllModes(params);
    
    // Calculate comparison metrics
    const comparison = {
      cheapest: this.findCheapest(results),
      fastest: this.findFastest(results),
      mostEcoFriendly: this.findMostEcoFriendly(results),
      mostConvenient: this.findMostConvenient(results)
    };

    return {
      results,
      comparison
    };
  }

  private findCheapest(results: any) {
    const allOptions = [...results.trains, ...results.buses, ...results.carRentals];
    return allOptions.reduce((cheapest, current) => 
      current.price.amount < cheapest.price.amount ? current : cheapest
    , allOptions[0]);
  }

  private findFastest(results: any) {
    const allOptions = [...results.trains, ...results.buses];
    return allOptions.reduce((fastest, current) => 
      current.duration.total < fastest.duration.total ? current : fastest
    , allOptions[0]);
  }

  private findMostEcoFriendly(results: any) {
    const allOptions = [...results.trains, ...results.buses];
    return allOptions.reduce((greenest, current) => 
      current.carbonFootprint.kg < greenest.carbonFootprint.kg ? current : greenest
    , allOptions[0]);
  }

  private findMostConvenient(results: any) {
    // Score based on multiple factors: direct route, frequency, stations
    return results.trains[0] || results.buses[0]; // Simplified
  }
}

// Export singleton instance
export const multiModalTransport = new MultiModalTransportService();