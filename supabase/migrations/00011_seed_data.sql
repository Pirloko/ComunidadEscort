-- ============================================================
-- 00011_seed_data.sql
-- Datos iniciales: regiones y 13 ciudades
-- FASE 1 — Ejecutar después de 00002
-- ============================================================

INSERT INTO regions (name, code) VALUES
  ('Región de Tarapacá', 'I'),
  ('Región de Antofagasta', 'II'),
  ('Región de Coquimbo', 'IV'),
  ('Región de Valparaíso', 'V'),
  ('Región Metropolitana', 'RM'),
  ('Región del Libertador Bernardo O''Higgins', 'VI'),
  ('Región del Maule', 'VII'),
  ('Región del Biobío', 'VIII'),
  ('Región de La Araucanía', 'IX'),
  ('Región de Los Lagos', 'X'),
  ('Región de Arica y Parinacota', 'XV');

-- Ciudades iniciales
INSERT INTO cities (name, slug, region_id) VALUES
  ('Santiago',      'santiago',      (SELECT id FROM regions WHERE code = 'RM')),
  ('Valparaíso',    'valparaiso',    (SELECT id FROM regions WHERE code = 'V')),
  ('Viña del Mar',  'vina-del-mar',  (SELECT id FROM regions WHERE code = 'V')),
  ('Rancagua',      'rancagua',      (SELECT id FROM regions WHERE code = 'VI')),
  ('Talca',         'talca',         (SELECT id FROM regions WHERE code = 'VII')),
  ('Curicó',        'curico',        (SELECT id FROM regions WHERE code = 'VII')),
  ('Concepción',    'concepcion',    (SELECT id FROM regions WHERE code = 'VIII')),
  ('Temuco',        'temuco',        (SELECT id FROM regions WHERE code = 'IX')),
  ('Antofagasta',   'antofagasta',   (SELECT id FROM regions WHERE code = 'II')),
  ('La Serena',     'la-serena',     (SELECT id FROM regions WHERE code = 'IV')),
  ('Puerto Montt',  'puerto-montt',  (SELECT id FROM regions WHERE code = 'X')),
  ('Arica',         'arica',         (SELECT id FROM regions WHERE code = 'XV')),
  ('Iquique',       'iquique',       (SELECT id FROM regions WHERE code = 'I'));

-- Permitir lectura de ciudades a usuarios anónimos (necesario para registro)
-- Nota: el registro ocurre antes de autenticarse, así que necesitamos
-- una policy especial o exponer ciudades via función pública.

-- Función pública para listar ciudades (usada en formulario de registro)
CREATE OR REPLACE FUNCTION get_public_cities()
RETURNS TABLE (id UUID, name TEXT, slug TEXT, region_name TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT c.id, c.name, c.slug, r.name AS region_name
  FROM cities c
  JOIN regions r ON r.id = c.region_id
  WHERE c.is_active = true
  ORDER BY c.name;
$$;

-- Permitir ejecutar la función sin autenticación
GRANT EXECUTE ON FUNCTION get_public_cities() TO anon, authenticated;

-- Verificar alias disponible (para registro)
CREATE OR REPLACE FUNCTION is_alias_available(p_alias TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE lower(alias) = lower(p_alias)
  );
$$;

GRANT EXECUTE ON FUNCTION is_alias_available(TEXT) TO anon, authenticated;
