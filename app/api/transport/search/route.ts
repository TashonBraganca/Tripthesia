import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const transportSearchSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  adults: z.number().int().min(1).max(9).default(1),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('USD'),
  transportTypes: z.array(z.enum(['flight', 'train', 'bus'])).default(['flight', 'train', 'bus']),
});

interface TransportOption {
  id: string;
  type: 'flight' | 'train' | 'bus';
  provider: string;
  airline?: string;
  flightNumber?: string;
  trainNumber?: string;
  price: number;
  currency: string;
  duration: string;
  departure: {
    time: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  stops?: number;
  rating?: number;
  bookingLink?: string;
  baggage?: {
    carry: boolean;
    checked: boolean;
  };
  amenities?: string[];
  score: number;
  co2Emissions?: number;
  comfort?: string;
}

// European train routes mapping
const TRAIN_ROUTES: Record<string, string[]> = {
  'London': ['Paris', 'Brussels', 'Amsterdam', 'Berlin'],
  'Paris': ['London', 'Brussels', 'Amsterdam', 'Berlin', 'Rome', 'Barcelona', 'Madrid'],
  'Berlin': ['Paris', 'Amsterdam', 'Prague', 'Vienna', 'Munich'],
  'Amsterdam': ['London', 'Paris', 'Berlin', 'Brussels'],
  'Brussels': ['London', 'Paris', 'Amsterdam'],
  'Rome': ['Paris', 'Milan', 'Florence', 'Naples'],
  'Barcelona': ['Madrid', 'Paris', 'Valencia'],
  'Madrid': ['Barcelona', 'Paris', 'Lisbon'],
  'Vienna': ['Berlin', 'Prague', 'Budapest'],
  'Prague': ['Berlin', 'Vienna', 'Budapest'],
  'Munich': ['Berlin', 'Vienna', 'Zurich'],
  'Milan': ['Rome', 'Paris', 'Zurich'],
  'Zurich': ['Milan', 'Munich', 'Paris'],
};

// Major bus route networks
const BUS_ROUTES: Record<string, string[]> = {
  // Most cities are connected by bus networks
  // FlixBus, MegaBus, Greyhound, etc. cover extensive routes
};

// Calculate approximate distance for pricing
function calculateDistance(from: string, to: string): number {
  // Mock distance calculation - in real implementation, use geocoding
  const cityCoords: Record<string, [number, number]> = {
    'London': [51.5074, -0.1278],
    'Paris': [48.8566, 2.3522],
    'Berlin': [52.5200, 13.4050],
    'Amsterdam': [52.3676, 4.9041],
    'Rome': [41.9028, 12.4964],
    'Barcelona': [41.3851, 2.1734],
    'Madrid': [40.4168, -3.7038],
    'Vienna': [48.2082, 16.3738],
    'New York': [40.7128, -74.0060],
    'Los Angeles': [34.0522, -118.2437],
    'Tokyo': [35.6762, 139.6503],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.7041, 77.1025],
  };

  const fromCoords = cityCoords[from] || [0, 0];
  const toCoords = cityCoords[to] || [0, 0];

