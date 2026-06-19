-- ============================================================
-- 00009g_rls_fase7_notifications.sql
-- RLS para notificaciones (Fase 7) — después de 00007_notifications.sql
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
