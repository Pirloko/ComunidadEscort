-- ============================================================
-- 00045_habitaciones_recibe_trans.sql
-- Atributo "recibe trans" para habitaciones escort
-- Requiere: 00036_habitaciones_escort.sql
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS recibe_trans BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN resources.recibe_trans IS
  'Habitación escort: recibe personas trans';
