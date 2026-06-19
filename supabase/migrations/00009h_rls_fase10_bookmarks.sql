-- ============================================================
-- 00009h_rls_fase10_bookmarks.sql
-- RLS para guardados (Fase 10) — después de 00006_bookmarks.sql
-- ============================================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());
