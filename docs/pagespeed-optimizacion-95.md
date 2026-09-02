# Plan de optimización PageSpeed — objetivo 95–100 (móvil)

> **Estado:** implementado en código (mar 2026). Pendiente: redimensionar manualmente `public/logo-comunidad*.webp` a 560×160 px (sips no escribe WebP en macOS) y backfill opcional de variantes `-card.webp` en fotos legacy.

Documento de implementación para **comunidadescort.cl** (`/home` y rutas SEO públicas).  
Basado en auditoría Lighthouse móvil (sep 2026) y en el estado actual del repositorio.

---

## 1. Resumen ejecutivo

### Situación actual (diagnóstico)

| Hallazgo Lighthouse | Impacto estimado | Causa raíz en este proyecto |
|---------------------|------------------|----------------------------|
| **LCP: retraso de carga 2060 ms** | Crítico | SPA: la imagen LCP (banner o destacada) solo aparece tras JS + fetch a Supabase |
| **LCP no visible en HTML inicial** | Crítico | `dist/home/index.html` prerenderizado no incluye `<img>` del banner ni preload dinámico |
| **Payload 10,3 MB** | Crítico | Un `.mp4` de ~9,4 MB se descarga en el home (portada video-only en Destacadas) |
| **Caché Supabase ~8,3 MB ahorrables** | Alto | URLs firmadas (`createSignedUrl`) con TTL corto (~30–60 min); el navegador no cachea bien |
| **Imágenes sobredimensionadas ~223 KiB** | Alto | Fotos subidas a 1600 px; cards muestran ~462 px; logos/avatares sin `srcset` |
| **Preconnect Supabase ~300 ms LCP** | Medio | Falta `<link rel="preconnect">` al origen de Storage en `index.html` |
| **CSS bloqueante ~190 ms** | Medio | Bundle CSS de Vite bloquea el primer paint |
| **Reflow forzado 35 ms** | Bajo | `DestacadasCarousel` lee `offsetLeft` / `scrollWidth` en scroll |
| **JS sin usar ~164 KiB** | Medio | Chunks `index` + `client` + GA4 |
| **Hilo principal 3,6 s** | Alto | Consecuencia de lo anterior (layout + JS + terceros) |

### Objetivo por métrica (móvil)

| Métrica | Actual (aprox.) | Meta |
|---------|-----------------|------|
| **Performance** | 60–80 | **95–100** |
| **LCP** | >2,5 s | **< 2,0 s** (ideal < 1,8 s) |
| **FCP** | variable | **< 1,5 s** |
| **CLS** | OK tras fixes a11y | **< 0,1** |
| **TBT / INP** | penalizado por JS | **TBT < 200 ms** |

### Principio rector

> **El 80 % del salto a 95+ viene de 3 decisiones:**  
> 1) No cargar video completo en listados del home.  
> 2) Hacer descubrible el LCP en el HTML estático de `/home`.  
> 3) Servir imágenes públicas con URL estable + tamaño correcto (sin signed URL en cards).

---

## 2. Mapa de prioridades (orden de implementación)

```
Fase 0 — Quick wins (1–2 días)     → +15–25 pts Performance
Fase 1 — LCP y medios (3–5 días)   → +20–30 pts
Fase 2 — Caché y red (2–3 días)    → +5–10 pts
Fase 3 — JS y hilo principal (2 días) → +3–8 pts
Fase 4 — Afinado y regresión       → estabilizar 95–100
```

---

## 3. Fase 0 — Quick wins

### 3.1 Preconnect a Supabase Storage

**Problema:** Lighthouse detecta ~300 ms de ahorro en LCP al conectar antes al origen de imágenes.

**Archivo:** `index.html`

```html
<!-- Sustituir PROJECT_REF por el ref real del proyecto Supabase -->
<link rel="preconnect" href="https://PROJECT_REF.supabase.co" crossorigin />
<link rel="dns-prefetch" href="https://PROJECT_REF.supabase.co" />
```

> Mantener los `preconnect` existentes a Google Fonts. No añadir preconnect a `googletagmanager.com` (GA ya se difiere en `src/lib/analytics.ts`).

**Verificación:** DevTools → Network → la conexión a `*.supabase.co` debe iniciarse antes del primer `.webp` / `.mp4`.

---

### 3.2 Logo: tamaño físico = tamaño mostrado

**Problema:** `logo-comunidad.webp` ~700×200 px; se muestra ~294×84 px (~24 KiB de más).

