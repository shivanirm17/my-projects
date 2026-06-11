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
    special: 'stamps',
    candidates: [
      { selector: '#map', text: 'Every stamp is a memory. Tap or hover one to peek at it, tap to read the whole postcard.' },
    ],
  },
  {
    special: 'pin',
    candidates: [
      { selector: '#map', text: 'See somewhere you remember? Search it, or click the spot on the map to pin it, then whisper from right there.' },
    ],
  },
  {
    candidates: [
      { selector: '#fab', text: 'Or start here: write your memory and pin its exact spot from inside the form.' },
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
  // must actually be on screen, not just rendered somewhere off-viewport
  if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return false
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

// markers: prefer one near the middle of the screen
function resolveMarker(text) {
  const markers = [...document.querySelectorAll('.mapboxgl-marker')].filter(isVisible)
  if (!markers.length) return null
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  markers.sort((a, b) => {
    const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect()
    const da = (ra.left + ra.width / 2 - cx) ** 2 + (ra.top + ra.height / 2 - cy) ** 2
    const db = (rb.left + rb.width / 2 - cx) ** 2 + (rb.top + rb.height / 2 - cy) ** 2
    return da - db
  })
  return { el: markers[0], text }
}

function resolveStep(step) {
  for (const c of step.candidates) {
    if (c.selector === '.mapboxgl-marker') {
      const m = resolveMarker(c.text)
      if (m) return m
      continue
    }
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
      if (!resolved) {
        // nothing left to point at: end the tour instead of blocking the app
        setView(null)
        setTimeout(onClose, 0)
        return
      }
      if (i !== step) { setStep(i); return }
      if (STEPS[i].special) {
        setView({ rect: null, text: resolved.text })
        return
      }
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

  // glow the stamps and dull the map during the stamps step
  useEffect(() => {
    const on = open && STEPS[step]?.special === 'stamps'
    document.body.classList.toggle('tour-stamps', on)
    return () => document.body.classList.remove('tour-stamps')
  }, [open, step])

  if (!open) return null

  function back() {
    for (let i = step - 1; i >= 0; i--) {
      if (resolveStep(STEPS[i])) { setStep(i); return }
    }
  }

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
  let cardTop = rect
    ? below
      ? rect.top + rect.height + 14
      : undefined
    : window.innerHeight / 2 - 80
  let cardBottom = rect && !below ? window.innerHeight - rect.top + 14 : undefined
  if (cardTop != null) cardTop = Math.min(Math.max(cardTop, 12), window.innerHeight - 200)
  if (cardBottom != null) cardBottom = Math.min(Math.max(cardBottom, 12), window.innerHeight - 200)

  const stampsMode = STEPS[step]?.special === 'stamps'
  const pinMode = STEPS[step]?.special === 'pin'

  return (
    <div id="tour-overlay" className={stampsMode || pinMode ? 'stamps-mode' : ''}>
      {pinMode && (
        <div className="tour-demo-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.5 C16.5 2.5 19 6 19 9 C19 13.5 12 21 12 21 C12 21 5 13.5 5 9 C5 6 7.5 2.5 12 2.5 Z" fill="#bd8163" stroke="#fff" strokeWidth="1.6" />
            <path d="M12 12.2 C9.8 10.5 8.8 9.3 8.8 8.1 C8.8 7.2 9.5 6.5 10.4 6.5 C11 6.5 11.6 6.9 12 7.5 C12.4 6.9 13 6.5 13.6 6.5 C14.5 6.5 15.2 7.2 15.2 8.1 C15.2 9.3 14.2 10.5 12 12.2 Z" fill="#fff" />
          </svg>
          <span className="tour-demo-ripple" />
        </div>
      )}
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
          <div className="tour-nav">
            <button className="tour-back" onClick={back} disabled={step === 0} aria-label="Previous step">←</button>
            <button className="tour-next" onClick={next}>
              {step < STEPS.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
