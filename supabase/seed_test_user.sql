-- ============================================================
-- seed_test_user.sql — Usuario de prueba ya aprobado
-- email: test@gmail.com  /  password: Test1234
-- Rol: user | account_status: aprobada
-- ============================================================
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email   TEXT := 'test@gmail.com';
  v_pass    TEXT := extensions.crypt('Test1234', extensions.gen_salt('bf'));
  v_alias   TEXT := 'testuser';
  v_phone   TEXT := '+56922222222';
  v_link    TEXT := 'https://example.com/publicacion-test';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(v_email)) THEN
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
    RAISE NOTICE 'Auth user % ya existe (id=%)', v_email, v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_pass,
      now(), '', '', '', '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('alias', v_alias, 'phone', v_phone, 'publication_link', v_link),
      now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  -- Si el trigger handle_new_user ya creó el perfil en pendiente, lo aprobamos.
  ALTER TABLE public.profiles DISABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_ensure_staff_active;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET
      role = 'user',
      is_active = true,
      account_status = 'aprobada',
      must_change_password = false,
      rejection_reason = NULL,
      phone = COALESCE(phone, v_phone),
      publication_link = COALESCE(publication_link, v_link),
      alias = COALESCE(NULLIF(alias, ''), v_alias),
      email = COALESCE(email, v_email)
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.profiles (
      id, alias, email, phone, publication_link, city_id,
      role, is_active, account_status, must_change_password
    ) VALUES (
      v_user_id, v_alias, v_email, v_phone, v_link,
      (SELECT id FROM public.cities WHERE is_active = true ORDER BY name LIMIT 1),
      'user', true, 'aprobada', false
    );
  END IF;

  ALTER TABLE public.profiles ENABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_ensure_staff_active;

  RAISE NOTICE 'Usuario test listo: % (id=%)', v_email, v_user_id;
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      ALTER TABLE public.profiles ENABLE TRIGGER before_profiles_update_guard;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.profiles ENABLE TRIGGER profiles_ensure_staff_active;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RAISE;
END $$;

SELECT au.id, au.email, p.alias, p.role, p.is_active, p.account_status, p.phone
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email) = 'test@gmail.com';
