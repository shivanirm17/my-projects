import { useEffect } from 'react'
import Logo from './Logo'

// First-visit splash: the stamp presses itself onto the paper,
// the name signs itself underneath, then the intro takes over.
export default function Splash({ open, onDone }) {
  useEffect(() => {
    if (!open) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(onDone, reduced ? 600 : 2600)
    return () => clearTimeout(t)
  }, [open, onDone])

  if (!open) return null
  return (
    <div id="splash" onClick={onDone}>
      <div className="splash-mark"><Logo size={96} /></div>
      <div className="splash-name">City Whispers</div>
      <div className="splash-tag">Little memories from the places we left</div>
    </div>
  )
}
