# CLAUDE.md

Guía de contexto para Claude Code al trabajar en este repositorio. **Responde siempre en español** al usuario, salvo que pida otro idioma.

---

## Resumen del proyecto

**Comunidadescort.cl** — PWA privada (React 19 + TypeScript + Vite) para seguridad, apoyo mutuo y bienestar, con alcance por ciudad en Chile. Backend: **Supabase** (Postgres + Auth + Realtime + Storage), accedido directamente desde el cliente con `@supabase/supabase-js`. **No hay API server propio** salvo Edge Functions puntuales para operaciones privilegiadas (ver `supabase/functions/`).

- Textos de UI, mensajes de validación y valores de enums de dominio: **español**.
- Acceso gated: registro → cuenta `pendiente` → revisión admin → acceso a la comunidad.
- Registro exige `publication_link` (URL de publicación externa) y `phone` (celular chileno normalizado) para verificación de identidad. `city_id` es **opcional** en el registro — se asigna después desde el perfil.
- Login acepta **email o celular** (`+569XXXXXXXX`) indistintamente.
- Admin puede **crear cuentas manualmente** (ya aprobadas) vía Edge Function, con contraseña temporal de un solo uso y cambio obligatorio en el primer login.

---

## Reglas de trabajo

### Comunicación
- Explicaciones, resúmenes y mensajes al usuario: **español**.
- Commits y PRs: mensajes claros en español o inglés técnico, según contexto del repo.

### Alcance y calidad de código
- **Cambios mínimos**: resolver solo lo pedido; no refactorizar ni “mejorar” código no relacionado.
- **No over-engineering**: sin abstracciones prematuras, helpers de una línea ni manejo de errores para casos imposibles.
- **Seguir convenciones existentes**: leer el código circundante antes de escribir; imitar naming, patrones de services, guards, schemas y estilo UI.
- **Comentarios**: solo para lógica de negocio no obvia; el código debe ser mayormente autoexplicativo.
- **Tests**: no hay unit test runner (sin Jest/Vitest) — no asumir `npm test`. Sí hay E2E con Playwright (`npm run test:e2e`, ver sección "Testing E2E"); no añadir specs nuevos salvo que se pidan explícitamente.

### Git y despliegue
- **No commitear** salvo petición explícita del usuario.
- **No pushear** al remoto salvo petición explícita.
- **No incluir secretos** en commits (`.env`, keys reales). Usar `.env.example` como referencia de variables.

### Capas y acceso a datos
- **Solo `src/services/*.service.ts`** importa `supabase` para acceso a datos. Componentes y hooks llaman services, no el client directamente.
- **Gating de cuenta**: usar siempre `canAccessCommunity()` / `isAccountPending()` de `src/lib/account-access.ts` — nunca checks ad hoc de `is_active` o `account_status` sueltos.
- **Mutaciones Supabase**: `{ error }` → `throw error` inmediato; el caller (React Query / form) maneja el catch.
- **React Query** para fetching/caching; services como `queryFn` / `mutationFn`.
- **Selects explícitos** con relaciones nombradas (`author:profiles!author_id(...)`) — evitar `select('*')`.
- **Operaciones atómicas**: preferir RPC + migración sobre lógica multi-paso en cliente.
- **Realtime**: suscribir con `supabase.channel(...).on('postgres_changes', ...)` y limpiar con `supabase.removeChannel(channel)` en unmount.

### Migraciones y tipos
- Al cambiar schema: **nueva migración** (no editar migraciones ya aplicadas) + **actualizar tipos** en `src/types/` manualmente (`database.ts` y archivos por feature).
- Convención de migraciones: schema/tabla → RLS separado → triggers/functions separado, con sufijo de fase cuando aplique (`00013c_triggers_fase5_resources.sql`).
- Numeración: secuencial con sufijos alfabéticos para fases (`00009c`, `00013a`…). **No reutilizar `00009b_rls_fases_3_7.sql`** (obsoleto).

### UI y validación
- Formularios: `zod` en `features/<dominio>/schemas/` + `react-hook-form` + `@hookform/resolvers`.
- Mensajes de validación: español, tono consistente con los existentes.
- Estilos: Tailwind v4 vía `@tailwindcss/vite`; tokens en `src/styles/globals.css`; dark mode por clase (`ThemeProvider`).
- Imports: alias `@/*` → `src/*`.

---

## Qué NO tocar

