-- ============================================================
-- 00040_alerts_funar_recomendar_cliente.sql
-- Reportes de cliente: funar / recomendar, más categorías,
-- número de cliente, ciudad alternativa, media (fotos/video).
-- ============================================================

-- Nuevas categorías (idempotente en PG15+)
ALTER TYPE alert_category ADD VALUE IF NOT EXISTS 'acoso';
ALTER TYPE alert_category ADD VALUE IF NOT EXISTS 'violencia';
ALTER TYPE alert_category ADD VALUE IF NOT EXISTS 'no_pago';
ALTER TYPE alert_category ADD VALUE IF NOT EXISTS 'cliente_peligroso';
ALTER TYPE alert_category ADD VALUE IF NOT EXISTS 'recomendacion';

DO $$ BEGIN
  CREATE TYPE alert_report_kind AS ENUM ('funar', 'recomendar');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_media_kind AS ENUM ('image', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS report_kind alert_report_kind NOT NULL DEFAULT 'funar',
  ADD COLUMN IF NOT EXISTS client_number TEXT,
  ADD COLUMN IF NOT EXISTS category_other TEXT,
  ADD COLUMN IF NOT EXISTS city_other TEXT,
  ADD COLUMN IF NOT EXISTS rating SMALLINT,
  ADD COLUMN IF NOT EXISTS treatment_notes TEXT,
  ADD COLUMN IF NOT EXISTS hygiene_notes TEXT;

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_rating_check;
ALTER TABLE alerts
  ADD CONSTRAINT alerts_rating_check
  CHECK (rating IS NULL OR rating BETWEEN 0 AND 5);

-- Ciudad opcional si escribió "otra"
ALTER TABLE alerts ALTER COLUMN city_id DROP NOT NULL;

ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_city_required;
ALTER TABLE alerts
  ADD CONSTRAINT alerts_city_required
  CHECK (city_id IS NOT NULL OR (city_other IS NOT NULL AND char_length(trim(city_other)) >= 2));

-- Descripción más corta permitida en recomendaciones (se rellena en cliente)
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alert_desc_length;
ALTER TABLE alerts
  ADD CONSTRAINT alert_desc_length
  CHECK (char_length(description) BETWEEN 5 AND 5000);

CREATE TABLE IF NOT EXISTS alert_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id      UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  kind          alert_media_kind NOT NULL,
  storage_path  TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  duration_sec  NUMERIC(5,1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alert_media_sort CHECK (sort_order BETWEEN 0 AND 3)
);

CREATE INDEX IF NOT EXISTS idx_alert_media_alert ON alert_media (alert_id, sort_order);

CREATE OR REPLACE FUNCTION enforce_alert_media_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_images INT;
  v_videos INT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE kind = 'image'),
    COUNT(*) FILTER (WHERE kind = 'video')
  INTO v_images, v_videos
  FROM alert_media
  WHERE alert_id = NEW.alert_id;

  IF TG_OP = 'INSERT' THEN
    IF NEW.kind = 'image' AND v_images >= 3 THEN
      RAISE EXCEPTION 'Máximo 3 fotos por reporte';
    END IF;
    IF NEW.kind = 'video' AND v_videos >= 1 THEN
      RAISE EXCEPTION 'Máximo 1 video por reporte';
    END IF;
  END IF;

  IF NEW.kind = 'video' AND NEW.duration_sec IS NOT NULL AND NEW.duration_sec > 20 THEN
    RAISE EXCEPTION 'El video no puede superar 20 segundos';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alert_media_limits ON alert_media;
CREATE TRIGGER alert_media_limits
  BEFORE INSERT ON alert_media
  FOR EACH ROW
  EXECUTE FUNCTION enforce_alert_media_limits();

ALTER TABLE alert_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_media_select" ON alert_media;
CREATE POLICY "alert_media_select"
  ON alert_media FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_id
        AND (
          a.status = 'aprobada'
          OR a.author_id = auth.uid()
          OR is_moderator_or_admin()
        )
    )
  );

DROP POLICY IF EXISTS "alert_media_insert_own" ON alert_media;
CREATE POLICY "alert_media_insert_own"
  ON alert_media FOR INSERT TO authenticated
  WITH CHECK (
    has_community_access()
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_id AND a.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alert_media_delete_own_or_mod" ON alert_media;
CREATE POLICY "alert_media_delete_own_or_mod"
  ON alert_media FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_id
        AND (a.author_id = auth.uid() OR is_moderator_or_admin())
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alert-media',
  'alert-media',
  false,
  52428800, -- 50 MB (video corto)
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm', 'video/quicktime'];

DROP POLICY IF EXISTS "alert_media_bucket_select" ON storage.objects;
CREATE POLICY "alert_media_bucket_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'alert-media'
    AND (has_community_access() OR is_moderator_or_admin())
  );

DROP POLICY IF EXISTS "alert_media_bucket_insert" ON storage.objects;
CREATE POLICY "alert_media_bucket_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'alert-media'
    AND has_community_access()
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND a.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "alert_media_bucket_delete" ON storage.objects;
CREATE POLICY "alert_media_bucket_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'alert-media'
    AND (
      is_moderator_or_admin()
      OR EXISTS (
        SELECT 1 FROM alerts a
        WHERE a.id::text = (storage.foldername(name))[1]
          AND a.author_id = auth.uid()
      )
    )
  );
