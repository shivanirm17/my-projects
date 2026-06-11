import { useEffect, useState } from 'react'

// A gentle first-visit tour: dims the page and spotlights one thing at a time.
const STEPS = [
  {
    selector: '#search-wrap',
    text: 'Start here. Search any city you miss and read the memories strangers left there.',
  },
  {
    selector: '.mapboxgl-marker',
    fallback: '#map',
    text: 'Every stamp on the map is a memory. Hover to peek, tap to read the whole postcard.',
  },
  {
    selector: '#fab',
    text: 'When you are ready, plant your own. Pick a stamp, write 150 letters, send it home.',
  },
  {
    selector: '#mine-toggle',
    text: 'Everything you plant lives here. Flip it to see just your whispers.',
  },
]

export default function Tour({ open, onClose }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!open) return
    function measure() {
      const s = STEPS[step]
      const el = document.querySelector(s.selector) || (s.fallback && document.querySelector(s.fallback))
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
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

  // card goes below the target unless the target sits in the lower half
  const below = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true
  const cardTop = rect
    ? below
      ? Math.min(rect.top + rect.height + 14, window.innerHeight - 170)
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
      <div
        className="tour-card"
        style={{ top: cardTop, bottom: cardBottom }}
      >
        <div className="tour-step">{step + 1} of {STEPS.length}</div>
        <p>{STEPS[step].text}</p>
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
