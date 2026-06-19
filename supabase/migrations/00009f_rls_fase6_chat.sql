-- ============================================================
-- 00009f_rls_fase6_chat.sql
-- RLS para chat (Fase 6) — después de 00008_chat.sql
-- NOTA: si ya ejecutaste una versión anterior con recursión,
-- ejecuta también 00017_fix_chat_rls_recursion.sql
-- ============================================================

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID) TO authenticated;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

CREATE POLICY "conversations_insert"
  ON conversations FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_participants_select"
  ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "conv_participants_insert"
  ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "conv_participants_update_own"
  ON conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id)
  );
