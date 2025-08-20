# Integrations Documentation

## Overview
Tripthesia integrates with multiple external services to provide real-time pricing, place data, mapping, and booking capabilities. All integrations include error handling, rate limiting, and fallback strategies.

## Travel Data Providers

### Kiwi Tequila (Flights/Trains/Buses)

#### Authentication
```typescript
const headers = {
  'apikey': process.env.KIWI_API_KEY!,
  'Content-Type': 'application/json'
};
```

#### Key Endpoints
```typescript
// Multi-city flight search
GET https://tequila-api.kiwi.com/v2/search
?fly_from=JFK
&fly_to=LON  
&date_from=01/10/2025
&date_to=07/10/2025
&curr=USD
&adults=1
&sort=price
&limit=50

// Specific flight details
GET https://tequila-api.kiwi.com/v2/flights/{id}

// Booking deep link (from search response)
booking_token -> direct booking URL
```

#### Sample Response
```json
{
  "data": [
    {
      "id": "040126241...",
      "price": 299,
      "booking_token": "AkJ8U2FsdGV...",
      "deep_link": "https://www.kiwi.com/deep?from=...",
      "route": [
        {
          "flyFrom": "JFK",
          "flyTo": "LHR", 
          "local_departure": "2025-10-01T14:30:00.000Z",
          "local_arrival": "2025-10-02T02:15:00.000Z",
          "airline": "BA",
          "flight_no": 177
        }
      ],
      "airlines": ["BA"],
      "duration": {"total": 27900}
    }
  ],
  "currency": "USD",
  "_results": 1
}
```

#### Integration Strategy
- Cache results for 2-4 hours
- Batch multiple destination queries
- Handle different trip types (one-way, round-trip, multi-city)
- Fall back to manual search URLs if API fails

### Foursquare Places (Primary POI Data)

#### Authentication
```typescript
const headers = {
  'Authorization': process.env.FOURSQUARE_API_KEY!,
  'Accept': 'application/json'
};
```

#### Key Endpoints
```typescript
// Place search by location
GET https://api.foursquare.com/v3/places/search
?ll=40.7128,-74.0060
&radius=10000
&categories=13000,10000,12000  // Food, Arts, Shopping
&sort=POPULARITY
&limit=50

// Place details with hours
GET https://api.foursquare.com/v3/places/{fsq_id}
?fields=name,categories,location,hours,rating,photos

// Place hours specifically
GET https://api.foursquare.com/v3/places/{fsq_id}/hours
```

#### Sample Response
```json
{
  "results": [
    {
      "fsq_id": "4b158184f964a520f4ac23e3",
      "name": "Central Park",
      "categories": [
        {
          "id": 16032,
          "name": "Park",
          "icon": {"prefix": "https://ss3.4sqi.net/img/categories_v2/parks_outdoors/park_"}
        }
      ],
      "location": {
        "address": "Central Park",
        "locality": "New York",
        "region": "NY",
        "country": "US",
        "formatted_address": "Central Park, New York, NY",
        "geocodes": {
          "main": {"latitude": 40.78838, "longitude": -73.96732}
        }
      },
      "rating": 9.2,
      "hours": {
        "regular": [
          {"day": 1, "open": "0600", "close": "0000"},
          {"day": 2, "open": "0600", "close": "0000"}
        ]
      }
    }
  ]
}
```

#### Category Mapping
```typescript
const categoryMap = {
  // Food & Drink
  '13000': 'restaurant',
  '13001': 'american_restaurant', 
  '13002': 'asian_restaurant',
  
  // Arts & Entertainment  
  '10000': 'arts_entertainment',
  '10001': 'aquarium',
  '10002': 'arcade',
  
  // Shopping
  '12000': 'retail',
  '12001': 'antique_shop',
  '12002': 'apparel_shop'
};
```

### OpenTripMap (Secondary POI Data)

#### Authentication
```typescript
const apiKey = process.env.OPENTRIPMAP_API_KEY!;
```

