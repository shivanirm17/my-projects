import { useState } from 'react'

const SEEN_KEY = 'cw-journal-hint-seen'
const isTouch = typeof window !== 'undefined' &&
  window.matchMedia && window.matchMedia('(pointer: coarse)').matches

// One-time, touch-only coaching card shown before the first decorating session:
// how to turn pages (vertical swipe) and how to place/draw.
export default function JournalHint() {
  const [show, setShow] = useState(() => {
    if (!isTouch) return false
    try { return !localStorage.getItem(SEEN_KEY) } catch { return false }
  })
  if (!show) return null

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode */ }
    setShow(false)
  }

  return (
    <div className="j-hint" onClick={dismiss}>
      <div className="j-hint-card" onClick={(e) => e.stopPropagation()}>
        <div className="j-hint-swipe" aria-hidden="true">
          <span className="j-hint-finger">↕</span>
        </div>
        <div className="j-hint-title">Swipe up &amp; down to turn pages</div>
        <div className="j-hint-sub">Tap a tool to add stickers, tape or photos. Drag to place them, and use Draw to doodle with your finger.</div>
        <button className="btn-primary j-hint-go" onClick={dismiss}>Got it</button>
      </div>
    </div>
  )
}
