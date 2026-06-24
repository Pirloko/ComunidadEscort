-- ============================================================
-- 00032_resources_categorias_data.sql
-- Migra datos existentes de 'hospedaje' a 'hoteles'.
-- Va en archivo separado de 00031 a propósito: Postgres no
-- permite usar un valor de enum agregado por ADD VALUE dentro
-- de la misma transacción en que se agregó.
-- Ejecutar DESPUÉS de 00031_resources_categorias.sql
-- ============================================================

UPDATE resources SET category = 'hoteles' WHERE category = 'hospedaje';
