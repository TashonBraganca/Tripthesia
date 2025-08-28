import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  getCachedFlightResults,
  cacheFlightResults,
  isFlightCacheAvailable,
  type FlightSearchParams
} from "@/lib/cache/flight-cache";

const flightSearchSchema = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().optional(),
  adults: z.number().int().min(1).max(9).default(1),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
});

// IATA code mapping for popular destinations
const LOCATION_TO_IATA: Record<string, string[]> = {
  'New York': ['JFK', 'LGA', 'EWR'],
  'Los Angeles': ['LAX'],
  'London': ['LHR', 'LGW', 'STN'],
  'Paris': ['CDG', 'ORY'],
  'Tokyo': ['NRT', 'HND'],
  'Rome': ['FCO', 'CIA'],
  'Madrid': ['MAD'],
  'Barcelona': ['BCN'],
  'Amsterdam': ['AMS'],
  'Berlin': ['BER'],
  'Sydney': ['SYD'],
  'Melbourne': ['MEL'],
  'Toronto': ['YYZ'],
  'Vancouver': ['YVR'],
  'Mumbai': ['BOM'],
  'Delhi': ['DEL'],
  'Bangkok': ['BKK'],
  'Singapore': ['SIN'],
  'Dubai': ['DXB'],
  'Istanbul': ['IST'],
  'Seoul': ['ICN'],
  'Hong Kong': ['HKG'],
  'Shanghai': ['PVG', 'SHA'],
  'Beijing': ['PEK'],
  'São Paulo': ['GRU'],
  'Mexico City': ['MEX'],
  'Cairo': ['CAI'],
  'Johannesburg': ['JNB'],
  'Miami': ['MIA'],
  'San Francisco': ['SFO'],
  'Chicago': ['ORD', 'MDW'],
  'Boston': ['BOS'],
  'Washington': ['DCA', 'IAD', 'BWI'],
  'Las Vegas': ['LAS'],
};

function getCityIataCode(cityName: string): string {
  // Find matching city from our location mapping
  for (const [city, codes] of Object.entries(LOCATION_TO_IATA)) {
    if (cityName.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(cityName.toLowerCase())) {
      return codes[0]; // Return primary airport
    }
  }
  
  // If no match found, return the input (assuming it might be an IATA code)
  return cityName.substring(0, 3).toUpperCase();
}

async function searchFlightsWithRapidAPI(params: {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
}, apiKey: string) {
  try {
    const fromIata = getCityIataCode(params.from);
    const toIata = getCityIataCode(params.to);
    
    // Using SkyScanner API via RapidAPI (free tier available)
    const searchParams = new URLSearchParams({
      originSkyId: fromIata,
      destinationSkyId: toIata,
      departureDate: params.departureDate.split('T')[0],
      adults: params.adults.toString(),
      currency: params.currency,
    });
    
    if (params.returnDate) {
      searchParams.append('returnDate', params.returnDate.split('T')[0]);
    }

    const response = await fetch(`https://skyscanner80.p.rapidapi.com/api/v1/flights/search-roundtrip?${searchParams}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'skyscanner80.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();
    return processRapidAPIFlights(data.data?.itineraries || []);
    
  } catch (error) {
    console.error('RapidAPI SkyScanner error:', error);
    throw error; // Let parent function handle fallback
  }
}

function processRapidAPIFlights(rapidFlights: any[]) {
  return rapidFlights.map((itinerary: any, index: number) => {
    const leg = itinerary.legs?.[0];
    const price = itinerary.price;
    
    if (!leg) return null;
    
    const segment = leg.segments?.[0];
    const origin = leg.origin;
    const destination = leg.destination;
    
    return {
      id: itinerary.id || `rapid-${index}`,
      type: 'flight',
      airline: segment?.marketingCarrier?.name || 'Unknown Airline',
      flightNumber: segment?.flightNumber || '',
      price: Math.round(price?.raw || 0),
      currency: price?.formatted?.split(' ')[0] || 'USD',
      duration: formatDuration(leg.durationInMinutes * 60),
      departure: {
        time: new Date(leg.departure).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        airport: origin?.id || '',
        city: origin?.name || '',
      },
      arrival: {
        time: new Date(leg.arrival).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        airport: destination?.id || '',
        city: destination?.name || '',
      },
      stops: leg.stopCount || 0,
      bookingLink: `https://www.skyscanner.com/transport/flights/${origin?.id}/${destination?.id}`,
      baggage: {
        carry: true,
        checked: Math.random() > 0.5, // RapidAPI doesn't always provide this info
      },
      score: 6 + Math.random() * 4,
    };
  }).filter(Boolean);
}

