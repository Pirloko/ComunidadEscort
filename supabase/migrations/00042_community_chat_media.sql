-- ============================================================
-- 00042_community_chat_media.sql
-- Emoticones, stickers y GIFs en el chat de comunidad.
-- Requiere: 00041_community_chat.sql
-- ============================================================

ALTER TABLE community_messages
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE community_messages
  DROP CONSTRAINT IF EXISTS community_messages_kind_check;

ALTER TABLE community_messages
  ADD CONSTRAINT community_messages_kind_check
  CHECK (kind IN ('text', 'gif', 'sticker'));

-- content: texto/emoji; en gif puede ir vacío (el media_url lleva la imagen)
ALTER TABLE community_messages
  DROP CONSTRAINT IF EXISTS community_messages_content_check;

ALTER TABLE community_messages
  ADD CONSTRAINT community_messages_content_check
  CHECK (
    (
      kind = 'text'
      AND char_length(trim(content)) BETWEEN 1 AND 2000
      AND media_url IS NULL
    )
    OR (
      kind = 'sticker'
      AND char_length(trim(content)) BETWEEN 1 AND 32
      AND media_url IS NULL
    )
    OR (
      kind = 'gif'
      AND media_url IS NOT NULL
      AND char_length(media_url) BETWEEN 12 AND 2000
      AND char_length(content) <= 200
    )
  );