| Área | Motivo |
|------|--------|
| `dist/` | Build generado por Vite; se regenera con `npm run build` |
| Migraciones ya aplicadas en Supabase prod | Crear nueva migración incremental; nunca reescribir historial |
| `00009b_rls_fases_3_7.sql` | Obsoleto; usar archivos por fase (`00009c`–`00009h`) |
| `00023_fix_admin_carlos.sql` | Fix one-off de admin; no re-ejecutar en prod salvo diagnóstico |
| `node_modules/` | Dependencias gestionadas por npm |
| `.env` con credenciales reales | No commitear; solo `.env.example` como plantilla |
| Lógica de acceso duplicada | No reimplementar guards; usar `ProtectedRoute`, `ActiveAccountRoute`, `RoleGuard`, `canAccessCommunity` |
| shadcn CLI / generadores externos | UI primitiva hand-rolled en `src/components/ui/` |

---

## Comandos

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # tsc -b + vite build
npm run lint      # eslint .
npm run preview   # preview del build de producción
npm run test:e2e  # Playwright E2E contra prod (ver sección "Testing E2E")
```

**No existe `npm test`** (sin Jest/Vitest en `package.json`) — los tests automatizados son E2E con Playwright.

---

## Entorno

Copiar `.env.example` → `.env`:

| Variable | Uso |
|----------|-----|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública |
| `VITE_APP_NAME` | Nombre mostrado (default: Comunidadescort.cl) |
| `VITE_APP_URL` | URL base de la app |

`src/lib/supabase/client.ts` usa placeholders si faltan vars → la app arranca pero Supabase falla.

Supabase cloud ref: `dxlqnlznhmeslzbxibhn.supabase.co` (según `.env.example`).

---

## Testing E2E (Playwright)

No hay unit tests (sin Jest/Vitest), pero sí una suite E2E con **Playwright** en `e2e/` que corre
contra `comunidadescort.netlify.app` (prod) — no hay entorno de staging.

```bash
npm run test:e2e      # playwright test (headless, chromium)
npm run test:e2e:ui   # playwright test --ui (modo interactivo)
```

Config en `playwright.config.ts`: `workers: 1` y `fullyParallel: false` a propósito — los tests
comparten cuentas reales (`E2E_ADMIN_EMAIL`/`E2E_USER_EMAIL`) y mutan datos en prod, correr en
paralelo arriesgaría condiciones de carrera entre specs.

### Variables de entorno

Copiar y completar `.env.e2e.local` (gitignored vía `*.local`, **nunca commitear**):

| Variable | Uso |
|----------|-----|
| `E2E_BASE_URL` | URL base (prod: `https://comunidadescort.netlify.app`) |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Cuenta real con rol `admin` |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Cuenta real con rol `user` |

### Specs (`e2e/`)

| Spec | Cubre |
|------|-------|
| `auth-admin.spec.ts` | Admin crea un dato en Datos de todo (queda `aprobada` de inmediato) y lo elimina al final |
| `auth-user-permissions.spec.ts` | Usuario regular no ve botones de creación ni accede a `/resources/new`; sí puede comentar y reseñar un dato (creado y borrado por el propio test vía admin) |
| `notifications.spec.ts` | Campana → "Ver todas" → `/notifications` renderiza sin pantalla blanca |
| `phone-validation.spec.ts` | Validación de celular chileno en tiempo real (`onBlur`) en registro y en el modal admin "Crear usuario" — sin enviar el formulario |
| `admin-create-user.spec.ts` | Creación de usuario vía Edge Function `admin-create-user`, condicionada a que esté desplegada |

### Datos de prueba en prod

Todo dato creado por los tests se nombra con prefijo **`[PRUEBA]`** y cada spec lo borra al final
vía la propia UI (botón "Eliminar"), salvo `admin-create-user.spec.ts`: crea una cuenta real en
`auth.users` (alias `prueba_e2e_<timestamp>`, email `prueba.e2e.<timestamp>@example.com`) y **no
hay botón de borrado de usuarios en la UI admin** — limpiar manualmente con `DELETE FROM
auth.users WHERE email = '...'` (cascada a `profiles` vía `ON DELETE CASCADE`, ver `00002`). Por
eso esta spec se ejecuta solo cuando se vaya a hacer esa limpieza manual a continuación, no como
parte de una corrida desatendida.

### Limitación de red conocida

Esta suite no pudo ejecutarse desde una red con un proxy/firewall de inspección TLS (detectado:
red institucional con `search inacap.cl` en DNS) — el handshake TLS de Node/Chromium contra
`comunidadescort.netlify.app` se resetea (`ECONNRESET`) aunque `curl` a la misma URL funciona
normal. Si `npm run test:e2e` falla con `net::ERR_CONNECTION_CLOSED` en todos los specs por igual
(no en selectores puntuales), sospechar de la red antes que del código — probar desde otra red.

---

## Despliegue

- **Prod:** https://comunidadescort.netlify.app
- **Host:** Netlify, config en `netlify.toml` (build: `npm run build`, publish: `dist`, redirect SPA `/*` → `/index.html`, `NODE_VERSION=20`).
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — `checkout` → `npm ci` → `npm run lint` → `npm run build` en push/PR a `main`. No despliega; Netlify hace su propio build al detectar push a `main`.
- Variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.) deben configurarse también en el dashboard de Netlify, no solo en `.env` local.