**Acción (assets, no código):**

1. Regenerar en `public/`:
   - `logo-comunidad.webp` → **560×160** (2× retina del display máx. 280×80)
   - `logo-comunidad-light.webp` → igual
   - Calidad WebP **80–82**
2. Actualizar `preload` en `index.html` si cambia el nombre.

**Código (opcional):** en `BrandLogo.tsx`, añadir `srcSet` si se generan dos densidades:

```tsx
<img
  src="/logo-comunidad.webp"
  srcSet="/logo-comunidad.webp 1x, /logo-comunidad@2x.webp 2x"
  width={280}
  height={80}
  ...
/>
```

---

### 3.3 Eliminar video del payload inicial del home (P0 — crítico)

**Problema:** Un listado con portada solo-video dispara la descarga de **~9,4 MB** en `/home`. Es el mayor lastre del informe “Cargas útiles enormes” y “Terceros Supabase”.

**Regla de producto:** En **listados y carruseles** (`HabitacionCard`, `DestacadasCarousel`) **nunca** montar `<video src="...">` con URL firmada del archivo completo.

**Implementación recomendada:**

#### A) Corto plazo (sin migración)

`src/features/home/components/HabitacionCardCover.tsx`:

```tsx
// En listados: preload="none" y NO asignar src hasta interacción o usar poster estático
{hasVideoOnly ? (
  <div
    className={cn('h-full w-full bg-muted', mediaClassName)}
    role="img"
    aria-label={alt}
  >
  {/* Placeholder + badge play; el detalle carga el video */}
    <HabitacionVideoPlayBadge />
  </div>
) : ( ... )}
```

`src/services/resource.service.ts` — en `withSignedCovers`, **no firmar video** para endpoints de listado (`getFeaturedPublicHabitaciones`, `getPublicHabitaciones`):

```ts
// Si no hay foto de portada, dejar video_url: null en cards
resource.video_url = null
```

#### B) Medio plazo (correcto)

Al subir video (`uploadResourceVideo`), generar **poster WebP** (frame en t=1s, maxEdge 800) y guardar en `resource_photos` o columna `video_poster_path`. El home solo muestra el poster.

**Meta:** Payload inicial del home **< 500 KiB** (sin contar lazy below-the-fold).

---

## 4. Fase 1 — LCP y descubrimiento en HTML

### 4.1 ¿Cuál es el LCP en `/home`?

Orden visual actual (`HomePage.tsx`):

1. Logo en header (`BrandLogo` con `priority`) — candidato LCP si no hay banner
2. `HomePromoBannerCarousel` — candidato LCP si hay banner activo
3. `DestacadasCarousel` — imágenes grandes, pero **below** el fold en muchos móviles

Lighthouse marcó: *“La solicitud no es visible en el documento inicial”* → el elemento LCP es una imagen que **solo existe tras React + React Query**.

### 4.2 Estrategia: prerender enriquecido + preload

**Archivos:** `scripts/prerender-seo.mjs`, `scripts/seo-prerender-pages.mjs`, nuevo `scripts/fetch-home-lcp.mjs`

#### Paso 1 — Build-time: obtener URL del banner LCP

Script post-build (con variables de entorno de CI/Netlify):

```js
// scripts/fetch-home-lcp.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const { data } = await supabase
  .from('home_banners')
  .select('image_url, title')
  .eq('is_active', true)
  .not('image_url', 'is', null)
  .order('sort_order')
  .limit(1)
  .maybeSingle()

export const homeLcp = data ?? null
```

#### Paso 2 — Inyectar en `dist/home/index.html`

En `prerender-seo.mjs`, para la ruta `/home` únicamente:

```html
<!-- En <head> -->
<link
  rel="preload"
  as="image"
  href="URL_BANNER_OPTIMIZADA"
  fetchpriority="high"
  type="image/webp"
/>

<!-- En <body> dentro de #root (contenido crawler) -->
<div class="home-lcp-prerender" aria-hidden="true">
  <img
    src="URL_BANNER_OPTIMIZADA"
    alt="Título banner"
    width="676"
    height="338"
    fetchpriority="high"
    decoding="async"
  />
</div>
```

> Si no hay banner activo, el preload debe apuntar al logo (`/logo-comunidad.webp`) — ya existe en `index.html`; eliminar duplicados conflictivos.

#### Paso 3 — Runtime: misma URL que el prerender

