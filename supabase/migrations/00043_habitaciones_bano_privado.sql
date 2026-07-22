-- ============================================================
-- 00043_habitaciones_bano_privado.sql
-- Atributo "baño privado" para habitaciones escort + filtro home
-- Requiere: 00036_habitaciones_escort.sql
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS tiene_bano_privado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN resources.tiene_bano_privado IS
  'Habitación escort: tiene baño privado (filtrable en /home público)';
