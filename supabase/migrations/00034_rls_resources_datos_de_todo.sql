-- ============================================================
-- 00034_rls_resources_datos_de_todo.sql
-- "Datos de todo": solo admin/moderator crean resources;
-- RLS para resource_comments y resource_reviews.
-- Ejecutar DESPUÉS de 00033_resources_campos.sql
-- ============================================================

-- Mirror de canAccessCommunity() en src/lib/account-access.ts
-- mantener sincronizados.
CREATE OR REPLACE FUNCTION has_community_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role IN ('moderator', 'admin')
        OR (
          account_status NOT IN ('bloqueada', 'rechazada')
          AND (account_status = 'aprobada' OR is_active)
        )
      )
  )
$$;

-- RESOURCES: solo staff crea, ya aprobado de inmediato
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own_pending" ON resources;

CREATE POLICY "resources_insert_staff"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (is_moderator_or_admin() AND status = 'aprobada');

-- RESOURCE_COMMENTS
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_comments_select_authenticated"
  ON resource_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "resource_comments_insert_own"
  ON resource_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND has_community_access());

CREATE POLICY "resource_comments_delete_own_or_mod"
  ON resource_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- RESOURCE_REVIEWS
ALTER TABLE resource_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_reviews_select_authenticated"
  ON resource_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "resource_reviews_insert_own"
  ON resource_reviews FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND has_community_access());

CREATE POLICY "resource_reviews_update_own"
  ON resource_reviews FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "resource_reviews_delete_own_or_mod"
  ON resource_reviews FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());
