# Backend Documentation

## Overview
The backend uses Next.js API routes with a service-oriented architecture, emphasizing type safety, caching, and real-time capabilities.

## API Routes

### Trip Management

#### POST /api/trips
**Purpose**: Create new trip from wizard
**Auth**: Required
**Input**:
```typescript
{
  destinations: Array<{city, country, lat, lng}>,
  startDate: string,
  endDate: string,
  tripType: "business" | "trek" | "research" | "mixed",
  budget: number,
  preferences?: object
}
```
**Output**: Trip record with generated ID
**Process**:
1. Validate input with Zod
2. Create trip record in database
3. Enqueue generation job
4. Return trip ID for redirect

#### POST /api/trips/:id/generate
**Purpose**: Generate itinerary with AI (streaming)
**Auth**: Required (trip owner)
**Response**: Server-Sent Events
**Process**:
1. Validate trip ownership
2. Start planner agent
3. Stream skeleton structure first
4. Stream detailed activities
5. Stream price updates
6. Save final itinerary

#### POST /api/trips/:id/reflow
**Purpose**: Update itinerary with constraints
**Auth**: Required (trip owner)
**Input**:
```typescript
{
  locks: string[],        // Locked activity IDs
  edits: Array<Change>,   // Activity modifications
  constraints: object     // New constraints
}
```
**Output**: Updated itinerary
**Process**:
1. Load current itinerary + locks
2. Run reflow agent with constraints
3. Validate time/budget constraints
4. Save new version
5. Return updated plan

#### GET /api/trips/:id
**Purpose**: Fetch trip details
**Auth**: Required (trip owner or shared token)
**Output**:
```typescript
{
  trip: TripRecord,
  itinerary: ItineraryData,
  quotes: PriceQuote[],
  locks: string[]
}
```

#### PATCH /api/trips/:id
**Purpose**: Update trip metadata
**Auth**: Required (trip owner)
**Input**: Partial trip updates
**Output**: Updated trip record

#### POST /api/trips/:id/share
**Purpose**: Generate shareable public link
**Auth**: Required (trip owner)
**Output**: 
```typescript
{
  token: string,
  url: string,
  expiresAt?: string
}
```

### Search & Discovery

#### GET /api/search/places
**Purpose**: Search for places of interest
**Auth**: Optional (rate limited)
**Query Parameters**:
- `q`: Search query
- `lat`, `lng`: Location center
- `radius`: Search radius in meters
- `categories`: Place categories
- `limit`: Result limit

**Process**:
1. Check cache first (Redis)
2. Query Foursquare Places API
3. Fallback to OpenTripMap
4. Normalize response format
5. Cache results (24h TTL)

### Pricing

#### GET /api/price/flights
**Purpose**: Get flight price quotes
**Auth**: Required
**Query Parameters**:
- `from`, `to`: Airport codes
- `departure`, `return`: Dates
- `adults`: Passenger count

**Process**:
1. Check cache (2-4h TTL)
2. Query Kiwi Tequila API
3. Parse and normalize prices
4. Return sorted options

#### GET /api/price/lodging
**Purpose**: Get hotel/accommodation quotes
**Auth**: Required
**Query Parameters**:
- `lat`, `lng`: Location
- `checkin`, `checkout`: Dates
- `guests`: Guest count

**Process**:
1. Check cache (2-4h TTL)
2. Generate Booking.com affiliate links
3. Get Agoda pricing if available
4. Return options by price tier

#### GET /api/price/cars
**Purpose**: Get car rental quotes
**Auth**: Required
**Query Parameters**:
- `location`: Pickup location
- `pickup`, `dropoff`: Dates

**Process**:
1. Check cache (4h TTL)
2. Query DiscoverCars API
3. Add nearby rental locations
4. Return with deep links

#### GET /api/price/activities
**Purpose**: Get activity/tour pricing
**Auth**: Required
**Query Parameters**:
- `lat`, `lng`: Location
- `date`: Activity date
- `category`: Activity type

**Process**:
1. Check cache (4h TTL)
2. Query GetYourGuide API
3. Fallback to Viator/Klook
4. Return with booking links

### Export

#### POST /api/export/:id
**Purpose**: Generate PDF/ICS exports
**Auth**: Required (trip owner)
**Query Parameter**: `format=pdf|ics`
**Process**:
1. Validate trip ownership
2. Generate PDF with pdf-lib or ICS
3. Include QR codes for booking links
4. Return file URL or stream

### Weather

