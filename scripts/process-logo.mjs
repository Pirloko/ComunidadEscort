import sharp from 'sharp'
import { unlinkSync } from 'node:fs'

function sat(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b)
}
function lum(r, g, b) {
  return (r + g + b) / 3
}

async function process(input, output, mode = 'lightBg') {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const px = Buffer.from(data)
  const w = info.width
  const h = info.height

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const s = sat(r, g, b)
    const L = lum(r, g, b)

    if (mode === 'darkBg') {
      if (L < 28 && s < 15) {
        px[i + 3] = 0
        continue
      }
      if (L < 48 && s < 18) {
        px[i + 3] = Math.round((L / 48) * 255)
      }
      continue
    }

    if (s >= 28) continue
    if (L >= 245) continue
    if (L >= 150) {
      if (L < 175 && s < 20) {
        px[i + 3] = Math.round(((175 - L) / 25) * 180)
      } else {
        px[i + 3] = 0
      }
      continue
    }
    if (L >= 80 && s < 18) {
      px[i + 3] = 0
    }
  }

  const setA = (x, y, a) => {
    px[(y * w + x) * 4 + 3] = a
  }
  const isKillCandidate = (x, y) => {
    const i = (y * w + x) * 4
    if (px[i + 3] === 0) return true
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    const s = sat(r, g, b)
    const L = lum(r, g, b)
    if (s >= 30) return false
    if (L >= 245) return false
    return L >= 140 && s < 30
  }
  const stack = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ]
  const seen = new Uint8Array(w * h)
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const idx = y * w + x
    if (seen[idx]) continue
    seen[idx] = 1
    if (!isKillCandidate(x, y)) continue
    setA(x, y, 0)
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  let count = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 16) {
        count++
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  const pad = 6
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(w - 1, maxX + pad)
  maxY = Math.min(h - 1, maxY + pad)
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const cropped = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((minY + y) * w + (minX + x)) * 4
      const di = (y * cw + x) * 4
      cropped[di] = px[si]
      cropped[di + 1] = px[si + 1]
      cropped[di + 2] = px[si + 2]
      cropped[di + 3] = px[si + 3]
    }
  }
  await sharp(cropped, { raw: { width: cw, height: ch, channels: 4 } })
    .png()
    .toFile(output)
  console.log(output, `${cw}x${ch}`, 'content pixels', count)
}

const gen =
  '/Users/pirloko/.cursor/projects/Users-pirloko-Desktop-comunidadEsocrt/assets/logo-comunidad-generated.png'
const iconGen =
  '/Users/pirloko/.cursor/projects/Users-pirloko-Desktop-comunidadEsocrt/assets/logo-icon-generated.png'
const orig =
  '/Users/pirloko/.cursor/projects/Users-pirloko-Desktop-comunidadEsocrt/assets/logoComunidad-924d88b8-37b3-4e09-93bd-0f43a27d5432.png'

await process(gen, 'public/logo-comunidad.png', 'lightBg')

{
  const { data, info } = await sharp('public/logo-comunidad.png')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const px = Buffer.from(data)
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 10) continue
    if (px[i] > 210 && px[i + 1] > 210 && px[i + 2] > 210) {
      px[i] = 22
      px[i + 1] = 22
      px[i + 2] = 26
    }
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile('public/logo-comunidad-light.png')
  console.log('light ok', info.width, info.height)
}

await process(iconGen, 'public/_logo-icon-tmp.png', 'lightBg')
await sharp('public/_logo-icon-tmp.png')
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('public/logo-icon.png')
unlinkSync('public/_logo-icon-tmp.png')

await process(orig, 'public/logo-comunidad-original-transparent.png', 'darkBg')

for (const f of [
  'public/logo-comunidad.png',
  'public/logo-comunidad-light.png',
  'public/logo-icon.png',
  'public/logo-comunidad-original-transparent.png',
]) {
  const m = await sharp(f).metadata()
  const { data } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  console.log(f, `${m.width}x${m.height}`, 'cornerRGBA', data[0], data[1], data[2], data[3])
}
