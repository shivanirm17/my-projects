// Renders one keepsake page (postcard + decorated canvas, side by side, the
// same layout the Preview screen shows) to a single PNG the user can save —
// a reliable alternative to a native share sheet or a fixed-size PDF page.
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from './constants'
import {
  loadImageEl, fetchMapDataUrl, svgStringToImage, renderDecoCanvas,
  PAPER, PAPER2, INK, MUTED, BORDER, SAGE,
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

async function drawPostcard(ctx, PAGE, PAD, city, whisper, cityCoords) {
  ctx.fillStyle = rgb(PAPER)
  ctx.fillRect(0, 0, PAGE, PAGE)

  let y = PAD
  const mapH = PAGE * 0.28
  const mapDataUrl = await fetchMapDataUrl(whisper, cityCoords)
  if (mapDataUrl) {
    try {
      const mapImg = await loadImageEl(mapDataUrl)
      const cw = PAGE - PAD * 2
      const scale = Math.max(cw / mapImg.width, mapH / mapImg.height)
      const dw = mapImg.width * scale
      const dh = mapImg.height * scale
      ctx.save()
      ctx.beginPath()
      ctx.rect(PAD, y, cw, mapH)
      ctx.clip()
      ctx.filter = 'sepia(0.22) saturate(0.85) contrast(0.95) brightness(1.03)'
      ctx.drawImage(mapImg, PAD - (dw - cw) / 2, y - (dh - mapH) / 2, dw, dh)
      ctx.restore()
    } catch { /* fall through to the plain block below */ }
  }
  if (!mapDataUrl) {
    ctx.fillStyle = '#ece7db'
    ctx.fillRect(PAD, y, PAGE - PAD * 2, mapH)
  }
  y += mapH + PAD * 0.5

  // category stamp, top-right of the map
  try {
    const flower = whisper.flower || 'other'
    const svg = CATEGORY_SVGS[flower] || CATEGORY_SVGS.other
    const stampImg = await svgStringToImage(svg)
    const sz = PAGE * 0.075
    ctx.save()
    ctx.translate(PAGE - PAD - sz / 2, PAD + sz / 2)
    ctx.rotate((5 * Math.PI) / 180)
    ctx.fillStyle = CATEGORY_COLORS[flower] || CATEGORY_COLORS.other
    ctx.drawImage(stampImg, -sz / 2, -sz / 2, sz, sz)
    ctx.restore()
  } catch { /* skip */ }

  // city chip
  ctx.font = `700 ${PAGE * 0.024}px 'DM Sans', sans-serif`
  const chipLabel = (city || '').toUpperCase()
  const chipW = Math.min(ctx.measureText(chipLabel).width + PAGE * 0.045, PAGE * 0.4)
  const chipH = PAGE * 0.045
  ctx.fillStyle = rgb(SAGE)
  ctx.beginPath()
  ctx.roundRect(PAD, y, chipW, chipH, chipH / 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(chipLabel, PAD + chipW / 2 - ctx.measureText(chipLabel).width / 2, y + chipH / 2 + 1)
  y += chipH + PAD * 0.4

  if (whisper.place) {
    ctx.font = `500 ${PAGE * 0.02}px 'DM Sans', sans-serif`
    ctx.fillStyle = rgb(MUTED)
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(whisper.place, PAD, y)
    y += PAGE * 0.032
  }

  ctx.strokeStyle = rgb(BORDER)
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAGE - PAD, y); ctx.stroke()
  y += PAGE * 0.045

  ctx.font = `400 ${PAGE * 0.028}px 'DM Sans', sans-serif`
  ctx.fillStyle = rgb(INK)
  ctx.textBaseline = 'alphabetic'
  const lineH = PAGE * 0.042
  const textLines = wrapText(ctx, whisper.text || '', PAGE - PAD * 2)
  textLines.forEach((line, i) => ctx.fillText(line, PAD, y + i * lineH))

  // footer, pinned to the bottom
  const footY = PAGE - PAD
  ctx.strokeStyle = rgb(BORDER)
  ctx.setLineDash([3, 3])
  ctx.beginPath(); ctx.moveTo(PAD, footY - PAGE * 0.055); ctx.lineTo(PAGE - PAD, footY - PAGE * 0.055); ctx.stroke()
  ctx.setLineDash([])

  ctx.font = `600 ${PAGE * 0.034}px 'Dancing Script', cursive`
  ctx.fillStyle = rgb(INK)
  ctx.fillText(whisper.author || signatureFor(whisper), PAD, footY)

  ctx.font = `400 ${PAGE * 0.018}px 'DM Sans', sans-serif`
  ctx.fillStyle = rgb(MUTED)
  const dateLabel = fmtDate(whisper)
  ctx.fillText(dateLabel, PAGE - PAD - ctx.measureText(dateLabel).width, footY)
}

// → PNG data URL of the two-page spread (postcard left, decorated page right)
export async function renderPageImage({ city, whisper, cityCoords, deco }) {
  const PAGE = 900
  const PAD = 40
  const SPINE = 3
  const canvas = document.createElement('canvas')
  canvas.width = PAGE * 2 + SPINE
  canvas.height = PAGE
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = rgb(BORDER)
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await drawPostcard(ctx, PAGE, PAD, city, whisper, cityCoords)

  const decoDataUrl = await renderDecoCanvas(deco, PAGE, PAGE)
  const decoImg = await loadImageEl(decoDataUrl)
  ctx.drawImage(decoImg, PAGE + SPINE, 0, PAGE, PAGE)

  return canvas.toDataURL('image/png')
}
