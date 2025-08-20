import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, lat, lng } = await request.json();
    
    // Try Foursquare first if API key is available
    if (process.env.FOURSQUARE_API_KEY) {
      try {
        const foursquareResults = await searchFoursquare(query, lat, lng);
        if (foursquareResults.length > 0) {
          return NextResponse.json({ 
            places: foursquareResults, 
            source: 'foursquare',
            success: true 
          });
        }
      } catch (error) {
        console.error('Foursquare error:', error);
      }
    }
    
    // Fallback to mock data
    const mockResults = generateMockPlaces(query, lat, lng);
    return NextResponse.json({ 
      places: mockResults, 
      source: 'mock',
      success: true,
      message: 'Using mock data (Foursquare not available or no results)'
    });
    
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json({ 
      error: 'Search failed', 
      success: false 
    }, { status: 500 });
  }
}

async function searchFoursquare(query: string, lat: number, lng: number) {
  const url = new URL('https://api.foursquare.com/v3/places/search');
  url.searchParams.set('query', query);
  url.searchParams.set('ll', `${lat},${lng}`);
  url.searchParams.set('radius', '10000');
  url.searchParams.set('limit', '10');
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': process.env.FOURSQUARE_API_KEY!,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Foursquare API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.results?.map((place: any) => ({
    id: place.fsq_id,
    name: place.name,
    category: place.categories?.[0]?.name || 'Place',
    lat: place.geocodes?.main?.latitude,
    lng: place.geocodes?.main?.longitude,
    rating: place.rating || null,
    verified: true,
    source: 'foursquare'
  })) || [];
}

function generateMockPlaces(query: string, lat: number, lng: number) {
  const mockTypes = [
    { name: 'Restaurant', category: 'food', emoji: '🍽️' },
    { name: 'Cafe', category: 'food', emoji: '☕' },
    { name: 'Museum', category: 'sight', emoji: '🏛️' },
    { name: 'Park', category: 'nature', emoji: '🌳' },
    { name: 'Shopping Mall', category: 'shopping', emoji: '🛍️' },
  ];
  
  return mockTypes.map((type, index) => ({
    id: `mock-${index}`,
    name: `${type.emoji} ${type.name} near ${query}`,
    category: type.category,
    lat: lat + (Math.random() - 0.5) * 0.02,
    lng: lng + (Math.random() - 0.5) * 0.02,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    verified: false,
    source: 'mock'
  }));
}