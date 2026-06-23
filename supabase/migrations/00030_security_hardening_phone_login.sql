-- ============================================================
-- 00030_security_hardening_phone_login.sql
-- Corrige hallazgos de seguridad de 00027-00029:
-- 1. get_auth_email_by_phone filtraba el email real a anon/authenticated
--    (enumeración de usuarios) -> se elimina; el login por teléfono pasa
--    a resolverse server-side en la Edge Function login-with-phone, que
--    nunca devuelve el email al cliente.
-- 2. must_change_password vivía en user_metadata, editable por el propio
--    usuario via auth.updateUser({data}) -> bypass del cambio forzado.
--    Pasa a profiles.must_change_password, protegido por el mismo
--    trigger de defensa en profundidad de 00029, con una única vía
--    legítima de limpiarlo: complete_forced_password_change().
-- ============================================================

DROP FUNCTION IF EXISTS get_auth_email_by_phone(TEXT);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias               TEXT;
  v_city_id              UUID;
  v_publication_link     TEXT;
  v_phone                TEXT;
  v_must_change_password BOOLEAN;
BEGIN
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

  v_alias               := NEW.raw_user_meta_data ->> 'alias';
  v_city_id              := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link     := trim(NEW.raw_user_meta_data ->> 'publication_link');
  v_phone                := NEW.raw_user_meta_data ->> 'phone';
  v_must_change_password := coalesce((NEW.raw_user_meta_data ->> 'must_change_password')::BOOLEAN, false);

  IF v_alias IS NULL THEN
    RAISE EXCEPTION 'alias es requerido en metadata';
  END IF;

  IF v_phone IS NULL OR v_phone !~ '^\+569\d{8}$' THEN
    RAISE EXCEPTION 'phone debe estar en formato +569XXXXXXXX';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, phone, is_active, account_status,
    must_change_password
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, v_phone, false, 'pendiente',
    v_must_change_password
  );

  RETURN NEW;
END;
$$;

-- Extiende el guard de 00029: must_change_password solo lo puede limpiar
-- complete_forced_password_change() (vía bypass local de transacción),
-- nunca un UPDATE directo del propio usuario.
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_admin()
    OR auth.role() = 'service_role'
    OR current_setting('app.bypass_password_gate', true) = 'true'
  ) THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password THEN
      RAISE EXCEPTION 'No tienes permisos para modificar estos campos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION complete_forced_password_change()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.bypass_password_gate', 'true', true);
  UPDATE profiles SET must_change_password = false WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION complete_forced_password_change() TO authenticated;
