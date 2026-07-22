-- ============================================================
-- 00039_resource_reviews_casas.sql
-- Reseñas de casas/habitaciones: rating 0–5, preguntas servicio/
-- dueña, fotos (máx. 3) en bucket privado review-photos.
-- Solo lecturas autenticadas (ya gated en 00037).
-- ============================================================

-- Rating permite 0 (antes 1–5)
ALTER TABLE resource_reviews DROP CONSTRAINT IF EXISTS resource_reviews_rating_check;
ALTER TABLE resource_reviews
  ADD CONSTRAINT resource_reviews_rating_check CHECK (rating BETWEEN 0 AND 5);

ALTER TABLE resource_reviews
  ADD COLUMN IF NOT EXISTS service_notes TEXT,
  ADD COLUMN IF NOT EXISTS owner_notes TEXT;

COMMENT ON COLUMN resource_reviews.service_notes IS
  'Cómo fue el servicio / la estadía';
COMMENT ON COLUMN resource_reviews.owner_notes IS
  'Relación o trato con la dueña / administración';

CREATE TABLE IF NOT EXISTS resource_review_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES resource_reviews(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resource_review_photos_sort CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE INDEX IF NOT EXISTS idx_resource_review_photos_review
  ON resource_review_photos (review_id, sort_order);

CREATE OR REPLACE FUNCTION enforce_resource_review_photos_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM resource_review_photos
  WHERE review_id = NEW.review_id;

  IF TG_OP = 'INSERT' AND v_count >= 3 THEN
    RAISE EXCEPTION 'Máximo 3 fotos por reseña';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resource_review_photos_limit ON resource_review_photos;
CREATE TRIGGER resource_review_photos_limit
  BEFORE INSERT ON resource_review_photos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_resource_review_photos_limit();

ALTER TABLE resource_review_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resource_review_photos_select" ON resource_review_photos;
CREATE POLICY "resource_review_photos_select"
  ON resource_review_photos FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "resource_review_photos_insert_own" ON resource_review_photos;
CREATE POLICY "resource_review_photos_insert_own"
  ON resource_review_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resource_reviews r
      WHERE r.id = review_id AND r.author_id = auth.uid()
    )
    AND (has_community_access() OR is_moderator_or_admin())
  );

DROP POLICY IF EXISTS "resource_review_photos_delete_own_or_mod" ON resource_review_photos;
CREATE POLICY "resource_review_photos_delete_own_or_mod"
  ON resource_review_photos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resource_reviews r
      WHERE r.id = review_id
        AND (r.author_id = auth.uid() OR is_moderator_or_admin())
    )
  );

-- Bucket privado para fotos de reseña (solo WebP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-photos',
  'review-photos',
  false,
  3145728,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/webp'];

-- Paths: {review_id}/{uuid}.webp
DROP POLICY IF EXISTS "review_photos_bucket_select" ON storage.objects;
CREATE POLICY "review_photos_bucket_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'review-photos'
    AND (has_community_access() OR is_moderator_or_admin())
  );

DROP POLICY IF EXISTS "review_photos_bucket_insert_own" ON storage.objects;
CREATE POLICY "review_photos_bucket_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-photos'
    AND (has_community_access() OR is_moderator_or_admin())
    AND EXISTS (
      SELECT 1 FROM resource_reviews r
      WHERE r.id::text = (storage.foldername(name))[1]
        AND r.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "review_photos_bucket_delete_own_or_mod" ON storage.objects;
CREATE POLICY "review_photos_bucket_delete_own_or_mod"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-photos'
    AND (
      is_moderator_or_admin()
      OR EXISTS (
        SELECT 1 FROM resource_reviews r
        WHERE r.id::text = (storage.foldername(name))[1]
          AND r.author_id = auth.uid()
      )
    )
  );
