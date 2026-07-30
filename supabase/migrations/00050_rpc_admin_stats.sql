-- ============================================================
-- 00050_rpc_admin_stats.sql
-- Un solo RPC para el dashboard admin (reemplaza 9 head-counts).
-- Solo is_admin().
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  active_users bigint,
  pending_users bigint,
  moderators bigint,
  total_cities bigint,
  active_cities bigint,
  total_habitaciones bigint,
  active_habitaciones bigint,
  pending_alerts bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo administradoras pueden ver estadísticas';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM profiles)::bigint,
    (SELECT count(*) FROM profiles WHERE is_active = true)::bigint,
    (SELECT count(*) FROM profiles WHERE account_status = 'pendiente')::bigint,
    (SELECT count(*) FROM profiles WHERE role IN ('moderator', 'admin'))::bigint,
    (SELECT count(*) FROM cities)::bigint,
    (SELECT count(*) FROM cities WHERE is_active = true)::bigint,
    (SELECT count(*) FROM resources
      WHERE category = 'habitaciones_escort' AND status = 'aprobada')::bigint,
    (SELECT count(*) FROM resources
      WHERE category = 'habitaciones_escort' AND status = 'aprobada' AND is_active = true)::bigint,
    (SELECT count(*) FROM alerts WHERE status = 'pendiente')::bigint;
END;
$$;

REVOKE ALL ON FUNCTION get_admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
