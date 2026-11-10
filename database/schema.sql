-- =====================================================
-- Hermes Drop - Esquema de base de datos (PostgreSQL)
-- Copiar y pegar completo en pgAdmin > Query Tool
-- =====================================================

-- Tabla principal: drops
CREATE TABLE IF NOT EXISTS drops (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code      VARCHAR(20)      NOT NULL UNIQUE,
  title            VARCHAR(80),
  message          TEXT             NOT NULL,
  image_data_url   TEXT,
  latitude         DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude        DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_meters    INTEGER          NOT NULL DEFAULT 50 CHECK (radius_meters > 0),
  keyword_hash     TEXT,
  has_keyword      BOOLEAN          NOT NULL DEFAULT FALSE,
  expires_at       TIMESTAMPTZ      NOT NULL,
  is_active        BOOLEAN          NOT NULL DEFAULT TRUE,
  is_reported      BOOLEAN          NOT NULL DEFAULT FALSE,
  report_count     INTEGER          NOT NULL DEFAULT 0,
  creator_ip_hash  TEXT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_drops_expires_at ON drops (expires_at);
CREATE INDEX IF NOT EXISTS idx_drops_active     ON drops (is_active, is_reported, expires_at);
CREATE INDEX IF NOT EXISTS idx_drops_created_at ON drops (created_at DESC);
