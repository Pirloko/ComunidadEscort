-- ============================================================
-- 00009c_rls_fase3_forum.sql
-- RLS SOLO para foro (Fase 3)
-- Ejecutar DESPUÉS de 00003_forum.sql
-- ============================================================

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_authenticated"
  ON posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND NOT is_locked)
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_delete_own_or_mod"
  ON posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "posts_mod_pin_lock"
  ON posts FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_authenticated"
  ON comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert_own"
  ON comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_delete_own_or_mod"
  ON comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- POST LIKES
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_select" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- COMMENT LIKES
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_likes_insert_own" ON comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comment_likes_delete_own" ON comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
