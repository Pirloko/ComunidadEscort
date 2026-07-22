-- ============================================================
-- seed_forum_hilos.sql
-- Hilos iniciales del foro: temas relevantes, preguntas abiertas
-- para invitar a comentar. Se insertan en TODAS las ciudades activas.
--
-- Autor: primer perfil admin; si no hay, testuser / carlosadmin.
-- Idempotente: no duplica el mismo título en la misma ciudad.
--
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

DO $$
DECLARE
  v_author UUID;
  v_city   RECORD;
  v_title  TEXT;
  v_cat    post_category;
  v_body   TEXT;
  v_pin    BOOLEAN;
  v_i      INT;
BEGIN
  SELECT id INTO v_author
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  IF v_author IS NULL THEN
    SELECT id INTO v_author FROM profiles WHERE alias IN ('carlosadmin', 'testuser') LIMIT 1;
  END IF;

  IF v_author IS NULL THEN
    RAISE EXCEPTION 'No hay autor (admin/testuser). Ejecuta seed_admin.sql o seed_test_user.sql primero.';
  END IF;

  -- Lista de hilos: (categoría, fijado, título, contenido)
  -- Usamos un array temporal vía filas en un loop con VALUES.

  FOR v_city IN
    SELECT id, name FROM cities WHERE is_active = true ORDER BY name
  LOOP
    FOR v_i IN 1..35 LOOP
      CASE v_i
        -- —— BIENVENIDA / EXPERIENCIAS ——
        WHEN 1 THEN
          v_cat := 'conversaciones_generales'; v_pin := true;
          v_title := 'Bienvenida a la comunidad — presenta tu ciudad y cómo te cuidas';
          v_body :=
            'Hola compañeras 💜 Este es un espacio privado para compartir con respeto y sin juicios.' || E'\n\n' ||
            'Para romper el hielo: ¿en qué ciudad estás trabajando ahora y qué tip de seguridad nunca dejas de lado?' || E'\n\n' ||
            'Cuéntanos sin datos personales sensibles (nada de dirección exacta ni documentos). ' ||
            'Mientras más experiencias sumemos, más protegidas estamos todas.';
        WHEN 2 THEN
          v_cat := 'conversaciones_generales'; v_pin := false;
          v_title := '¿Qué aprendiste en tus primeros meses que ojalá te hubieran contado antes?';
          v_body :=
            'Las que llevan más tiempo: ¿qué consejo le darías a alguien que recién empieza?' || E'\n\n' ||
            'Puede ser de límites, plata, clientes, salud, redes o mentalidad. ' ||
            'Una idea clara y concreta ayuda más que un discurso largo. ¿Cuál es la tuya?';

        -- —— SEGURIDAD ——
        WHEN 3 THEN
          v_cat := 'seguridad'; v_pin := true;
          v_title := 'Checklist de seguridad antes de atender (compártela y mejora la lista)';
          v_body :=
            'Propongo una lista base. Completen lo que falte según su realidad:' || E'\n\n' ||
            '1) Verificar número / historial en Reportes de clientes' || E'\n' ||
            '2) Avisar a una amiga de confianza (hora y zona aproximada)' || E'\n' ||
            '3) Depositar o acordar condiciones ANTES' || E'\n' ||
            '4) No compartir ubicación exacta por adelantado' || E'\n' ||
            '5) Tener un plan de salida / código de emergencia' || E'\n\n' ||
            '¿Qué agregas tú? ¿Qué señal te hace cancelar de inmediato?';
        WHEN 4 THEN
          v_cat := 'seguridad'; v_pin := false;
          v_title := 'Señales de alerta en mensajes: ¿cuáles te hicieron cortar de una?';
          v_body :=
            'A veces el peligro se ve en el chat: presión, no querer pagar anticipo, ' ||
            'preguntas invasivas, tono agresivo, insistir en sin protección, etc.' || E'\n\n' ||
            '¿Qué red flags te funcionan como filtro? Cuéntalo para que otras lo detecten más rápido.';
        WHEN 5 THEN
          v_cat := 'seguridad'; v_pin := false;
          v_title := 'Cómo manejar un cliente que se pone agresivo o no respeta límites';
          v_body :=
            'Sin dramatizar ni dar datos identificables: ¿qué te sirvió para salir de una situación tensa?' || E'\n\n' ||
            'Técnicas de desescalada, cuándo cortar, cuándo pedir ayuda, qué NO hacer. ' ||
            'Tu experiencia puede evitarle un susto a otra compañera.';
        WHEN 6 THEN
          v_cat := 'seguridad'; v_pin := false;
          v_title := '¿Usas código con una amiga? ¿Cómo lo organizan en la práctica?';
          v_body :=
            'Muchas trabajan con una “persona de confianza” que sabe cuándo terminas.' || E'\n\n' ||
            '¿Qué código usan? ¿Cada cuánto avisan? ¿Apps, llamada o WhatsApp? ' ||
            'Ideas prácticas (sin números personales) son bienvenidas.';

        -- —— CONSEJOS ——
        WHEN 7 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Límites claros: cómo los comunicas sin pelear ni perder clientes buenos';
          v_body :=
            'Decir “no” también es profesional. ¿Cómo explicas tus límites (tiempo, servicios, protección) ' ||
            'de forma firme y calmada?' || E'\n\n' ||
            'Frases que te funcionaron, errores que cometiste al principio, lo que ya no negocias. ¡Comparte!';
        WHEN 8 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Fotos y publicación: tips para atraer sin exponer de más';
          v_body :=
            '¿Qué te ha funcionado en fotos/textos de publicación sin mostrar cara o datos de más?' || E'\n\n' ||
            'Iluminación, ángulos, copy, plataformas, lo que evita problemas. ' ||
            'Ojo: no peguen links personales si no quieren; hablen de criterios generales.';
        WHEN 9 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Cómo organizar tu agenda sin quemarte (turnos, descansos, “días off”)';
          v_body :=
            'El burnout es real. ¿Cómo decides cuántos turnos tomar? ¿Bloqueas días libres?' || E'\n\n' ||
            'Tips de calendario, precios en feriados, cuándo subir tarifa, cuándo parar. ' ||
            '¿Qué hábito te salvó la energía?';
        WHEN 10 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Dinero: anticipos, transferencia y cómo evitar que te “vengan con cuentos”';
          v_body :=
            'Hablemos de plata con claridad (sin doxxear a nadie).' || E'\n\n' ||
            '¿Pides anticipo siempre? ¿Cuánto? ¿Qué método te da más tranquilidad? ' ||
            '¿Qué excusa de pago ya no aceptas? Ayuda a las que están armando su sistema.';
        WHEN 11 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Primer contacto por WhatsApp: plantilla que filtra y suena profesional';
          v_body :=
            'Si tuvieras que escribir un mensaje tipo (editable) para el primer contacto, ¿cómo sería?' || E'\n\n' ||
            'Incluyan: saludo, condiciones, protección, anticipo, zona general. ' ||
            'Copien, adapten y comenten qué les funciona en su ciudad.';

        -- —— SALUD ——
        WHEN 12 THEN
          v_cat := 'salud'; v_pin := true;
          v_title := 'Protección y salud sexual: rutinas que sí mantienen (sin vergüenza)';
          v_body :=
            'Cuidarnos es parte del trabajo. ¿Cada cuánto te haces controles? ' ||
            '¿Qué rutina de protección e higiene te funciona en el día a día?' || E'\n\n' ||
            'Recomendaciones de hábitos (no diagnósticos médicos). Si conocen lugares amigables ' ||
            'en su ciudad, pueden mencionar comuna/zona sin doxxear.';
        WHEN 13 THEN
          v_cat := 'salud'; v_pin := false;
          v_title := '¿Qué haces si un cliente insiste en “sin condón”?';
          v_body :=
            'Es una de las situaciones más comunes y peligrosas.' || E'\n\n' ||
            '¿Cómo cortas esa conversación? ¿Lo reportas en funas? ¿Lo bloqueas de una? ' ||
            'Comparte frases firmes que te hayan funcionado.';
        WHEN 14 THEN
          v_cat := 'salud'; v_pin := false;
          v_title := 'Dolor, cansancio e higiene íntima: cuidados básicos entre turnos';
          v_body :=
            'Entre cliente y cliente, ¿qué te ayuda a recuperarte? Hidratación, pausas, ' ||
            'productos que te funcionan (marcas genéricas), señales de “hoy paro”.' || E'\n\n' ||
            'Esto no reemplaza a un/a profesional de salud, pero sí suma hábitos colectivos.';
        WHEN 15 THEN
          v_cat := 'salud'; v_pin := false;
          v_title := 'Salud mental: ¿cómo lidias con la ansiedad después de un mal servicio?';
          v_body :=
            'A veces el cuerpo termina el turno y la cabeza sigue.' || E'\n\n' ||
            '¿Qué te calma? ¿Hablas con alguien? ¿Escribes? ¿Paras unos días? ' ||
            'Espacio sin juicios para lo que realmente les pasa.';

        -- —— BIENESTAR ——
        WHEN 16 THEN
          v_cat := 'bienestar'; v_pin := false;
          v_title := 'Rutinas de autocuidado que sí caben en una semana ajetreada';
          v_body :=
            'No hace falta un spa: puede ser dormir bien, comer, caminar, desconectar el celular.' || E'\n\n' ||
            '¿Cuál es tu ritual mínimo no negociable? ¿Mañana o noche? Cuéntalo en 3–5 líneas.';
        WHEN 17 THEN
          v_cat := 'bienestar'; v_pin := false;
          v_title := 'Cómo separar “modo trabajo” de tu vida personal (sin culpa)';
          v_body :=
            'Límites también con uno misma: ¿apagas el chip laboral? ¿Usas otro celular? ' ||
            '¿Horarios duros de “no contesto”?' || E'\n\n' ||
            'Tips reales para no vivir 24/7 en modo alerta.';
        WHEN 18 THEN
          v_cat := 'bienestar'; v_pin := false;
          v_title := 'Comunidad y soledad: ¿cómo hacen amistad real entre compañeras?';
          v_body :=
            'Esta app existe para apoyo mutuo. ¿Cómo conocieron a alguien de confianza? ' ||
            '¿Qué les da seguridad para abrirse?' || E'\n\n' ||
            'Ideas para crear redes sanas (sin exponer datos privados en público).';
        WHEN 19 THEN
          v_cat := 'bienestar'; v_pin := false;
          v_title := 'Días difíciles: qué te levanta el ánimo sin gastar de más';
          v_body :=
            'Playlist, serie, comida, baile en la pieza, llamada a una amiga…' || E'\n\n' ||
            '¿Tu antídoto barato contra un día malo? Dejen ideas para cuando otra lo necesite.';

        -- —— TRANSPORTE ——
        WHEN 20 THEN
          v_cat := 'transporte'; v_pin := false;
          v_title := '¿Uber, taxi o traslado propio? Pros y contras para salir segura';
          v_body :=
            'En su ciudad: ¿qué les da más tranquilidad para llegar y volver?' || E'\n\n' ||
            'Tips de horario, compartir viaje (sin dirección exacta), cuándo preferir no moverse. ' ||
            'Si recomiendan apps o prácticas, digan el “por qué”.';
        WHEN 21 THEN
          v_cat := 'transporte'; v_pin := false;
          v_title := 'Traslados de madrugada: ¿cómo se organizan para no ir solas sin plan?';
          v_body :=
            'La madrugada cambia todo. ¿Acompañamiento virtual, códigos, puntos de encuentro públicos?' || E'\n\n' ||
            'Compartan protocolos simples que otra pueda copiar esta misma noche.';
        WHEN 22 THEN
          v_cat := 'transporte'; v_pin := false;
          v_title := 'Clientes que ofrecen “yo te paso a buscar”: ¿sí, no, o solo con condiciones?';
          v_body :=
            'Es un clásico. ¿Lo aceptan? ¿Qué condiciones ponen? ¿Cuándo es red flag?' || E'\n\n' ||
            'Experiencias (anonimizadas) para decidir mejor la próxima vez.';

        -- —— RECURSOS ÚTILES ——
        WHEN 23 THEN
          v_cat := 'recursos_utiles'; v_pin := true;
          v_title := 'Mapa de recursos: datos útiles de tu ciudad (farmacia, caja, ayuda)';
          v_body :=
            'Usemos este hilo como directorio vivo (sin doxxear viviendas).' || E'\n\n' ||
            'Pueden mencionar: farmacias 24h de confianza, cajas de compensación, ' ||
            'orientación jurídica/salud amigable, apps útiles, números de emergencia públicos.' || E'\n\n' ||
            'Formato sugerido: Ciudad / tipo de recurso / por qué sirve.';
        WHEN 24 THEN
          v_cat := 'recursos_utiles'; v_pin := false;
          v_title := 'Apps y herramientas que usan para organizarse (agenda, finanzas, seguridad)';
          v_body :=
            '¿Agenda en el celular? ¿Excel? ¿Apps de contraseñas? ¿Notas de clientes problemáticos ' ||
            '(sin datos sensibles en el foro)?' || E'\n\n' ||
            'Recomienden herramientas y el uso concreto que les dan.';
        WHEN 25 THEN
          v_cat := 'recursos_utiles'; v_pin := false;
          v_title := '¿Dónde se informan de leyes, derechos o apoyo en Chile?';
          v_body :=
            'Si conocen organizaciones, guías o canales serios de información ' ||
            '(derechos laborales/sexuales, orientación), compartan el nombre y por qué confían.' || E'\n\n' ||
            'Eviten links dudosos. Mejor calidad que cantidad.';
        WHEN 26 THEN
          v_cat := 'recursos_utiles'; v_pin := false;
          v_title := 'Casas y habitaciones: qué preguntar antes de quedarte o recomendar';
          v_body :=
            'Si usan el directorio de casas de la app o conocen hospedajes: ' ||
            '¿qué preguntas hacen sí o sí? (reglas, seguridad, ruido, dueña, fotos reales…)' || E'\n\n' ||
            'Armen juntas un checklist para reseñas honestas.';

        -- —— MÁS EXPERIENCIAS / APERTURA ——
        WHEN 27 THEN
          v_cat := 'conversaciones_generales'; v_pin := false;
          v_title := 'Historias de “casi me pasa”: aprendizajes sin morbo';
          v_body :=
            'Espacio para contar situaciones límite (anonimizadas) y qué harían distinto hoy.' || E'\n\n' ||
            'El objetivo no es asustar: es aprender en comunidad. ¿Te animas a contar una?';
        WHEN 28 THEN
          v_cat := 'conversaciones_generales'; v_pin := false;
          v_title := 'Clientes respetuosos: ¿qué comportamientos valoran y cómo los incentivan?';
          v_body :=
            'También sirve hablar de lo bueno. ¿Qué hace que alguien sea un buen cliente?' || E'\n\n' ||
            '¿Cómo premian eso (prioridad, mejor trato, recomendación)? Ideas para elevar el estándar.';
        WHEN 29 THEN
          v_cat := 'seguridad'; v_pin := false;
          v_title := 'Funas y recomendaciones de clientes: ¿cómo las usan antes de atender?';
          v_body :=
            'En esta comunidad pueden buscar por celular en Reportes de clientes.' || E'\n\n' ||
            '¿Lo revisan siempre? ¿Qué les hace decidir “no”? ¿Qué info les falta en las funas? ' ||
            'Feedback para mejorar el apoyo mutuo.';
        WHEN 30 THEN
          v_cat := 'consejos'; v_pin := false;
          v_title := 'Precios: ¿cómo los suben sin miedo y qué dicen cuando el cliente reclama?';
          v_body :=
            'Hablar de tarifas sin competencia tóxica: criterios (ciudad, horario, experiencia), ' ||
            'cómo comunican un alza, qué respuestas dan ante “está muy caro”.' || E'\n\n' ||
            '¿Cuándo fue la última vez que subiste y qué pasó?';
        WHEN 31 THEN
          v_cat := 'salud'; v_pin := false;
          v_title := 'Vacaciones / pausas: cómo parar unos días sin que se caiga todo';
          v_body :=
            'Parar también es salud. ¿Avisan en la publicación? ¿Bajan el chip? ' ||
            '¿Cuánto tiempo mínimo les sirve para recargar?' || E'\n\n' ||
            'Tips para volver sin saturarse la primera semana.';
        WHEN 32 THEN
          v_cat := 'bienestar'; v_pin := false;
          v_title := 'Autoestima y mirada externa: cómo cuidan su cabeza con las redes';
          v_body :=
            'Compararse con otras publicaciones puede doler. ¿Qué límites ponen con Instagram/u otras redes?' || E'\n\n' ||
            '¿Mutear, horarios, enfocarse en su propio ritmo? Compartan lo que les dio paz.';
        WHEN 33 THEN
          v_cat := 'transporte'; v_pin := false;
          v_title := 'Zonas y traslados en ' || v_city.name || ': tips locales de llegada/salida';
          v_body :=
            'Hilo local de ' || v_city.name || '.' || E'\n\n' ||
            'Sin direcciones exactas: ¿qué zonas les parecen más cómodas para encontrarse en lugar público? ' ||
            '¿Horarios a evitar? ¿Tips de locomoción o apps que funcionan mejor acá?' || E'\n\n' ||
            'Si no conocen bien la ciudad, pregunten: ¿alguien puede orientar a una compañera nueva?';
        WHEN 34 THEN
          v_cat := 'recursos_utiles'; v_pin := false;
          v_title := 'Glosario rápido: palabras y acuerdos que usan entre compañeras';
          v_body :=
            'A veces no hablamos el mismo “idioma” (códigos, abreviaturas, formas de pedir ayuda).' || E'\n\n' ||
            'Propongan términos útiles y su significado para que las nuevas no se sientan perdidas.';
        WHEN 35 THEN
          v_cat := 'conversaciones_generales'; v_pin := false;
          v_title := 'Pregunta abierta de la semana: ¿qué necesitas más de esta comunidad ahora?';
          v_body :=
            'Seguridad, contención, tips de plata, salud, casas, funas, solo charlar…' || E'\n\n' ||
            'Comenten con honestidad. Sus respuestas ayudan a priorizar lo que construimos juntas.';
        ELSE
          CONTINUE;
      END CASE;

      IF EXISTS (
        SELECT 1 FROM posts p
        WHERE p.city_id = v_city.id
          AND p.title = v_title
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO posts (author_id, city_id, category, title, content, is_pinned)
      VALUES (v_author, v_city.id, v_cat, v_title, v_body, v_pin);
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Hilos del foro insertados (idempotente) para ciudades activas. Autor=%', v_author;
END $$;
