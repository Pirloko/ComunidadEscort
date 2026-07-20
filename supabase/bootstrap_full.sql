-- ============================================================
-- bootstrap_full.sql — Comunidadescort.cl
-- Schema completo + RLS endurecido (hasta 00037) + seed admin.
-- Proyecto Supabase NUEVO / vacío. Ejecutar una sola vez.
--
-- Admin: carlosadmin@gmail.com / 123456
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00001_extensions_and_enums.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00001_extensions_and_enums.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00002_cities_and_profiles.sql
-- ######################################################################

-- ============================================================
-- 00002_cities_and_profiles.sql
-- Regiones, ciudades y perfiles de usuario
-- FASE 1 + FASE 2
-- ============================================================

-- Regiones
CREATE TABLE regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  code        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ciudades
CREATE TABLE cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  region_id   UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cities_region ON cities (region_id);
CREATE INDEX idx_cities_active ON cities (is_active) WHERE is_active = true;

-- Perfiles (extensión de auth.users)
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias             TEXT NOT NULL,
  email             TEXT NOT NULL,
  city_id           UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  avatar_url        TEXT,
  description       TEXT,
  privacy_settings  JSONB NOT NULL DEFAULT '{
    "show_city": true,
    "show_description": true,
    "allow_messages": true
  }'::jsonb,
  role              user_role NOT NULL DEFAULT 'user',
  publication_link  TEXT,
  account_status    account_status NOT NULL DEFAULT 'pendiente',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alias_length CHECK (char_length(alias) BETWEEN 3 AND 30),
  CONSTRAINT alias_format CHECK (alias ~ '^[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+$'),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE UNIQUE INDEX profiles_alias_lower_idx ON profiles (lower(alias));
CREATE INDEX idx_profiles_city ON profiles (city_id);
CREATE INDEX idx_profiles_role ON profiles (role);

-- Vista pública de perfiles (SIN email)
CREATE VIEW public_profiles AS
SELECT
  id,
  alias,
  city_id,
  avatar_url,
  description,
  privacy_settings,
  created_at
FROM profiles
WHERE is_active = true;

-- END FILE: supabase/migrations/00002_cities_and_profiles.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00003_forum.sql
-- ######################################################################

-- ============================================================
-- 00003_forum.sql
-- Foro comunitario: publicaciones, comentarios y likes
-- FASE 3 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id         UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  category        post_category NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  is_pinned       BOOLEAN NOT NULL DEFAULT false,
  is_locked       BOOLEAN NOT NULL DEFAULT false,
  likes_count     INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 5 AND 200),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 10 AND 10000)
);

CREATE INDEX idx_posts_city_category ON posts (city_id, category, created_at DESC);
CREATE INDEX idx_posts_author ON posts (author_id, created_at DESC);
CREATE INDEX idx_posts_pinned ON posts (city_id, is_pinned, created_at DESC) WHERE is_pinned = true;

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 5000)
);

CREATE INDEX idx_comments_post ON comments (post_id, created_at);
CREATE INDEX idx_comments_parent ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_author ON comments (author_id, created_at DESC);

CREATE TABLE post_likes (
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comment_likes (
  comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- END FILE: supabase/migrations/00003_forum.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00004_alerts.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00004_alerts.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00005_resources.sql
-- ######################################################################

-- ============================================================
-- 00005_resources.sql
-- Directorio local de recursos por ciudad
-- FASE 5 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id     UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  category    resource_category NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  phone       TEXT,
  address     TEXT,
  website     TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resource_name_length CHECK (char_length(name) BETWEEN 2 AND 150)
);

CREATE INDEX idx_resources_city ON resources (city_id, category) WHERE is_active = true;
CREATE INDEX idx_resources_author ON resources (author_id, created_at DESC);
CREATE INDEX idx_resources_name_trgm ON resources USING gin (name gin_trgm_ops);

-- END FILE: supabase/migrations/00005_resources.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00006_bookmarks.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00006_bookmarks.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00007_notifications.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00007_notifications.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00008_chat.sql
-- ######################################################################

-- ============================================================
-- 00008_chat.sql
-- Chat privado entre miembros
-- FASE 6 — Ejecutar cuando llegues a esa fase
-- ============================================================

CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants (user_id, joined_at DESC);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT message_content_length CHECK (char_length(content) BETWEEN 1 AND 5000)
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages (sender_id, created_at DESC);

-- END FILE: supabase/migrations/00008_chat.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009_rls_policies.sql
-- ######################################################################

-- ============================================================
-- 00009_rls_policies.sql
-- RLS FASE 1: regions, cities, profiles
-- (RLS de fases 3-7 en 00009b_rls_fases_3_7.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  )
$$;

-- REGIONS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_select_all"
  ON regions FOR SELECT TO authenticated USING (true);

CREATE POLICY "regions_admin_all"
  ON regions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- CITIES
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_select_active"
  ON cities FOR SELECT TO authenticated
  USING (is_active = true OR is_moderator_or_admin());

CREATE POLICY "cities_admin_all"
  ON cities FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated
  USING (is_active = true OR id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- END FILE: supabase/migrations/00009_rls_policies.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009c_rls_fase3_forum.sql
-- ######################################################################

-- ============================================================
-- 00009c_rls_fase3_forum.sql
-- RLS SOLO para foro (Fase 3)
-- Ejecutar DESPUÉS de 00003_forum.sql
-- ============================================================

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_authenticated"
  ON posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND NOT is_locked)
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_delete_own_or_mod"
  ON posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "posts_mod_pin_lock"
  ON posts FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_authenticated"
  ON comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert_own"
  ON comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "comments_delete_own_or_mod"
  ON comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- POST LIKES
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_select" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- COMMENT LIKES
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_likes_insert_own" ON comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comment_likes_delete_own" ON comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- END FILE: supabase/migrations/00009c_rls_fase3_forum.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009d_rls_fase4_alerts.sql
-- ######################################################################

-- ============================================================
-- 00009b_rls_fases_4_7.sql
-- RLS para fases 4 a 7 y 10 (NO incluye foro)
-- ⚠️ Ejecutar SOLO la sección de la fase correspondiente
--
-- Fase 3 (foro): usar 00009c_rls_fase3_forum.sql
-- ============================================================

-- ── FASE 4: ALERTAS (después de 00004_alerts.sql) ────────────

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_approved_or_own_or_mod"
  ON alerts FOR SELECT TO authenticated
  USING (status = 'aprobada' OR author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "alerts_insert_own"
  ON alerts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "alerts_update_own_pending"
  ON alerts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = 'pendiente')
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "alerts_mod_review"
  ON alerts FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

CREATE POLICY "alerts_delete_mod"
  ON alerts FOR DELETE TO authenticated
  USING (is_moderator_or_admin() OR author_id = auth.uid());

-- END FILE: supabase/migrations/00009d_rls_fase4_alerts.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009e_rls_fase5_resources.sql
-- ######################################################################

-- ============================================================
-- 00009e_rls_fase5_resources.sql
-- RLS para directorio (Fase 5) — después de 00005_resources.sql
-- ============================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_active"
  ON resources FOR SELECT TO authenticated
  USING (is_active = true OR author_id = auth.uid() OR is_moderator_or_admin());

CREATE POLICY "resources_insert_own"
  ON resources FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "resources_update_own_or_admin"
  ON resources FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR is_admin()) WITH CHECK (author_id = auth.uid() OR is_admin());

CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- END FILE: supabase/migrations/00009e_rls_fase5_resources.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009f_rls_fase6_chat.sql
-- ######################################################################

-- ============================================================
-- 00009f_rls_fase6_chat.sql
-- RLS para chat (Fase 6) — después de 00008_chat.sql
-- NOTA: si ya ejecutaste una versión anterior con recursión,
-- ejecuta también 00017_fix_chat_rls_recursion.sql
-- ============================================================

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID) TO authenticated;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert"
  ON conversations FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_participants_select" ON conversation_participants;
CREATE POLICY "conv_participants_select"
  ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS "conv_participants_insert" ON conversation_participants;
CREATE POLICY "conv_participants_insert"
  ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "conv_participants_update_own" ON conversation_participants;
CREATE POLICY "conv_participants_update_own"
  ON conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id)
  );

-- END FILE: supabase/migrations/00009f_rls_fase6_chat.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009g_rls_fase7_notifications.sql
-- ######################################################################

-- ============================================================
-- 00009g_rls_fase7_notifications.sql
-- RLS para notificaciones (Fase 7) — después de 00007_notifications.sql
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- END FILE: supabase/migrations/00009g_rls_fase7_notifications.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00009h_rls_fase10_bookmarks.sql
-- ######################################################################

-- ============================================================
-- 00009h_rls_fase10_bookmarks.sql
-- RLS para guardados (Fase 10) — después de 00006_bookmarks.sql
-- ============================================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- END FILE: supabase/migrations/00009h_rls_fase10_bookmarks.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00010_triggers_functions.sql
-- ######################################################################

-- ============================================================
-- 00010_triggers_functions.sql
-- Triggers FASE 1 únicamente
-- (Triggers de fases 3-7 están en 00013_triggers_fases_3_7.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias            TEXT;
  v_city_id          UUID;
  v_publication_link TEXT;
BEGIN
  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');

  IF v_alias IS NULL OR v_city_id IS NULL THEN
    RAISE EXCEPTION 'alias y city_id son requeridos en metadata';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, is_active, account_status
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, false, 'pendiente'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- END FILE: supabase/migrations/00010_triggers_functions.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00011_seed_data.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00011_seed_data.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00012_storage.sql
-- ######################################################################

-- ============================================================
-- FASE 1 — Ejecutar estos 5 archivos EN ORDEN en Supabase:
--
--   1. 00001_extensions_and_enums.sql
--   2. 00002_cities_and_profiles.sql
--   3. 00009_rls_policies.sql      (solo secciones regions, cities, profiles)
--   4. 00010_triggers_functions.sql (solo sección handle_new_user + profiles_updated_at)
--   5. 00011_seed_data.sql
--
-- NOTA: Los archivos 00009 y 00010 incluyen políticas/triggers de fases
-- futuras. Puedes ejecutarlos completos desde el inicio (no causan error)
-- o ejecutar solo las secciones marcadas para cada fase.
--
-- FASE 3: 00003_forum.sql (ya incluido en 00009 y 00010)
-- FASE 4: 00004_alerts.sql
-- FASE 5: 00005_resources.sql
-- FASE 6: 00008_chat.sql
-- FASE 7: 00007_notifications.sql (triggers ya en 00010)
-- FASE 10: 00006_bookmarks.sql
-- ============================================================

-- Storage bucket para avatares (ejecutar en Supabase Dashboard > Storage)
-- O via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage para avatares (Fase 2)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- END FILE: supabase/migrations/00012_storage.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00013_triggers_fases_3_7.sql
-- ######################################################################

-- ============================================================
-- 00013_triggers_fases_3_7.sql
-- Triggers para foro, alertas, notificaciones y chat
-- Ejecutar después de crear las tablas correspondientes
-- ============================================================

-- updated_at para tablas de fases futuras
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Contadores de likes en posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Contadores de likes en comentarios
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Contador de comentarios en posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Notificación: nuevo comentario
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post_author UUID; v_post_title TEXT;
BEGIN
  SELECT author_id, title INTO v_post_author, v_post_title FROM posts WHERE id = NEW.post_id;
  IF v_post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_post_author, 'new_comment', 'Nuevo comentario en tu publicación',
      left(NEW.content, 100), jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments FOR EACH ROW
  WHEN (NEW.parent_id IS NULL) EXECUTE FUNCTION notify_new_comment();

-- Notificación: respuesta
CREATE OR REPLACE FUNCTION notify_new_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_parent_author UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO v_parent_author FROM comments WHERE id = NEW.parent_id;
  IF v_parent_author IS NOT NULL AND v_parent_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_parent_author, 'new_reply', 'Respondieron a tu comentario',
      left(NEW.content, 100), jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'parent_id', NEW.parent_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_reply_created
  AFTER INSERT ON comments FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL) EXECUTE FUNCTION notify_new_reply();

