-- ============================================================
-- 00009b_rls_fases_4_7.sql
-- RLS para fases 4 a 7 y 10 (NO incluye foro)
-- ⚠️ Ejecutar SOLO la sección de la fase correspondiente
--
-- Fase 3 (foro): usar 00009c_rls_fase3_forum.sql
-- ============================================================

-- ── FASE 4: ALERTAS (después de 00004_alerts.sql) ────────────

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_approved_or_own_or_mod"
  ON alerts FOR SELECT TO authenticated
  USING (status = 'aprobada' OR author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "alerts_insert_own"
  ON alerts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "alerts_update_own_pending"
  ON alerts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = 'pendiente')
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "alerts_mod_review"
  ON alerts FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

CREATE POLICY "alerts_delete_mod"
  ON alerts FOR DELETE TO authenticated
  USING (is_moderator_or_admin() OR author_id = auth.uid());