async function searchFlightsWithAmadeus(params: {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
}): Promise<{ flights: any[], provider: 'amadeus' | 'rapidapi' | 'mock' }> {
  const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
  const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  
  // Try RapidAPI first (easier to get), then Amadeus
  if (RAPIDAPI_KEY) {
    try {
      const flights = await searchFlightsWithRapidAPI(params, RAPIDAPI_KEY);
      return { flights, provider: 'rapidapi' };
    } catch (error) {
      console.error('RapidAPI failed, trying Amadeus:', error);
    }
  }
  
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    console.log('No flight API credentials found, using enhanced mock data');
    const flights = generateEnhancedMockFlights(params);
    return { flights, provider: 'mock' };
  }

  try {
    // First, get access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token fetch failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const fromIata = getCityIataCode(params.from);
    const toIata = getCityIataCode(params.to);
    
    // Search for flight offers
    const searchParams = new URLSearchParams({
      originLocationCode: fromIata,
      destinationLocationCode: toIata,
      departureDate: params.departureDate.split('T')[0],
      adults: params.adults.toString(),
      currencyCode: params.currency,
      max: '10',
    });
    
    if (params.returnDate) {
      searchParams.append('returnDate', params.returnDate.split('T')[0]);
    }

    const flightResponse = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!flightResponse.ok) {
      throw new Error(`Flight search failed: ${flightResponse.status}`);
    }

    const flightData = await flightResponse.json();
    const flights = processAmadeusFlights(flightData.data || [], flightData.dictionaries || {});
    return { flights, provider: 'amadeus' };
    
  } catch (error) {
    console.error('Amadeus API error:', error);
    // Fallback to enhanced mock data on API failure
    console.log('Falling back to mock data due to API error');
    const flights = generateEnhancedMockFlights(params);
    return { flights, provider: 'mock' };
  }
}

function processAmadeusFlights(amadeusFlights: any[], dictionaries: any) {
  return amadeusFlights.map((offer: any, index: number) => {
    const itinerary = offer.itineraries?.[0];
    const segment = itinerary?.segments?.[0];
    const price = offer.price;
    
    if (!segment) {
      return null;
    }

    const departure = segment.departure;
    const arrival = segment.arrival;
    const airline = dictionaries.carriers?.[segment.carrierCode] || segment.carrierCode;
    
    return {
      id: offer.id || `amadeus-${index}`,
      type: 'flight',
      airline: airline || 'Unknown Airline',
      flightNumber: `${segment.carrierCode}${segment.number}`,
      price: Math.round(parseFloat(price.total)),
      currency: price.currency || 'USD',
      duration: parseDuration(itinerary.duration),
      departure: {
        time: new Date(departure.at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        airport: departure.iataCode || '',
        city: dictionaries.locations?.[departure.iataCode]?.cityCode || departure.iataCode,
      },
      arrival: {
        time: new Date(arrival.at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        airport: arrival.iataCode || '',
        city: dictionaries.locations?.[arrival.iataCode]?.cityCode || arrival.iataCode,
      },
      stops: (itinerary.segments?.length || 1) - 1,
      bookingLink: `https://www.amadeus.com/booking/${offer.id}`,
      baggage: {
        carry: true,
        checked: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity > 0,
      },
      score: 7 + Math.random() * 3, // Amadeus typically has good quality
    };
  }).filter(Boolean);
}

function parseDuration(duration: string): string {
  if (!duration) return '0h 0m';
  
  // Parse ISO 8601 duration (PT2H30M format)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return '0h 0m';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  return `${hours}h ${minutes}m`;
}

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
        airport: getCityIataCode(params.from),
        city: params.from,
      },
      arrival: {
        time: `${Math.floor((departureHour + duration) % 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${((departureHour + duration) % 24) >= 12 ? 'PM' : 'AM'}`,
        airport: getCityIataCode(params.to),
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

    // Search for flights
    const { flights, provider } = await searchFlightsWithAmadeus(searchParams);

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