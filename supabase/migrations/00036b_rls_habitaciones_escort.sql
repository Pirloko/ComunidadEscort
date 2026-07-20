-- ============================================================
-- 00036b_rls_habitaciones_escort.sql
-- RLS: lectura anon de habitaciones públicas; create habitaciones solo admin
-- Ejecutar DESPUÉS de 00036_habitaciones_escort.sql
-- ============================================================

-- Ciudades activas visibles para el listado público /home
DROP POLICY IF EXISTS "cities_select_public_active" ON cities;
CREATE POLICY "cities_select_public_active"
  ON cities FOR SELECT TO anon
  USING (is_active = true);

-- Habitaciones: solo admin puede INSERT con category habitaciones_escort
-- Otras categorías: moderator o admin (patrón 00034)
DROP POLICY IF EXISTS "resources_insert_staff" ON resources;

CREATE POLICY "resources_insert_staff"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (
    status = 'aprobada'
    AND (
      (category = 'habitaciones_escort' AND is_admin())
      OR (category <> 'habitaciones_escort' AND is_moderator_or_admin())
    )
  );

-- Lectura pública (anon + authenticated) de habitaciones marcadas is_public
DROP POLICY IF EXISTS "resources_select_public_habitaciones" ON resources;
CREATE POLICY "resources_select_public_habitaciones"
  ON resources FOR SELECT TO anon, authenticated
  USING (
    category = 'habitaciones_escort'
    AND is_public = true
    AND is_active = true
    AND status = 'aprobada'
  );

-- resource_photos RLS
ALTER TABLE resource_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resource_photos_select" ON resource_photos;
CREATE POLICY "resource_photos_select"
  ON resource_photos FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
        AND (
          (r.category = 'habitaciones_escort' AND r.is_public = true AND r.is_active AND r.status = 'aprobada')
          OR (auth.uid() IS NOT NULL AND r.status = 'aprobada' AND r.is_active)
          OR (auth.uid() IS NOT NULL AND (r.author_id = auth.uid() OR is_moderator_or_admin()))
        )
    )
  );

DROP POLICY IF EXISTS "resource_photos_insert_admin" ON resource_photos;
CREATE POLICY "resource_photos_insert_admin"
  ON resource_photos FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "resource_photos_update_admin" ON resource_photos;
CREATE POLICY "resource_photos_update_admin"
  ON resource_photos FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "resource_photos_delete_admin" ON resource_photos;
CREATE POLICY "resource_photos_delete_admin"
  ON resource_photos FOR DELETE TO authenticated
  USING (is_admin());

-- Habitaciones: moderadoras no editan; solo admin (resources_admin_verify ya cubre admin)
DROP POLICY IF EXISTS "resources_mod_review" ON resources;
CREATE POLICY "resources_mod_review"
  ON resources FOR UPDATE TO authenticated
  USING (is_moderator_or_admin() AND category <> 'habitaciones_escort')
  WITH CHECK (is_moderator_or_admin() AND category <> 'habitaciones_escort');

DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;
CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (
    (category = 'habitaciones_escort' AND is_admin())
    OR (category <> 'habitaciones_escort' AND (author_id = auth.uid() OR is_moderator_or_admin()))
  );
