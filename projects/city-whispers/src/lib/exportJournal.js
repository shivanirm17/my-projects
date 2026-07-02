import jsPDF from 'jspdf'
import { loadDeco } from './journalStore'

// Portrait A4 — renders well in iOS/Android share sheets
const W = 210
const H = 297
const PAD = 20

// Beige paper tones
const PAPER   = [250, 247, 240]
const PAPER2  = [243, 238, 228]
const SAGE    = [157, 184, 151]
const INK     = [60,  52,  40]
const MUTED   = [140, 128, 108]
const BORDER  = [210, 200, 182]

function bg(pdf, color) {
  pdf.setFillColor(...color)
  pdf.rect(0, 0, W, H, 'F')
}

function addCoverPage(pdf, title, pageCount) {
  bg(pdf, PAPER)

  // top sage band
  pdf.setFillColor(...SAGE)
  pdf.rect(0, 0, W, 10, 'F')

  // bottom sage band
  pdf.rect(0, H - 10, W, 10, 'F')

  // decorative corner marks
  pdf.setDrawColor(...SAGE)
  pdf.setLineWidth(0.5)
  const c = 10
  pdf.line(PAD, PAD + c, PAD, PAD)
  pdf.line(PAD, PAD, PAD + c, PAD)
  pdf.line(W - PAD - c, PAD, W - PAD, PAD)
  pdf.line(W - PAD, PAD, W - PAD, PAD + c)
  pdf.line(PAD, H - PAD - c, PAD, H - PAD)
  pdf.line(PAD, H - PAD, PAD + c, H - PAD)
  pdf.line(W - PAD - c, H - PAD, W - PAD, H - PAD)
  pdf.line(W - PAD, H - PAD, W - PAD, H - PAD - c)

  // title block — vertically centred
  const cy = H / 2

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...INK)
  const titleLines = pdf.splitTextToSize(title || 'My Journal', W - PAD * 2 - 20)
  pdf.text(titleLines, W / 2, cy - (titleLines.length - 1) * 8, { align: 'center' })

  // thin rule
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.4)
  pdf.line(W / 2 - 24, cy + 12, W / 2 + 24, cy + 12)

  // memory count
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...MUTED)
  pdf.text(
    `${pageCount} ${pageCount === 1 ? 'memory' : 'memories'}`,
    W / 2, cy + 22, { align: 'center' }
  )

  // city-whispers wordmark at bottom
  pdf.setFontSize(8)
  pdf.setTextColor(200, 192, 176)
  pdf.text('city whispers', W / 2, H - 14, { align: 'center' })
}

async function addMemoryPage(pdf, city, whisper) {
  const deco = loadDeco(whisper.id)
  const photos = deco?.photos || []

  bg(pdf, PAPER)

  // left sage accent strip
  pdf.setFillColor(...SAGE)
  pdf.rect(0, 0, 5, H, 'F')

  let y = PAD + 6

  // city chip
  pdf.setFillColor(...SAGE)
  pdf.roundedRect(PAD + 4, y - 5, 40, 8, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.setTextColor(255, 255, 255)
  pdf.text((city || '').toUpperCase(), PAD + 4 + 20, y + 0.5, { align: 'center' })
  y += 12

  // place
  if (whisper.place) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...MUTED)
    pdf.text(whisper.place, PAD + 4, y)
    y += 7
  }

  // divider
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(PAD + 4, y, W - PAD, y)
  y += 8

  // whisper text — main body
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(...INK)
  const textLines = pdf.splitTextToSize(whisper.text || '', W - PAD * 2 - 4)
  pdf.text(textLines, PAD + 4, y)
  y += textLines.length * 6.5 + 10

  // photos as polaroids
  if (photos.length > 0) {
    const cols = photos.length === 1 ? 1 : 2
    const photoW = cols === 1 ? 100 : (W - PAD * 2 - 4 - 8) / 2
    const photoH = photoW * 0.75
    const frameW = photoW + 6
    const frameH = photoH + 14

    for (let i = 0; i < Math.min(photos.length, 4); i++) {
      try {
        const col = i % cols
        const row = Math.floor(i / cols)
        const px = PAD + 4 + col * (frameW + 6)
        const py = y + row * (frameH + 6)
        if (py + frameH > H - PAD - 16) break

        // polaroid
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(...BORDER)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(px, py, frameW, frameH, 1, 1, 'FD')
        pdf.addImage(photos[i], 'JPEG', px + 3, py + 3, photoW, photoH)
      } catch { /* skip */ }
    }
    y += Math.ceil(Math.min(photos.length, 4) / cols) * (photoW * 0.75 + 14 + 6) + 4
  }

  // caption
  if (deco?.caption) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    pdf.setTextColor(...MUTED)
    const capLines = pdf.splitTextToSize(deco.caption, W - PAD * 2 - 4)
    pdf.text(capLines, PAD + 4, Math.min(y, H - PAD - 14))
  }

  // footer: author + date
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...MUTED)
  if (whisper.author) pdf.text(`— ${whisper.author}`, PAD + 4, H - PAD)
  const timeStr = whisper.time || ''
  if (timeStr) pdf.text(timeStr, W - PAD, H - PAD, { align: 'right' })
}

export async function shareJournalPDF(title, selected) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  addCoverPage(pdf, title, selected.length)

  for (const { city, w } of selected) {
    pdf.addPage()
    await addMemoryPage(pdf, city, w)
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
