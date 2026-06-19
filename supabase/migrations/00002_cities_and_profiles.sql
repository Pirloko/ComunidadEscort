-- ============================================================
-- 00002_cities_and_profiles.sql
-- Regiones, ciudades y perfiles de usuario
-- FASE 1 + FASE 2
-- ============================================================

-- Regiones
CREATE TABLE regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  code        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ciudades
CREATE TABLE cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  region_id   UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cities_region ON cities (region_id);
CREATE INDEX idx_cities_active ON cities (is_active) WHERE is_active = true;

-- Perfiles (extensión de auth.users)
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias             TEXT NOT NULL,
  email             TEXT NOT NULL,
  city_id           UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  avatar_url        TEXT,
  description       TEXT,
  privacy_settings  JSONB NOT NULL DEFAULT '{
    "show_city": true,
    "show_description": true,
    "allow_messages": true
  }'::jsonb,
  role              user_role NOT NULL DEFAULT 'user',
  publication_link  TEXT,
  account_status    account_status NOT NULL DEFAULT 'pendiente',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alias_length CHECK (char_length(alias) BETWEEN 3 AND 30),
  CONSTRAINT alias_format CHECK (alias ~ '^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$'),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE UNIQUE INDEX profiles_alias_lower_idx ON profiles (lower(alias));
CREATE INDEX idx_profiles_city ON profiles (city_id);
CREATE INDEX idx_profiles_role ON profiles (role);

-- Vista pública de perfiles (SIN email)
CREATE VIEW public_profiles AS
SELECT
  id,
  alias,
  city_id,
  avatar_url,
  description,
  privacy_settings,
  created_at
FROM profiles
WHERE is_active = true;
