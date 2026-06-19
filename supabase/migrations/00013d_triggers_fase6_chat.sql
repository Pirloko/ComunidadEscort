-- ============================================================
-- 00013d_triggers_fase6_chat.sql
-- Triggers SOLO para chat (Fase 6)
-- Ejecutar DESPUÉS de 00008_chat.sql y 00009f_rls_fase6_chat.sql
-- (Trigger de notificaciones en Fase 7 con 00013g)
-- ============================================================

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Actualizar updated_at al enviar mensaje
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();
