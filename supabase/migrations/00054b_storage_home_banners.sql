-- 00054b_storage_home_banners.sql
-- Bucket para imágenes del carrusel publicitario del home.
-- Depende de: 00054_home_banners, is_admin()

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'home-banners',
  'home-banners',
  true,
  3145728,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "home_banners_storage_public_read" ON storage.objects;
CREATE POLICY "home_banners_storage_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'home-banners');

DROP POLICY IF EXISTS "home_banners_storage_admin_insert" ON storage.objects;
CREATE POLICY "home_banners_storage_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'home-banners' AND is_admin());

DROP POLICY IF EXISTS "home_banners_storage_admin_update" ON storage.objects;
CREATE POLICY "home_banners_storage_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'home-banners' AND is_admin())
  WITH CHECK (bucket_id = 'home-banners' AND is_admin());

DROP POLICY IF EXISTS "home_banners_storage_admin_delete" ON storage.objects;
CREATE POLICY "home_banners_storage_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'home-banners' AND is_admin());
