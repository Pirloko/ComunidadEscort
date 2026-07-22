-- ============================================================
-- 00041_community_chat.sql
-- Chat único de comunidad: todas las cuentas con acceso pueden
-- leer y escribir sin unirse. Las tablas de DM (conversations /
-- messages) quedan sin uso en la UI.
-- Requiere: has_community_access() (00034), is_moderator_or_admin()
-- ============================================================

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL
    CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_messages_created
  ON community_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_messages_sender
  ON community_messages (sender_id, created_at DESC);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_messages_select" ON community_messages;
CREATE POLICY "community_messages_select"
  ON community_messages FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "community_messages_insert" ON community_messages;
CREATE POLICY "community_messages_insert"
  ON community_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (has_community_access() OR is_moderator_or_admin())
  );

DROP POLICY IF EXISTS "community_messages_delete" ON community_messages;
CREATE POLICY "community_messages_delete"
  ON community_messages FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    OR is_moderator_or_admin()
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
  END IF;
END $$;
