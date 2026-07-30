-- ============================================================
-- 00047_protect_resources_on_author_delete.sql
-- Evita que borrar un usuario (admin) borre sus casas/recursos
-- Requiere: 00005_resources.sql
--
-- Antes: resources.author_id ON DELETE CASCADE
-- Ahora:  resources.author_id ON DELETE RESTRICT
--         (hay que reasignar o borrar casas primero)
-- ============================================================

DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'resources'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%author_id%REFERENCES%profiles%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.resources DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE RESTRICT;
