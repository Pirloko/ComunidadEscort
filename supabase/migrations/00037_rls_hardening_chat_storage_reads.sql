-- ============================================================
-- 00037_rls_hardening_chat_storage_reads.sql
-- Endurece RLS tras revisión:
-- 1) Chat: cierra INSERT abierto en conversations/participants
-- 2) Trigger: participants solo pueden actualizar last_read_at
-- 3) Lecturas de resources/comments/reviews con has_community_access
-- 4) Storage resource-photos: bucket privado, solo WebP, paths public|private
-- Requiere: 00014, 00017, 00019, 00034, 00036b, 00036c
-- ============================================================

-- ------------------------------------------------------------
-- 1) Chat: sin INSERT directo desde el cliente (solo RPC DEFINER)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conv_participants_insert" ON conversation_participants;

-- Solo actualizar last_read_at de la propia fila (el trigger bloquea otras columnas)
DROP POLICY IF EXISTS "conv_participants_update_own" ON conversation_participants;
CREATE POLICY "conv_participants_update_own"
  ON conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION prevent_conversation_participant_tamper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
    RAISE EXCEPTION 'No se pueden modificar conversation_id, user_id ni joined_at';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversation_participants_no_tamper ON conversation_participants;
CREATE TRIGGER conversation_participants_no_tamper
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION prevent_conversation_participant_tamper();

-- RPC: exigir acceso a comunidad
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
  v_current UUID := auth.uid();
BEGIN
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT has_community_access() THEN
    RAISE EXCEPTION 'Tu cuenta no tiene acceso a la comunidad';
  END IF;

  IF p_other_user_id = v_current THEN
    RAISE EXCEPTION 'No puedes chatear contigo misma';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_other_user_id
      AND (
        role IN ('moderator', 'admin')
        OR (
          account_status NOT IN ('bloqueada', 'rechazada')
          AND (account_status = 'aprobada' OR is_active)
        )
      )
  ) THEN
    RAISE EXCEPTION 'La usuaria no está disponible para chat';
  END IF;

  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
    AND cp2.user_id = p_other_user_id
  WHERE cp1.user_id = v_current
    AND (
      SELECT count(*)::int
      FROM conversation_participants cp
      WHERE cp.conversation_id = cp1.conversation_id
    ) = 2
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_current), (v_conv_id, p_other_user_id);

  RETURN v_conv_id;
END;
$$;

-- ------------------------------------------------------------
-- 2) Lecturas internas: exige acceso a comunidad
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "resources_select_approved_or_own_or_mod" ON resources;
CREATE POLICY "resources_select_approved_or_own_or_mod"
  ON resources FOR SELECT TO authenticated
  USING (
    (has_community_access() AND status = 'aprobada' AND is_active = true)
    OR author_id = auth.uid()
    OR is_moderator_or_admin()
  );

DROP POLICY IF EXISTS "resource_photos_select" ON resource_photos;
CREATE POLICY "resource_photos_select"
  ON resource_photos FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
        AND (
          (r.category = 'habitaciones_escort' AND r.is_public = true AND r.is_active AND r.status = 'aprobada')
          OR (auth.uid() IS NOT NULL AND has_community_access() AND r.status = 'aprobada' AND r.is_active)
          OR (auth.uid() IS NOT NULL AND (r.author_id = auth.uid() OR is_moderator_or_admin()))
        )
    )
  );

DROP POLICY IF EXISTS "resource_comments_select_authenticated" ON resource_comments;
CREATE POLICY "resource_comments_select_authenticated"
  ON resource_comments FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "resource_reviews_select_authenticated" ON resource_reviews;
CREATE POLICY "resource_reviews_select_authenticated"
  ON resource_reviews FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

-- Delete resources: solo staff (quitita autor legacy)
DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;
CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (
    (category = 'habitaciones_escort' AND is_admin())
    OR (category <> 'habitaciones_escort' AND is_moderator_or_admin())
  );

-- ------------------------------------------------------------
-- 3) Storage: privado + solo WebP + lectura por prefijo
-- Paths: public/{resourceId}/…  |  private/{resourceId}/…
-- ------------------------------------------------------------
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 3145728, -- 3 MB tras conversión WebP
  allowed_mime_types = ARRAY['image/webp']
WHERE id = 'resource-photos';

DROP POLICY IF EXISTS "resource_photos_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_anon_public_prefix" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_auth_read" ON storage.objects;

-- Anon: solo objetos bajo prefijo public/
CREATE POLICY "resource_photos_bucket_anon_public_prefix"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'resource-photos'
    AND (storage.foldername(name))[1] = 'public'
  );

-- Authenticated: public/ siempre; private/ si comunidad o admin
CREATE POLICY "resource_photos_bucket_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-photos'
    AND (
      (storage.foldername(name))[1] = 'public'
      OR (
        (storage.foldername(name))[1] = 'private'
        AND (is_admin() OR has_community_access())
      )
    )
  );

-- INSERT path debe empezar por public/ o private/
DROP POLICY IF EXISTS "resource_photos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

DROP POLICY IF EXISTS "resource_photos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin())
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

DROP POLICY IF EXISTS "resource_photos_bucket_admin_delete" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin());
