-- ============================================================
-- seed_admin.sql — Solo crea/promueve el admin
-- Usar si el schema ya corrió y falló solo el seed.
-- email: carlosadmin@gmail.com  /  password: 123456
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email   TEXT := 'carlosadmin@gmail.com';
  v_pass    TEXT := extensions.crypt('123456', extensions.gen_salt('bf'));
  v_alias   TEXT := 'carlosadmin';
  v_phone   TEXT := '+56911111111';
  v_link    TEXT := 'https://comunidadescort.cl/admin';
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

  ALTER TABLE public.profiles DISABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_ensure_staff_active;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET
      role = 'admin',
      is_active = true,
      account_status = 'aprobada',
      must_change_password = false,
      rejection_reason = NULL,
      phone = COALESCE(phone, v_phone),
      publication_link = COALESCE(publication_link, v_link),
      alias = COALESCE(NULLIF(alias, ''), v_alias)
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.profiles (
      id, alias, email, phone, publication_link, city_id,
      role, is_active, account_status, must_change_password
    ) VALUES (
      v_user_id, v_alias, v_email, v_phone, v_link,
      (SELECT id FROM public.cities WHERE is_active = true ORDER BY name LIMIT 1),
      'admin', true, 'aprobada', false
    );
  END IF;

  ALTER TABLE public.profiles ENABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_ensure_staff_active;

  RAISE NOTICE 'Admin listo: % (id=%)', v_email, v_user_id;
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
WHERE lower(au.email) = 'carlosadmin@gmail.com';
