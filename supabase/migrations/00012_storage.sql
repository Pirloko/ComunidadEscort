-- ============================================================
-- FASE 1 — Ejecutar estos 5 archivos EN ORDEN en Supabase:
--
--   1. 00001_extensions_and_enums.sql
--   2. 00002_cities_and_profiles.sql
--   3. 00009_rls_policies.sql      (solo secciones regions, cities, profiles)
--   4. 00010_triggers_functions.sql (solo sección handle_new_user + profiles_updated_at)
--   5. 00011_seed_data.sql
--
-- NOTA: Los archivos 00009 y 00010 incluyen políticas/triggers de fases
-- futuras. Puedes ejecutarlos completos desde el inicio (no causan error)
-- o ejecutar solo las secciones marcadas para cada fase.
--
-- FASE 3: 00003_forum.sql (ya incluido en 00009 y 00010)
-- FASE 4: 00004_alerts.sql
-- FASE 5: 00005_resources.sql
-- FASE 6: 00008_chat.sql
-- FASE 7: 00007_notifications.sql (triggers ya en 00010)
-- FASE 10: 00006_bookmarks.sql
-- ============================================================

-- Storage bucket para avatares (ejecutar en Supabase Dashboard > Storage)
-- O via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage para avatares (Fase 2)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
