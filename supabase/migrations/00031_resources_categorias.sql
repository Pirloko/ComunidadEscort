-- ============================================================
-- 00031_resources_categorias.sql
-- "Datos de todo": evoluciona el enum resource_category
-- Renombra valores existentes y agrega categorías nuevas.
-- 'hospedaje' queda huérfano (Postgres no permite DROP VALUE sin
-- recrear el tipo); los datos existentes se migran en 00032.
-- ============================================================

ALTER TYPE resource_category RENAME VALUE 'farmacias' TO 'farmacia';
ALTER TYPE resource_category RENAME VALUE 'supermercados' TO 'supermercado';
ALTER TYPE resource_category RENAME VALUE 'transporte' TO 'taxis_uber';

ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'botilleria';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'carniceria';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'tours_ciudad';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'gym';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'habitaciones_escort';
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'hoteles';
