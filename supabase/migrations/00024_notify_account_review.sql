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
