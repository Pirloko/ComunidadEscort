-- ============================================================
-- 00013c_triggers_fase5_resources.sql
-- Triggers SOLO para recursos (Fase 5)
-- Ejecutar DESPUÉS de 00005_resources.sql y 00009e_rls_fase5_resources.sql
-- ============================================================

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
