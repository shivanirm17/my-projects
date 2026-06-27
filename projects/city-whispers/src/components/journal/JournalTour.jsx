import { useEffect, useState, useCallback } from 'react'

const LS_KEY = 'cw-journal-tour-seen'

// Steps: selector targets elements inside the journal overlay.
// phase 'shelf' steps only show when on the shelf; 'edit' when in a journal.
// No phase = always visible.
const STEPS = [
  {
    id: 'celebrate',
    celebrate: true,
    text: null, // rendered specially
  },
  {
    id: 'shelf',
    selector: '.j-shelf-stage',
    text: 'This is your bookshelf. Every journal you create lives here as its own little book.',
  },
  {
    id: 'new-journal',
    selector: '.j-book-new',
    text: 'Tap "+ New journal" to start your first keepsake — give it a name, then pick which of your whispers go inside.',
  },
  {
    id: 'toolbar',
    selector: '.j-toolbar',
    text: 'Decorate each page with stickers, tape, photos and hand-drawn doodles — all from this toolbar.',
  },
  {
    id: 'undo',
    selector: '.j-tool-hist',
    text: 'Changed your mind? Undo covers everything — decorations, drawings, even adding or removing pages.',
  },
  {
    id: 'topbar',
    selector: '.j-topbar',
    text: 'Name your journal, save it, or manage pages and add more whispers — all up here.',
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

// Floating confetti particles for the celebration step
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  return (
    <div className="jt-confetti" aria-hidden="true">
      {pieces.map((i) => (
        <div key={i} className="jt-petal" style={{ '--i': i }} />
      ))}
    </div>
  )
}

export default function JournalTour({ onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(true)

  const current = STEPS[step]

  const measure = useCallback(() => {
    if (!current || current.celebrate) { setRect(null); return }
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

  function next() {
    // find next step whose target is visible (or celebrate/no-selector)
    let i = step + 1
    while (i < STEPS.length) {
      const s = STEPS[i]
      if (s.celebrate || !s.selector) break
      if (isVisible(document.querySelector(s.selector))) break
      i++
    }
    if (i >= STEPS.length) finish()
    else setStep(i)
  }

  function finish() {
    setVisible(false)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* private mode */ }
    setTimeout(onClose, 300)
  }

  if (!visible) return null

  const isCelebrate = current?.celebrate
  const below = rect ? rect.top + rect.height / 2 < window.innerHeight * 0.55 : true
  let cardTop = rect
    ? below ? rect.top + rect.height + 16 : undefined
    : window.innerHeight / 2 - 110
  let cardBottom = rect && !below ? window.innerHeight - rect.top + 16 : undefined
  if (cardTop != null) cardTop = Math.min(Math.max(cardTop, 16), window.innerHeight - 220)
  if (cardBottom != null) cardBottom = Math.min(Math.max(cardBottom, 16), window.innerHeight - 220)

  return (
    <div className={'jt-overlay' + (isCelebrate ? ' jt-celebrate' : '')}>
      {isCelebrate && <Confetti />}
      {rect && !isCelebrate && (
        <div
          className="jt-ring"
          style={{
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
          }}
        />
      )}
      <div className="jt-card" style={isCelebrate ? {} : { top: cardTop, bottom: cardBottom }}>
        {isCelebrate ? (
          <>
            <div className="jt-celebrate-icon">📖</div>
            <h2 className="jt-celebrate-title">Your Journal is here!</h2>
            <p className="jt-celebrate-body">
              Collect the memories you've whispered across the world into beautiful keepsake books — decorate them, save them, hold onto them forever.
            </p>
            <button className="jt-btn-primary" onClick={next}>Take the tour →</button>
            <button className="jt-btn-skip" onClick={finish}>Skip</button>
          </>
        ) : (
          <>
            <div className="jt-step-count">{step} of {STEPS.length - 1}</div>
            <p className="jt-step-text">{current?.text}</p>
            <div className="jt-actions">
              <button className="jt-btn-skip" onClick={finish}>Skip</button>
              <button className="jt-btn-primary" onClick={next}>
                {step < STEPS.length - 1 ? 'Next →' : 'Done ✓'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function shouldShowJournalTour() {
  try { return !localStorage.getItem(LS_KEY) } catch { return false }
}
