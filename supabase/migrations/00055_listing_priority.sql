-- 00055_listing_priority.sql
-- Prioridad interna en listados por ciudad (solo admin la activa).
-- Depende de: resources (00005), is_admin() (00009)

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_listing_priority boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS resources_listing_priority_idx
  ON resources (city_id, is_listing_priority DESC, created_at DESC)
  WHERE category = 'habitaciones_escort' AND status = 'aprobada' AND is_active = true;

COMMENT ON COLUMN resources.is_listing_priority IS
  'Admin: aparece primero en el listado público de su ciudad. Sin badge visible para usuarias.';

CREATE OR REPLACE FUNCTION prevent_resource_listing_priority_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_listing_priority IS DISTINCT FROM OLD.is_listing_priority THEN
    IF NOT is_admin() AND auth.role() <> 'service_role' THEN
      NEW.is_listing_priority := OLD.is_listing_priority;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_resources_listing_priority_guard ON resources;
CREATE TRIGGER before_resources_listing_priority_guard
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION prevent_resource_listing_priority_escalation();
