/** Convierte una imagen (JPG/PNG/WebP) a WebP vía canvas del navegador. */

const DEFAULT_MAX_EDGE = 1600
const DEFAULT_QUALITY = 0.82
const WATERMARK_TEXT = 'Comunidadescort.cl'

export type ImageToWebpOptions = {
  maxEdge?: number
  quality?: number
  /** Tamaño máximo del archivo de salida en bytes (reintenta con menor quality). */
  maxOutputBytes?: number
  /** Si true, dibuja marca de agua en el archivo. Default false (el sello de habitaciones es CSS). */
  watermark?: boolean
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('El navegador no pudo generar WebP'))
        else resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

/** Una sola marca: esquina inferior derecha (sin overlays CSS encima). */
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(16, Math.round(Math.min(width, height) * 0.042))
  ctx.save()
  ctx.font = `700 ${fontSize}px Archivo, system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  const pad = Math.round(fontSize * 0.9)
  const x = width - pad
  const y = height - pad
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 9))
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
  ctx.strokeText(WATERMARK_TEXT, x, y)
  ctx.fillText(WATERMARK_TEXT, x, y)
  ctx.restore()
}

/**
 * Acepta image/jpeg, image/png o image/webp y devuelve un File `.webp` optimizado
 * con marca de agua opcional Comunidadescort (watermark: true).
 */
export async function convertImageToWebp(
  file: File,
  options: ImageToWebpOptions = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE
  const maxOutputBytes = options.maxOutputBytes ?? 2.5 * 1024 * 1024
  let quality = options.quality ?? DEFAULT_QUALITY
  const withWatermark = options.watermark === true

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WebP.')
  }

  const img = await loadImage(file)
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el canvas')
  ctx.drawImage(img, 0, 0, width, height)
  if (withWatermark) drawWatermark(ctx, width, height)

  let blob = await canvasToWebpBlob(canvas, quality)
  while (blob.size > maxOutputBytes && quality > 0.45) {
    quality = Math.max(0.45, quality - 0.1)
    blob = await canvasToWebpBlob(canvas, quality)
  }

  if (blob.size > maxOutputBytes) {
    throw new Error('La imagen sigue siendo demasiado grande tras optimizar. Prueba otra más liviana.')
  }

  const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() })
}
