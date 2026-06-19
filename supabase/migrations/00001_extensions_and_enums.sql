-- ============================================================
-- 00001_extensions_and_enums.sql
-- Ejecutar PRIMERO en Supabase SQL Editor
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda de texto

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Categorías del foro (Fase 3)
CREATE TYPE post_category AS ENUM (
  'seguridad',
  'consejos',
  'salud',
  'bienestar',
  'transporte',
  'recursos_utiles',
  'conversaciones_generales'
);

-- Categorías de alertas (Fase 4)
CREATE TYPE alert_category AS ENUM (
  'estafa',
  'robo',
  'incidente_seguridad',
  'advertencia',
  'otro'
);

-- Estados de alertas (Fase 4)
CREATE TYPE alert_status AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- Estados de cuenta (aprobación admin)
CREATE TYPE account_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'bloqueada');

-- Categorías de recursos (Fase 5)
CREATE TYPE resource_category AS ENUM (
  'delivery',
  'farmacias',
  'supermercados',
  'transporte',
  'salud',
  'juridico',
  'hospedaje',
  'otros'
);

-- Tipos de bookmark (Fase 10)
CREATE TYPE bookmark_type AS ENUM ('post', 'resource', 'alert');

-- Tipos de notificación (Fase 7)
CREATE TYPE notification_type AS ENUM (
  'new_comment',
  'new_reply',
  'alert_approved',
  'alert_rejected',
  'new_message',
  'mention'
);
