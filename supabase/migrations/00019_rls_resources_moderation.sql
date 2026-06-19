-- ============================================================
-- 00019_rls_resources_moderation.sql
-- RLS actualizado: directorio solo con recursos aprobados
-- Ejecutar DESPUÉS de 00018_resources_moderation.sql
-- ============================================================

DROP POLICY IF EXISTS "resources_select_active" ON resources;
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own_or_admin" ON resources;
DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;

CREATE POLICY "resources_select_approved_or_own_or_mod"
  ON resources FOR SELECT TO authenticated
  USING (
    (status = 'aprobada' AND is_active = true)
    OR author_id = auth.uid()
    OR is_moderator_or_admin()
  );

CREATE POLICY "resources_insert_own"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "resources_update_own_pending"
  ON resources FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = 'pendiente')
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "resources_mod_review"
  ON resources FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

CREATE POLICY "resources_admin_verify"
  ON resources FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());
