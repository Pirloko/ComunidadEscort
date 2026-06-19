-- ============================================================
-- 00025_rls_reports.sql
-- RLS para reports — después de 00025_reports.sql
-- ============================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own_or_mod" ON reports;
CREATE POLICY "reports_select_own_or_mod"
  ON reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'pendiente');

DROP POLICY IF EXISTS "reports_mod_review" ON reports;
CREATE POLICY "reports_mod_review"
  ON reports FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());
