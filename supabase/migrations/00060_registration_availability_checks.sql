-- ============================================================
-- 00060_registration_availability_checks.sql
-- Pre-checks de registro para mostrar un mensaje claro en vez del
-- genérico "Database error saving new user" (índice único
-- profiles_phone_unique_idx de 00027) o del signUp silencioso de
-- GoTrue con email ya existente.
-- Requiere: profiles.phone (00027)
-- ============================================================

CREATE OR REPLACE FUNCTION is_phone_available(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE phone = p_phone
  );
$$;

CREATE OR REPLACE FUNCTION is_email_available(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION is_phone_available(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION is_email_available(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_phone_available(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_email_available(TEXT) TO anon, authenticated;
