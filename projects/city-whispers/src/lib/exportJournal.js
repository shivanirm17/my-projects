import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Renders each .jp-spread (and the cover) inside the hidden #journal-print
// element to a PDF, then returns it as a Blob for sharing/downloading.
export async function exportJournalPDF(title) {
  const container = document.getElementById('journal-print')
  if (!container) throw new Error('journal-print not found')

  try {
    const pages = [
      container.querySelector('.jp-cover'),
      ...container.querySelectorAll('.jp-spread'),
    ].filter(Boolean)

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', compress: true })
    let first = true

    for (const page of pages) {
      const canvas = await html2canvas(page, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.88)
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pw / canvas.width, ph / canvas.height)
      const w = canvas.width * ratio
      const h = canvas.height * ratio
      const x = (pw - w) / 2
      const y = (ph - h) / 2

      if (!first) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', x, y, w, h)
      first = false
    }

    return pdf.output('blob')
  } catch (err) {
    throw err
  }
}

export async function shareJournalPDF(title, selected) {
  const blob = await exportJournalPDF(title)
  const filename = (title || 'journal').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] })
  } else {
    // Fallback: trigger download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}