`HomePromoBannerCarousel` debe usar la misma URL (sin query `?t=` volátil en producción). En `banner.service.ts`, evitar `?t=${Date.now()}` en prod; usar versión por `updated_at` del banner.

### 4.3 Desglose LCP objetivo

| Subparte | Actual | Objetivo | Cómo |
|----------|--------|----------|------|
| TTFB | 0 ms | < 200 ms | Netlify + HTML prerender OK |
| Retraso carga recurso | 2060 ms | **< 400 ms** | Preload + `<img>` en HTML |
| Duración carga | 120 ms | < 200 ms | Imagen ≤ 40 KiB (banner 676×338 WebP) |
| Retraso renderizado | 640 ms | **< 300 ms** | Menos JS antes del paint; ver Fase 3 |

### 4.4 Banner: dimensiones y peso

| Uso | Dimensiones archivo | Peso máx. |
|-----|---------------------|-----------|
| Admin upload | **1200×600** (2:1) | 60 KiB |
| Display móvil | ~676×338 | — |

`banner.service.ts` ya usa `maxEdge: 1200`. Ajustar:

```ts
convertImageToWebp(file, {
  maxEdge: 1200,
  quality: 0.82,
  maxOutputBytes: 60 * 1024, // 60 KiB
})
```

---

## 5. Fase 2 — Imágenes responsive y caché

### 5.1 Imágenes de habitaciones (Supabase)

**Problema:** Fotos ~816×1088 mostradas a ~462×616 (~71 KiB de más por imagen).

#### Solución A — Variantes al subir (recomendada, sin depender de plan Pro)

Nuevo helper `src/lib/image-variants.ts`:

```ts
export type ImageVariant = 'card' | 'detail' | 'full'

const VARIANT_MAX_EDGE: Record<ImageVariant, number> = {
  card: 640,    // listados / destacadas
  detail: 1200, // galería detalle
  full: 1600,   // lightbox (lazy)
}
```

En `uploadResourcePhoto`, generar y subir:

- `public/{id}/{uuid}-card.webp` (640 px)
- `public/{id}/{uuid}-detail.webp` (1200 px)

Guardar en DB el path `-card` como URL principal para listados; `-detail` para galería.

#### Solución B — Supabase Image Transform (si el proyecto tiene Transform habilitado)

URL pública estable (cacheable 1 año en CDN):

```
{SUPABASE_URL}/storage/v1/render/image/public/resource-photos/{path}?width=480&quality=80&resize=contain
```

Helper:

```ts
// src/lib/supabase-image.ts
export function publicImageUrl(
  bucket: string,
  path: string,
  opts?: { width?: number; quality?: number },
): string {
  const base = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}`
  const q = new URLSearchParams()
  if (opts?.width) q.set('width', String(opts.width))
  if (opts?.quality) q.set('quality', String(opts.quality ?? 80))
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}
```

### 5.2 Dejar de usar signed URLs en contenido público

**Problema:** `createSignedUrls` → TTL 1 h → Lighthouse reporta caché de 29–59 min.

Para fotos en prefijo `public/` de habitaciones `is_public=true`:

```ts
// En withSignedCovers / resolvePhotoUrls — rama pública
function publicObjectUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
```

Solo usar `createSignedUrl` para:

- `private/` (miembros autenticados)
- Videos
- Admin

**Cache-Control en upload** (`resource.service.ts`, `banner.service.ts`):

```ts
await supabase.storage.from(PHOTOS_BUCKET).upload(path, webp, {
  contentType: 'image/webp',
  cacheControl: '31536000', // 1 año — inmutable si el path incluye UUID
})
```

> Las URLs firmadas **no** pueden cachearse 1 año (el token expira). Por eso la migración a URLs públicas + transform es clave.

### 5.3 `srcset` en componentes

**`HabitacionCardCover.tsx`:**

```tsx
<img
  src={photoCardUrl}
  srcSet={`${photoCardUrl} 1x, ${photoDetailUrl} 2x`}
  sizes="(max-width: 640px) 92vw, 462px"
  alt={alt}
  width={462}
  height={616}
  loading={isAboveFold ? 'eager' : 'lazy'}
  fetchPriority={isAboveFold ? 'high' : 'auto'}
