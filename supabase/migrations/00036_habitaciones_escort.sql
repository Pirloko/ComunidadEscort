-- ============================================================
-- 00036_habitaciones_escort.sql
-- Campos específicos de habitaciones + fotos + visibilidad pública
-- Requiere: resources (00005), 00033 campos, categoría habitaciones_escort (00031)
-- ============================================================

-- Contacto / visibilidad / reglas
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS house_rules TEXT,
  ADD COLUMN IF NOT EXISTS recibe_mujer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibe_hombre BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_reserva BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_referencias BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_doc_identidad BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_link_publicacion BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acepta_parejas BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibe_agencias BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_camaras_seguridad BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_wifi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_kit_primeros_auxilios BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_extintor BOOLEAN NOT NULL DEFAULT false;

-- Índice para listado público de habitaciones
CREATE INDEX IF NOT EXISTS idx_resources_public_habitaciones
  ON resources (created_at DESC)
  WHERE category = 'habitaciones_escort'
    AND is_public = true
    AND is_active = true
    AND status = 'aprobada';

-- Fotos de recursos (galería)
CREATE TABLE IF NOT EXISTS resource_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_photos_resource
  ON resource_photos (resource_id, sort_order);
