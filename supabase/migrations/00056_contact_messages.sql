-- 00056_contact_messages.sql
-- Formulario «Contáctanos» del home → bandeja admin.
-- Depende de: is_admin() (00009)

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT contact_messages_name_len
    CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT contact_messages_subject_len
    CHECK (char_length(trim(subject)) >= 3),
  CONSTRAINT contact_messages_message_len
    CHECK (char_length(trim(message)) >= 10)
);

CREATE INDEX IF NOT EXISTS contact_messages_created_idx
  ON contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_unread_idx
  ON contact_messages (is_read, created_at DESC)
  WHERE is_read = false;

COMMENT ON TABLE contact_messages IS
  'Mensajes del formulario público Contáctanos en /home.';

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert_anon" ON contact_messages;
CREATE POLICY "contact_messages_insert_anon"
  ON contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_admin_select" ON contact_messages;
CREATE POLICY "contact_messages_admin_select"
  ON contact_messages FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "contact_messages_admin_update" ON contact_messages;
CREATE POLICY "contact_messages_admin_update"
  ON contact_messages FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "contact_messages_admin_delete" ON contact_messages;
CREATE POLICY "contact_messages_admin_delete"
  ON contact_messages FOR DELETE TO authenticated
  USING (is_admin());

GRANT INSERT ON contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON contact_messages TO authenticated;
