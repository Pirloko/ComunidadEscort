-- ============================================================
-- 00021_account_approval.sql
-- Aprobación de cuentas por admin + link de publicación
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS publication_link TEXT;

-- Nuevas cuentas quedan inactivas hasta aprobación del admin
ALTER TABLE profiles
  ALTER COLUMN is_active SET DEFAULT false;

-- Perfiles existentes permanecen activos
UPDATE profiles SET is_active = true;

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
BEGIN
  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');

  IF v_alias IS NULL OR v_city_id IS NULL THEN
    RAISE EXCEPTION 'alias y city_id son requeridos en metadata';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (id, alias, email, city_id, publication_link, is_active)
  VALUES (NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, false);

  RETURN NEW;
END;
$$;
