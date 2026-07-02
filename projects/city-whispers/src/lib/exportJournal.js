import jsPDF from 'jspdf'
import { loadDeco } from './journalStore'
import { STICKER_SVG, TAPE_STYLE } from '../components/journal/decoConstants'

// Portrait A4 in mm
const W = 210
const H = 297
const PAD = 18

// Colour palette (matches app CSS vars)
const PAPER   = [250, 247, 240]
const PAPER2  = [243, 238, 228]
const SAGE    = [157, 184, 151]
const INK     = [60,  52,  40]
const MUTED   = [140, 128, 108]
const BORDER  = [210, 200, 182]

// ── helpers ────────────────────────────────────────────────────────────────

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function svgStringToImage(svgHtml) {
  // ensure xmlns so the browser can load it as an external image
  const xml = svgHtml.includes('xmlns')
    ? svgHtml
    : svgHtml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  const blob = new Blob([xml], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    return await loadImageEl(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Pull the first rgba/rgb/hex from a CSS value (gradient or solid)
function extractColor(cssStyle) {
  const m = cssStyle.match(/rgba?\([^)]+\)/)
  if (m) return m[0]
  const hex = cssStyle.match(/#[0-9a-fA-F]{3,6}/)
  if (hex) return hex[0]
  return 'rgba(180,165,145,0.55)'
}

// ── deco canvas ─────────────────────────────────────────────────────────────
// Renders the right-page decorations to an offscreen canvas at a target
// pixel size and returns the data URL.

async function renderDecoCanvas(deco, pxW, pxH) {
  const canvas = document.createElement('canvas')
  canvas.width  = pxW
  canvas.height = pxH
  const ctx = canvas.getContext('2d')

  // paper background
  ctx.fillStyle = `rgb(${PAPER2.join(',')})`
  ctx.fillRect(0, 0, pxW, pxH)

  const { items = [], strokes = [] } = deco || {}

  // ── freehand strokes (SVG path `d` strings; viewBox 0 0 100 100) ──
  if (strokes.length > 0) {
    ctx.save()
    // map SVG 0-100 coordinate space to pixel dimensions
    ctx.scale(pxW / 100, pxH / 100)
    for (const s of strokes) {
      ctx.beginPath()
      ctx.strokeStyle = s.color
      // lineWidth in scaled space: 2 SVG-units ≈ 2 * (pxW/100) px → reasonable
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke(new Path2D(s.d))
    }
    ctx.restore()
  }

  // ── placed items ──
  for (const item of items) {
    const cx = (item.x / 100) * pxW
    const cy = (item.y / 100) * pxH
    const rotRad = ((item.rot || 0) * Math.PI) / 180

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotRad)

    if (item.kind === 'photo') {
      try {
        const img = await loadImageEl(item.value)
        const iw = ((item.w || 60) / 100) * pxW
        const ih = (img.naturalHeight / img.naturalWidth) * iw
        const pad = Math.round(iw * 0.06)
        const foot = Math.round(iw * 0.12)
        // drop shadow
        ctx.shadowColor = 'rgba(0,0,0,0.18)'
        ctx.shadowBlur = 14
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 4
        // white polaroid frame
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(-iw / 2 - pad, -ih / 2 - pad, iw + pad * 2, ih + pad * 2 + foot)
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)
      } catch { /* skip missing/broken photo */ }

    } else if (item.kind === 'sticker') {
      try {
        const svg = STICKER_SVG[item.value]
        if (svg) {
          const img = await svgStringToImage(svg)
          const sz = pxW * 0.16
          ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz)
        }
      } catch { /* skip */ }

    } else if (item.kind === 'tape') {
      const style = TAPE_STYLE[item.value] || item.value
      const color = extractColor(style)
      const tw = pxW * 0.36
      const th = pxH * 0.055
      ctx.globalAlpha = 0.78
      ctx.fillStyle = color
      // rounded tape strip
      const r = th / 2
      ctx.beginPath()
      ctx.moveTo(-tw / 2 + r, -th / 2)
      ctx.arcTo( tw / 2,  -th / 2,  tw / 2,  th / 2, r)
      ctx.arcTo( tw / 2,   th / 2, -tw / 2,  th / 2, r)
      ctx.arcTo(-tw / 2,   th / 2, -tw / 2, -th / 2, r)
      ctx.arcTo(-tw / 2,  -th / 2,  tw / 2, -th / 2, r)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.88)
}

// ── PDF pages ───────────────────────────────────────────────────────────────

function addCoverPage(pdf, title, pageCount) {
  pdf.setFillColor(...PAPER)
  pdf.rect(0, 0, W, H, 'F')

  pdf.setFillColor(...SAGE)
  pdf.rect(0, 0, W, 10, 'F')
  pdf.rect(0, H - 10, W, 10, 'F')

  // corner brackets
  const c = 10
  pdf.setDrawColor(...SAGE)
  pdf.setLineWidth(0.5)
  ;[[PAD,PAD],[W-PAD,PAD],[PAD,H-PAD],[W-PAD,H-PAD]].forEach(([x,y]) => {
    const sx = x === PAD ? 1 : -1
    const sy = y === PAD ? 1 : -1
    pdf.line(x, y, x + sx*c, y)
    pdf.line(x, y, x, y + sy*c)
  })

  const cy = H / 2
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...INK)
  const tl = pdf.splitTextToSize(title || 'My Journal', W - PAD * 2 - 16)
  pdf.text(tl, W / 2, cy - (tl.length - 1) * 8, { align: 'center' })

  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.4)
  pdf.line(W / 2 - 24, cy + 12, W / 2 + 24, cy + 12)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...MUTED)
  pdf.text(`${pageCount} ${pageCount === 1 ? 'memory' : 'memories'}`, W / 2, cy + 22, { align: 'center' })

  pdf.setFontSize(8)
  pdf.setTextColor(200, 192, 176)
  pdf.text('city whispers', W / 2, H - 14, { align: 'center' })
}

