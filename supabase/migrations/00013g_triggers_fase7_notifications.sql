-- ============================================================
-- 00013g_triggers_fase7_notifications.sql
-- Triggers automáticos de notificaciones
-- Ejecutar DESPUÉS de 00007_notifications.sql
-- Requiere tablas: posts, comments, alerts, messages (fases 3-6)
-- ============================================================

-- Nuevo comentario en publicación
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_post_author,
      'new_comment',
      'Nuevo comentario en tu publicación',
      left(NEW.content, 100),
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created_notify
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NULL)
  EXECUTE FUNCTION notify_new_comment();

-- Respuesta a comentario
CREATE OR REPLACE FUNCTION notify_new_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_parent_author UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO v_parent_author FROM comments WHERE id = NEW.parent_id;
  IF v_parent_author IS NOT NULL AND v_parent_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_parent_author,
      'new_reply',
      'Respondieron a tu comentario',
      left(NEW.content, 100),
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'parent_id', NEW.parent_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reply_created_notify
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION notify_new_reply();

-- Alerta aprobada / rechazada
CREATE OR REPLACE FUNCTION notify_alert_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pendiente' AND NEW.status IN ('aprobada', 'rechazada') THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.author_id,
      CASE WHEN NEW.status = 'aprobada' THEN 'alert_approved'::notification_type
           ELSE 'alert_rejected'::notification_type END,
      CASE WHEN NEW.status = 'aprobada' THEN 'Tu alerta fue aprobada'
           ELSE 'Tu alerta fue rechazada' END,
      CASE WHEN NEW.status = 'rechazada' THEN NEW.rejection_reason ELSE NEW.title END,
      jsonb_build_object('alert_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_alert_status_change_notify
  AFTER UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_alert_status_change();

-- Nuevo mensaje privado (solo notificación; updated_at ya lo maneja Fase 6)
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_recipient UUID;
BEGIN
  SELECT user_id INTO v_recipient
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_recipient,
      'new_message',
      'Nuevo mensaje privado',
      left(NEW.content, 100),
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
