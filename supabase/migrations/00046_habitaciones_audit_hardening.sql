-- ============================================================
-- 00046_habitaciones_audit_hardening.sql
-- Escala /home, tope fotos, índice ciudad, RLS videos alineado
-- Requiere: 00036, 00037, 00044, has_community_access(), is_admin()
-- ============================================================

-- Índice parcial para listado público filtrado por ciudad
CREATE INDEX IF NOT EXISTS idx_resources_public_habitaciones_city
  ON resources (city_id, created_at DESC)
  WHERE category = 'habitaciones_escort'
    AND is_public = true
    AND is_active = true
    AND status = 'aprobada';

-- Tope de fotos por habitación (máx. 10)
CREATE OR REPLACE FUNCTION enforce_resource_photos_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  n integer;
BEGIN
  SELECT COUNT(*)::integer INTO n
  FROM resource_photos
  WHERE resource_id = NEW.resource_id;

  IF n >= 10 THEN
    RAISE EXCEPTION 'Máximo 10 fotos por habitación';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resource_photos_limit ON resource_photos;
CREATE TRIGGER trg_resource_photos_limit
  BEFORE INSERT ON resource_photos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_resource_photos_limit();

-- Conteo de ciudades con habitaciones públicas (RLS aplica vía INVOKER)
CREATE OR REPLACE FUNCTION get_public_habitacion_cities()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    COUNT(r.id)::bigint AS count
  FROM resources r
  INNER JOIN cities c ON c.id = r.city_id
  WHERE r.category = 'habitaciones_escort'
    AND r.is_public = true
    AND r.is_active = true
    AND r.status = 'aprobada'
  GROUP BY c.id, c.name, c.slug
  ORDER BY c.name;
$$;

GRANT EXECUTE ON FUNCTION get_public_habitacion_cities() TO anon, authenticated;

-- Alinear RLS storage resource-videos con resource-photos
DROP POLICY IF EXISTS "resource_videos_bucket_auth_read" ON storage.objects;
CREATE POLICY "resource_videos_bucket_auth_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resource-videos'
    AND (
      (storage.foldername(name))[1] = 'public'
      OR (
        (storage.foldername(name))[1] = 'private'
        AND (is_admin() OR has_community_access())
      )
    )
  );

DROP POLICY IF EXISTS "resource_videos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_videos_bucket_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resource-videos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

DROP POLICY IF EXISTS "resource_videos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_videos_bucket_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resource-videos' AND is_admin())
  WITH CHECK (
    bucket_id = 'resource-videos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );
