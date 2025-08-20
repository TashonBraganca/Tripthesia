# Database Documentation

## Overview
Tripthesia uses Neon PostgreSQL with PostGIS for geospatial queries, managed through Drizzle ORM with strict type safety and row-level security.

## Database Choice Rationale

### Why Neon PostgreSQL + PostGIS?
- **Geospatial Features**: Native support for location queries, distance calculations
- **Serverless Architecture**: Auto-scaling, pay-per-use pricing
- **PostGIS Extension**: Advanced geographic functions
- **ACID Compliance**: Data consistency for financial transactions
- **Full-text Search**: Built-in search capabilities
- **JSON Support**: Flexible schema for itinerary data

### Why Drizzle ORM?
- **Type Safety**: Full TypeScript integration
- **Performance**: Minimal runtime overhead
- **Flexibility**: Raw SQL when needed
- **Developer Experience**: Intuitive API design
- **Migration Management**: Schema versioning

## Schema Design

### Core Tables

#### users
```sql
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,           -- Clerk user ID
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### profiles
```sql
CREATE TABLE profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
  display_name VARCHAR(120),
  home_airport VARCHAR(8),              -- IATA code
  budget_band VARCHAR(16),              -- low/med/high
  pace VARCHAR(16),                     -- chill/standard/packed
  mobility VARCHAR(16),                 -- walk/public/car
  preferences JSONB,                    -- cuisine, dietary, must/avoid
  pro BOOLEAN DEFAULT FALSE
);
```

#### trips
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  title VARCHAR(160),
  destinations JSONB NOT NULL,          -- [{city, country, lat, lng}]
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  trip_type VARCHAR(24) NOT NULL,       -- business/trek/research/mixed
  budget_total INTEGER,                 -- in cents
  budget_split JSONB,                   -- {transport, lodging, food, activities}
  status VARCHAR(24) DEFAULT 'draft',   -- draft/generating/planned/shared/traveling/completed
  shared_token VARCHAR(64),             -- for public sharing
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### itineraries
```sql
CREATE TABLE itineraries (
  id SERIAL PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id),
  version INTEGER DEFAULT 1,
  data JSONB NOT NULL,                  -- structured Itinerary JSON
  locks JSONB,                          -- array of locked activity IDs
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### places (Cached POI Data)
```sql
CREATE TABLE places (
  id VARCHAR(64) PRIMARY KEY,           -- fsq:xxx or otm:xxx
  source VARCHAR(16) NOT NULL,          -- fsq/otm/google
  name VARCHAR(255) NOT NULL,
  category VARCHAR(80),
  rating NUMERIC(3,2),                  -- 0.00 to 5.00
  coords GEOGRAPHY(POINT, 4326),        -- PostGIS point
  raw JSONB,                            -- original API response
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### price_quotes (Cached Pricing)
```sql
CREATE TABLE price_quotes (
  id SERIAL PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id),
  item_type VARCHAR(24) NOT NULL,       -- flight/hotel/activity/car
  item_ref JSONB NOT NULL,              -- {supplier_id, place_id, etc}
  currency VARCHAR(8) NOT NULL,
  amount NUMERIC(12,2),
  url TEXT,                             -- booking deep link
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### webhooks (Event Log)
```sql
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  source VARCHAR(24) NOT NULL,          -- clerk/stripe
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Indexing Strategy

### Performance Indexes

#### Geographic Indexes (GiST)
```sql
-- Spatial index for location-based queries
CREATE INDEX idx_places_coords_gist ON places USING GIST(coords);

-- Composite index for bounded searches
CREATE INDEX idx_places_category_coords ON places USING GIST(category, coords);
```

#### User Data Indexes
```sql
-- User's trips (frequent access)
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_user_status ON trips(user_id, status);

-- Trip lookup by shared token
CREATE INDEX idx_trips_shared_token ON trips(shared_token) WHERE shared_token IS NOT NULL;
```

#### Itinerary Indexes
```sql
-- Latest version lookup
CREATE INDEX idx_itineraries_trip_version ON itineraries(trip_id, version DESC);

-- Price quotes by trip
CREATE INDEX idx_price_quotes_trip ON price_quotes(trip_id);
CREATE INDEX idx_price_quotes_expires ON price_quotes(expires_at) WHERE expires_at IS NOT NULL;
```

#### Text Search Indexes
```sql
-- Full-text search on places
CREATE INDEX idx_places_name_gin ON places USING GIN(to_tsvector('english', name));

-- Trip search
CREATE INDEX idx_trips_title_gin ON trips USING GIN(to_tsvector('english', title));
```

### Partial Indexes (Space Optimization)
```sql
-- Only index active trips
CREATE INDEX idx_trips_active ON trips(user_id, updated_at) 
WHERE status IN ('draft', 'planned', 'traveling');

-- Only index unexpired quotes
CREATE INDEX idx_price_quotes_valid ON price_quotes(trip_id, item_type)
WHERE expires_at > NOW();
```

## Data Types & Validation

### JSONB Schemas

#### Destinations Format
```typescript
interface Destination {
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone?: string;
}
```

#### Budget Split Format
```typescript
interface BudgetSplit {
  transport: number;    // percentage (0-100)
  lodging: number;
  food: number;
  activities: number;
}
```

#### Itinerary Data Format
```typescript
interface ItineraryData {
  days: DayPlan[];
  summary: string;
  currency: string;
  totalBudget?: number;
  generatedAt: string;  // ISO timestamp
  version: string;      // semantic version
}
```

#### Preferences Format
```typescript
interface UserPreferences {
  cuisine?: string[];           // preferred cuisines
  dietary?: string[];          // dietary restrictions
  mustVisit?: string[];        // must-see places
  avoid?: string[];            // places to avoid
  accessibility?: string[];     // accessibility needs
  interests?: string[];        // activity interests
}
```

### Constraints & Validation

#### Database Constraints
```sql
-- Ensure valid trip dates
ALTER TABLE trips ADD CONSTRAINT check_trip_dates 
CHECK (end_date > start_date);