/>
```

**Destacadas — primera slide:** `loading="eager"` + `fetchPriority="high"` solo en `i === 0`.

**Avatares publishers** (`publisher.service.ts` ya usa `maxEdge: 512`):

- Bajar a **160 px** (display ~76 px)
- En UI: `width={76} height={76}`

### 5.4 PWA Workbox — no cachear API como NetworkFirst 5 min

**Problema:** `vite.config.ts` cachea `*.supabase.co` con `maxAgeSeconds: 300`, compitiendo con caché HTTP del CDN.

**Ajuste:**

```ts
runtimeCaching: [
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\//i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'supabase-public-media',
      expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api',
      expiration: { maxEntries: 32, maxAgeSeconds: 300 },
    },
  },
],
```

---

## 6. Fase 3 — CSS, JS y hilo principal

### 6.1 CSS que bloquea el renderizado (~190 ms)

**Archivo afectado:** `/assets/index-*.css` (~13 KiB)

**Opciones (de menor a mayor esfuerzo):**

1. **Crítico inline ampliado** en `index.html` (ya hay anti-flash). Extraer reglas above-the-fold del header + shell del banner (~2–3 KiB) con herramienta `critical` o manual.
2. **Vite `build.cssCodeSplit: true`** (default) — asegurar que rutas admin no carguen CSS del home.
3. **Defer del CSS principal** (avanzado):

```html
<link rel="preload" href="/assets/index.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

Solo si el crítico inline cubre el primer viewport.

### 6.2 Code splitting de rutas

Ya hay `React.lazy` en el router. Verificar que **HomePage** no importe en cadena módulos pesados de admin/comunidad.

Auditar:

```bash
npm run build
# Revisar dist/assets/*.js — chunks > 50 KiB que no sean home
```

**Meta:** chunk inicial del home **< 80 KiB gzip**.

Acciones si sigue alto:

- Mover `lucide-react` a imports por icono (`import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left'`) o sprite SVG propio.
- `AnunciosGuidesSection`: `staleTime: 5 * 60 * 1000` en lugar de `refetchOnMount: 'always'` (evita trabajo extra en cada visita).

### 6.3 Google Analytics (terceros)

Estado actual (`src/lib/analytics.ts`): GA diferido con `requestIdleCallback` — **correcto**.

Para exprimir más:

```ts
// Aumentar timeout idle a 5000 ms en móvil
window.requestIdleCallback(inject, { timeout: 5000 })
```

Opcional (avanzado): cargar GA solo tras primer `scroll` o `pointerdown` (trade-off: menos datos inmediatos).

**No** añadir Google Tag Manager contenedor adicional; el informe ya penaliza GTM (~326 ms hilo principal).

### 6.4 Reflow forzado — `DestacadasCarousel`

**Origen:** `updateScrollState` lee `offsetLeft`, `offsetWidth`, `scrollWidth` en cada scroll.

**Fix:**

```ts
// Agrupar lecturas en requestAnimationFrame; evitar setState si active no cambió
const updateScrollState = () => {
  requestAnimationFrame(() => {
    const el = trackRef.current
    if (!el) return
    // ... lecturas ...
    setActive((prev) => (prev === best ? prev : best))
  })
}
```

Usar `ResizeObserver` en lugar de `window.resize` donde aplique.

---

## 7. Fase 4 — Checklist de verificación

### Antes de cada deploy

- [ ] `npm run build` sin errores
- [ ] `dist/home/index.html` contiene `<link rel="preload" as="image">` del LCP real
- [ ] `dist/home/index.html` contiene `<img>` del banner o indicación clara del LCP
- [ ] Network throttling 4G: **sin descarga de .mp4** en carga inicial de `/home`
- [ ] Primera imagen destacada ≤ 70 KiB

### Lighthouse (Chrome incógnito, móvil)

URL: `https://comunidadescort.cl/home`

| Auditoría | Debe pasar |
|-----------|------------|
| Descubrimiento LCP | ✅ visible en documento inicial |
| `loading=lazy` en LCP | ✅ no |
| `fetchpriority=high` en LCP | ✅ sí |
| Mejorar entrega de imágenes | ✅ ahorro < 50 KiB |
| Caché eficiente | ✅ assets propios 1 año; Supabase público > 7 días |
| Cargas útiles enormes | ✅ total < 1,5 MB en home |
| Solicitudes bloqueantes | ✅ CSS < 100 ms o crítico inline |
| Terceros | ✅ GA < 200 ms hilo principal |

### PageSpeed Insights

Correr 3 veces (mediana). Objetivo:

