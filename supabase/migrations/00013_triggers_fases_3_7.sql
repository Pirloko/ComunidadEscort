-- ============================================================
-- 00013_triggers_fases_3_7.sql
-- Triggers para foro, alertas, notificaciones y chat
-- Ejecutar después de crear las tablas correspondientes
-- ============================================================

-- updated_at para tablas de fases futuras
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contadores de likes en posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Contadores de likes en comentarios
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Contador de comentarios en posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Notificación: nuevo comentario
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post_author UUID; v_post_title TEXT;
BEGIN
  SELECT author_id, title INTO v_post_author, v_post_title FROM posts WHERE id = NEW.post_id;
  IF v_post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_post_author, 'new_comment', 'Nuevo comentario en tu publicación',
      left(NEW.content, 100), jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments FOR EACH ROW
  WHEN (NEW.parent_id IS NULL) EXECUTE FUNCTION notify_new_comment();

-- Notificación: respuesta
CREATE OR REPLACE FUNCTION notify_new_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_parent_author UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO v_parent_author FROM comments WHERE id = NEW.parent_id;
  IF v_parent_author IS NOT NULL AND v_parent_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_parent_author, 'new_reply', 'Respondieron a tu comentario',
      left(NEW.content, 100), jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'parent_id', NEW.parent_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON comments FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL) EXECUTE FUNCTION notify_new_reply();

-- Notificación: alerta aprobada/rechazada
CREATE OR REPLACE FUNCTION notify_alert_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pendiente' AND NEW.status IN ('aprobada', 'rechazada') THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.author_id,
      CASE WHEN NEW.status = 'aprobada' THEN 'alert_approved'::notification_type ELSE 'alert_rejected'::notification_type END,
      CASE WHEN NEW.status = 'aprobada' THEN 'Tu alerta fue aprobada' ELSE 'Tu alerta fue rechazada' END,
      CASE WHEN NEW.status = 'rechazada' THEN NEW.rejection_reason ELSE NEW.title END,
      jsonb_build_object('alert_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_alert_status_change
  AFTER UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION notify_alert_status_change();

-- Notificación: nuevo mensaje
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipient UUID;
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  SELECT user_id INTO v_recipient FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id LIMIT 1;
  IF v_recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_recipient, 'new_message', 'Nuevo mensaje privado', left(NEW.content, 100),
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION handle_new_message();
