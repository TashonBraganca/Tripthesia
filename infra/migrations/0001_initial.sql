-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create initial tables
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(120),
  home_airport VARCHAR(8),
  budget_band VARCHAR(16),
  pace VARCHAR(16),
  mobility VARCHAR(16),
  preferences JSONB,
  pro BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(160),
  destinations JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  trip_type VARCHAR(24) NOT NULL,
  budget_total INTEGER,
  budget_split JSONB,
  status VARCHAR(24) DEFAULT 'draft',
  shared_token VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  trip_id UUID NOT NULL,
  day_index INTEGER NOT NULL,
  date DATE NOT NULL,
  activities JSONB NOT NULL,
  summary TEXT,
  total_budget NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS places (
  id VARCHAR(128) PRIMARY KEY,
  source VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  address TEXT,
  phone VARCHAR(32),
  website VARCHAR(512),
  hours JSONB,
  rating NUMERIC(3,2),
  price_level INTEGER,
  photos JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS price_quotes (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(32) NOT NULL,
  item_ref VARCHAR(255) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  deep_link TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_date ON itineraries(date);
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_source ON places(source);
CREATE INDEX IF NOT EXISTS idx_price_quotes_item ON price_quotes(item_type, item_ref);
CREATE INDEX IF NOT EXISTS idx_price_quotes_provider ON price_quotes(provider);
CREATE INDEX IF NOT EXISTS idx_price_quotes_valid ON price_quotes(valid_until);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for searching places by location
CREATE OR REPLACE FUNCTION search_places_near(
  search_lat NUMERIC,
  search_lng NUMERIC,
  radius_km NUMERIC DEFAULT 10,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id VARCHAR,
  name VARCHAR,
  category VARCHAR,
  lat NUMERIC,
  lng NUMERIC,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.category,
    ST_Y(p.location) AS lat,
    ST_X(p.location) AS lng,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM places p
  WHERE ST_DWithin(
    p.location::geography,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;