- Performance **≥ 95**
- LCP **verde**
- Sin regresión SEO / Accesibilidad (mantener ≥ 90)

---

## 8. Archivos del repositorio a modificar

| Prioridad | Archivo | Cambio |
|-----------|---------|--------|
| P0 | `src/features/home/components/HabitacionCardCover.tsx` | Sin `<video>` en listados; poster/placeholder |
| P0 | `src/services/resource.service.ts` | No firmar video en `withSignedCovers`; URLs públicas; variantes; `cacheControl` |
| P0 | `scripts/prerender-seo.mjs` + nuevo `fetch-home-lcp.mjs` | Preload + `<img>` LCP en `/home` |
| P0 | `index.html` | `preconnect` Supabase |
| P1 | `src/lib/supabase-image.ts` (nuevo) | Helper transform / variantes |
| P1 | `src/services/banner.service.ts` | Peso máx. 60 KiB; URL estable sin `Date.now()` |
| P1 | `public/logo-comunidad.webp` | Redimensionar 560×160 |
| P1 | `src/services/publisher.service.ts` | `maxEdge: 160` logos |
| P2 | `vite.config.ts` | Workbox CacheFirst para media pública |
| P2 | `src/features/home/components/DestacadasCarousel.tsx` | rAF + `srcset` slide 0 eager |
| P2 | `src/features/home/components/AnunciosGuidesSection.tsx` | `staleTime` en query publishers |
| P3 | `index.html` | CSS crítico ampliado |

---

## 9. Migraciones / backfill (datos existentes)

### 9.1 Script one-off: regenerar variantes de fotos

Ejecutar desde máquina local con service role (o Edge Function admin):

1. Listar `resource_photos` de habitaciones `is_public=true`
2. Descargar WebP original
3. Generar `-card.webp` (640 px) y reemplazar referencia de listado
4. Re-subir con `cacheControl: '31536000'`

### 9.2 Videos sin poster

1. Identificar resources con `video_url` y sin `photos[0]`
2. Extraer frame → subir como foto portada
3. En UI de admin, exigir foto O poster antes de publicar en home

### 9.3 Banners existentes

Re-exportar desde admin si superan 60 KiB.

---

## 10. CI / Netlify

### Variables necesarias en build (para prerender LCP)

En Netlify → Site settings → Environment:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

El script `fetch-home-lcp.mjs` debe ejecutarse **después** de `vite build` y **antes** o **dentro** de `prerender-seo.mjs`.

### `netlify.toml` — ya correcto para assets propios

Mantener:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

No añadir headers de caché larga a rutas SPA dinámicas (`/feed`, etc.).

---

## 11. Expectativa realista de puntuación

| Escenario | Performance móvil estimado |
|-----------|----------------------------|
| Solo Fase 0 (preconnect + sin video home + logo) | 75–85 |
| Fase 0 + 1 (LCP prerender + banner optimizado) | 88–93 |
| Fase 0–2 completa (imágenes + caché pública) | **93–97** |
| Fase 0–3 completa | **95–100** estable |

> **Nota:** 100 exacto depende de red de prueba, variabilidad de Lighthouse y si hay banner/video en prod ese día. La mediana de 3 corridas es la referencia.

---

## 12. Qué NO hacer

- No lazy-load del elemento LCP (banner o logo).
- No usar `aria-hidden` en contenedores con enlaces/botones (ya corregido en carruseles).
- No subir videos > 5 MB como portada de listado sin poster.
- No depender solo de signed URLs para imágenes públicas indexables.
- No añadir más scripts de terceros en `<head>` sin defer.
- No commitear `supabase/.temp/` ni credenciales service role en scripts.

---

## 13. Referencias internas

| Tema | Ubicación en repo |
|------|-------------------|
| Prerender SEO | `scripts/prerender-seo.mjs`, `scripts/seo-prerender-pages.mjs` |
| Carrusel banner | `src/features/home/components/HomePromoBannerCarousel.tsx` |
| Destacadas | `src/features/home/components/DestacadasCarousel.tsx` |
| Firmado Storage | `src/services/resource.service.ts` (`withSignedCovers`) |
| Conversión WebP | `src/lib/image-webp.ts` |
| Analytics diferido | `src/lib/analytics.ts` |
| Headers Netlify | `netlify.toml` |
| PWA caching | `vite.config.ts` |

---

*Última actualización: marzo 2026 — Comunidadescort.cl*
