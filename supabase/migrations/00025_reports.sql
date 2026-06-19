-- ============================================================
-- 00025_reports.sql
-- Reportes de contenido (posts, comentarios, alertas)
-- Requiere: profiles (00002), posts (00003), comments (00003), alerts (00004)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE report_target_type AS ENUM ('post', 'comment', 'alert');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM (
    'spam',
    'contenido_inapropiado',
    'acoso',
    'informacion_falsa',
    'otro'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pendiente', 'resuelto', 'descartado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   report_target_type NOT NULL,
  target_id     UUID NOT NULL,
  reason        report_reason NOT NULL,
  details       TEXT,
  status        report_status NOT NULL DEFAULT 'pendiente',
  reviewed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id);