-- Notificación: alerta aprobada/rechazada
CREATE OR REPLACE FUNCTION notify_alert_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pendiente' AND NEW.status IN ('aprobada', 'rechazada') THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (NEW.author_id,
      CASE WHEN NEW.status = 'aprobada' THEN 'alert_approved'::notification_type ELSE 'alert_rejected'::notification_type END,
      CASE WHEN NEW.status = 'aprobada' THEN 'Tu alerta fue aprobada' ELSE 'Tu alerta fue rechazada' END,
      CASE WHEN NEW.status = 'rechazada' THEN NEW.rejection_reason ELSE NEW.title END,
      jsonb_build_object('alert_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_alert_status_change
  AFTER UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION notify_alert_status_change();

-- Notificación: nuevo mensaje
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipient UUID;
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  SELECT user_id INTO v_recipient FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id LIMIT 1;
  IF v_recipient IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (v_recipient, 'new_message', 'Nuevo mensaje privado', left(NEW.content, 100),
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- END FILE: supabase/migrations/00013_triggers_fases_3_7.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00014_chat_functions.sql
-- ######################################################################

-- ============================================================
-- 00014_chat_functions.sql
-- Funciones helper para chat 1:1
-- Ejecutar DESPUÉS de 00008_chat.sql
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
  v_current UUID := auth.uid();
BEGIN
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_other_user_id = v_current THEN
    RAISE EXCEPTION 'No puedes chatear contigo misma';
  END IF;

  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
    AND cp2.user_id = p_other_user_id
  WHERE cp1.user_id = v_current
    AND (
      SELECT count(*)::int
      FROM conversation_participants cp
      WHERE cp.conversation_id = cp1.conversation_id
    ) = 2
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_current), (v_conv_id, p_other_user_id);

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(UUID) TO authenticated;

-- Habilitar Realtime para mensajes (ejecutar si no está activo):
-- Dashboard → Database → Replication → agregar tabla `messages`

-- END FILE: supabase/migrations/00014_chat_functions.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00015_realtime_notifications.sql
-- ######################################################################

-- ============================================================
-- 00015_realtime_notifications.sql
-- Habilitar Realtime para notificaciones
-- Ejecutar DESPUÉS de 00007_notifications.sql
-- Idempotente: no falla si la tabla ya está en la publicación
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- END FILE: supabase/migrations/00015_realtime_notifications.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00017_fix_chat_rls_recursion.sql
-- ######################################################################

-- ============================================================
-- 00017_fix_chat_rls_recursion.sql
-- Corrige error 500 en chat: política RLS recursiva en
-- conversation_participants (infinite recursion).
-- Ejecutar en Supabase SQL Editor si el chat falla con 500.
-- ============================================================

CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_conversation_participant(UUID) TO authenticated;

-- Reemplazar políticas que causaban recursión
DROP POLICY IF EXISTS "conv_participants_select_own" ON conversation_participants;
DROP POLICY IF EXISTS "conv_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON messages;

CREATE POLICY "conv_participants_select"
  ON conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id)
  );

-- END FILE: supabase/migrations/00017_fix_chat_rls_recursion.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00018_resources_moderation.sql
-- ######################################################################

-- ============================================================
-- 00018_resources_moderation.sql
-- Moderación de recursos del directorio (aprobación mod/admin)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS status alert_status,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Recursos existentes quedan publicados; los nuevos arrancan pendientes
UPDATE resources SET status = 'aprobada' WHERE status IS NULL;

ALTER TABLE resources
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pendiente';

CREATE INDEX IF NOT EXISTS idx_resources_status ON resources (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_city_approved
  ON resources (city_id, created_at DESC)
  WHERE status = 'aprobada' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_resources_pending
  ON resources (created_at ASC)
  WHERE status = 'pendiente';

-- Tipos de notificación para recursos (Fase 7+)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'resource_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'resource_rejected';

-- END FILE: supabase/migrations/00018_resources_moderation.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00019_rls_resources_moderation.sql
-- ######################################################################

-- ============================================================
-- 00019_rls_resources_moderation.sql
-- RLS actualizado: directorio solo con recursos aprobados
-- Ejecutar DESPUÉS de 00018_resources_moderation.sql
-- ============================================================

DROP POLICY IF EXISTS "resources_select_active" ON resources;
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own_or_admin" ON resources;
DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;

CREATE POLICY "resources_select_approved_or_own_or_mod"
  ON resources FOR SELECT TO authenticated
  USING (
    (status = 'aprobada' AND is_active = true)
    OR author_id = auth.uid()
    OR is_moderator_or_admin()
  );

CREATE POLICY "resources_insert_own"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "resources_update_own_pending"
  ON resources FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = 'pendiente')
  WITH CHECK (author_id = auth.uid() AND status = 'pendiente');

CREATE POLICY "resources_mod_review"
  ON resources FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

CREATE POLICY "resources_admin_verify"
  ON resources FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- END FILE: supabase/migrations/00019_rls_resources_moderation.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00020_triggers_resources_moderation.sql
-- ######################################################################

-- ============================================================
-- 00020_triggers_resources_moderation.sql
-- Notificaciones al aprobar/rechazar recursos del directorio
-- Ejecutar DESPUÉS de 00018 y 00019
-- ============================================================

