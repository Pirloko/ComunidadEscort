-- ============================================================
-- 00028_rpc_login_by_phone.sql
-- RPC para resolver el email asociado a un teléfono normalizado,
-- usada por el login con "email o celular"
-- Requiere: profiles.phone (00027)
-- ============================================================

CREATE OR REPLACE FUNCTION get_auth_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT email FROM profiles WHERE phone = p_phone LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_auth_email_by_phone(TEXT) TO anon, authenticated;
