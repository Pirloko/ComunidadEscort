-- ============================================================
-- 00006_bookmarks.sql
-- Sistema de guardados
-- FASE 10 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type   bookmark_type NOT NULL,
  item_id     UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks (user_id, item_type, created_at DESC);
