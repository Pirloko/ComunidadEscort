-- ============================================================
-- 00029_rls_profiles_hardening.sql
-- Defensa en profundidad: solo admin (o service_role, usado por
-- Edge Functions) puede cambiar role/account_status/is_active.
-- profiles_update_own (00009) permite UPDATE de cualquier columna
-- de la propia fila; este trigger cierra la auto-escalación.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_admin() OR auth.role() = 'service_role') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'No tienes permisos para modificar estos campos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_profiles_update_guard ON profiles;
CREATE TRIGGER before_profiles_update_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_privilege_escalation();
