-- ============================================================
-- 00013a_triggers_fase3_forum.sql
-- Triggers SOLO para foro (Fase 3)
-- Ejecutar DESPUÉS de 00009c_rls_fase3_forum.sql
-- ============================================================

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
