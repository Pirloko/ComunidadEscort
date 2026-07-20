-- ============================================================
-- 00036c_storage_resource_photos.sql
-- Bucket público para fotos de habitaciones / datos
-- Ejecutar DESPUÉS de 00036b
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-photos',
  'resource-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resource_photos_bucket_public_read" ON storage.objects;
CREATE POLICY "resource_photos_bucket_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'resource-photos');

DROP POLICY IF EXISTS "resource_photos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-photos' AND is_admin());

DROP POLICY IF EXISTS "resource_photos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin())
  WITH CHECK (bucket_id = 'resource-photos' AND is_admin());

DROP POLICY IF EXISTS "resource_photos_bucket_admin_delete" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin());
