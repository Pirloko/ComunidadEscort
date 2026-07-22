-- ============================================================
-- 00044_habitaciones_video.sql
-- Un video opcional por habitación escort (admin).
-- Requiere: 00036, 00036b, 00037, is_admin()
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN resources.video_url IS
  'Path en bucket resource-videos (public|private/{id}/…). Solo habitaciones_escort.';

-- Bucket privado; lectura anon solo prefijo public/
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-videos',
  'resource-videos',
  false,
  52428800, -- 50 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = false;

DROP POLICY IF EXISTS "resource_videos_bucket_anon_public_prefix" ON storage.objects;
CREATE POLICY "resource_videos_bucket_anon_public_prefix"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'resource-videos'
    AND (storage.foldername(name))[1] = 'public'
  );

DROP POLICY IF EXISTS "resource_videos_bucket_auth_read" ON storage.objects;
CREATE POLICY "resource_videos_bucket_auth_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resource-videos'
    AND (
      (storage.foldername(name))[1] = 'public'
      OR is_admin()
      OR has_community_access()
    )
  );

DROP POLICY IF EXISTS "resource_videos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_videos_bucket_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resource-videos' AND is_admin());

DROP POLICY IF EXISTS "resource_videos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_videos_bucket_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resource-videos' AND is_admin())
  WITH CHECK (bucket_id = 'resource-videos' AND is_admin());

DROP POLICY IF EXISTS "resource_videos_bucket_admin_delete" ON storage.objects;
CREATE POLICY "resource_videos_bucket_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resource-videos' AND is_admin());
