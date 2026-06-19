-- ============================================================
-- 00010_triggers_functions.sql
-- Triggers FASE 1 únicamente
-- (Triggers de fases 3-7 están en 00013_triggers_fases_3_7.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Crear perfil automáticamente al registrarse
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

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, is_active, account_status
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, false, 'pendiente'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
