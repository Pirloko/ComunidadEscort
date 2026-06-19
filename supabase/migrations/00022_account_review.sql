-- ============================================================
-- 00022_account_review.sql
-- Estados de cuenta: aprobar / rechazar / bloquear email
-- + fix admin bloqueado
-- ============================================================

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'bloqueada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Sincronizar datos existentes
UPDATE profiles
SET account_status = CASE WHEN is_active THEN 'aprobada'::account_status ELSE 'pendiente'::account_status END;

-- Staff y admin principal siempre activos
UPDATE profiles
SET is_active = true, account_status = 'aprobada'
WHERE role IN ('admin', 'moderator');

UPDATE profiles
SET is_active = true, account_status = 'aprobada', role = 'admin'
WHERE lower(email) = 'carlos@gmail.com';

-- Emails bloqueados (impiden registro e ingreso)
CREATE TABLE IF NOT EXISTS blocked_emails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  blocked_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_lower ON blocked_emails (lower(email));

ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_emails_admin" ON blocked_emails;
CREATE POLICY "blocked_emails_admin"
  ON blocked_emails FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION is_email_blocked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_emails WHERE lower(email) = lower(trim(p_email))
  );
$$;

GRANT EXECUTE ON FUNCTION is_email_blocked(TEXT) TO anon, authenticated;

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
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

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

-- Staff activo al asignar rol admin/moderador
CREATE OR REPLACE FUNCTION ensure_staff_account_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IN ('admin', 'moderator') THEN
    NEW.is_active := true;
    NEW.account_status := 'aprobada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_staff_active ON profiles;
CREATE TRIGGER profiles_ensure_staff_active
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_staff_account_active();
