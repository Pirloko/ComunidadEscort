-- ============================================================
-- 00033_resources_campos.sql
-- "Datos de todo": ubicación, redes sociales y contadores de
-- reseñas en resources; tablas resource_comments y resource_reviews.
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0;

CREATE TABLE resource_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resource_comment_content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_resource_comments_resource ON resource_comments (resource_id, created_at);

CREATE TABLE resource_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resource_id, author_id)
);

CREATE INDEX idx_resource_reviews_resource ON resource_reviews (resource_id);
