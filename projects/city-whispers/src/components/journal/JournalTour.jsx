import { useEffect, useState, useCallback } from 'react'

const LS_KEY = 'cw-journal-tour-seen'

const STEPS = [
  {
    id: 'shelf',
    selector: '.j-shelf-stage',
    text: 'This is your bookshelf — every journal you create lives here as its own keepsake book. Tap one to open it.',
  },
  {
    id: 'new-journal',
    selector: '.j-book-new',
    text: 'Tap "+ New journal" to start one. Give it a name and pick which of your whispers go inside — each whisper becomes a page.',
  },
  {
    id: 'spread',
    icon: '📖',
    text: 'Inside a journal you get a two-page spread: the left shows your whisper as a postcard; the right is your blank canvas to decorate.',
  },
  {
    id: 'decor',
    icon: '✦',
    text: 'Decor — tap the Decor button in the toolbar to open stickers, washi tape strips, and a freehand drawing tool. Tap any item to place it, then drag it anywhere on the page.',
  },
  {
    id: 'photos',
    icon: '📷',
    text: 'Photos — add up to 3 polaroid-style photos per page. Drag them to reposition, and use two fingers to twist and rotate them.',
  },
  {
    id: 'manage',
    icon: '📋',
    text: 'Manage — add more of your whispers as new pages, or remove ones you no longer want. Tap the Manage button in the toolbar.',
  },
  {
    id: 'undo',
    icon: '↩',
    text: 'Undo covers everything — stickers, drawings, photos, and even adding or removing pages. Use the Undo button in the toolbar.',
  },
  {
    id: 'topbar',
    selector: '.j-topbar',
    text: 'Up here: rename your journal, save your work, or download the whole journal as a PDF to keep forever.',
  },
]

function isVisible(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return false
  if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return false
  const s = window.getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
}

export default function JournalTour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(true)

  const current = STEPS[step]

  const measure = useCallback(() => {
    if (!current || !current.selector) { setRect(null); return }
    const el = document.querySelector(current.selector)
    if (!isVisible(el)) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [current])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  function nextStep() {
    let i = step + 1
    while (i < STEPS.length) {
      const s = STEPS[i]
      if (!s.selector) break  // informational steps always shown
      if (isVisible(document.querySelector(s.selector))) break
      i++
    }
    if (i >= STEPS.length) finish()
    else setStep(i)
  }

  function prevStep() {
    for (let i = step - 1; i >= 0; i--) {
      const s = STEPS[i]
      if (!s.selector || isVisible(document.querySelector(s.selector))) { setStep(i); return }
    }
  }

  function finish() {
    setVisible(false)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* private mode */ }
    setTimeout(onClose, 300)
  }

  if (!visible) return null

  const below = rect ? rect.top + rect.height / 2 < window.innerHeight * 0.55 : true
  let cardTop = rect ? (below ? rect.top + rect.height + 16 : undefined) : window.innerHeight / 2 - 110
  let cardBottom = rect && !below ? window.innerHeight - rect.top + 16 : undefined
  if (cardTop != null) cardTop = Math.min(Math.max(cardTop, 16), window.innerHeight - 220)
  if (cardBottom != null) cardBottom = Math.min(Math.max(cardBottom, 16), window.innerHeight - 220)

  return (
    <div className="jt-overlay">
      {rect && (
        <div
          className="jt-ring"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      )}
      <div className="jt-card" style={{ top: cardTop, bottom: cardBottom }}>
        {current?.icon && <div className="jt-step-icon">{current.icon}</div>}
        <div className="jt-step-count">{step + 1} of {STEPS.length}</div>
        <p className="jt-step-text">{current?.text}</p>
        <div className="jt-actions">
          <button className="jt-skip" onClick={finish}>Skip</button>
          <div className="jt-nav">
            <button
              className="jt-back"
              onClick={(e) => { e.currentTarget.blur(); prevStep() }}
              disabled={step === 0}
              aria-label="Previous step"
            >←</button>
            <button
              className="jt-next"
              onClick={(e) => { e.currentTarget.blur(); nextStep() }}
              aria-label={step < STEPS.length - 1 ? 'Next step' : 'Finish tour'}
            >
              {step < STEPS.length - 1 ? '→' : '✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function shouldShowJournalTour() {
  try { return !localStorage.getItem(LS_KEY) } catch { return false }
}
