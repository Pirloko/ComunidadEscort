-- 00048: índices de rendimiento para listados frecuentes (feed reseñas, alertas por teléfono)
-- Depende de: 00033/00039 (resource_reviews), 00004/00040 (alerts), extensión pg_trgm (00001)

CREATE INDEX IF NOT EXISTS idx_resource_reviews_created
  ON resource_reviews (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_client_number_trgm
  ON alerts USING gin (client_number gin_trgm_ops)
  WHERE client_number IS NOT NULL AND length(trim(client_number)) > 0;