async function addMemoryPage(pdf, city, whisper, journalId) {
  const deco = loadDeco(journalId, whisper.id)

  pdf.setFillColor(...PAPER)
  pdf.rect(0, 0, W, H, 'F')

  // ── TOP HALF: left-page text content ──
  const textH = H * 0.45   // ~133mm
  let y = PAD + 6

  // city chip
  pdf.setFillColor(...SAGE)
  const chipW = Math.min(pdf.getStringUnitWidth(city || '') * 7 + 16, 80)
  pdf.roundedRect(PAD, y - 5, chipW, 8, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(255, 255, 255)
  pdf.text((city || '').toUpperCase(), PAD + chipW / 2, y + 0.5, { align: 'center' })
  y += 12

  // place
  if (whisper.place) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...MUTED)
    pdf.text(whisper.place, PAD, y)
    y += 7
  }

  // divider
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(PAD, y, W - PAD, y)
  y += 8

  // whisper text (body)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(...INK)
  const textLines = pdf.splitTextToSize(whisper.text || '', W - PAD * 2)
  pdf.text(textLines, PAD, y)
  y += textLines.length * 7

  // author + date
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  if (whisper.author) pdf.text(`— ${whisper.author}`, PAD, textH - 6)
  if (whisper.time) pdf.text(String(whisper.time), W - PAD, textH - 6, { align: 'right' })

  // horizontal rule separating text from deco
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.4)
  pdf.line(PAD, textH, W - PAD, textH)

  // ── BOTTOM HALF: right-page deco canvas ──
  const decoY = textH + 4
  const decoH = H - decoY - 6   // ~154mm
  const decoMm = { x: PAD, y: decoY, w: W - PAD * 2, h: decoH }

  // render at 2× resolution for sharpness
  const pxW = Math.round(decoMm.w * 5)   // ~870px
  const pxH = Math.round(decoMm.h * 5)   // ~770px

  try {
    const dataUrl = await renderDecoCanvas(deco, pxW, pxH)
    pdf.addImage(dataUrl, 'JPEG', decoMm.x, decoMm.y, decoMm.w, decoMm.h)
  } catch (err) {
    // fallback: just leave the paper background
    console.warn('deco render failed', err)
    pdf.setFillColor(...PAPER2)
    pdf.rect(decoMm.x, decoMm.y, decoMm.w, decoMm.h, 'F')
  }

  // page number / city footer
  pdf.setFontSize(8)
  pdf.setTextColor(200, 192, 176)
  pdf.text('city whispers', W / 2, H - 3, { align: 'center' })
}

// ── entry point ──────────────────────────────────────────────────────────────

export async function shareJournalPDF(title, selected, journalId) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  addCoverPage(pdf, title, selected.length)

  for (const { city, w } of selected) {
    pdf.addPage()
    await addMemoryPage(pdf, city, w, journalId)
  }

  const blob = pdf.output('blob')
  const filename = (title || 'journal').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] })
  } else if (navigator.share) {
    await navigator.share({ title, text: `My journal: ${title}` })
  } else {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
}
