-- ============================================================
-- 00014_chat_functions.sql
-- Funciones helper para chat 1:1
-- Ejecutar DESPUÉS de 00008_chat.sql
-- ============================================================

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

  IF p_other_user_id = v_current THEN
    RAISE EXCEPTION 'No puedes chatear contigo misma';
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

GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID) TO authenticated;

-- Habilitar Realtime para mensajes (ejecutar si no está activo):
-- Dashboard → Database → Replication → agregar tabla `messages`
