-- ============================================================
-- 00015_realtime_notifications.sql
-- Habilitar Realtime para notificaciones
-- Ejecutar DESPUÉS de 00007_notifications.sql
-- Idempotente: no falla si la tabla ya está en la publicación
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
