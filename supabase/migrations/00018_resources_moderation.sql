-- ============================================================
-- 00018_resources_moderation.sql
-- Moderación de recursos del directorio (aprobación mod/admin)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS status alert_status,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Recursos existentes quedan publicados; los nuevos arrancan pendientes
UPDATE resources SET status = 'aprobada' WHERE status IS NULL;

ALTER TABLE resources
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pendiente';

CREATE INDEX IF NOT EXISTS idx_resources_status ON resources (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_city_approved
  ON resources (city_id, created_at DESC)
  WHERE status = 'aprobada' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_resources_pending
  ON resources (created_at ASC)
  WHERE status = 'pendiente';

-- Tipos de notificación para recursos (Fase 7+)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'resource_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'resource_rejected';
