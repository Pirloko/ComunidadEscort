# CLAUDE.md

Guía de contexto para Claude Code al trabajar en este repositorio. **Responde siempre en español** al usuario, salvo que pida otro idioma.

---

## Resumen del proyecto

**Comunidadescort.cl** — PWA privada (React 19 + TypeScript + Vite) para seguridad, apoyo mutuo y bienestar, con alcance por ciudad en Chile. Backend: **Supabase** (Postgres + Auth + Realtime + Storage), accedido directamente desde el cliente con `@supabase/supabase-js`. **No hay API server propio.**

- Textos de UI, mensajes de validación y valores de enums de dominio: **español**.
- Acceso gated: registro → cuenta `pendiente` → revisión admin → acceso a la comunidad.
- Registro exige `publication_link` (URL de publicación externa) para verificación de identidad.

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
- **Tests**: no hay runner configurado — no asumir `npm test`; no añadir tests salvo que se pidan explícitamente.

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
```

**No existe `npm test`** (sin Jest/Vitest en `package.json`).

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

**Dominios:** `auth`, `forum`, `alerts`, `resources`, `chat`, `bookmarks`, `notifications`, `profile`, `cities`, `moderation`, `admin`.

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
| `/cuenta-pendiente` | Autenticado, cuenta no activa | Espera de aprobación |
| `/feed`, `/forum/*`, `/alerts/*`, `/resources/*` | Cuenta activa | Features de comunidad |
| `/chat/*`, `/notifications`, `/bookmarks`, `/members` | Cuenta activa | Comunicación y perfil |
| `/profile/*`, `/settings` | Cuenta activa | Perfil y ajustes |
| `/moderation/*` | `moderator` \| `admin` | Panel de moderación |
| `/admin/*` | `admin` | Panel administrativo |

**Guards (en orden):** `ProtectedRoute` → `ActiveAccountRoute` → `AppShell` → `RoleGuard` (moderation/admin).

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
1. Usuario completa alias, email, password, ciudad, **`publication_link`** (URL obligatoria).
2. Se valida email no bloqueado (`is_email_blocked` RPC) y alias disponible (`is_alias_available` RPC).
3. Trigger `handle_new_user` crea perfil con `is_active=false`, `account_status='pendiente'`.
4. Admin revisa en `/admin/users` (filtro “Pendientes de aprobación”).

### Lógica de acceso (`src/lib/account-access.ts`)
```typescript
canAccessCommunity(profile):
  - null → false
  - admin | moderator → true (siempre)
  - bloqueada | rechazada → false
  - user → account_status === 'aprobada' || is_active
```

**Nota:** coexisten `account_status` e `is_active` por compatibilidad histórica. Al aprobar/rechazar, `profileService.reviewAccount` sincroniza ambos. Preferir `account_status` como fuente de verdad; `is_active` se actualiza en paralelo.

### Staff
Trigger `ensure_staff_account_active`: al asignar rol `admin`/`moderator`, fuerza `is_active=true` y `account_status='aprobada'`.

---

## Flujo de moderación y administración

### División de responsabilidades

| Acción | Quién | Dónde | Pre-aprobación |
|--------|-------|-------|----------------|
| Aprobar/rechazar/bloquear **cuentas** | Admin | `/admin/users` | Sí — registro queda `pendiente` |
| Aprobar/rechazar **alertas** | Mod + Admin | `/moderation/alerts` | Sí — `status: pendiente` |
| Aprobar/rechazar **recursos nuevos** | Mod + Admin | `/moderation/resources` | Sí — `status: pendiente` |
| Verificar recurso (`is_verified`) | Admin | `/admin/resources` | No — badge de confianza post-aprobación |
| Activar/desactivar recurso | Admin | `/admin/resources` | — |
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

### Flujo: recursos del directorio (Moderación + Admin)
```
Usuario crea recurso → status=pendiente → Cola en /moderation/resources
  → Mod/Admin aprueba/rechaza (status + reviewed_by/at)
  → Trigger notify_resource_status_change → notificación al autor
  → Recurso aprobado visible en /resources (status=aprobada, is_active=true)

Post-aprobación (Admin en /admin/resources):
  → is_verified=true: badge “Verificado”, orden prioritario en listados
  → is_active toggle: ocultar/mostrar sin borrar
```
Autor puede editar recurso solo mientras `status=pendiente`.

### Flujo: foro (Moderación reactiva, sin cola)
- Posts y comentarios **se publican inmediatamente** (no hay pre-moderación).
- Moderación reactiva en `/moderation/posts`: fijar (`is_pinned`), bloquear comentarios (`is_locked`), eliminar.
- `/moderation/comments`: ver recientes por ciudad seleccionada, eliminar.
- Stats de moderación filtradas por ciudad seleccionada; **alertas pendientes son globales**.

### Badges en Sidebar
- Moderadores: contador alertas pendientes (`pending-alerts-count`, refetch 60s).
- Admins: contador recursos sin verificar (`admin-unverified-count`, refetch 60s).

---

## City scoping

`CityProvider` (`src/features/cities/context/CityContext.tsx`):
1. Carga ciudades vía RPC `get_public_cities`.
2. Selección: `localStorage` (`comunidad_selected_city_id`) → ciudad del perfil → primera ciudad activa.
3. La mayoría de queries (forum, alerts, resources, members, moderation stats) filtran por **ciudad seleccionada**, no solo la ciudad “home” del usuario.

---

## Capa de datos (Supabase)

### Services (12 archivos)
`auth`, `profile`, `city`, `post`, `comment`, `alert`, `resource`, `chat`, `notification`, `bookmark`, `moderation`, `admin`.

### RPCs existentes
| RPC | Uso |
|-----|-----|
| `get_public_cities` | Listar ciudades activas |
| `is_alias_available` | Validar alias en registro |
| `is_email_blocked` | Validar email bloqueado |
| `get_or_create_direct_conversation` | Chat 1:1 |

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

### No implementado
- `mention` — enum definido, sin trigger ni UI.
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
| 5 | Directorio de recursos | `00005`, `00009e`, `00013c` |
| 6 | Chat 1:1 | `00008`, `00009f`, `00013d`, `00014`, `00017` |
| 7 | Notificaciones | `00007`, `00009g`, `00013g`, `00015` |
| 10 | Bookmarks | `00006`, `00009h` |
| — | RLS base, triggers core, seed, storage | `00009`, `00010`, `00011`, `00012`, `00013` |
| Post-MVP | Moderación recursos, aprobación cuentas | `00018`–`00024` |

**Lista completa (35 archivos):** `00001` … `00024` (falta `00016` — hueco intencional). Sufijos `a`–`h` para RLS/triggers por fase.

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
resource_category:   'delivery' | 'farmacias' | 'supermercados' | 'transporte' | 'salud' | 'juridico' | 'hospedaje' | 'otros'
bookmark_type:       'post' | 'resource' | 'alert'
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

### Prioridad alta (trabajo reciente / estabilización)
1. **Verificar migraciones 00021–00024 aplicadas** en Supabase cloud (cuentas pendientes, `blocked_emails`, admin operativo).
2. **Sincronizar tipos TS** con schema post-migración (`Profile.account_status`, `Resource.status`, etc.).
3. **Flujo end-to-end de registro → aprobación → acceso** probado en prod/staging.

### Prioridad media
5. Tests (Vitest + Testing Library) — infraestructura inexistente.
6. CI/CD (lint + build en PR) — no configurado.
7. Deploy producción documentado (no hay `vercel.json` / `netlify.toml` / GitHub Actions).
8. Implementar `mention` en comentarios/posts.
9. Cola de alertas pendientes: decidir si filtrar por ciudad o mantener global.

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
| 3 | **Moderadores aprueban cuentas** | Hoy solo admin en `/admin/users`; ¿delegar a moderadores? |
| 4 | **`is_active` vs `account_status`** | Duplicidad legacy; ¿migrar a un solo campo? |
| 5 | **Deploy target** | ¿Vercel, Netlify, Cloudflare Pages? Sin config en repo aún. |
| 6 | **Testing strategy** | ¿Vitest unit + E2E Playwright? Sin decisión. |
| 7 | **`mention` notifications** | Enum existe; sin parser ni triggers. |
| 8 | **Invites/códigos** | Acceso solo por aprobación manual; ¿añadir invite codes? |
| 9 | **Rate limiting / anti-spam** | Sin implementar en cliente ni Edge Functions. |

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
