-- ============================================================
-- 00061_home_banners_contact_links.sql
-- Contactos opcionales del banner: Instagram y WhatsApp.
-- Al pulsar el banner se despliegan los botones que existan.
-- Depende de: home_banners (00054)
-- ============================================================

ALTER TABLE home_banners
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

ALTER TABLE home_banners
  DROP CONSTRAINT IF EXISTS home_banners_instagram_url_http;
ALTER TABLE home_banners
  ADD CONSTRAINT home_banners_instagram_url_http
  CHECK (instagram_url IS NULL OR instagram_url ~ '^https?://');

ALTER TABLE home_banners
  DROP CONSTRAINT IF EXISTS home_banners_whatsapp_phone_fmt;
ALTER TABLE home_banners
  ADD CONSTRAINT home_banners_whatsapp_phone_fmt
  CHECK (whatsapp_phone IS NULL OR whatsapp_phone ~ '^\+569\d{8}$');

COMMENT ON COLUMN home_banners.instagram_url IS
  'Perfil Instagram al pulsar el banner. NULL = sin botón.';
COMMENT ON COLUMN home_banners.whatsapp_phone IS
  'Celular WhatsApp (+569XXXXXXXX). NULL = sin botón.';
