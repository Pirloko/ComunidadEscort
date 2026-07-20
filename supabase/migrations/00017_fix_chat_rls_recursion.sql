-- ============================================================
-- 00017_fix_chat_rls_recursion.sql
-- Corrige error 500 en chat: política RLS recursiva en
-- conversation_participants (infinite recursion).
-- Ejecutar en Supabase SQL Editor si el chat falla con 500.
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

-- Reemplazar políticas que causaban recursión
DROP POLICY IF EXISTS "conv_participants_select_own" ON conversation_participants;
DROP POLICY IF EXISTS "conv_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;

CREATE POLICY "conv_participants_select"
  ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id)
  );
