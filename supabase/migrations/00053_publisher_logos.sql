-- 00053_publisher_logos.sql
-- Logo circular de publicadores recomendados (home público).
-- Depende de: 00051_recommended_publishers, is_admin()

ALTER TABLE recommended_publishers
  ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN recommended_publishers.logo_url IS
  'URL pública del logo (bucket publisher-logos). Se muestra en círculo en el home.';

-- Bucket público para logos (lectura anon; escritura solo admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'publisher-logos',
  'publisher-logos',
  true,
  2097152,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "publisher_logos_public_read" ON storage.objects;
CREATE POLICY "publisher_logos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'publisher-logos');

DROP POLICY IF EXISTS "publisher_logos_admin_insert" ON storage.objects;
CREATE POLICY "publisher_logos_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'publisher-logos' AND is_admin());

DROP POLICY IF EXISTS "publisher_logos_admin_update" ON storage.objects;
CREATE POLICY "publisher_logos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'publisher-logos' AND is_admin())
  WITH CHECK (bucket_id = 'publisher-logos' AND is_admin());

DROP POLICY IF EXISTS "publisher_logos_admin_delete" ON storage.objects;
CREATE POLICY "publisher_logos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'publisher-logos' AND is_admin());
