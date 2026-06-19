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