### Deploy de Edge Functions

Netlify solo construye el frontend — las Edge Functions en `supabase/functions/` **no se despliegan solas** y requieren `supabase` CLI con sesión iniciada (`supabase login`) y el proyecto vinculado (`supabase link --project-ref dxlqnlznhmeslzbxibhn`):

```bash
supabase functions deploy admin-create-user
supabase functions deploy login-with-phone
```

Si `admin-create-user` no está desplegada (o quedó desactualizada tras un cambio), el modal "Crear usuario" en `/admin/users` falla con el error genérico de Supabase ("Edge Function returned a non-2xx status code"); `profileService.createUserAsAdmin` ya intenta leer el mensaje específico del body de la función antes de mostrar ese genérico.

Flujo completo tras el deploy: Admin crea usuario en `/admin/users` → modal muestra credenciales (copiar ahora, no se repiten) → usuaria inicia sesión con esas credenciales → `MustChangePasswordRoute` la redirige a `/cambiar-password-obligatorio` antes de cualquier otra ruta.

---

## Arquitectura

### Estructura por features

```
src/features/<dominio>/
  components/   # UI del dominio
  pages/        # rutas lazy-loaded
  hooks/        # lógica React (ej. useAuth)
  schemas/      # validación zod
  context/      # providers locales (ej. CityContext)
```

**Dominios:** `auth`, `forum`, `alerts`, `resources`, `chat`, `bookmarks`, `notifications`, `profile`, `cities`, `moderation`, `admin`, `reports`.

**Fuera de features:**

| Ruta | Contenido |
|------|-----------|
| `src/services/*.service.ts` | Capa de datos Supabase (única que importa el client) |
| `src/lib/` | Helpers (`account-access`, `format`, `constants`, `utils`/`cn()`, `supabase/client`) |
| `src/types/` | Tipos TS manuales (no generados); `database.ts` es parcial |
| `src/components/ui/` | Primitivos estilo shadcn (CVA + `cn()`) |
| `src/components/shared/` | Guards, `EmptyState`, `ErrorState`, `PageLoader`, PWA banner |
| `src/components/layout/` | `AppShell`, `Navbar`, `Sidebar`, `MobileNav`, `UserMenu`, `AuthLayout` |
| `src/app/` | `router.tsx`, `providers.tsx` |

### Composición de la app

`main.tsx` → `App.tsx` → `AppProviders`:

```
QueryClientProvider (staleTime 5 min)
  → ThemeProvider (light/dark, localStorage + prefers-color-scheme)
  → BrowserRouter
  → AuthProvider
  → CityProvider
  → AppRouter
```