#### Key Endpoints
```typescript
// POI search by location
GET https://api.opentripmap.com/0.1/en/places/radius
?radius=10000
&lon=-74.0060
&lat=40.7128
&kinds=historic,museums,architecture
&format=json
&limit=100
&apikey=${apiKey}

// Place details
GET https://api.opentripmap.com/0.1/en/places/xid/{xid}
?apikey=${apiKey}
```

#### Category Harmonization
```typescript
// Map OTM categories to our standard
const otmCategoryMap = {
  'historic': 'historical_site',
  'museums': 'museum', 
  'architecture': 'landmark',
  'natural': 'nature',
  'sport': 'recreation',
  'tourism': 'attraction'
};
```

### Booking.com/Agoda (Hotels)

#### Affiliate Integration
```typescript
// Generate Booking.com affiliate link
function generateBookingLink(params: {
  checkin: string,
  checkout: string,
  latitude: number,
  longitude: number,
  guests: number
}) {
  const baseUrl = 'https://www.booking.com/searchresults.html';
  const affiliateId = process.env.BOOKING_AFFILIATE_ID!;
  
  return `${baseUrl}?aid=${affiliateId}&checkin=${params.checkin}&checkout=${params.checkout}&latitude=${params.latitude}&longitude=${params.longitude}&no_rooms=1&group_adults=${params.guests}`;
}

// Agoda affiliate link
function generateAgodaLink(params: HotelSearchParams) {
  const baseUrl = 'https://www.agoda.com/search';
  const cid = process.env.AGODA_CID!;
  
  return `${baseUrl}?cid=${cid}&city=${params.cityId}&checkIn=${params.checkin}&checkOut=${params.checkout}&rooms=1&adults=${params.guests}`;
}
```

#### Property Search Strategy
1. Use coordinates to find properties within radius
2. Group by price tier (budget/mid-range/luxury)
3. Include ratings and review counts
4. Generate deep links with tracking parameters

### GetYourGuide, Viator, Klook (Activities)

#### GetYourGuide Integration
```typescript
// Search activities by location
const searchActivities = async (params: {
  latitude: number,
  longitude: number,
  radius: number,
  date?: string
}) => {
  // Use partner API or generate affiliate links
  const baseUrl = 'https://www.getyourguide.com';
  const partnerId = process.env.GYG_PARTNER_ID!;
  
  // Search by city/location
  return `${baseUrl}/s?partner_id=${partnerId}&q=${params.city}&date=${params.date}`;
};
```

#### Activity Categories
- Tours & Sightseeing
- Food & Drink Experiences  
- Adventure & Outdoor
- Museums & Culture
- Transportation
- Unique Experiences

#### Pricing Strategy
- Display "From $X per person" pricing
- Include typical duration
- Show availability indicators
- Link directly to booking pages

### DiscoverCars/Rentalcars (Car Rentals)

#### API Integration
```typescript
// Search car rentals
GET https://api.discovercars.com/search
?pickup_location_id=${locationId}
&pickup_date=${date}
&pickup_time=10:00
&dropoff_date=${endDate}  
&dropoff_time=10:00
&currency=USD
&partner_id=${partnerId}

// Sample response format
interface CarRental {
  vendor: string;
  vehicle_class: string;
  price_per_day: number;
  total_price: number;
  deep_link: string;
  features: string[];
  pickup_location: {
    name: string;
    address: string;
    coordinates: [number, number];
  };
}
```

## Maps & Routing

### Mapbox (Visualization)

#### Map Configuration
```typescript
const mapboxConfig = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
  style: 'mapbox://styles/tripthesia/custom-travel-style',
  center: [-74.0060, 40.7128],
  zoom: 12
};
```

#### Custom Map Style Features
- Optimized for travel planning
- Highlighted transit stations
- Prominent landmarks
- Restaurant/hotel markers
- Walking-friendly street emphasis

