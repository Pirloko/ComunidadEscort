---
name: supabase-migration
description: Crea y revisa migraciones SQL para Comunidadescort.cl siguiendo numeración, RLS, triggers y sync de tipos TS. Usar cuando se pida migración, cambio de schema, política RLS, trigger, RPC o función Postgres en supabase/migrations/.
---

# Migraciones Supabase — Comunidadescort.cl

## Antes de escribir SQL

1. Leer migraciones existentes en `supabase/migrations/` para no duplicar columnas/policies.
2. Determinar el **siguiente número** (actual: hasta `00023`; hueco conocido: `00016`).
3. Identificar si el cambio requiere **1, 2 o 3 archivos** (ver convención abajo).
4. Planificar actualización de tipos en `src/types/` (manual, no hay codegen).

## Convención de archivos

| Tipo | Patrón de nombre | Contenido |
|------|------------------|-----------|
| Schema | `000XX_<feature>.sql` | `CREATE TABLE`, `ALTER TABLE`, enums, índices |
| RLS | `000XX_rls_<feature>.sql` o `00009x_rls_faseN_<area>.sql` | `ENABLE ROW LEVEL SECURITY`, policies |
| Triggers | `000XX_triggers_<feature>.sql` o `00013x_triggers_faseN_<area>.sql` | Functions + triggers |
| Fix puntual | `000XX_fix_<descripcion>.sql` | Reparaciones idempotentes one-off |

**Reglas:**
- Nunca editar migraciones ya aplicadas en Supabase prod → crear nueva incremental.
- Ignorar `00009b_rls_fases_3_7.sql` (obsoleto).
- SQL idempotente cuando sea posible (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
- Comentario de cabecera con número, descripción y dependencias.

## Orden de ejecución en Supabase

```
00001 enums/extensions → 00002 profiles/cities → tablas por fase → RLS por fase → triggers → fixes
```

Fases del proyecto: 1–2 ciudades/perfiles, 3 foro, 4 alertas, 5 recursos, 6 chat, 7 notificaciones, 10 bookmarks.

## RLS — patrones del proyecto

- Helpers existentes: `is_admin()`, `is_moderator()`, `auth.uid()`.
- Staff (`admin`/`moderator`) suele tener acceso ampliado vía role check en policy.
- Policies nombradas descriptivamente: `"alerts_select_approved"`, `"blocked_emails_admin"`.
- Toda tabla nueva **debe** tener RLS habilitado + policies antes de mergear.

## Triggers — patrones del proyecto

- Notificaciones: insert en `notifications` con `SECURITY DEFINER`, `search_path = public`.
- Contadores (`likes_count`, `comments_count`): triggers AFTER INSERT/DELETE.
- Status changes: notificar solo en transición desde `pendiente` → `aprobada`/`rechazada`.
- Registro: `handle_new_user` en auth.users → crea perfil `pendiente`, valida `publication_link`.

## RPCs

Preferir RPC cuando la operación debe ser atómica o requiere lógica server-side:
- Ejemplos existentes: `get_public_cities`, `is_alias_available`, `is_email_blocked`, `get_or_create_direct_conversation`.
- `GRANT EXECUTE ... TO anon, authenticated` según corresponda.

## Después de la migración SQL

Checklist obligatorio:

```
- [ ] Actualizar src/types/database.ts y/o types por feature (forum.ts, alerts.ts, resources.ts, admin.ts...)
- [ ] Actualizar src/services/*.service.ts si cambian columnas en selects
- [ ] Actualizar zod schemas si hay campos de formulario nuevos
- [ ] Verificar RLS permite el flujo desde el cliente (no solo admin SQL Editor)
- [ ] npm run build compila sin errores
```

## Enums existentes (no recrear)

```sql
user_role, post_category, alert_category, alert_status, account_status,
resource_category, bookmark_type, notification_type
```

Nuevos valores enum: `ALTER TYPE ... ADD VALUE IF NOT EXISTS 'valor'`.

## Ejemplo: añadir columna a profiles

```
00024_add_foo_to_profiles.sql     → ALTER TABLE profiles ADD COLUMN ...
00024_rls_profiles_foo.sql        → solo si la columna afecta policies
```

Actualizar: `Profile` en `src/types/database.ts`, selects en `profile.service.ts`.

## Ejemplo: nueva tabla con moderación

```
00024_my_feature.sql              → CREATE TABLE + índices
00024_rls_my_feature.sql          → policies (autor, mod/admin, público aprobado)
00024_triggers_my_feature.sql     → notificaciones si aplica status pendiente
```

## Qué NO hacer

- No usar `select('*')` en services al añadir queries relacionadas.
- No poner lógica multi-step en cliente si debe ser atómica → RPC.
- No commitear sin que el usuario lo pida.
- No incluir secretos ni datos de usuarios reales en migraciones.

## Referencia

Contexto completo del proyecto: `CLAUDE.md` en la raíz del repo.
