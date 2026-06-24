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
