-- ============================================================
-- 00005_resources.sql
-- Directorio local de recursos por ciudad
-- FASE 5 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id     UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  category    resource_category NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  phone       TEXT,
  address     TEXT,
  website     TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resource_name_length CHECK (char_length(name) BETWEEN 2 AND 150)
);

CREATE INDEX idx_resources_city ON resources (city_id, category) WHERE is_active = true;
CREATE INDEX idx_resources_author ON resources (author_id, created_at DESC);
CREATE INDEX idx_resources_name_trgm ON resources USING gin (name gin_trgm_ops);