CREATE OR REPLACE FUNCTION notify_resource_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pendiente' AND NEW.status IN ('aprobada', 'rechazada') THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.author_id,
      CASE WHEN NEW.status = 'aprobada' THEN 'resource_approved'::notification_type
           ELSE 'resource_rejected'::notification_type END,
      CASE WHEN NEW.status = 'aprobada' THEN 'Tu recurso fue aprobado'
           ELSE 'Tu recurso fue rechazado' END,
      CASE WHEN NEW.status = 'rechazada' THEN NEW.rejection_reason ELSE NEW.name END,
      jsonb_build_object('resource_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_resource_status_change_notify ON resources;

CREATE TRIGGER on_resource_status_change_notify
  AFTER UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION notify_resource_status_change();

-- END FILE: supabase/migrations/00020_triggers_resources_moderation.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00021_account_approval.sql
-- ######################################################################

-- ============================================================
-- 00021_account_approval.sql
-- Aprobación de cuentas por admin + link de publicación
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS publication_link TEXT;

-- Nuevas cuentas quedan inactivas hasta aprobación del admin
ALTER TABLE profiles
  ALTER COLUMN is_active SET DEFAULT false;

-- Perfiles existentes permanecen activos
UPDATE profiles SET is_active = true;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias            TEXT;
  v_city_id          UUID;
  v_publication_link TEXT;
BEGIN
  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');

  IF v_alias IS NULL OR v_city_id IS NULL THEN
    RAISE EXCEPTION 'alias y city_id son requeridos en metadata';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (id, alias, email, city_id, publication_link, is_active)
  VALUES (NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, false);

  RETURN NEW;
END;
$$;

-- END FILE: supabase/migrations/00021_account_approval.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00022_account_review.sql
-- ######################################################################

-- ============================================================
-- 00022_account_review.sql
-- Estados de cuenta: aprobar / rechazar / bloquear email
-- + fix admin bloqueado
-- ============================================================

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'bloqueada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Sincronizar datos existentes
UPDATE profiles
SET account_status = CASE WHEN is_active THEN 'aprobada'::account_status ELSE 'pendiente'::account_status END;

-- Staff y admin principal siempre activos
UPDATE profiles
SET is_active = true, account_status = 'aprobada'
WHERE role IN ('admin', 'moderator');

UPDATE profiles
SET is_active = true, account_status = 'aprobada', role = 'admin'
WHERE lower(email) = 'carlos@gmail.com';

-- Emails bloqueados (impiden registro e ingreso)
CREATE TABLE IF NOT EXISTS blocked_emails (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  blocked_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_lower ON blocked_emails (lower(email));

ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_emails_admin" ON blocked_emails;
CREATE POLICY "blocked_emails_admin"
  ON blocked_emails FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION is_email_blocked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_emails WHERE lower(email) = lower(trim(p_email))
  );
$$;

GRANT EXECUTE ON FUNCTION is_email_blocked(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias            TEXT;
  v_city_id          UUID;
  v_publication_link TEXT;
BEGIN
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');

  IF v_alias IS NULL OR v_city_id IS NULL THEN
    RAISE EXCEPTION 'alias y city_id son requeridos en metadata';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, is_active, account_status
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, false, 'pendiente'
  );

  RETURN NEW;
END;
$$;

-- Staff activo al asignar rol admin/moderador
CREATE OR REPLACE FUNCTION ensure_staff_account_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IN ('admin', 'moderator') THEN
    NEW.is_active := true;
    NEW.account_status := 'aprobada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_staff_active ON profiles;
CREATE TRIGGER profiles_ensure_staff_active
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_staff_account_active();

-- END FILE: supabase/migrations/00022_account_review.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00024_notify_account_review.sql
-- ######################################################################

-- ============================================================
-- 00024_notify_account_review.sql
-- Notificación al usuario cuando un admin aprueba o rechaza su cuenta
-- Requiere: notifications (Fase 7, 00007), profiles.account_status (00022)
-- ============================================================

-- Nuevos tipos de notificación
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_rejected';

-- Cuenta aprobada / rechazada por admin (transición pendiente -> aprobada/rechazada)
CREATE OR REPLACE FUNCTION notify_account_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.account_status = 'pendiente' AND NEW.account_status IN ('aprobada', 'rechazada') THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.id,
      CASE WHEN NEW.account_status = 'aprobada' THEN 'account_approved'::notification_type
           ELSE 'account_rejected'::notification_type END,
      CASE WHEN NEW.account_status = 'aprobada' THEN 'Tu cuenta fue aprobada'
           ELSE 'Solicitud rechazada' END,
      CASE WHEN NEW.account_status = 'rechazada' THEN NEW.rejection_reason
           ELSE 'Ya puedes acceder a todas las funciones de la comunidad.' END,
      jsonb_build_object('account_status', NEW.account_status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_account_status_change_notify ON profiles;
CREATE TRIGGER on_account_status_change_notify
  AFTER UPDATE OF account_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_account_status_change();

-- END FILE: supabase/migrations/00024_notify_account_review.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00025_reports.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00025_reports.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00025_rls_reports.sql
-- ######################################################################

-- ============================================================
-- 00025_rls_reports.sql
-- RLS para reports — después de 00025_reports.sql
-- ============================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own_or_mod" ON reports;
CREATE POLICY "reports_select_own_or_mod"
  ON reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'pendiente');

DROP POLICY IF EXISTS "reports_mod_review" ON reports;
CREATE POLICY "reports_mod_review"
  ON reports FOR UPDATE TO authenticated
  USING (is_moderator_or_admin()) WITH CHECK (is_moderator_or_admin());

-- END FILE: supabase/migrations/00025_rls_reports.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00026_triggers_mentions.sql
-- ######################################################################

-- ============================================================
-- 00026_triggers_mentions.sql
-- Detecta menciones @alias en comentarios del foro y notifica
-- Requiere: comments (00003), profiles (00002), notifications (00007)
-- El tipo 'mention' ya existe en notification_type desde 00001
-- ============================================================

CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias TEXT;
  v_mentioned_id UUID;
BEGIN
  FOR v_alias IN
    SELECT DISTINCT match[1]
    FROM regexp_matches(NEW.content, '@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)', 'g') AS match
  LOOP
    SELECT id INTO v_mentioned_id
    FROM profiles
    WHERE lower(alias) = lower(v_alias) AND is_active = true;

    IF v_mentioned_id IS NOT NULL AND v_mentioned_id != NEW.author_id THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_mentioned_id,
        'mention',
        'Te mencionaron en un comentario',
        left(NEW.content, 100),
        jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created_notify_mentions ON comments;
CREATE TRIGGER on_comment_created_notify_mentions
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentions();

-- END FILE: supabase/migrations/00026_triggers_mentions.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00027_phone_and_city_nullable.sql
-- ######################################################################

-- ============================================================
-- 00027_phone_and_city_nullable.sql
-- Teléfono normalizado de Chile en profiles + city_id opcional
-- Requiere: profiles (00002), handle_new_user vigente (00022)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS phone_format;
ALTER TABLE profiles ADD CONSTRAINT phone_format
  CHECK (phone IS NULL OR phone ~ '^\+569\d{8}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON profiles (phone) WHERE phone IS NOT NULL;

ALTER TABLE profiles ALTER COLUMN city_id DROP NOT NULL;

-- city_id ya no es obligatorio en metadata; phone pasa a ser el dato
-- requerido para verificar identidad/contacto en registros nuevos.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias            TEXT;
  v_city_id          UUID;
  v_publication_link TEXT;
  v_phone            TEXT;
BEGIN
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

  v_alias            := NEW.raw_user_meta_data ->> 'alias';
  v_city_id          := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link := trim(NEW.raw_user_meta_data ->> 'publication_link');
  v_phone            := NEW.raw_user_meta_data ->> 'phone';

  IF v_alias IS NULL THEN
    RAISE EXCEPTION 'alias es requerido en metadata';
  END IF;

  IF v_phone IS NULL OR v_phone !~ '^\+569\d{8}$' THEN
    RAISE EXCEPTION 'phone debe estar en formato +569XXXXXXXX';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, phone, is_active, account_status
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, v_phone, false, 'pendiente'
  );

  RETURN NEW;
END;
$$;

-- END FILE: supabase/migrations/00027_phone_and_city_nullable.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00028_rpc_login_by_phone.sql
-- ######################################################################

-- ============================================================
-- 00028_rpc_login_by_phone.sql
-- RPC para resolver el email asociado a un teléfono normalizado,
-- usada por el login con "email o celular"
-- Requiere: profiles.phone (00027)
-- ============================================================

CREATE OR REPLACE FUNCTION get_auth_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT email FROM profiles WHERE phone = p_phone LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_auth_email_by_phone(TEXT) TO anon, authenticated;

-- END FILE: supabase/migrations/00028_rpc_login_by_phone.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00029_rls_profiles_hardening.sql
-- ######################################################################

-- ============================================================
-- 00029_rls_profiles_hardening.sql
-- Defensa en profundidad: solo admin (o service_role, usado por
-- Edge Functions) puede cambiar role/account_status/is_active.
-- profiles_update_own (00009) permite UPDATE de cualquier columna
-- de la propia fila; este trigger cierra la auto-escalación.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_admin() OR auth.role() = 'service_role') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'No tienes permisos para modificar estos campos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_profiles_update_guard ON profiles;
CREATE TRIGGER before_profiles_update_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_privilege_escalation();

