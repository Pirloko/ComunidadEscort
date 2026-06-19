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