#### GET /api/weather
**Purpose**: Get weather forecast
**Auth**: Optional (cached)
**Query Parameters**:
- `lat`, `lng`: Location
- `date`: Forecast date

**Process**:
1. Check cache (6h TTL)
2. Query Open-Meteo API
3. Return forecast data

### Webhooks

#### POST /api/webhooks/clerk
**Purpose**: Handle Clerk user lifecycle events
**Auth**: Svix signature validation
**Events**:
- `user.created`: Create database user record
- `user.updated`: Sync profile changes
- `user.deleted`: Clean up user data

#### POST /api/webhooks/stripe
**Purpose**: Handle Stripe subscription events
**Auth**: Stripe signature validation
**Events**:
- `checkout.session.completed`: Upgrade to Pro
- `customer.subscription.updated`: Sync subscription
- `customer.subscription.deleted`: Downgrade account

### Health

#### GET /api/health
**Purpose**: Service health check
**Auth**: None
**Output**:
```typescript
{
  status: "ok" | "degraded" | "down",
  timestamp: string,
  version: string,
  dependencies: {
    database: "ok" | "down",
    redis: "ok" | "down",
    external: "ok" | "degraded"
  }
}
```

## Middleware Stack

### Authentication Middleware (Clerk)
- Validates JWT tokens
- Injects user context
- Protects private routes
- Handles session refresh

### Rate Limiting
- **Public endpoints**: 100 req/min per IP
- **Authenticated**: 1000 req/min per user
- **Pricing endpoints**: 60 req/min per user
- **Generation**: 5 req/min per user

### Input Validation (Zod)
- Validates all request bodies
- Sanitizes input data
- Provides detailed error messages
- Prevents injection attacks

### Error Handling
- Centralized error formatting
- Sentry error reporting
- User-friendly error messages
- Proper HTTP status codes

### Logging (Pino)
- Structured JSON logging
- Request/response logging
- Performance metrics
- Error stack traces

## Background Jobs

### Price Refresh Job
**Schedule**: Every 2 hours
**Purpose**: Update cached price quotes
**Process**:
1. Find quotes expiring soon
2. Refresh from original sources
3. Update cache and database
4. Notify affected users if significant changes

### Cache Invalidation Job
**Schedule**: Every 6 hours
**Purpose**: Clean up stale cache entries
**Process**:
1. Remove expired cache keys
2. Update cache hit/miss metrics
3. Preload popular searches

### Email Notifications
**Triggers**: Trip updates, price alerts, system notifications
**Service**: Resend
**Templates**: React-based email templates

## Database Layer

### Connection Management
- **Pool Size**: 20 connections
- **Connection Timeout**: 30 seconds
- **Query Timeout**: 60 seconds
- **Retry Logic**: 3 attempts with exponential backoff

### Query Optimization
- Prepared statements for common queries
- Proper indexing strategy
- Query plan analysis
- N+1 query prevention

### Migrations (Drizzle Kit)
```bash
pnpm db:generate    # Generate migration
pnpm db:migrate     # Run migration
pnpm db:seed        # Seed data
```

## Caching Strategy

### Multi-Layer Caching
1. **CDN Layer**: Static assets (Vercel Edge)
2. **Application Layer**: API responses (Redis)
3. **Database Layer**: Query results (Connection pool)
4. **Client Layer**: SWR caching

### Cache Keys
- Places: `place:{bbox}:{category}`
- Hours: `hours:{placeId}`
- Prices: `price:{tripId}:{itemKey}`
- Weather: `weather:{lat}:{lng}:{date}`

### TTL Strategy
- **Places**: 24 hours
- **Hours**: 7 days
- **Prices**: 2-4 hours
- **Weather**: 6 hours
- **User data**: 1 hour

## Cost Control

### API Usage Optimization
- Request deduplication
- Batch processing where possible
- Intelligent caching
- Circuit breaker patterns

### Resource Limits
- **Database**: Connection pooling
- **Redis**: Memory limits with LRU eviction
- **API calls**: Rate limiting per integration
- **File uploads**: Size and type restrictions

## Monitoring & Observability

### Application Metrics (PostHog)
- API response times
- Error rates by endpoint
- User journey tracking
- Feature usage analytics

### Error Tracking (Sentry)
- Real-time error notifications
- Error grouping and trends
- Performance monitoring
- Release health tracking

### Database Monitoring
- Query performance
- Connection pool status
- Storage usage
- Index effectiveness

### External Service Monitoring
- API availability
- Response time tracking
- Error rate monitoring
- Rate limit tracking