  const R = 6371; // Earth's radius in kilometers
  const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
  const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(fromCoords[0] * Math.PI / 180) * Math.cos(toCoords[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return Math.max(distance, 100); // Minimum 100km
}

// Search trains using mock data (can be replaced with real APIs)
async function searchTrains(params: {
  from: string;
  to: string;
  departureDate: string;
  adults: number;
  currency: string;
}): Promise<TransportOption[]> {
  // Check if train route exists
  const trainRoutes = TRAIN_ROUTES[params.from] || [];
  if (!trainRoutes.includes(params.to)) {
    return []; // No train connection
  }

  const distance = calculateDistance(params.from, params.to);
  const trainOptions: TransportOption[] = [];

  // Generate 2-4 train options
  const trainProviders = ['Eurail Express', 'High Speed Rail', 'Regional Express', 'InterCity'];
  const numOptions = Math.min(Math.floor(Math.random() * 3) + 2, 4);

  for (let i = 0; i < numOptions; i++) {
    const isHighSpeed = i === 1; // Second option is usually high-speed
    const basePrice = distance * (isHighSpeed ? 0.15 : 0.08); // Price per km
    const priceMultiplier = params.currency === 'USD' ? 1 : params.currency === 'EUR' ? 0.85 : 0.75;
    
    const departureHour = 6 + (i * 3) + Math.random() * 2;
    const travelTimeHours = isHighSpeed ? distance / 200 : distance / 120; // Speed: 200km/h or 120km/h
    const arrivalHour = departureHour + travelTimeHours;

    trainOptions.push({
      id: `train-${i + 1}`,
      type: 'train',
      provider: trainProviders[i],
      trainNumber: `${isHighSpeed ? 'HSR' : 'RE'}-${Math.floor(Math.random() * 9000) + 1000}`,
      price: Math.floor(basePrice * priceMultiplier * (0.8 + Math.random() * 0.4)),
      currency: params.currency,
      duration: `${Math.floor(travelTimeHours)}h ${Math.floor((travelTimeHours % 1) * 60)}m`,
      departure: {
        time: `${Math.floor(departureHour).toString().padStart(2, '0')}:${Math.floor((departureHour % 1) * 60).toString().padStart(2, '0')}`,
        airport: isHighSpeed ? 'Central Station' : 'Main Station',
        city: params.from,
      },
      arrival: {
        time: `${Math.floor(arrivalHour).toString().padStart(2, '0')}:${Math.floor((arrivalHour % 1) * 60).toString().padStart(2, '0')}`,
        airport: isHighSpeed ? 'Central Station' : 'Main Station',
        city: params.to,
      },
      stops: isHighSpeed ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 1,
      rating: 3.8 + Math.random() * 1.2,
      bookingLink: isHighSpeed ? 'https://raileurope.com' : 'https://eurail.com',
      amenities: isHighSpeed 
        ? ['WiFi', 'Power Outlet', 'Restaurant', 'First Class Available']
        : ['WiFi', 'Power Outlet', 'Cafe Car'],
      score: (isHighSpeed ? 8 : 7) + Math.random() * 1.5,
      co2Emissions: Math.floor(distance * 0.02), // Very low emissions
      comfort: isHighSpeed ? 'Premium' : 'Standard'
    });
  }

  return trainOptions;
}

// Search buses using mock data
async function searchBuses(params: {
  from: string;
  to: string;
  departureDate: string;
  adults: number;
  currency: string;
}): Promise<TransportOption[]> {
  const distance = calculateDistance(params.from, params.to);
  const busOptions: TransportOption[] = [];

  // Generate 2-3 bus options
  const busProviders = ['FlixBus', 'MegaBus', 'Greyhound', 'Eurolines'];
  const numOptions = Math.min(Math.floor(Math.random() * 2) + 2, 3);

  for (let i = 0; i < numOptions; i++) {
    const isPremium = i === 1; // Second option is premium
    const basePrice = distance * (isPremium ? 0.06 : 0.04); // Price per km
    const priceMultiplier = params.currency === 'USD' ? 1 : params.currency === 'EUR' ? 0.85 : 0.75;
    
    const departureHour = 7 + (i * 4) + Math.random() * 2;
    const travelTimeHours = isPremium ? distance / 80 : distance / 65; // Speed with stops
    const arrivalHour = departureHour + travelTimeHours;

    busOptions.push({
      id: `bus-${i + 1}`,
      type: 'bus',
      provider: `${busProviders[i]}${isPremium ? ' Premium' : ''}`,
      price: Math.floor(basePrice * priceMultiplier * (0.7 + Math.random() * 0.6)),
      currency: params.currency,
      duration: `${Math.floor(travelTimeHours)}h ${Math.floor((travelTimeHours % 1) * 60)}m`,
      departure: {
        time: `${Math.floor(departureHour).toString().padStart(2, '0')}:${Math.floor((departureHour % 1) * 60).toString().padStart(2, '0')}`,
        airport: isPremium ? 'Central Bus Terminal' : 'Bus Station',
        city: params.from,
      },
      arrival: {
        time: `${Math.floor(arrivalHour).toString().padStart(2, '0')}:${Math.floor((arrivalHour % 1) * 60).toString().padStart(2, '0')}`,
        airport: isPremium ? 'Central Bus Terminal' : 'Bus Station',
        city: params.to,
      },
      stops: Math.floor(Math.random() * 3) + 1,
      rating: 3.5 + Math.random() * 1.5,
      bookingLink: `https://${busProviders[i].toLowerCase().replace(' ', '')}.com`,
      amenities: isPremium 
        ? ['WiFi', 'Power Outlet', 'Reclining Seats', 'Air Conditioning', 'Snacks']
        : ['WiFi', 'Power Outlet', 'Air Conditioning'],
      score: (isPremium ? 7 : 6) + Math.random() * 1.5,
      co2Emissions: Math.floor(distance * 0.05), // Low emissions per person
      comfort: isPremium ? 'Premium' : 'Standard'
    });
  }

  return busOptions;
}

// Get flights from existing flight search API
async function getFlights(params: {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
}): Promise<TransportOption[]> {
  try {
    // Make internal API call to flight search
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flights/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('Flight search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.flights || [];
  } catch (error) {
    console.error('Flight search error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const searchParams = transportSearchSchema.parse(body);

    const results = await Promise.allSettled([
      // Search flights if requested
      searchParams.transportTypes.includes('flight') 
        ? getFlights({
            from: searchParams.from,
            to: searchParams.to,
            departureDate: searchParams.departureDate,
            returnDate: searchParams.returnDate,
            adults: searchParams.adults,
            currency: searchParams.currency,
          })
        : Promise.resolve([]),
      
      // Search trains if requested
      searchParams.transportTypes.includes('train')
        ? searchTrains({
            from: searchParams.from,
            to: searchParams.to,
            departureDate: searchParams.departureDate,
            adults: searchParams.adults,
            currency: searchParams.currency,
          })
        : Promise.resolve([]),
      
      // Search buses if requested
      searchParams.transportTypes.includes('bus')
        ? searchBuses({
            from: searchParams.from,
            to: searchParams.to,
            departureDate: searchParams.departureDate,
            adults: searchParams.adults,
            currency: searchParams.currency,
          })
        : Promise.resolve([]),
    ]);

    const allOptions: TransportOption[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allOptions.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`Transport search failed for type ${searchParams.transportTypes[index]}:`, result.reason);
      }
    });

    // Sort by score (best overall value)
    allOptions.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      transportOptions: allOptions,
      searchParams: {
        from: searchParams.from,
        to: searchParams.to,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        adults: searchParams.adults,
        currency: searchParams.currency,
        transportTypes: searchParams.transportTypes,
      },
      summary: {
        total: allOptions.length,
        byType: {
          flight: allOptions.filter(o => o.type === 'flight').length,
          train: allOptions.filter(o => o.type === 'train').length,
          bus: allOptions.filter(o => o.type === 'bus').length,
        },
        priceRange: allOptions.length > 0 ? {
          min: Math.min(...allOptions.map(o => o.price)),
          max: Math.max(...allOptions.map(o => o.price)),
        } : null,
      },
    });

  } catch (error) {
    console.error('Transport search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Transport search failed' },
      { status: 500 }
    );
  }
}