#### Map Interactions
- Cluster POI markers by zoom level
- Show travel routes between activities
- Hover effects sync with timeline
- Custom markers for different activity types

### OpenRouteService (Routing)

#### Configuration
```typescript
const orsConfig = {
  apiKey: process.env.OPENROUTESERVICE_API_KEY!,
  baseUrl: 'https://api.openrouteservice.org'
};
```

#### Routing Profiles
```typescript
// Different transport modes
const profiles = {
  'foot-walking': 'walking',
  'driving-car': 'driving', 
  'cycling-regular': 'cycling',
  'public-transport': 'transit'  // Limited support
};

// Route optimization
GET /v2/directions/{profile}
?start=lng,lat
&end=lng,lat
&radiuses=500,500  // Allow 500m deviation
&overview=full
&geometries=geojson
&instructions=true
```

#### Route Processing
- Calculate time estimates with traffic
- Provide turn-by-turn directions
- Handle multi-waypoint optimization
- Fall back to straight-line estimates if API fails

## Weather & Utilities

### Open-Meteo (Weather)

#### API Integration
```typescript
// Weather forecast
GET https://api.open-meteo.com/v1/forecast
?latitude=40.7128
&longitude=-74.0060
&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode
&hourly=temperature_2m,precipitation_probability,weathercode
&timezone=America/New_York
&forecast_days=14

// Weather alerts
GET https://api.open-meteo.com/v1/forecast
?latitude=40.7128
&longitude=-74.0060
&alerts=true
```

#### Weather Integration Strategy
- Cache forecasts for 6 hours
- Show weather impact on activities (indoor/outdoor)
- Include packing suggestions
- Weather-based activity recommendations

### Open Exchange Rates (Currency)

#### Configuration
```typescript
const oxrConfig = {
  appId: process.env.OPEN_EXCHANGE_RATES_KEY!,
  baseUrl: 'https://openexchangerates.org/api'
};

// Latest rates
GET https://openexchangerates.org/api/latest.json
?app_id=${appId}
&base=USD
&symbols=EUR,GBP,JPY,AUD,CAD
```

## Rate Limiting & Error Handling

### Rate Limit Strategy
```typescript
const rateLimits = {
  foursquare: { requests: 950, window: 3600 }, // 950/hour
  kiwi: { requests: 100, window: 60 },         // 100/min
  openroute: { requests: 2000, window: 86400 }, // 2000/day
  opentripmap: { requests: 5000, window: 86400 } // 5000/day
};
```

### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > 60000) { // 1 min
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Fallback Strategies
- **Places**: Foursquare → OpenTripMap → Cached data
- **Routing**: OpenRouteService → Straight-line estimates
- **Weather**: Open-Meteo → Historical averages
- **Pricing**: Primary → Secondary → "Contact for price"

## Caching Strategy

### Redis Cache Keys
```typescript
const cacheKeys = {
  place: (bbox: string, category: string) => `place:${bbox}:${category}`,
  hours: (placeId: string) => `hours:${placeId}`,
  route: (from: string, to: string, profile: string) => `route:${from}:${to}:${profile}`,
  weather: (lat: number, lng: number, date: string) => `weather:${lat}:${lng}:${date}`,
  price: (type: string, key: string) => `price:${type}:${key}`
};
```

### TTL Strategy
- **Places**: 24 hours (stable data)
- **Hours**: 7 days (changes infrequently) 
- **Routes**: 1 hour (traffic changes)
- **Weather**: 6 hours (updated regularly)
- **Prices**: 2-4 hours (volatile)

## Monitoring & Analytics

### API Health Monitoring
```typescript
interface ProviderMetrics {
  requests: number;
  failures: number;
  avgResponseTime: number;
  rateLimitHits: number;
  lastError?: string;
}
```

### Cost Tracking
- API call costs per provider
- Usage patterns by feature
- Cost per generated itinerary
- Budget alerts and limits

### Data Quality Metrics
- Place data freshness
- Pricing accuracy
- Route accuracy validation
- User satisfaction by provider