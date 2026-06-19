-- ============================================================
-- 00013b_triggers_fase4_alerts.sql
-- Triggers SOLO para alertas (Fase 4)
-- Ejecutar DESPUÉS de 00004_alerts.sql y 00009d_rls_fase4_alerts.sql
-- (El trigger de notificación se activa en Fase 7 con 00013g)
-- ============================================================

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
