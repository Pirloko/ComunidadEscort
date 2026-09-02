/**
 * Post-build: genera HTML estático por ruta SEO (metas + H1 + JSON-LD)
 * para que crawlers lean contenido sin ejecutar JS.
 * Netlify sirve dist/<ruta>/index.html antes del fallback SPA.
 *
 * Uso: node scripts/prerender-seo.mjs  (tras vite build)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ORIGIN, OG_IMAGE, buildSeoPages } from './seo-prerender-pages.mjs'
import { fetchHomeLcp } from './fetch-home-lcp.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const templatePath = path.join(distDir, 'index.html')

function replaceOrInsertMetaName(html, name, content) {
  const re = new RegExp(
    `<meta\\s+[^>]*name=["']${name}["'][^>]*>`,
    'i',
  )
  const tag = `<meta name="${name}" content="${escapeAttr(content)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function replaceOrInsertMetaProperty(html, property, content) {
  const re = new RegExp(
    `<meta\\s+[^>]*property=["']${property}["'][^>]*>`,
    'i',
  )
  const tag = `<meta property="${property}" content="${escapeAttr(content)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function replaceCanonical(html, href) {
  const re = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i
  const tag = `<link rel="canonical" href="${escapeAttr(href)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function replaceTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  }
  return html.replace(/<\/head>/i, `    <title>${escapeHtml(title)}</title>\n  </head>`)
}

function upsertJsonLd(html, data) {
  const cleaned = html.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    '',
  )
  if (!data) return cleaned
  const tag = `    <script type="application/ld+json">${JSON.stringify(data)}</script>`
  return cleaned.replace(/<\/head>/i, `${tag}\n  </head>`)
}

function injectRootBody(html, bodyHtml) {
  // Contenido visible para crawlers; React lo reemplaza al hidratar.
  const replacement = `<div id="root">\n${bodyHtml}\n    </div>`
  if (/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>\s*<script/i.test(html)) {
    return html.replace(
      /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>(\s*<script)/i,
      `${replacement}$1`,
    )
  }
  return html.replace(
    /<div\s+id=["']root["'][^>]*>\s*<\/div>/i,
    replacement,
  )
}

function escapeAttr(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function injectHomeLcp(html, lcp, bodyHtml) {
  let out = html.replace(
    /<link\s+rel=["']preload["']\s+as=["']image["']\s+href=["']\/logo-comunidad\.webp["'][^>]*>\s*/i,
    '',
  )

  const preload = `    <link rel="preload" as="image" href="${escapeAttr(lcp.imageUrl)}" fetchpriority="high" type="image/webp" />`
  out = out.replace(/<\/head>/i, `${preload}\n  </head>`)

  const lcpBlock = `
    <div class="home-lcp-prerender" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden;clip:rect(0,0,0,0)">
      <img src="${escapeAttr(lcp.imageUrl)}" alt="${escapeAttr(lcp.title)}" width="676" height="338" fetchpriority="high" decoding="async" />
    </div>`

  return injectRootBody(out, `${lcpBlock}\n${bodyHtml}`)
}

function applyPage(template, page, homeLcp) {
  const url = `${ORIGIN}${page.path}`
  let html = template
  html = replaceTitle(html, page.title)
  html = replaceOrInsertMetaName(html, 'description', page.description)
  html = replaceOrInsertMetaName(html, 'robots', 'index,follow')
  html = replaceCanonical(html, url)
  html = replaceOrInsertMetaProperty(html, 'og:title', page.title)
  html = replaceOrInsertMetaProperty(html, 'og:description', page.description)
  html = replaceOrInsertMetaProperty(html, 'og:url', url)
  html = replaceOrInsertMetaProperty(html, 'og:image', OG_IMAGE)
  html = replaceOrInsertMetaProperty(html, 'og:type', 'website')
  html = replaceOrInsertMetaProperty(html, 'og:locale', 'es_CL')
  html = replaceOrInsertMetaProperty(html, 'og:site_name', 'Comunidadescort.cl')
  html = replaceOrInsertMetaName(html, 'twitter:card', 'summary')
  html = replaceOrInsertMetaName(html, 'twitter:title', page.title)
  html = replaceOrInsertMetaName(html, 'twitter:description', page.description)
  html = upsertJsonLd(html, page.jsonLd ?? null)

  if (page.path === '/home' && homeLcp) {
    html = injectHomeLcp(html, homeLcp, page.bodyHtml)
  } else {
    html = injectRootBody(html, page.bodyHtml)
  }

  return html
}

function outFileForPath(routePath) {
  const clean = routePath.replace(/^\//, '').replace(/\/$/, '')
  return path.join(distDir, clean, 'index.html')
}

async function main() {
  if (!fs.existsSync(templatePath)) {
    console.error(`[prerender-seo] No existe ${templatePath}. Corre vite build antes.`)
    process.exit(1)
  }

  const homeLcp = await fetchHomeLcp()
  if (homeLcp) {
    console.log(`[prerender-seo] LCP home: ${homeLcp.title}`)
  }

  const template = fs.readFileSync(templatePath, 'utf8')
  const pages = buildSeoPages()
  let written = 0

  for (const page of pages) {
    const outFile = outFileForPath(page.path)
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, applyPage(template, page, homeLcp), 'utf8')
    written += 1
    console.log(`[prerender-seo] ${page.path} → ${path.relative(distDir, outFile)}`)
  }

  console.log(`[prerender-seo] Listo: ${written} páginas SEO.`)
}

main().catch((err) => {
  console.error('[prerender-seo]', err)
  process.exit(1)
})
