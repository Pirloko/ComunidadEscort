-- ============================================================
-- 00027_phone_and_city_nullable.sql
-- Teléfono normalizado de Chile en profiles + city_id opcional
-- Requiere: profiles (00002), handle_new_user vigente (00022)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS phone_format;
ALTER TABLE profiles ADD CONSTRAINT phone_format
  CHECK (phone IS NULL OR phone ~ '^\+569\d{8}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON profiles (phone) WHERE phone IS NOT NULL;

ALTER TABLE profiles ALTER COLUMN city_id DROP NOT NULL;

-- city_id ya no es obligatorio en metadata; phone pasa a ser el dato
-- requerido para verificar identidad/contacto en registros nuevos.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias            TEXT;
  v_city_id          UUID;
  v_publication_link TEXT;
  v_phone            TEXT;
BEGIN
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');
  v_phone            := NEW.raw_user_meta_data ->> 'phone';

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
    id, alias, email, city_id, publication_link, phone, is_active, account_status
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, v_phone, false, 'pendiente'
  );

  RETURN NEW;
END;
$$;
