import jsPDF from 'jspdf'
import { loadDeco } from './journalStore'

const W = 297  // A4 landscape width mm
const H = 210  // A4 landscape height mm
const MID = W / 2

function hex(cssVar) {
  // resolve a CSS variable to a hex color, fallback to safe defaults
  const val = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  return val || '#5a4f3a'
}

function addCoverPage(pdf, title, pageCount) {
  pdf.setFillColor(250, 247, 240)
  pdf.rect(0, 0, W, H, 'F')

  // spine strip
  pdf.setFillColor(157, 184, 151)
  pdf.rect(MID - 3, 0, 6, H, 'F')

  // title
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(36)
  pdf.setTextColor(60, 52, 40)
  pdf.text(title || 'My Journal', W / 2, H / 2 - 10, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(130, 120, 100)
  pdf.text(`${pageCount} ${pageCount === 1 ? 'memory' : 'memories'}`, W / 2, H / 2 + 8, { align: 'center' })
}

async function addSpread(pdf, city, whisper) {
  const deco = loadDeco(whisper.id)

  // backgrounds
  pdf.setFillColor(250, 247, 240)
  pdf.rect(0, 0, MID - 3, H, 'F')
  pdf.setFillColor(245, 241, 232)
  pdf.rect(MID + 3, 0, MID - 3, H, 'F')

  // spine
  pdf.setFillColor(157, 184, 151)
  pdf.rect(MID - 3, 0, 6, H, 'F')

  // ── LEFT PAGE: whisper content ──
  const lx = 18
  let ly = 22

  // city name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(90, 79, 58)
  pdf.text(city || '', lx, ly)
  ly += 9

  // place
  if (whisper.place) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(140, 128, 108)
    pdf.text(whisper.place, lx, ly)
    ly += 7
  }

  // divider
  pdf.setDrawColor(200, 190, 172)
  pdf.setLineWidth(0.3)
  pdf.line(lx, ly, MID - 18, ly)
  ly += 8

  // whisper text
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(60, 52, 40)
  const lines = pdf.splitTextToSize(whisper.text || '', MID - 36)
  pdf.text(lines, lx, ly)
  ly += lines.length * 6 + 6

  // author + date
  pdf.setFontSize(9)
  pdf.setTextColor(140, 128, 108)
  if (whisper.author) pdf.text(`— ${whisper.author}`, lx, H - 18)
  if (whisper.time) pdf.text(whisper.time, MID - 18, H - 18, { align: 'right' })

  // ── RIGHT PAGE: photos ──
  const photos = deco?.photos || []
  if (photos.length > 0) {
    const rx = MID + 12
    const availW = MID - 24
    const photoW = Math.min(availW, 70)
    const photoH = photoW * 0.75

    for (let i = 0; i < Math.min(photos.length, 3); i++) {
      try {
        const px = rx + (i % 2) * (photoW + 8)
        const py = 18 + Math.floor(i / 2) * (photoH + 12)
        // polaroid frame
        pdf.setFillColor(255, 255, 255)
        pdf.roundedRect(px - 4, py - 4, photoW + 8, photoH + 18, 2, 2, 'F')
        pdf.addImage(photos[i], 'JPEG', px, py, photoW, photoH)
      } catch { /* skip bad photo */ }
    }
  }

  // caption
  if (deco?.caption) {
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    pdf.setTextColor(110, 100, 82)
    pdf.text(deco.caption, MID + 12, H - 18, { maxWidth: MID - 24 })
  }
}

export async function shareJournalPDF(title, selected) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  addCoverPage(pdf, title, selected.length)

  for (const { city, w } of selected) {
    pdf.addPage()
    await addSpread(pdf, city, w)
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
