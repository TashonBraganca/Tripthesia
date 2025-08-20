-- Migration: Add shared_trips table for trip sharing functionality
-- Generated: 2024-01-15

CREATE TABLE shared_trips (
  id VARCHAR(16) PRIMARY KEY,
  trip_id UUID NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '["view"]',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX idx_shared_trips_trip_id ON shared_trips(trip_id);
CREATE INDEX idx_shared_trips_created_by ON shared_trips(created_by);
CREATE INDEX idx_shared_trips_expires_at ON shared_trips(expires_at) WHERE expires_at IS NOT NULL;