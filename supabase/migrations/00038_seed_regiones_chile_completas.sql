-- ============================================================
-- 00038_seed_regiones_chile_completas.sql
-- Completa las 16 regiones de Chile (faltaban III, XI, XII, XIV, XVI).
-- Idempotente: no duplica si ya existen por code.
-- ============================================================

INSERT INTO regions (name, code)
SELECT v.name, v.code
FROM (VALUES
  ('Región de Atacama', 'III'),
  ('Región de Aysén del General Carlos Ibáñez del Campo', 'XI'),
  ('Región de Magallanes y de la Antártica Chilena', 'XII'),
  ('Región de Los Ríos', 'XIV'),
  ('Región de Ñuble', 'XVI')
) AS v(name, code)
WHERE NOT EXISTS (
  SELECT 1 FROM regions r WHERE r.code = v.code
);

-- Ciudades capitales de las regiones nuevas (opcionales, activas)
INSERT INTO cities (name, slug, region_id)
SELECT v.name, v.slug, r.id
FROM (VALUES
  ('Copiapó', 'copiapo', 'III'),
  ('Coyhaique', 'coyhaique', 'XI'),
  ('Punta Arenas', 'punta-arenas', 'XII'),
  ('Valdivia', 'valdivia', 'XIV'),
  ('Chillán', 'chillan', 'XVI')
) AS v(name, slug, code)
JOIN regions r ON r.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM cities c WHERE c.slug = v.slug
);
