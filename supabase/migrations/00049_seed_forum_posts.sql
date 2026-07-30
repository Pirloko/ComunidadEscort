-- ============================================================
-- 00049_seed_forum_posts.sql
-- Contenido inicial del foro tras pérdida de posts (CASCADE al borrar admin).
-- Usa el primer perfil admin/aprobado disponible. Idempotente vía título marcador.
-- ============================================================

DO $$
DECLARE
  v_author UUID;
  v_city_pm UUID;
  v_city_stgo UUID;
  v_city_conce UUID;
  v_city_valdivia UUID;
  v_city_temuco UUID;
BEGIN
  SELECT id INTO v_author
  FROM profiles
  WHERE role IN ('admin', 'moderator')
     OR account_status = 'aprobada'
  ORDER BY
    CASE role WHEN 'admin' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END,
    created_at ASC
  LIMIT 1;

  IF v_author IS NULL THEN
    RAISE NOTICE '00049: no hay perfil aprobado/admin — omitiendo seed del foro';
    RETURN;
  END IF;

  -- Si ya corrimos este seed, no duplicar
  IF EXISTS (
    SELECT 1 FROM posts WHERE title = '[Bienvenida] Cómo usar el foro de la comunidad'
  ) THEN
    RAISE NOTICE '00049: seed del foro ya aplicado — omitiendo';
    RETURN;
  END IF;

  SELECT id INTO v_city_pm FROM cities WHERE slug = 'puerto-montt' LIMIT 1;
  SELECT id INTO v_city_stgo FROM cities WHERE slug = 'santiago' LIMIT 1;
  SELECT id INTO v_city_conce FROM cities WHERE slug = 'concepcion' LIMIT 1;
  SELECT id INTO v_city_valdivia FROM cities WHERE slug = 'valdivia' LIMIT 1;
  SELECT id INTO v_city_temuco FROM cities WHERE slug = 'temuco' LIMIT 1;

  -- Fallback: primera ciudad activa
  IF v_city_pm IS NULL THEN
    SELECT id INTO v_city_pm FROM cities WHERE is_active = true ORDER BY name LIMIT 1;
  END IF;
  IF v_city_stgo IS NULL THEN v_city_stgo := v_city_pm; END IF;
  IF v_city_conce IS NULL THEN v_city_conce := v_city_pm; END IF;
  IF v_city_valdivia IS NULL THEN v_city_valdivia := v_city_pm; END IF;
  IF v_city_temuco IS NULL THEN v_city_temuco := v_city_pm; END IF;

  IF v_city_pm IS NULL THEN
    RAISE NOTICE '00049: no hay ciudades — omitiendo seed del foro';
    RETURN;
  END IF;

  INSERT INTO posts (author_id, city_id, category, title, content, is_pinned, is_locked) VALUES
  (
    v_author,
    v_city_pm,
    'conversaciones_generales',
    '[Bienvenida] Cómo usar el foro de la comunidad',
    E'Saludos 💜\n\nEste foro es un espacio privado entre colegas: seguridad, consejos, salud, bienestar y recursos útiles.\n\nReglas rápidas:\n• Respeta el anonimato y no compartas datos personales de otras.\n• No publiques spam ni links dudosos.\n• Si ves algo grave, usa alertas / reportes.\n\nPuedes filtrar por categoría a la izquierda y crear publicaciones con “Nueva publicación”.\n\nBienvenida a Comunidadescort.cl.',
    true,
    false
  ),
  (
    v_author,
    v_city_pm,
    'seguridad',
    'Checklist antes de aceptar un cliente nuevo',
    E'Antes de confirmar:\n1. Busca el número en Reportes de clientes.\n2. Pide referencias a colegas de confianza.\n3. Acuerda lugar, horario y forma de pago por escrito (WhatsApp).\n4. Avisa a alguien de confianza dónde estarás.\n5. Si algo no cuadra, cancela sin culpa.\n\n¿Qué otra pregunta hacen ustedes siempre?',
    false,
    false
  ),
  (
    v_author,
    v_city_pm,
    'consejos',
    'Tips para arrendar habitación o pieza en otra ciudad',
    E'Si viajas a trabajar:\n• Pide fotos actuales y reglas de la casa por escrito.\n• Pregunta quiénes reciben (mujer / trans / hombre) y si pide reserva.\n• Revisa reseñas en Casas y habitaciones de la comunidad.\n• Llega con plan B de hospedaje por si el lugar no cumple.\n• Cobra al día y deja la pieza como la encontraste.\n\n¿Alguien recomienda casas buenas en Puerto Montt?',
    false,
    false
  ),
  (
    v_author,
    v_city_stgo,
    'salud',
    'Recordatorio: controles y autocuidado',
    E'No es sermón: es cuidado entre nosotras.\n\n• Agenda controles periódicos.\n• Usa protección y ten stock de lo básico.\n• Si estás enferma o con mucho estrés, pausa: tu cuerpo también es tu herramienta de trabajo.\n• Si conoces centros o profesionales respetuosos en tu ciudad, comparte (sin doxxear).\n\nCuídate 💚',
    false,
    false
  ),
  (
    v_author,
    v_city_stgo,
    'bienestar',
    'Cómo desconectar después de una mala semana',
    E'Dejo ideas que a mí me funcionan:\n• Apagar el celular un rato (aunque sea 1 hora).\n• Comer algo rico sin culpa.\n• Hablar con una colega que entienda el rubro.\n• Dormir, aunque sea una siesta corta.\n\n¿Qué hacen ustedes para bajar la ansiedad después de un día pesado?',
    false,
    false
  ),
  (
    v_author,
    v_city_conce,
    'transporte',
    'Movilización segura de noche — Concepción',
    E'Consejo general:\n• Prefiere apps con historial y compartir viaje.\n• Evita bajar en puntos muy solos si no conoces la zona.\n• Guarda el número de un taxi/colectivo de confianza.\n\nSi conocen conductores o apps que les han resultado bien en Concepción, comenten (sin datos sensibles de clientes).',
    false,
    false
  ),
  (
    v_author,
    v_city_valdivia,
    'recursos_utiles',
    'Datos útiles: farmacia, delivery y piezas en Valdivia',
    E'Si llegan a Valdivia:\n• Revisen “Datos de todo” filtrado por la ciudad.\n• En Casas y habitaciones pueden ver quién recibe y si pide reserva.\n• Si conocen un delivery o farmacia de turno que atiende bien a la madrugada, sumen el dato (moderación/admin puede publicarlo).\n\n¿Qué les falta ver en el directorio?',
    false,
    false
  ),
  (
    v_author,
    v_city_temuco,
    'seguridad',
    'Señales de alerta con clientes o intermediarios',
    E'Red flags frecuentes:\n• Presión para bajar el precio “ya” o adelantar plata a terceros.\n• Pedir fotos/videos íntimos “para verificar”.\n• Cambiar el lugar a último minuto a un sitio desconocido.\n• Negarse a hablar por un canal donde quede registro.\n\nSi les pasó algo así (sin doxxear), cuenten cómo lo resolvieron para que otras aprendan.',
    false,
    false
  ),
  (
    v_author,
    v_city_pm,
    'conversaciones_generales',
    'Presentaciones: ¿quién trabaja o visita Puerto Montt?',
    E'Hilo libre para presentarse (sin datos personales sensibles):\n• ¿Eres de acá o vienes de visita?\n• ¿Qué tip le darías a alguien que llega por primera vez?\n\nRespeto ante todo. Si prefieres solo leer, también está bien 💜',
    false,
    false
  ),
  (
    v_author,
    v_city_stgo,
    'consejos',
    'Organizar la semana: agenda, descanso y plata',
    E'Tips prácticos:\n• Bloquea al menos un día de descanso real.\n• Separa un % para imprevistos (taxi, pieza, salud).\n• Anota deudas/pagos pendientes para no mezclar todo en la cabeza.\n• Si trabajas con casa, aclara reglas el día 1.\n\n¿Usan alguna app o método simple para organizarse?',
    false,
    false
  );

  RAISE NOTICE '00049: seed del foro insertado (autor %)', v_author;
END $$;
