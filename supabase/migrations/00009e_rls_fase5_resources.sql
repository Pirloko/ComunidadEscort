-- ============================================================
-- 00009e_rls_fase5_resources.sql
-- RLS para directorio (Fase 5) — después de 00005_resources.sql
-- ============================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_active"
  ON resources FOR SELECT TO authenticated
  USING (is_active = true OR author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "resources_insert_own"
  ON resources FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "resources_update_own_or_admin"
  ON resources FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR is_admin()) WITH CHECK (author_id = auth.uid() OR is_admin());

CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());
