-- ============================================================
-- 00007_notifications.sql
-- Sistema de notificaciones
-- FASE 7 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id, created_at DESC) WHERE is_read = false;
