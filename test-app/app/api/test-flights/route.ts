import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, departDate } = await request.json();
    
    // Generate realistic mock flight data since Kiwi requires business account
    const mockFlights = generateMockFlights(origin, destination, departDate);
    
    return NextResponse.json({ 
      flights: mockFlights, 
      source: 'mock',
      success: true,
      message: 'Using realistic mock flight data (Kiwi API requires business account)'
    });
    
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json({ 
      error: 'Flight search failed', 
      success: false 
    }, { status: 500 });
  }
}

function generateMockFlights(origin: string, destination: string, departDate: string) {
  const airlines = [
    'IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'GoFirst', 'AirAsia India'
  ];
  
  const basePrice = getBasePriceForRoute(origin, destination);
  
  return Array.from({ length: 5 }, (_, index) => {
    const airline = airlines[index % airlines.length];
    const priceVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
    const price = Math.round(basePrice * priceVariation);
    
    // Generate realistic departure times
    const departHour = 6 + index * 3 + Math.floor(Math.random() * 2);
    const departMinute = Math.floor(Math.random() * 6) * 10;
    
    // Generate duration (1.5 to 3 hours for domestic)
    const durationMinutes = 90 + Math.floor(Math.random() * 90);
    const durationHours = Math.floor(durationMinutes / 60);
    const durationMins = durationMinutes % 60;
    
    // Calculate arrival time
    const arrivalTime = new Date(`${departDate}T${departHour.toString().padStart(2, '0')}:${departMinute.toString().padStart(2, '0')}`);
    arrivalTime.setMinutes(arrivalTime.getMinutes() + durationMinutes);
    
    const stops = Math.random() < 0.7 ? 0 : 1; // 70% direct flights
    
    return {
      airline,
      price,
      departure: {
        time: `${departHour.toString().padStart(2, '0')}:${departMinute.toString().padStart(2, '0')}`,
        airport: origin,
        date: departDate
      },
      arrival: {
        time: `${arrivalTime.getHours().toString().padStart(2, '0')}:${arrivalTime.getMinutes().toString().padStart(2, '0')}`,
        airport: destination,
        date: departDate
      },
      duration: `${durationHours}h ${durationMins}m`,
      stops,
      bookingUrl: `https://www.makemytrip.com/flight/search?from=${origin}&to=${destination}&date=${departDate}`,
      source: 'mock'
    };
  }).sort((a, b) => a.price - b.price); // Sort by price
}

function getBasePriceForRoute(origin: string, destination: string): number {
  // Realistic base prices for common Indian routes (in INR)
  const routePrices: Record<string, number> = {
    'DEL-BOM': 8500,  // Delhi to Mumbai
    'BOM-DEL': 8500,  // Mumbai to Delhi
    'DEL-BLR': 9200,  // Delhi to Bangalore  
    'BLR-DEL': 9200,  // Bangalore to Delhi
    'BOM-BLR': 7800,  // Mumbai to Bangalore
    'BLR-BOM': 7800,  // Bangalore to Mumbai
    'DEL-MAA': 10500, // Delhi to Chennai
    'MAA-DEL': 10500, // Chennai to Delhi
    'DEL-CCU': 8900,  // Delhi to Kolkata
    'CCU-DEL': 8900,  // Kolkata to Delhi
  };
  
  const routeKey = `${origin}-${destination}`;
  const reverseRouteKey = `${destination}-${origin}`;
  
  return routePrices[routeKey] || routePrices[reverseRouteKey] || 8000; // Default price
}