-- END FILE: supabase/migrations/00029_rls_profiles_hardening.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00030_security_hardening_phone_login.sql
-- ######################################################################

-- ============================================================
-- 00030_security_hardening_phone_login.sql
-- Corrige hallazgos de seguridad de 00027-00029:
-- 1. get_auth_email_by_phone filtraba el email real a anon/authenticated
--    (enumeración de usuarios) -> se elimina; el login por teléfono pasa
--    a resolverse server-side en la Edge Function login-with-phone, que
--    nunca devuelve el email al cliente.
-- 2. must_change_password vivía en user_metadata, editable por el propio
--    usuario via auth.updateUser({data}) -> bypass del cambio forzado.
--    Pasa a profiles.must_change_password, protegido por el mismo
--    trigger de defensa en profundidad de 00029, con una única vía
--    legítima de limpiarlo: complete_forced_password_change().
-- ============================================================

DROP FUNCTION IF EXISTS get_auth_email_by_phone(TEXT);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias               TEXT;
  v_city_id              UUID;
  v_publication_link     TEXT;
  v_phone                TEXT;
  v_must_change_password BOOLEAN;
BEGIN
  IF is_email_blocked(NEW.email) THEN
    RAISE EXCEPTION 'Este correo está bloqueado y no puede registrarse';
  END IF;

  v_alias               := NEW.raw_user_meta_data ->> 'alias';
  v_city_id              := (NEW.raw_user_meta_data ->> 'city_id')::UUID;
  v_publication_link     := trim(NEW.raw_user_meta_data ->> 'publication_link');
  v_phone                := NEW.raw_user_meta_data ->> 'phone';
  v_must_change_password := coalesce((NEW.raw_user_meta_data ->> 'must_change_password')::BOOLEAN, false);

  IF v_alias IS NULL THEN
    RAISE EXCEPTION 'alias es requerido en metadata';
  END IF;

  IF v_phone IS NULL OR v_phone !~ '^\+569\d{8}$' THEN
    RAISE EXCEPTION 'phone debe estar en formato +569XXXXXXXX';
  END IF;

  IF v_publication_link IS NULL OR v_publication_link = '' THEN
    RAISE EXCEPTION 'publication_link es requerido en metadata';
  END IF;

  INSERT INTO profiles (
    id, alias, email, city_id, publication_link, phone, is_active, account_status,
    must_change_password
  )
  VALUES (
    NEW.id, v_alias, NEW.email, v_city_id, v_publication_link, v_phone, false, 'pendiente',
    v_must_change_password
  );

  RETURN NEW;
END;
$$;

-- Extiende el guard de 00029: must_change_password solo lo puede limpiar
-- complete_forced_password_change() (vía bypass local de transacción),
-- nunca un UPDATE directo del propio usuario.
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_admin()
    OR auth.role() = 'service_role'
    OR current_setting('app.bypass_password_gate', true) = 'true'
  ) THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.account_status IS DISTINCT FROM OLD.account_status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password THEN
      RAISE EXCEPTION 'No tienes permisos para modificar estos campos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION complete_forced_password_change()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.bypass_password_gate', 'true', true);
  UPDATE profiles SET must_change_password = false WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION complete_forced_password_change() TO authenticated;

