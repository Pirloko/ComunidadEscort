-- 00052_mod_create_habitaciones_pending.sql
-- Moderadoras pueden crear habitaciones_escort en status=pendiente;
-- admin sigue pudiendo crear aprobada. Fotos/video: staff (mod o admin).
-- Depende de: 00036b, 00037, 00044, is_admin(), is_moderator_or_admin()

-- INSERT habitaciones: admin → pendiente|aprobada; mod → solo pendiente
DROP POLICY IF EXISTS "resources_insert_staff" ON resources;
CREATE POLICY "resources_insert_staff"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (
        category = 'habitaciones_escort'
        AND is_moderator_or_admin()
        AND (
          (is_admin() AND status IN ('pendiente', 'aprobada'))
          OR (NOT is_admin() AND status = 'pendiente')
        )
      )
      OR (
        category <> 'habitaciones_escort'
        AND is_moderator_or_admin()
        AND status = 'aprobada'
      )
    )
  );

-- Fotos: insert/update/delete para moderadora o admin
DROP POLICY IF EXISTS "resource_photos_insert_admin" ON resource_photos;
CREATE POLICY "resource_photos_insert_staff"
  ON resource_photos FOR INSERT TO authenticated
  WITH CHECK (is_moderator_or_admin());

DROP POLICY IF EXISTS "resource_photos_update_admin" ON resource_photos;
CREATE POLICY "resource_photos_update_staff"
  ON resource_photos FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

DROP POLICY IF EXISTS "resource_photos_delete_admin" ON resource_photos;
CREATE POLICY "resource_photos_delete_staff"
  ON resource_photos FOR DELETE TO authenticated
  USING (is_moderator_or_admin());

-- Storage resource-photos: upload/update/delete staff
DROP POLICY IF EXISTS "resource_photos_bucket_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_staff_delete" ON storage.objects;

CREATE POLICY "resource_photos_bucket_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_moderator_or_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

CREATE POLICY "resource_photos_bucket_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resource-photos' AND is_moderator_or_admin())
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_moderator_or_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

CREATE POLICY "resource_photos_bucket_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resource-photos' AND is_moderator_or_admin());

-- Storage resource-videos: upload/update/delete staff
DROP POLICY IF EXISTS "resource_videos_bucket_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "resource_videos_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_videos_bucket_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "resource_videos_bucket_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "resource_videos_bucket_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_videos_bucket_staff_delete" ON storage.objects;

CREATE POLICY "resource_videos_bucket_staff_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resource-videos' AND is_moderator_or_admin());

CREATE POLICY "resource_videos_bucket_staff_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resource-videos' AND is_moderator_or_admin())
  WITH CHECK (bucket_id = 'resource-videos' AND is_moderator_or_admin());

CREATE POLICY "resource_videos_bucket_staff_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resource-videos' AND is_moderator_or_admin());