### Rutas principales

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/login`, `/register`, `/forgot-password` | Guest | Auth pública |
| `/reset-password` | Público | Reset con token Supabase |
| `/cambiar-password-obligatorio` | Autenticado, `must_change_password=true` | Cambio forzado tras alta por admin |
| `/cuenta-pendiente` | Autenticado, cuenta no activa | Espera de aprobación |
| `/feed`, `/forum/*`, `/alerts/*`, `/resources/*` | Cuenta activa | Features de comunidad |
| `/chat/*`, `/notifications`, `/bookmarks`, `/members` | Cuenta activa | Comunicación y perfil |
| `/profile/*`, `/settings` | Cuenta activa | Perfil y ajustes |
| `/moderation/*` | `moderator` \| `admin` | Panel de moderación |
| `/admin/*` | `admin` | Panel administrativo |

**Guards (en orden):** `ProtectedRoute` → `MustChangePasswordRoute`/`RequirePasswordChangeDone` (`src/components/shared/MustChangePasswordGate.tsx`) → `ActiveAccountRoute` → `AppShell` → `RoleGuard` (moderation/admin).

Todas las pages (salvo auth) se cargan con `React.lazy` + `Suspense` + `PageLoader`.

---

## Auth, roles y aprobación de cuentas

### Roles (`user_role`)
- **`user`**: miembro estándar; requiere cuenta aprobada.
- **`moderator`**: acceso siempre + panel `/moderation/*`.
- **`admin`**: acceso siempre + panel `/admin/*` y `/moderation/*`.

### Estados de cuenta (`account_status`)
`pendiente` → `aprobada` | `rechazada` | `bloqueada`

| Estado | Comportamiento |
|--------|----------------|
| `pendiente` | Redirige a `/cuenta-pendiente`; sin acceso a comunidad |
| `aprobada` | Acceso completo (si `is_active` coherente) |
| `rechazada` | Sin acceso; muestra motivo (`rejection_reason`) |
| `bloqueada` | Sin acceso; email añadido a `blocked_emails` |

### Registro
1. Usuario completa alias, email, password, **`phone`** (celular chileno, normalizado a `+569XXXXXXXX`), **`publication_link`** (URL obligatoria). **`city_id` ya no se pide en el registro** — se elige después desde `/profile/edit` (decisión documentada más abajo).
2. Se valida email no bloqueado (`is_email_blocked` RPC) y alias disponible (`is_alias_available` RPC).
3. Trigger `handle_new_user` (actualizado en `00027`) crea perfil con `is_active=false`, `account_status='pendiente'`, exige `phone` válido en metadata (formato `+569\d{8}`), `city_id` queda `NULL`.
4. Admin revisa en `/admin/users` (filtro “Pendientes de aprobación”).

### Login con email o celular
- Un solo campo "Email o celular" (`LoginForm.tsx`). Si el input parece teléfono (`looksLikePhone`, `src/lib/phone.ts`), se normaliza y se autentica enteramente server-side vía la Edge Function `login-with-phone` (`authService.signInWithPhone`), que resuelve el email con `service_role`, llama al endpoint `/auth/v1/token` de GoTrue y devuelve solo los tokens de sesión — **el email nunca llega al cliente** y el error es genérico exista o no el teléfono (evita enumeración). El cliente aplica esos tokens con `supabase.auth.setSession(...)`.
- `normalizePhoneChile(input)` (`src/lib/phone.ts`) acepta variantes (`+56 9 1234 5678`, `912345678`, `56912345678`, con espacios/guiones) y devuelve `+569XXXXXXXX` o lanza error.

### Política de contraseña
- `passwordSchema` compartido en `src/features/auth/schemas/auth.schema.ts`: mínimo 6 caracteres + al menos 1 mayúscula + al menos 1 número o símbolo. Reutilizado en `registerSchema`, `resetPasswordSchema` y el formulario de cambio obligatorio (`ChangePasswordRequiredForm`, reusa `resetPasswordSchema`).
- El login **no** aplica `passwordSchema` (solo exige que no esté vacío) para no rechazar contraseñas antiguas más débiles ya existentes.

### Admin crea usuarios manualmente
- Botón "Crear usuario" en `/admin/users` (`CreateUserModal.tsx`) → pide `alias, email, phone, publication_link, city_id` (opcional) → invoca la Edge Function `admin-create-user` (`supabase/functions/admin-create-user/index.ts`).
- La Edge Function verifica que el caller sea `role='admin'` (consulta `profiles` con su propio JWT), genera una contraseña temporal segura server-side, crea el `auth.user` (`email_confirm: true`, metadata `must_change_password: true`), y aprueba el perfil automáticamente (`account_status='aprobada'`, `is_active=true`, `reviewed_by`, `reviewed_at`) usando el cliente con `SUPABASE_SERVICE_ROLE_KEY` (inyectada automáticamente por Supabase a toda Edge Function — **no requiere configurar secret manual**).
- Devuelve `{ email, temporaryPassword }`; el modal muestra "Credenciales — copia ahora, no se volverán a mostrar" con botón Copiar.
- Toda cuenta creada por admin nace con rol `'user'` — si se necesita moderator/admin, se cambia después desde el selector de rol que ya existe en `UserRow`.

### Cambio obligatorio de contraseña (primer login tras alta por admin)
- Gate `MustChangePasswordGate.tsx` (`RequirePasswordChangeDone` / `MustChangePasswordRoute`) lee `profile.must_change_password` (columna en `profiles`, **no** `user_metadata` — un usuario no puede limpiarla por su cuenta) y redirige a `/cambiar-password-obligatorio` antes de llegar a `/cuenta-pendiente` o `ActiveAccountRoute` — cubre el caso de cuentas admin-create-user que ya están `aprobada`+`is_active` y entrarían directo al feed.
- `authService.completeForcedPasswordChange(password)` hace `updateUser({ password })` y luego llama al RPC `complete_forced_password_change()` (única vía permitida para limpiar el flag; ver defensa en profundidad abajo), seguido de `refreshProfile()` antes de navegar a `/feed`.

### Lógica de acceso (`src/lib/account-access.ts`)
```typescript
canAccessCommunity(profile):
  - null → false
  - admin | moderator → true (siempre)
  - bloqueada | rechazada → false
  - user → account_status === 'aprobada' || is_active
```

**Nota:** coexisten `account_status` e `is_active` por compatibilidad histórica. Al aprobar/rechazar, `profileService.reviewAccount` sincroniza ambos. Preferir `account_status` como fuente de verdad; `is_active` se actualiza en paralelo.

**Mirror en SQL:** `has_community_access()` (`00034_rls_resources_datos_de_todo.sql`) replica esta misma lógica server-side para RLS de `resource_comments`/`resource_reviews` — mantener sincronizados si cambia `canAccessCommunity`.

### Staff
Trigger `ensure_staff_account_active`: al asignar rol `admin`/`moderator`, fuerza `is_active=true` y `account_status='aprobada'`.

### Ciudad opcional y asignación post-aprobación
**Decisión:** `city_id` es nullable desde `00027` y ya no se pide en el registro público ni en el flujo de aprobación admin (`UserReviewModal`/`UserApproveButton` sin cambios). La usuaria elige/cambia su ciudad cuando quiera desde `/profile/edit` (`ProfileEditForm` con opción "Sin asignar"). `CityContext` ya maneja `city_id=null` sin romperse (cae a la primera ciudad activa). Se eligió esta vía por ser la de menor superficie de cambio frente a agregar un selector de ciudad al modal de aprobación.

### Defensa en profundidad: solo admin cambia role/account_status/is_active/must_change_password
RLS de `profiles` (`profiles_update_own`, `00009`) permite `UPDATE` de cualquier columna de la propia fila sin distinguir cuáles — un moderator/usuario no puede tocar la fila de **otra** persona (solo `is_admin()` tiene `FOR ALL`), pero en teoría podría intentar auto-promoverse sobre su propia fila. El trigger `before_profiles_update_guard` / `prevent_profile_privilege_escalation()` (`00029`, extendido en `00030`) bloquea cambios a `role`, `account_status`, `is_active` o `must_change_password` salvo que el caller sea `is_admin()`, `auth.role() = 'service_role'` (Edge Functions), o esté dentro de `complete_forced_password_change()` (que activa un bypass local de transacción vía `set_config('app.bypass_password_gate', 'true', true)` — solo alcanzable desde esa función, nunca desde un `UPDATE` directo del cliente). No afecta a `reviewAccount`/`adminUpdateProfile` (admin) ni a `admin-create-user` (service_role).

**Nota de seguridad (`00030`):** la primera versión de este flujo (`00027`–`00029`) tenía dos fallas corregidas antes de exponerse en prod: (1) `get_auth_email_by_phone` devolvía el email real a `anon` — enumeración de usuarios particularmente sensible en una app de anonimato; reemplazada por la Edge Function `login-with-phone`. (2) `must_change_password` vivía en `user_metadata`, que el propio usuario puede sobrescribir vía `auth.updateUser({data})` — bypass del cambio forzado; movida a `profiles.must_change_password` con el guard de arriba. También se cambió `Math.random()` por `crypto.getRandomValues()` para la contraseña temporal en `admin-create-user`.

---

## Flujo de moderación y administración

### División de responsabilidades

| Acción | Quién | Dónde | Pre-aprobación |
|--------|-------|-------|----------------|
| Aprobar/rechazar/bloquear **cuentas** | Admin | `/admin/users` | Sí — registro queda `pendiente` |
| Aprobar/rechazar **alertas** | Mod + Admin | `/moderation/alerts` | Sí — `status: pendiente` |
| Crear/editar **datos de todo** | Mod + Admin | `/resources/new`, `/resources/:id/edit` | No — se publica `aprobada` de inmediato |
| Resolver/descartar **reportes** de posts, comentarios y alertas | Mod + Admin | `/moderation/reports` | Sí — `status: pendiente` |
| Verificar dato (`is_verified`) | Admin | `/admin/resources` | No — badge de confianza post-aprobación |
| Activar/desactivar dato | Admin | `/admin/resources` | — |
| Fijar/bloquear/eliminar **posts** | Mod + Admin | `/moderation/posts` | No — posts publican al instante |
| Eliminar **comentarios** | Mod + Admin | `/moderation/comments` | No — comentarios publican al instante |
| Gestionar **ciudades** | Admin | `/admin/cities` | — |
| Cambiar **roles** | Admin | `/admin/users` | — |

### Flujo: aprobación de cuenta (Admin)
```
Registro → pendiente → Admin ve publication_link → Aprobar | Rechazar | Bloquear email
  Aprobar:  account_status=aprobada, is_active=true
  Rechazar: account_status=rechazada, rejection_reason obligatorio
  Bloquear: account_status=bloqueada + upsert en blocked_emails (impide futuros registros)
  → Trigger notify_account_status_change (00024) → notificación al usuario
    (account_approved / account_rejected; solo en transición pendiente → aprobada/rechazada)
```
**Bloquear no notifica** — solo aprobar/rechazar generan notificación in-app.

### Flujo: alertas (Moderación)
```
Usuario crea alerta → status=pendiente → Cola global (no filtrada por ciudad)
  → Mod/Admin revisa en /moderation/alerts
  → Aprobar: status=aprobada → visible en /alerts por ciudad
  → Rechazar: status=rechazada + rejection_reason
  → Trigger notify_alert_status_change → notificación al autor
```
Autor puede editar alerta solo mientras `status=pendiente`.

### Flujo: "Datos de todo" — ex directorio de recursos (migración `00031`–`00035`)
```
Mod/Admin crea dato en /resources/new → status=aprobada directo (sin cola)
  → RLS resources_insert_staff exige is_moderator_or_admin() AND status='aprobada'
  → Visible de inmediato en /resources (is_active=true)

Post-publicación (Admin en /admin/resources):
  → is_verified=true: badge “Verificado”, orden prioritario en listados
  → is_active toggle: ocultar/mostrar sin borrar

Edición: solo Mod/Admin (RoleGuard en /resources/:id/edit + RLS resources_mod_review,
sin filtro de autoría ni de status — puede editar cualquier dato, no solo el propio).
Usuarias normales: solo lectura, comentan (resource_comments) y dejan reseña con
estrellas (resource_reviews, una por usuaria por dato — reenviar actualiza la propia).
/moderation/resources sigue funcionando para filas legacy con status=pendiente
creadas antes de `00034` (usuarias ya no pueden crear nuevas).
```
Categorías (`resource_category`, migración `00031`): `delivery`, `farmacia`,
`botilleria`, `carniceria`, `supermercado`, `taxis_uber`, `salud`, `juridico`,
`habitaciones_escort`, `hoteles`, `tours_ciudad`, `gym`, `otros`. Campos nuevos en
`resources` (`00033`): `latitude`, `longitude`, `google_maps_url`, `instagram_url`,
`facebook_url`, `whatsapp_phone` (normalizado con `normalizePhoneChile`),
`rating_avg`/`reviews_count` (denormalizados, recalculados por trigger
`update_resource_rating` en `00035` ante cualquier cambio en `resource_reviews`).

### Flujo: reportes de contenido (Moderación)
```
Usuaria ve botón "Reportar" en post/comentario/alerta (oculto para su propio contenido)
  → Elige motivo (spam, contenido_inapropiado, acoso, informacion_falsa, otro) + detalle opcional
  → INSERT en reports con status=pendiente (UNIQUE por reporter+target: no se duplica)
  → Mod/Admin revisa en /moderation/reports (preview del contenido reportado)
  → Marcar resuelto | Descartar (reviewed_by/reviewed_at) — sin notificación automática
```
Tabla `reports` (migración `00025`) referencia el contenido de forma polimórfica
(`target_type` + `target_id`, sin FK — mismo patrón que `bookmarks`). No borra ni
oculta el contenido original; la acción sobre el post/comentario/alerta reportado
se hace manualmente desde `/moderation/posts`, `/moderation/comments` o
`/moderation/alerts`.

### Flujo: foro (Moderación reactiva, sin cola)
- Posts y comentarios **se publican inmediatamente** (no hay pre-moderación).
- Moderación reactiva en `/moderation/posts`: fijar (`is_pinned`), bloquear comentarios (`is_locked`), eliminar.
- `/moderation/comments`: ver recientes por ciudad seleccionada, eliminar.
- Stats de moderación filtradas por ciudad seleccionada; **alertas pendientes son globales**.

### Badges en Sidebar
- Moderadores: contador alertas pendientes (`pending-alerts-count`, refetch 60s).
- Admins: contador recursos sin verificar (`admin-unverified-count`, refetch 60s).

`ModerationLayout` (tabs `/moderation/*`) además muestra badges propios de alertas,
recursos y **reportes** (`pending-reports-count`, refetch 30s) — no están en el Sidebar.

---

## City scoping

`CityProvider` (`src/features/cities/context/CityContext.tsx`):
1. Carga ciudades vía RPC `get_public_cities`.
2. Selección: `localStorage` (`comunidad_selected_city_id`) → ciudad del perfil → primera ciudad activa.
3. La mayoría de queries (forum, alerts, resources, members, moderation stats) filtran por **ciudad seleccionada**, no solo la ciudad “home” del usuario.

---

## Capa de datos (Supabase)

### Services (15 archivos)
`auth`, `profile`, `city`, `post`, `comment`, `alert`, `resource`, `resource-comment`, `resource-review`, `chat`, `notification`, `bookmark`, `moderation`, `admin`, `report`.

### RPCs existentes
| RPC | Uso |
|-----|-----|
| `get_public_cities` | Listar ciudades activas |
| `is_alias_available` | Validar alias en registro |
| `is_email_blocked` | Validar email bloqueado |
| `get_or_create_direct_conversation` | Chat 1:1 |
| `complete_forced_password_change` | Limpia `profiles.must_change_password` (única vía permitida, ver defensa en profundidad) |

### Edge Functions
| Función | Uso |
|---------|-----|
| `admin-create-user` (`supabase/functions/admin-create-user/`) | Admin crea cuentas manualmente ya aprobadas, con password temporal (CSPRNG); verifica `role='admin'` del caller; usa `SUPABASE_SERVICE_ROLE_KEY` (auto-inyectada, sin secret manual) |
| `login-with-phone` (`supabase/functions/login-with-phone/`, `verify_jwt=false`) | Login por celular: resuelve email con `service_role` y autentica vía GoTrue `/auth/v1/token`, sin exponer el email al cliente; error genérico ante teléfono inexistente o password incorrecta |

### Storage
- Bucket `avatars`: upload en `profileService.uploadAvatar` (max 2 MB, jpg/png/webp).

### Realtime habilitado
- `notifications` (migración `00015`) — `notificationService.subscribeToNotifications`.
- Chat messages — `chatService.subscribeToMessages`.

---

## Notificaciones

### Tipos (`notification_type`)
`new_comment`, `new_reply`, `alert_approved`, `alert_rejected`, `resource_approved`, `resource_rejected`, `account_approved`, `account_rejected`, `new_message`, `mention`

### Triggers automáticos (DB)
| Evento | Tipo |
|--------|------|
| Comentario en post | `new_comment` |
| Respuesta a comentario | `new_reply` |
| Alerta aprobada/rechazada | `alert_approved` / `alert_rejected` |
| Recurso aprobado/rechazado | `resource_approved` / `resource_rejected` |
| Cuenta aprobada/rechazada (`00024`, `notify_account_status_change`) | `account_approved` / `account_rejected` |
| Mensaje privado | `new_message` |
| Mención `@alias` en comentario (`00026`, `notify_mentions`) | `mention` |

### No implementado
- Notificación de **cuenta bloqueada** (`bloqueada` no dispara notificación; ver `notify_account_status_change`).

Frontend: `/notifications` + badge unread; suscripción realtime invalida cache React Query.

---

## Base de datos — fases y migraciones

Aplicar en **orden de filename** en Supabase SQL Editor.

| Fase | Contenido | Migraciones clave |
|------|-----------|-------------------|
| 1–2 | Regiones, ciudades, perfiles | `00001`, `00002` |
| 3 | Foro (posts, comments, likes) | `00003`, `00009c`, `00013a` |
| 4 | Alertas | `00004`, `00009d`, `00013b` |
| 5 | Datos de todo (ex "Directorio de recursos") | `00005`, `00009e`, `00013c` |
| 6 | Chat 1:1 | `00008`, `00009f`, `00013d`, `00014`, `00017` |
| 7 | Notificaciones | `00007`, `00009g`, `00013g`, `00015` |
| 10 | Bookmarks | `00006`, `00009h` |
| — | RLS base, triggers core, seed, storage | `00009`, `00010`, `00011`, `00012`, `00013` |
| Post-MVP | Moderación recursos, aprobación cuentas, reportes, menciones | `00018`–`00026` |
| Post-MVP | Teléfono + ciudad opcional, login por celular, defensa en profundidad RLS, fixes de seguridad | `00027`–`00030` |
| Post-MVP | "Datos de todo": categorías nuevas, solo staff crea, ubicación/redes, comentarios y reseñas con estrellas | `00031`–`00035` |

**Lista completa:** `00001` … `00035` (falta `00016` — hueco intencional). Sufijos `a`–`h` para RLS/triggers por fase.

**Convención al añadir features:**
1. `000XX_<feature>.sql` — tablas/columnas
2. `000XX_rls_<feature>.sql` — políticas RLS
3. `000XX_triggers_<feature>.sql` — triggers y functions

---

## Enums de dominio (referencia rápida)

```typescript
user_role:           'user' | 'moderator' | 'admin'
account_status:      'pendiente' | 'aprobada' | 'rechazada' | 'bloqueada'
alert_status:        'pendiente' | 'aprobada' | 'rechazada'
post_category:       'seguridad' | 'consejos' | 'salud' | 'bienestar' | 'transporte' | 'recursos_utiles' | 'conversaciones_generales'
alert_category:      'estafa' | 'robo' | 'incidente_seguridad' | 'advertencia' | 'otro'
resource_category:   'delivery' | 'farmacia' | 'botilleria' | 'carniceria' | 'supermercado' | 'taxis_uber' | 'salud' | 'juridico' | 'habitaciones_escort' | 'hoteles' | 'tours_ciudad' | 'gym' | 'otros'
  -- 'hospedaje' sigue en el enum de Postgres (huérfano, Postgres no permite DROP VALUE)
  -- pero ya no está en el tipo TS ResourceCategory ni se usa en la app (datos migrados a 'hoteles' en 00032)
bookmark_type:       'post' | 'resource' | 'alert'
report_target_type:  'post' | 'comment' | 'alert'
report_reason:       'spam' | 'contenido_inapropiado' | 'acoso' | 'informacion_falsa' | 'otro'
report_status:       'pendiente' | 'resuelto' | 'descartado'
```

---

## PWA

`vite-plugin-pwa` en `vite.config.ts`: `registerType: 'autoUpdate'`, Workbox `NetworkFirst` para `*.supabase.co`. Banner de instalación: `InstallPwaBanner`.

---

## Estado actual del proyecto (prioridades)

### Completado (MVP funcional)
- [x] Auth (login, registro, reset password, guards)
- [x] Aprobación de cuentas con `publication_link` (migraciones 00021–00023)
- [x] Foro con posts, comentarios, likes, pin/lock
- [x] Alertas con pre-moderación
- [x] Directorio de recursos con pre-moderación + verificación admin
- [x] Chat 1:1 con realtime
- [x] Notificaciones in-app + realtime
- [x] Bookmarks
- [x] Perfiles, miembros, privacidad, avatares
- [x] Paneles `/moderation` y `/admin`
- [x] Multi-ciudad con selector persistente
- [x] PWA básica
- [x] Notificación de cuenta aprobada/rechazada (migración `00024`, `notify_account_status_change`)
- [x] Reportes de posts, comentarios y alertas con cola en `/moderation/reports` (migración `00025`)
- [x] Menciones `@alias` en comentarios con notificación (migración `00026`)
- [x] Teléfono normalizado (`+569XXXXXXXX`), login dual email/celular, `city_id` opcional en registro (migraciones `00027`–`00029`)
- [x] Admin crea usuarios manualmente vía Edge Function (`admin-create-user`) con cambio obligatorio de contraseña en primer login
- [x] Política de contraseña compartida (mayúscula + número/símbolo) en registro, reset y cambio obligatorio
- [x] CI en GitHub Actions (lint + build en push/PR a `main`)
- [x] Deploy en Netlify (`netlify.toml`)

### Prioridad alta (trabajo reciente / estabilización)
1. **Verificar migraciones 00021–00024 aplicadas** en Supabase cloud (cuentas pendientes, `blocked_emails`, admin operativo).
2. **Sincronizar tipos TS** con schema post-migración (`Profile.account_status`, `Resource.status`, etc.).
3. **Flujo end-to-end de registro → aprobación → acceso** probado en prod/staging.

### Prioridad media
4. Tests unitarios (Vitest + Testing Library) — infraestructura inexistente. E2E con Playwright ya existe (`e2e/`, ver sección "Testing E2E") para flujos críticos contra prod.
5. Implementar `mention` en comentarios/posts.
6. Cola de alertas pendientes: decidir si filtrar por ciudad o mantener global.
7. Acción directa sobre el contenido reportado desde `/moderation/reports` (hoy solo enlaza a `/moderation/posts|comments|alerts`).

### Prioridad baja
10. Pre-moderación de posts del foro (hoy publican al instante).
11. Deprecar `is_active` a favor de solo `account_status` (requiere migración + refactor).
12. Generación automática de tipos desde Supabase CLI.

---

## Decisiones pendientes

| # | Tema | Opciones / contexto |
|---|------|---------------------|
| 1 | **Pre-moderación del foro** | Hoy posts/comentarios son instantáneos; ¿añadir cola `pendiente` como alertas? |
| 2 | **Alertas: cola global vs por ciudad** | UI de moderación muestra cola global; stats filtran por ciudad — ¿unificar? |
| 3 | **Moderadores aprueban cuentas** | **Confirmado y reforzado (`00029`)**: solo `admin` (RLS `is_admin()` + trigger `prevent_profile_privilege_escalation`). Moderadores no tienen vía RLS para tocar `account_status`/`role`/`is_active` de otros perfiles. |
| 4 | **`is_active` vs `account_status`** | Duplicidad legacy; ¿migrar a un solo campo? |
| 5 | **Deploy target** | ¿Vercel, Netlify, Cloudflare Pages? Sin config en repo aún. |
| 6 | **Testing strategy** | ¿Vitest unit + E2E Playwright? Sin decisión. |
| 8 | **Invites/códigos** | Acceso solo por aprobación manual; ¿añadir invite codes? |
| 9 | **Rate limiting / anti-spam** | Sin implementar en cliente ni Edge Functions. `login-with-phone`/`is_alias_available`/`is_email_blocked` son endpoints `anon` sin rate limit; `login-with-phone` ya no filtra el email (ver `00030`), pero sigue sin throttling de intentos. |

---

## Checklist antes de entregar cambios

- [ ] `npm run lint` sin errores nuevos
- [ ] `npm run build` compila
- [ ] Tipos TS actualizados si hubo cambio de schema
- [ ] Nueva migración SQL si hubo cambio de DB (no editar migraciones viejas)
- [ ] RLS incluido para tablas nuevas
- [ ] Textos de UI en español
- [ ] Gating de cuenta con `canAccessCommunity`
- [ ] Realtime subscriptions con cleanup
- [ ] Sin secretos en código commiteado