-- END FILE: supabase/migrations/00030_security_hardening_phone_login.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00031_resources_categorias.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00031_resources_categorias.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00032_resources_categorias_data.sql
-- ######################################################################

-- ============================================================
-- 00032_resources_categorias_data.sql
-- Migra datos existentes de 'hospedaje' a 'hoteles'.
-- Va en archivo separado de 00031 a propósito: Postgres no
-- permite usar un valor de enum agregado por ADD VALUE dentro
-- de la misma transacción en que se agregó.
-- Ejecutar DESPUÉS de 00031_resources_categorias.sql
-- ============================================================

UPDATE resources SET category = 'hoteles' WHERE category = 'hospedaje';

-- END FILE: supabase/migrations/00032_resources_categorias_data.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00033_resources_campos.sql
-- ######################################################################

-- ============================================================
-- 00033_resources_campos.sql
-- "Datos de todo": ubicación, redes sociales y contadores de
-- reseñas en resources; tablas resource_comments y resource_reviews.
-- ============================================================

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0;

CREATE TABLE resource_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resource_comment_content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_resource_comments_resource ON resource_comments (resource_id, created_at);

CREATE TABLE resource_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resource_id, author_id)
);

CREATE INDEX idx_resource_reviews_resource ON resource_reviews (resource_id);

-- END FILE: supabase/migrations/00033_resources_campos.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00034_rls_resources_datos_de_todo.sql
-- ######################################################################

-- ============================================================
-- 00034_rls_resources_datos_de_todo.sql
-- "Datos de todo": solo admin/moderator crean resources;
-- RLS para resource_comments y resource_reviews.
-- Ejecutar DESPUÉS de 00033_resources_campos.sql
-- ============================================================

-- Mirror de canAccessCommunity() en src/lib/account-access.ts
-- mantener sincronizados.
CREATE OR REPLACE FUNCTION has_community_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role IN ('moderator', 'admin')
        OR (
          account_status NOT IN ('bloqueada', 'rechazada')
          AND (account_status = 'aprobada' OR is_active)
        )
      )
  )
$$;

-- RESOURCES: solo staff crea, ya aprobado de inmediato
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own_pending" ON resources;

CREATE POLICY "resources_insert_staff"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (is_moderator_or_admin() AND status = 'aprobada');

-- RESOURCE_COMMENTS
ALTER TABLE resource_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_comments_select_authenticated"
  ON resource_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "resource_comments_insert_own"
  ON resource_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND has_community_access());

CREATE POLICY "resource_comments_delete_own_or_mod"
  ON resource_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- RESOURCE_REVIEWS
ALTER TABLE resource_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_reviews_select_authenticated"
  ON resource_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "resource_reviews_insert_own"
  ON resource_reviews FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND has_community_access());

CREATE POLICY "resource_reviews_update_own"
  ON resource_reviews FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "resource_reviews_delete_own_or_mod"
  ON resource_reviews FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_moderator_or_admin());

-- END FILE: supabase/migrations/00034_rls_resources_datos_de_todo.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00035_triggers_resources_datos_de_todo.sql
-- ######################################################################

-- ============================================================
-- 00035_triggers_resources_datos_de_todo.sql
-- Recalcula rating_avg/reviews_count en resources cuando cambian
-- sus resource_reviews. No es incremental (a diferencia de los
-- contadores de likes) porque un promedio no es aditivo al editar
-- o borrar una fila.
-- Ejecutar DESPUÉS de 00034_rls_resources_datos_de_todo.sql
-- ============================================================

CREATE OR REPLACE FUNCTION update_resource_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource_id UUID;
BEGIN
  v_resource_id := COALESCE(NEW.resource_id, OLD.resource_id);

  UPDATE resources
  SET
    rating_avg = (
      SELECT ROUND(AVG(rating), 1) FROM resource_reviews WHERE resource_id = v_resource_id
    ),
    reviews_count = (
      SELECT COUNT(*) FROM resource_reviews WHERE resource_id = v_resource_id
    )
  WHERE id = v_resource_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS resource_reviews_rating_trigger ON resource_reviews;

CREATE TRIGGER resource_reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON resource_reviews
  FOR EACH ROW EXECUTE FUNCTION update_resource_rating();

-- END FILE: supabase/migrations/00035_triggers_resources_datos_de_todo.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00036_habitaciones_escort.sql
-- ######################################################################

-- ============================================================
-- 00036_habitaciones_escort.sql
-- Campos específicos de habitaciones + fotos + visibilidad pública
-- Requiere: resources (00005), 00033 campos, categoría habitaciones_escort (00031)
-- ============================================================

-- Contacto / visibilidad / reglas
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS house_rules TEXT,
  ADD COLUMN IF NOT EXISTS recibe_mujer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibe_hombre BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_reserva BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_referencias BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_doc_identidad BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pide_link_publicacion BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acepta_parejas BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recibe_agencias BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_camaras_seguridad BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_wifi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_kit_primeros_auxilios BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiene_extintor BOOLEAN NOT NULL DEFAULT false;

-- Índice para listado público de habitaciones
CREATE INDEX IF NOT EXISTS idx_resources_public_habitaciones
  ON resources (created_at DESC)
  WHERE category = 'habitaciones_escort'
    AND is_public = true
    AND is_active = true
    AND status = 'aprobada';

-- Fotos de recursos (galería)
CREATE TABLE IF NOT EXISTS resource_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_photos_resource
  ON resource_photos (resource_id, sort_order);

-- END FILE: supabase/migrations/00036_habitaciones_escort.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00036b_rls_habitaciones_escort.sql
-- ######################################################################

-- ============================================================
-- 00036b_rls_habitaciones_escort.sql
-- RLS: lectura anon de habitaciones públicas; create habitaciones solo admin
-- Ejecutar DESPUÉS de 00036_habitaciones_escort.sql
-- ============================================================

