-- ============================================================
-- 00023_fix_admin_carlos.sql
-- Repara admin + asegura columnas faltantes (idempotente)
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================

-- 0) Asegurar columnas de migraciones 00021 y 00022 (si no se ejecutaron)
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'bloqueada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS publication_link TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status account_status;

UPDATE public.profiles
SET account_status = CASE
  WHEN is_active THEN 'aprobada'::account_status
  ELSE 'pendiente'::account_status
END
WHERE account_status IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN account_status SET DEFAULT 'pendiente';

ALTER TABLE public.profiles
  ALTER COLUMN account_status SET NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 1) Diagnóstico: auth.users <-> profiles
SELECT
  au.id AS auth_user_id,
  au.email AS auth_email,
  p.id AS profile_id,
  p.email AS profile_email,
  p.role,
  p.is_active,
  p.account_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email) = 'carlos@gmail.com';

-- 2) Activar admin por ID de auth (vínculo correcto)
UPDATE public.profiles p
SET
  role = 'admin',
  is_active = true,
  account_status = 'aprobada',
  rejection_reason = NULL,
  reviewed_at = now()
FROM auth.users au
WHERE p.id = au.id
  AND lower(au.email) = 'carlos@gmail.com';

-- 3) Si no existe perfil para ese auth user, crearlo
INSERT INTO public.profiles (
  id,
  alias,
  email,
  city_id,
  role,
  is_active,
  account_status,
  publication_link
)
SELECT
  au.id,
  'carlos_admin',
  au.email,
  (SELECT id FROM public.cities WHERE is_active = true ORDER BY name LIMIT 1),
  'admin',
  true,
  'aprobada',
  'https://admin.comunidadescort.cl'
FROM auth.users au
WHERE lower(au.email) = 'carlos@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  );

-- 4) Verificación final
SELECT
  au.id AS auth_user_id,
  p.id AS profile_id,
  p.role,
  p.is_active,
  p.account_status
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email) = 'carlos@gmail.com';
