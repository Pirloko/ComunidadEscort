-- ============================================================
-- 00026_triggers_mentions.sql
-- Detecta menciones @alias en comentarios del foro y notifica
-- Requiere: comments (00003), profiles (00002), notifications (00007)
-- El tipo 'mention' ya existe en notification_type desde 00001
-- ============================================================

CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias TEXT;
  v_mentioned_id UUID;
BEGIN
  FOR v_alias IN
    SELECT DISTINCT match[1]
    FROM regexp_matches(NEW.content, '@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)', 'g') AS match
  LOOP
    SELECT id INTO v_mentioned_id
    FROM profiles
    WHERE lower(alias) = lower(v_alias) AND is_active = true;

    IF v_mentioned_id IS NOT NULL AND v_mentioned_id != NEW.author_id THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_mentioned_id,
        'mention',
        'Te mencionaron en un comentario',
        left(NEW.content, 100),
        jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created_notify_mentions ON comments;
CREATE TRIGGER on_comment_created_notify_mentions
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentions();