-- Ciudades activas visibles para el listado público /home
DROP POLICY IF EXISTS "cities_select_public_active" ON cities;
CREATE POLICY "cities_select_public_active"
  ON cities FOR SELECT TO anon
  USING (is_active = true);

-- Habitaciones: solo admin puede INSERT con category habitaciones_escort
-- Otras categorías: moderator o admin (patrón 00034)
DROP POLICY IF EXISTS "resources_insert_staff" ON resources;

CREATE POLICY "resources_insert_staff"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (
    status = 'aprobada'
    AND (
      (category = 'habitaciones_escort' AND is_admin())
      OR (category <> 'habitaciones_escort' AND is_moderator_or_admin())
    )
  );

-- Lectura pública (anon + authenticated) de habitaciones marcadas is_public
DROP POLICY IF EXISTS "resources_select_public_habitaciones" ON resources;
CREATE POLICY "resources_select_public_habitaciones"
  ON resources FOR SELECT TO anon, authenticated
  USING (
    category = 'habitaciones_escort'
    AND is_public = true
    AND is_active = true
    AND status = 'aprobada'
  );

-- resource_photos RLS
ALTER TABLE resource_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resource_photos_select" ON resource_photos;
CREATE POLICY "resource_photos_select"
  ON resource_photos FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
        AND (
          (r.category = 'habitaciones_escort' AND r.is_public = true AND r.is_active AND r.status = 'aprobada')
          OR (auth.uid() IS NOT NULL AND r.status = 'aprobada' AND r.is_active)
          OR (auth.uid() IS NOT NULL AND (r.author_id = auth.uid() OR is_moderator_or_admin()))
        )
    )
  );

DROP POLICY IF EXISTS "resource_photos_insert_admin" ON resource_photos;
CREATE POLICY "resource_photos_insert_admin"
  ON resource_photos FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "resource_photos_update_admin" ON resource_photos;
CREATE POLICY "resource_photos_update_admin"
  ON resource_photos FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "resource_photos_delete_admin" ON resource_photos;
CREATE POLICY "resource_photos_delete_admin"
  ON resource_photos FOR DELETE TO authenticated
  USING (is_admin());

-- Habitaciones: moderadoras no editan; solo admin (resources_admin_verify ya cubre admin)
DROP POLICY IF EXISTS "resources_mod_review" ON resources;
CREATE POLICY "resources_mod_review"
  ON resources FOR UPDATE TO authenticated
  USING (is_moderator_or_admin() AND category <> 'habitaciones_escort')
  WITH CHECK (is_moderator_or_admin() AND category <> 'habitaciones_escort');

DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;
CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (
    (category = 'habitaciones_escort' AND is_admin())
    OR (category <> 'habitaciones_escort' AND (author_id = auth.uid() OR is_moderator_or_admin()))
  );

-- END FILE: supabase/migrations/00036b_rls_habitaciones_escort.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00036c_storage_resource_photos.sql
-- ######################################################################

-- ============================================================
-- 00036c_storage_resource_photos.sql
-- Bucket público para fotos de habitaciones / datos
-- Ejecutar DESPUÉS de 00036b
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-photos',
  'resource-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resource_photos_bucket_public_read" ON storage.objects;
CREATE POLICY "resource_photos_bucket_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'resource-photos');

DROP POLICY IF EXISTS "resource_photos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resource-photos' AND is_admin());

DROP POLICY IF EXISTS "resource_photos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin())
  WITH CHECK (bucket_id = 'resource-photos' AND is_admin());

DROP POLICY IF EXISTS "resource_photos_bucket_admin_delete" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin());

-- END FILE: supabase/migrations/00036c_storage_resource_photos.sql


-- ######################################################################
-- BEGIN FILE: supabase/migrations/00037_rls_hardening_chat_storage_reads.sql
-- ######################################################################

-- ============================================================
-- 00037_rls_hardening_chat_storage_reads.sql
-- Endurece RLS tras revisión:
-- 1) Chat: cierra INSERT abierto en conversations/participants
-- 2) Trigger: participants solo pueden actualizar last_read_at
-- 3) Lecturas de resources/comments/reviews con has_community_access
-- 4) Storage resource-photos: bucket privado, solo WebP, paths public|private
-- Requiere: 00014, 00017, 00019, 00034, 00036b, 00036c
-- ============================================================

-- ------------------------------------------------------------
-- 1) Chat: sin INSERT directo desde el cliente (solo RPC DEFINER)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conv_participants_insert" ON conversation_participants;

-- Solo actualizar last_read_at de la propia fila (el trigger bloquea otras columnas)
DROP POLICY IF EXISTS "conv_participants_update_own" ON conversation_participants;
CREATE POLICY "conv_participants_update_own"
  ON conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION prevent_conversation_participant_tamper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
    RAISE EXCEPTION 'No se pueden modificar conversation_id, user_id ni joined_at';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversation_participants_no_tamper ON conversation_participants;
CREATE TRIGGER conversation_participants_no_tamper
  BEFORE UPDATE ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION prevent_conversation_participant_tamper();

-- RPC: exigir acceso a comunidad
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id UUID;
  v_current UUID := auth.uid();
BEGIN
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT has_community_access() THEN
    RAISE EXCEPTION 'Tu cuenta no tiene acceso a la comunidad';
  END IF;

  IF p_other_user_id = v_current THEN
    RAISE EXCEPTION 'No puedes chatear contigo misma';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_other_user_id
      AND (
        role IN ('moderator', 'admin')
        OR (
          account_status NOT IN ('bloqueada', 'rechazada')
          AND (account_status = 'aprobada' OR is_active)
        )
      )
  ) THEN
    RAISE EXCEPTION 'La usuaria no está disponible para chat';
  END IF;

  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
    AND cp2.user_id = p_other_user_id
  WHERE cp1.user_id = v_current
    AND (
      SELECT count(*)::int
      FROM conversation_participants cp
      WHERE cp.conversation_id = cp1.conversation_id
    ) = 2
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_current), (v_conv_id, p_other_user_id);

  RETURN v_conv_id;
END;
$$;

