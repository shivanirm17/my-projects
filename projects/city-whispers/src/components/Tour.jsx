import { useEffect, useState } from 'react'

// A gentle first-visit tour: dims the page and spotlights one thing at a time.
// Each step lists candidate targets; the first visible one wins, so the tour
// adapts to mobile (where some controls live in the drawer).
const STEPS = [
  {
    candidates: [
      { selector: '#search-wrap', text: 'Start here. Search any city you miss and read the memories strangers left there.' },
    ],
  },
  {
    candidates: [
      { selector: '.mapboxgl-marker', text: 'Every stamp on the map is a memory. Tap one to read the whole postcard.' },
      { selector: '#map', text: 'Every stamp on the map is a memory. Tap one to read the whole postcard.' },
    ],
  },
  {
    candidates: [
      { selector: '#fab', text: 'When you are ready, plant your own. Pick a stamp, write your memory, send it home.' },
    ],
  },
  {
    candidates: [
      { selector: '#mine-toggle', text: 'Everything you plant lives here. Flip it to see just your whispers.' },
      { selector: '#menu-btn', text: 'Your whispers, theme and sound all live in this menu.' },
    ],
  },
]

function isVisible(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return false
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function resolveStep(step) {
  for (const c of step.candidates) {
    const el = document.querySelector(c.selector)
    if (isVisible(el)) return { el, text: c.text }
  }
  return null
}

export default function Tour({ open, onClose }) {
  const [step, setStep] = useState(0)
  const [view, setView] = useState(null) // { rect, text }

  useEffect(() => {
    if (!open) return
    function measure() {
      // skip past steps with no visible target on this layout
      let i = step
      let resolved = null
      while (i < STEPS.length && !(resolved = resolveStep(STEPS[i]))) i += 1
      if (!resolved) { setView(null); return }
      if (i !== step) { setStep(i); return }
      const r = resolved.el.getBoundingClientRect()
      setView({
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        text: resolved.text,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, step])

  if (!open) return null

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  function finish() {
    setStep(0)
    onClose()
  }

  const rect = view?.rect
  // card goes below the target unless the target sits in the lower half
  const below = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true
  const cardTop = rect
    ? below
      ? Math.min(rect.top + rect.height + 14, window.innerHeight - 190)
      : undefined
    : window.innerHeight / 2 - 80
  const cardBottom = rect && !below ? window.innerHeight - rect.top + 14 : undefined

  return (
    <div id="tour-overlay">
      {rect && (
        <div
          className="tour-ring"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}
      <div className="tour-card" style={{ top: cardTop, bottom: cardBottom }}>
        <div className="tour-step">{step + 1} of {STEPS.length}</div>
        <p>{view?.text || ''}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={finish}>Skip</button>
          <button className="tour-next" onClick={next}>
            {step < STEPS.length - 1 ? 'Next' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  )
}
