-- 00051_recommended_publishers.sql
-- Publicadores recomendados (home → Guía de publicaciones), gestionados por admin.
-- Depende de: is_admin() (00009)

CREATE TABLE IF NOT EXISTS recommended_publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text NOT NULL,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recommended_publishers_whatsapp_chile
    CHECK (whatsapp ~ '^\+569\d{8}$')
);

CREATE INDEX IF NOT EXISTS recommended_publishers_active_sort_idx
  ON recommended_publishers (is_active, sort_order);

ALTER TABLE recommended_publishers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommended_publishers_select_active" ON recommended_publishers;
CREATE POLICY "recommended_publishers_select_active"
  ON recommended_publishers FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "recommended_publishers_admin_all" ON recommended_publishers;
CREATE POLICY "recommended_publishers_admin_all"
  ON recommended_publishers FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON recommended_publishers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON recommended_publishers TO authenticated;
