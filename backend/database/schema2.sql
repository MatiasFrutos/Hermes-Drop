CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  public_code TEXT UNIQUE NOT NULL,

  title TEXT,
  message TEXT NOT NULL,
  image_data_url TEXT,

  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  radius_meters INTEGER NOT NULL DEFAULT 50,

  keyword_hash TEXT,
  has_keyword BOOLEAN NOT NULL DEFAULT FALSE,

  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INTEGER NOT NULL DEFAULT 0,

  creator_ip_hash TEXT,

  CONSTRAINT drops_radius_check CHECK (radius_meters >= 10 AND radius_meters <= 500),
  CONSTRAINT drops_latitude_check CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT drops_longitude_check CHECK (longitude >= -180 AND longitude <= 180)
);

ALTER TABLE drops
ADD COLUMN IF NOT EXISTS image_data_url TEXT;

CREATE INDEX IF NOT EXISTS idx_drops_location
ON drops(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_drops_active_expires
ON drops(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_drops_public_code
ON drops(public_code);

CREATE INDEX IF NOT EXISTS idx_drops_created_at
ON drops(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_drops_updated_at ON drops;

CREATE TRIGGER trg_drops_updated_at
BEFORE UPDATE ON drops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();