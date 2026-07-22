// Renders one keepsake page (postcard + decorated canvas, side by side, the
// same layout the Preview screen shows) to a single PNG the user can save —
// a reliable alternative to a native share sheet or a fixed-size PDF page.
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from './constants'
import {
  loadImageEl, fetchMapDataUrl, svgStringToImage, renderDecoCanvas,
  PAPER, INK, MUTED, BORDER,
} from './exportJournal'

const rgb = (c) => `rgb(${c.join(',')})`

function fmtDate(w) {
  if (w.created_at) {
    const d = new Date(w.created_at)
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return w.time || ''
}

function wrapText(ctx, text, maxWidth) {
  const words = (text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// the brand teardrop pin (matches JournalMap.jsx / MapView.jsx)
const PIN_PATH_OUTER = 'M0 -9.5 C4.5 -9.5 7 -6 7 -3 C7 1.5 0 9 0 9 C0 9 -7 1.5 -7 -3 C-7 -6 -4.5 -9.5 0 -9.5 Z'
const PIN_PATH_INNER = 'M0 2.7 C-2.2 1 -3.2 -0.2 -3.2 -1.4 C-3.2 -2.3 -2.5 -3 -1.6 -3 C-1 -3 -0.4 -2.6 0 -2 C0.4 -2.6 1 -3 1.6 -3 C2.5 -3 3.2 -2.3 3.2 -1.4 C3.2 -0.2 2.2 1 0 2.7 Z'

// currentColor only resolves against an ancestor's CSS `color`, which is lost
// once the SVG is rasterised standalone — set it directly on the root instead
function withColor(svgHtml, color) {
  return svgHtml.includes('<svg ')
    ? svgHtml.replace('<svg ', `<svg style="color:${color}" `)
    : svgHtml
}

async function drawPostcard(ctx, PAGE, city, whisper, cityCoords) {
  const S = PAGE / 400 // CSS px → canvas px, calibrated against the live page's own layout
  const PAD_X = 24 * S
  const PAD_TOP = 26 * S
  const PAD_BOTTOM = 22 * S

  ctx.fillStyle = rgb(PAPER)
  ctx.fillRect(0, 0, PAGE, PAGE)

  // ── reserve fixed-height rows first; the map fills whatever's left, same as
  //    the live page's flex layout (map is flex:1, everything else is auto) ──
  const placeH = whisper.place ? 11 * S + 8 * S : 0
  ctx.font = `400 ${16 * S}px 'DM Sans', sans-serif`
  const lineH = 16 * 1.55 * S
  const textLines = wrapText(ctx, whisper.text || '', PAGE - PAD_X * 2)
  const textH = textLines.length * lineH
  const footH = 18 * S + 12 * S + 26 * S

  const mapTop = PAD_TOP
  const mapH = Math.max(PAGE * 0.22, PAGE - PAD_TOP - PAD_BOTTOM - placeH - textH - footH)
  const mapW = PAGE - PAD_X * 2

  // ── map, cropped to fill its box, sepia-aged like the live page ──
  const mapDataUrl = await fetchMapDataUrl(whisper, cityCoords)
  ctx.save()
  ctx.beginPath()
  ctx.rect(PAD_X, mapTop, mapW, mapH)
  ctx.clip()
  if (mapDataUrl) {
    try {
      const mapImg = await loadImageEl(mapDataUrl)
      const scale = Math.max(mapW / mapImg.width, mapH / mapImg.height)
      const dw = mapImg.width * scale
      const dh = mapImg.height * scale
      ctx.filter = 'sepia(0.22) saturate(0.85) contrast(0.95) brightness(1.03)'
      ctx.drawImage(mapImg, PAD_X + (mapW - dw) / 2, mapTop + (mapH - dh) / 2, dw, dh)
      ctx.filter = 'none'
    } catch { /* fall through to the plain block below */ }
  }
  if (!mapDataUrl) {
    ctx.fillStyle = '#ece7db'
    ctx.fillRect(PAD_X, mapTop, mapW, mapH)
  }
  // aged-paper fade, matches .jm-fade
  const grad = ctx.createRadialGradient(
    PAD_X + mapW / 2, mapTop + mapH * 0.45, mapH * 0.1,
    PAD_X + mapW / 2, mapTop + mapH * 0.45, mapH * 0.75,
  )
  grad.addColorStop(0.55, 'rgba(110,95,72,0)')
  grad.addColorStop(1, 'rgba(110,95,72,0.20)')
  ctx.globalAlpha = 0.28
  ctx.fillStyle = grad
  ctx.fillRect(PAD_X, mapTop, mapW, mapH)
  ctx.globalAlpha = 1
  // the pin, dead centre
  ctx.save()
  ctx.translate(PAD_X + mapW / 2, mapTop + mapH / 2)
  ctx.scale(1.6 * S, 1.6 * S)
  ctx.fillStyle = '#bd8163'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 0.9
  ctx.fill(new Path2D(PIN_PATH_OUTER))
  ctx.stroke(new Path2D(PIN_PATH_OUTER))
  ctx.fillStyle = '#fff'
  ctx.fill(new Path2D(PIN_PATH_INNER))
  ctx.restore()
  ctx.restore()

  // ── category stamp, overlapping the map's top-right corner ──
  try {
    const flower = whisper.flower || 'other'
    const color = CATEGORY_COLORS[flower] || CATEGORY_COLORS.other
    const stampImg = await svgStringToImage(withColor(CATEGORY_SVGS[flower] || CATEGORY_SVGS.other, color))
    const sz = 40 * S
    ctx.save()
    ctx.translate(PAGE - 18 * S - sz / 2, 18 * S + sz / 2)
    ctx.rotate((5 * Math.PI) / 180)
    ctx.shadowColor = 'rgba(125,147,122,0.3)'
    ctx.shadowBlur = 3 * S
    ctx.drawImage(stampImg, -sz / 2, -sz / 2, sz, sz)
    ctx.restore()
  } catch { /* skip */ }

  // ── postmark seal, just left of the stamp ──
  {
    const r = 25 * S
    const cx = PAGE - 44 * S - r
    const cy = 16 * S + r
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((-8 * Math.PI) / 180)
    ctx.strokeStyle = 'rgba(159,179,209,0.6)'
    ctx.lineWidth = 1.5 * S
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#9fb3d1'
    ctx.textAlign = 'center'
    ctx.font = `700 ${6.5 * S}px 'DM Sans', sans-serif`
    const cityLabel = (city || '').toUpperCase().slice(0, 12)
    ctx.fillText(cityLabel, 0, -4 * S)
    const time = whisper.time || ''
    if (time) {
      ctx.font = `400 ${6 * S}px 'DM Sans', sans-serif`
      const tw = Math.min(ctx.measureText(time).width + 4 * S, r * 1.5)
      ctx.strokeStyle = '#9fb3d1'
      ctx.lineWidth = 0.6 * S
      ctx.beginPath(); ctx.moveTo(-tw / 2, 3 * S); ctx.lineTo(tw / 2, 3 * S); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-tw / 2, 9 * S); ctx.lineTo(tw / 2, 9 * S); ctx.stroke()
      ctx.fillText(time.slice(0, 14), 0, 7.5 * S)
    }
    ctx.restore()
  }

  // ── place, text, footer — normal flow below the map ──
  let y = mapTop + mapH + 8 * S
  ctx.textAlign = 'left'
  if (whisper.place) {
    ctx.font = `700 ${11 * S}px 'DM Sans', sans-serif`
    ctx.fillStyle = rgb([180, 130, 90]) // var(--brown) approx
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(whisper.place.toUpperCase(), PAD_X, y + 11 * S)
    y += 11 * S + 8 * S
  }

  ctx.font = `400 ${16 * S}px 'DM Sans', sans-serif`
  ctx.fillStyle = rgb(INK)
  ctx.textBaseline = 'alphabetic'
  textLines.forEach((line, i) => ctx.fillText(line, PAD_X, y + 16 * S + i * lineH))
  y += textH

  // footer, right after the text (no forced bottom-pinning — matches live layout)
  y += 18 * S
  ctx.strokeStyle = rgb(BORDER)
  ctx.setLineDash([3 * S, 3 * S])
  ctx.beginPath(); ctx.moveTo(PAD_X, y); ctx.lineTo(PAGE - PAD_X, y); ctx.stroke()
  ctx.setLineDash([])
  y += 12 * S

  ctx.font = `600 ${22 * S}px 'Dancing Script', cursive`
  ctx.fillStyle = rgb(INK)
  ctx.fillText(whisper.author || signatureFor(whisper), PAD_X, y + 20 * S)

  ctx.font = `400 ${11 * S}px 'DM Sans', sans-serif`
  ctx.fillStyle = rgb(MUTED)
  const dateLabel = fmtDate(whisper)
  ctx.fillText(dateLabel, PAGE - PAD_X - ctx.measureText(dateLabel).width, y + 20 * S)
}

// → PNG data URL of the two-page spread (postcard left, decorated page right)
export async function renderPageImage({ city, whisper, cityCoords, deco }) {
  const PAGE = 900
  const SPINE = 3
  const canvas = document.createElement('canvas')
  canvas.width = PAGE * 2 + SPINE
  canvas.height = PAGE
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = rgb(BORDER)
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await drawPostcard(ctx, PAGE, city, whisper, cityCoords)

  const decoDataUrl = await renderDecoCanvas(deco, PAGE, PAGE)
  const decoImg = await loadImageEl(decoDataUrl)
  ctx.drawImage(decoImg, PAGE + SPINE, 0, PAGE, PAGE)

  return canvas.toDataURL('image/png')
}