-- ------------------------------------------------------------
-- 2) Lecturas internas: exige acceso a comunidad
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "resources_select_approved_or_own_or_mod" ON resources;
CREATE POLICY "resources_select_approved_or_own_or_mod"
  ON resources FOR SELECT TO authenticated
  USING (
    (has_community_access() AND status = 'aprobada' AND is_active = true)
    OR author_id = auth.uid()
    OR is_moderator_or_admin()
  );

DROP POLICY IF EXISTS "resource_photos_select" ON resource_photos;
CREATE POLICY "resource_photos_select"
  ON resource_photos FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
        AND (
          (r.category = 'habitaciones_escort' AND r.is_public = true AND r.is_active AND r.status = 'aprobada')
          OR (auth.uid() IS NOT NULL AND has_community_access() AND r.status = 'aprobada' AND r.is_active)
          OR (auth.uid() IS NOT NULL AND (r.author_id = auth.uid() OR is_moderator_or_admin()))
        )
    )
  );

DROP POLICY IF EXISTS "resource_comments_select_authenticated" ON resource_comments;
CREATE POLICY "resource_comments_select_authenticated"
  ON resource_comments FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

DROP POLICY IF EXISTS "resource_reviews_select_authenticated" ON resource_reviews;
CREATE POLICY "resource_reviews_select_authenticated"
  ON resource_reviews FOR SELECT TO authenticated
  USING (has_community_access() OR is_moderator_or_admin());

-- Delete resources: solo staff (quitita autor legacy)
DROP POLICY IF EXISTS "resources_delete_own_or_mod" ON resources;
CREATE POLICY "resources_delete_own_or_mod"
  ON resources FOR DELETE TO authenticated
  USING (
    (category = 'habitaciones_escort' AND is_admin())
    OR (category <> 'habitaciones_escort' AND is_moderator_or_admin())
  );

-- ------------------------------------------------------------
-- 3) Storage: privado + solo WebP + lectura por prefijo
-- Paths: public/{resourceId}/…  |  private/{resourceId}/…
-- ------------------------------------------------------------
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 3145728, -- 3 MB tras conversión WebP
  allowed_mime_types = ARRAY['image/webp']
WHERE id = 'resource-photos';

DROP POLICY IF EXISTS "resource_photos_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_anon_public_prefix" ON storage.objects;
DROP POLICY IF EXISTS "resource_photos_bucket_auth_read" ON storage.objects;

-- Anon: solo objetos bajo prefijo public/
CREATE POLICY "resource_photos_bucket_anon_public_prefix"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'resource-photos'
    AND (storage.foldername(name))[1] = 'public'
  );

-- Authenticated: public/ siempre; private/ si comunidad o admin
CREATE POLICY "resource_photos_bucket_auth_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-photos'
    AND (
      (storage.foldername(name))[1] = 'public'
      OR (
        (storage.foldername(name))[1] = 'private'
        AND (is_admin() OR has_community_access())
      )
    )
  );

-- INSERT path debe empezar por public/ o private/
DROP POLICY IF EXISTS "resource_photos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

DROP POLICY IF EXISTS "resource_photos_bucket_admin_update" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin())
  WITH CHECK (
    bucket_id = 'resource-photos'
    AND is_admin()
    AND (storage.foldername(name))[1] IN ('public', 'private')
  );

DROP POLICY IF EXISTS "resource_photos_bucket_admin_delete" ON storage.objects;
CREATE POLICY "resource_photos_bucket_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resource-photos' AND is_admin());

-- END FILE: supabase/migrations/00037_rls_hardening_chat_storage_reads.sql


-- ######################################################################
-- SEED ADMIN (ver también seed_admin.sql)
-- ######################################################################

-- ============================================================
-- seed_admin.sql — Solo crea/promueve el admin
-- Usar si el schema ya corrió y falló solo el seed.
-- email: carlosadmin@gmail.com  /  password: 123456
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email   TEXT := 'carlosadmin@gmail.com';
  v_pass    TEXT := extensions.crypt('123456', extensions.gen_salt('bf'));
  v_alias   TEXT := 'carlosadmin';
  v_phone   TEXT := '+56911111111';
  v_link    TEXT := 'https://comunidadescort.cl/admin';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(v_email)) THEN
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
    RAISE NOTICE 'Auth user % ya existe (id=%)', v_email, v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_pass,
      now(), '', '', '', '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('alias', v_alias, 'phone', v_phone, 'publication_link', v_link),
      now(), now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  ALTER TABLE public.profiles DISABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_ensure_staff_active;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
    SET
      role = 'admin',
      is_active = true,
      account_status = 'aprobada',
      must_change_password = false,
      rejection_reason = NULL,
      phone = COALESCE(phone, v_phone),
      publication_link = COALESCE(publication_link, v_link),
      alias = COALESCE(NULLIF(alias, ''), v_alias)
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.profiles (
      id, alias, email, phone, publication_link, city_id,
      role, is_active, account_status, must_change_password
    ) VALUES (
      v_user_id, v_alias, v_email, v_phone, v_link,
      (SELECT id FROM public.cities WHERE is_active = true ORDER BY name LIMIT 1),
      'admin', true, 'aprobada', false
    );
  END IF;

  ALTER TABLE public.profiles ENABLE TRIGGER before_profiles_update_guard;
  ALTER TABLE public.profiles ENABLE TRIGGER profiles_ensure_staff_active;

  RAISE NOTICE 'Admin listo: % (id=%)', v_email, v_user_id;
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      ALTER TABLE public.profiles ENABLE TRIGGER before_profiles_update_guard;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.profiles ENABLE TRIGGER profiles_ensure_staff_active;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RAISE;
END $$;

SELECT au.id, au.email, p.alias, p.role, p.is_active, p.account_status, p.phone
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email) = 'carlosadmin@gmail.com';

-- ######################################################################
-- BEGIN FILE: supabase/migrations/00038_seed_regiones_chile_completas.sql
-- ######################################################################

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

-- END FILE: supabase/migrations/00038_seed_regiones_chile_completas.sql
