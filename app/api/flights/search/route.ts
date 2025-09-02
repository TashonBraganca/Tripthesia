import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getCachedFlightResults,
  cacheFlightResults,
  isFlightCacheAvailable,
  type FlightSearchParams
} from "@/lib/cache/flight-cache";
import { FlightSearchManager } from "@/lib/services/flight-providers";

const flightSearchSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  adults: z.number().int().min(1).max(9).default(1),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
});

// Flight search implementation using new multi-provider system

async function searchFlightsWithProviders(params: {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
}): Promise<{ flights: any[], provider: string }> {
  const flightManager = new FlightSearchManager({
    aviationStackKey: process.env.AVIATIONSTACK_API_KEY,
    rapidApiKey: process.env.RAPIDAPI_KEY,
  });
  
  try {
    const searchResult = await flightManager.searchFlights({
      from: params.from,
      to: params.to,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      currency: params.currency,
    });

    return {
      flights: searchResult.flights,
      provider: searchResult.provider
    };
  } catch (error) {
    console.error('Flight search failed with all providers:', error);
    // Final fallback to enhanced mock data
    const flights = generateEnhancedMockFlights(params);
    return { flights, provider: 'fallback-mock' };
  }
}

// Clean implementation using new FlightSearchManager - old functions removed

function generateEnhancedMockFlights(params: any) {
  const airlines = [
    'Delta Airlines', 'United Airlines', 'American Airlines', 'British Airways',
    'Emirates', 'Lufthansa', 'Air France', 'Singapore Airlines', 'Qatar Airways'
  ];
  
  const flights = [];
  
  for (let i = 0; i < 8; i++) {
    const basePrice = 300 + Math.random() * 800;
    const departureHour = 6 + Math.random() * 16;
    const duration = 2 + Math.random() * 12;
    
    flights.push({
      id: `mock-${i + 1}`,
      type: 'flight',
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      flightNumber: `${['DL', 'UA', 'AA', 'BA', 'EK'][Math.floor(Math.random() * 5)]}${Math.floor(Math.random() * 9000 + 1000)}`,
      price: Math.round(basePrice),
      currency: params.currency || 'USD',
      duration: `${Math.floor(duration)}h ${Math.floor((duration % 1) * 60)}m`,
      departure: {
        time: `${Math.floor(departureHour)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${departureHour >= 12 ? 'PM' : 'AM'}`,
        airport: params.from.substring(0, 3).toUpperCase() + (Math.floor(Math.random() * 9) + 1),
        city: params.from,
      },
      arrival: {
        time: `${Math.floor((departureHour + duration) % 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${((departureHour + duration) % 24) >= 12 ? 'PM' : 'AM'}`,
        airport: params.to.substring(0, 3).toUpperCase() + (Math.floor(Math.random() * 9) + 1),
        city: params.to,
      },
      stops: Math.random() > 0.6 ? 0 : Math.random() > 0.8 ? 2 : 1,
      bookingLink: `https://booking.example.com/flight/${i + 1}`,
      baggage: {
        carry: true,
        checked: Math.random() > 0.3,
      },
      score: 5 + Math.random() * 5,
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
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
    const searchParams = flightSearchSchema.parse(body);

    // Check cache first
    const cacheAvailable = await isFlightCacheAvailable();
    if (cacheAvailable) {
      const cachedResults = await getCachedFlightResults(searchParams);
      if (cachedResults) {
        return NextResponse.json({
          success: true,
          flights: cachedResults.flights,
          searchParams: cachedResults.searchParams,
          resultsCount: cachedResults.resultsCount,
          cached: true,
          provider: cachedResults.provider,
          cachedAt: new Date(cachedResults.cachedAt).toISOString(),
        });
      }
    }

    // Search for flights using new multi-provider system
    const { flights, provider } = await searchFlightsWithProviders(searchParams);

    // Cache results if cache is available
    if (cacheAvailable && flights.length > 0) {
      await cacheFlightResults(searchParams, flights, provider);
    }

    return NextResponse.json({
      success: true,
      flights,
      searchParams: {
        from: searchParams.from,
        to: searchParams.to,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        adults: searchParams.adults,
        currency: searchParams.currency,
      },
      resultsCount: flights.length,
      cached: false,
      provider: provider,
    });

  } catch (error) {
    console.error('Flight search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Flight search failed' },
      { status: 500 }
    );
  }
}