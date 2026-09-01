-- 00054_home_banners.sql
-- Banners publicitarios del carrusel superior en /home.
-- Depende de: is_admin() (00009)

CREATE TABLE IF NOT EXISTS home_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  link_url text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_banners_link_url_http
    CHECK (link_url IS NULL OR link_url ~ '^https?://')
);

CREATE INDEX IF NOT EXISTS home_banners_active_sort_idx
  ON home_banners (is_active, sort_order);

COMMENT ON TABLE home_banners IS
  'Carrusel publicitario en la parte superior del home público.';
COMMENT ON COLUMN home_banners.title IS
  'Texto alternativo / nombre interno del banner.';
COMMENT ON COLUMN home_banners.link_url IS
  'URL externa al hacer clic. NULL = solo imagen, sin enlace.';

ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_banners_select_active" ON home_banners;
CREATE POLICY "home_banners_select_active"
  ON home_banners FOR SELECT TO anon, authenticated
  USING (is_active = true AND image_url IS NOT NULL);

DROP POLICY IF EXISTS "home_banners_admin_all" ON home_banners;
CREATE POLICY "home_banners_admin_all"
  ON home_banners FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON home_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON home_banners TO authenticated;