-- Ensure valid budget split (percentages sum to 100)
ALTER TABLE trips ADD CONSTRAINT check_budget_split
CHECK (
  budget_split IS NULL OR 
  (budget_split->>'transport')::int + 
  (budget_split->>'lodging')::int + 
  (budget_split->>'food')::int + 
  (budget_split->>'activities')::int = 100
);

-- Ensure valid ratings
ALTER TABLE places ADD CONSTRAINT check_rating
CHECK (rating >= 0 AND rating <= 5);
```

#### Application-Level Validation
- Drizzle schema validation
- Zod runtime validation
- Type-safe queries

## Row Level Security (RLS)

### Security Policies

#### User Data Isolation
```sql
-- Users can only see their own trips
CREATE POLICY user_trips_policy ON trips
FOR ALL USING (user_id = current_setting('app.user_id'));

-- Users can only see their own profiles
CREATE POLICY user_profiles_policy ON profiles
FOR ALL USING (user_id = current_setting('app.user_id'));
```

#### Shared Trip Access
```sql
-- Anyone can view trips with valid shared tokens
CREATE POLICY shared_trips_policy ON trips
FOR SELECT USING (
  shared_token IS NOT NULL AND 
  shared_token = current_setting('app.shared_token', true)
);
```

#### Public Data Access
```sql
-- Places and cached data are publicly readable
CREATE POLICY places_read_policy ON places FOR SELECT TO PUBLIC USING (true);
```

### RLS Implementation
```typescript
// Set user context for RLS
export async function withUserContext<T>(
  userId: string, 
  callback: () => Promise<T>
): Promise<T> {
  await db.execute(sql`SET LOCAL app.user_id = ${userId}`);
  return callback();
}
```

## Migration Management

### Drizzle Kit Configuration
```typescript
// drizzle.config.ts
export default {
  schema: "./infra/schema.ts",
  out: "./infra/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### Migration Workflow
```bash
# Generate migration from schema changes
pnpm db:generate

# Review generated SQL
cat infra/migrations/0001_*.sql

# Apply migration to database
pnpm db:migrate

# Rollback if needed (manual)
psql $DATABASE_URL < infra/migrations/rollback.sql
```

### Migration Best Practices
- Always review generated SQL
- Test migrations on staging data
- Use transactions for complex changes
- Keep migrations small and focused
- Document breaking changes

## Seed Data

### Development Seeds
```typescript
// Popular destinations
const cities = [
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
];

// Place categories mapping
const categories = {
  "Restaurant": ["restaurant", "cafe", "bar"],
  "Attraction": ["museum", "landmark", "park"],
  "Shopping": ["shop", "mall", "market"],
};
```

### Production Seeds
```bash
# Seed essential data
pnpm db:seed

# Specific seed files
pnpm db:seed:cities
pnpm db:seed:categories  
pnpm db:seed:airports
```

## Query Optimization

### Common Query Patterns

#### Geographic Queries
```sql
-- Find places within radius
SELECT * FROM places 
WHERE ST_DWithin(coords, ST_Point(-74.0060, 40.7128)::geography, 5000);

-- Distance-ordered results
SELECT *, ST_Distance(coords, ST_Point(-74.0060, 40.7128)::geography) as distance
FROM places 
ORDER BY coords <-> ST_Point(-74.0060, 40.7128)::geography
LIMIT 20;
```

#### User Trip Queries
```sql
-- User's recent trips
SELECT * FROM trips 
WHERE user_id = $1 
ORDER BY updated_at DESC 
LIMIT 10;

-- Trip with latest itinerary
SELECT t.*, i.data as itinerary
FROM trips t
LEFT JOIN LATERAL (
  SELECT data FROM itineraries 
  WHERE trip_id = t.id 
  ORDER BY version DESC 
  LIMIT 1
) i ON true
WHERE t.id = $1;
```

### Query Performance Tips
- Use prepared statements
- Leverage partial indexes
- Use LATERAL joins for related data
- Avoid N+1 queries with proper joins
- Use EXPLAIN ANALYZE for optimization

## Backup & Recovery

### Automated Backups (Neon)
- **Frequency**: Continuous WAL backups
- **Retention**: 7 days (can be extended)
- **Point-in-time recovery**: To any second
- **Geographic replication**: Available

### Manual Exports
```bash
# Full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql

# Data only  
pg_dump --data-only $DATABASE_URL > data.sql
```

### Recovery Procedures
1. **Point-in-time**: Use Neon console
2. **Full restore**: Import from dump file
3. **Selective restore**: Table-specific imports
4. **Schema migration**: Apply migrations to restore point

## Monitoring & Maintenance

### Performance Metrics
- Query execution times
- Index usage statistics
- Connection pool status
- Storage usage trends

### Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes if needed
REINDEX INDEX idx_places_coords_gist;

-- Clean up expired data
DELETE FROM price_quotes WHERE expires_at < NOW() - INTERVAL '1 day';

-- Update full-text search vectors
UPDATE places SET search_vector = to_tsvector('english', name);
```

### Health Checks
- Connection test
- Basic query performance
- Index effectiveness
- Storage capacity alerts