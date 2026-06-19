-- ============================================================
-- 00004_alerts.sql
-- Centro de alertas comunitarias con moderación
-- FASE 4 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id          UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  category         alert_category NOT NULL,
  status           alert_status NOT NULL DEFAULT 'pendiente',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  location_detail  TEXT,
  reviewed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alert_title_length CHECK (char_length(title) BETWEEN 5 AND 200),
  CONSTRAINT alert_desc_length CHECK (char_length(description) BETWEEN 10 AND 5000)
);

CREATE INDEX idx_alerts_status ON alerts (status, created_at DESC);
CREATE INDEX idx_alerts_city_approved ON alerts (city_id, created_at DESC) WHERE status = 'aprobada';
CREATE INDEX idx_alerts_author ON alerts (author_id, created_at DESC);
CREATE INDEX idx_alerts_pending ON alerts (created_at ASC) WHERE status = 'pendiente';
