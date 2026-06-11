import { useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'

// ── Polaroid hover preview ──
export function DotTip({ tip }) {
  if (!tip) return <div id="dot-tip" />
  const flower = tip.whisper?.flower || 'other'
  const left = Math.min(tip.x + 14, window.innerWidth - 254)
  const top = Math.max(tip.y - 40, 40)
  return (
    <div id="dot-tip" className="show" style={{ left, top }}>
      <div className="tip-photo">
        <div
          className="tip-stamp"
          style={{ color: CATEGORY_COLORS[flower] }}
          dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }}
        />
        <div className="tip-text">
          {tip.whisper ? `“${tip.whisper.text}”` : 'No whispers yet. Be the first.'}
        </div>
      </div>
      <div className="tip-caption">
        {tip.whisper ? `${tip.city}, ${tip.whisper.time}` : tip.city}
      </div>
      <div className="tip-hint">tap the stamp to open the whisper</div>
    </div>
  )
}

// ── Intro letter ──
export function Intro({ open, onClose }) {
  return (
    <div id="intro-overlay" className={open ? '' : 'hidden'}>
      <div id="intro-card">
        <h2>City Whispers</h2>
        <div className="intro-tagline">little memories from the places we left</div>

        <p className="intro-story">
          You left. For work, for school, for love, for a life you couldn't have stayed for.
          You'd probably do it again.
        </p>
        <p className="intro-story">
          But some mornings a smell finds you. Rain on hot concrete, bread from a bakery
          that doesn't exist here. For a second you're <b>home</b>, and no one around
          you would understand.
        </p>
        <p className="intro-story">
          Someone else does. Every whisper on this map is a memory left by a stranger
          who misses the same streets you do.
        </p>

        <div className="intro-step">
          <div className="step-icon">🔍</div>
          <div className="step-text"><b>Find your city</b>, or tap any stamp on the map, to read what others still carry with them.</div>
        </div>
        <div className="intro-step">
          <div className="step-icon">🌼</div>
          <div className="step-text"><b>Leave a whisper</b> of your own: pick its shape, plant your memory.</div>
        </div>
        <div className="intro-step">
          <div className="step-icon">🌱</div>
          <div className="step-text">If your city is still bare, <b>yours will be the first whisper</b>. Someone will find it.</div>
        </div>

        <button id="intro-start" onClick={onClose}>Go home for a minute</button>
      </div>
    </div>
  )
}

// ── First whisper in a city ──
export function FirstOverlay({ open, onClose }) {
  return (
    <div id="first-overlay" className={open ? 'show' : ''}>
      <div className="first-flower">🌷</div>
      <h2>You're the first<br />to whisper here</h2>
      <p>Your memory just planted a little whisper on the map. Now others who miss this place can find it.</p>
      <button className="btn-primary" onClick={onClose}>see it bloom</button>
    </div>
  )
}

// ── Post-submit feedback ──
export function FeedbackCard({ open, onDismiss }) {
  const [thanked, setThanked] = useState(false)

  function send(rating) {
    console.log('whisper feedback:', rating) // becomes a Supabase insert later
    setThanked(true)
    setTimeout(() => { onDismiss(); setThanked(false) }, 1600)
  }

  return (
    <div id="feedback-card" className={open ? 'show' : ''}>
      <div className="fb-title">{thanked ? 'Thank you' : 'Your whisper is planted'}</div>
      <div className="fb-sub">{thanked ? 'Come back whenever you miss home.' : 'How did that feel?'}</div>
      {!thanked && (
        <>
          <div className="fb-faces">
            <button onClick={() => send('lovely')}>🥹<span>lovely</span></button>
            <button onClick={() => send('nice')}>🙂<span>nice</span></button>
            <button onClick={() => send('meh')}>😕<span>meh</span></button>
          </div>
          <button className="fb-skip" onClick={onDismiss}>skip</button>
        </>
      )}
    </div>
  )
}

// ── Drifting petals ──
const PETAL_COLORS = ['#f4a6c0', '#e8845e', '#b9a3d8', '#92c4a2', '#f7cf9f']
const PETALS = Array.from({ length: 7 }, (_, i) => ({
  color: PETAL_COLORS[i % PETAL_COLORS.length],
  py: 8 + Math.random() * 70,
  size: 8 + Math.random() * 7,
  dur: 20 + Math.random() * 18,
  delay: -Math.random() * 30, // already mid-flight on load
}))

export function Petals() {
  return (
    <div id="petals">
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="petal"
          style={{
            color: p.color,
            '--py': p.py + '%',
            '--psize': p.size + 'px',
            '--pdur': p.dur + 's',
            '--pdelay': p.delay + 's',
          }}
        >
          <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1 C9 3 10 7 6 11 C2 7 3 3 6 1 Z" fill="currentColor" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ── Zoom toast ──
export function ZoomToast({ city }) {
  return (
    <div id="zoom-toast" className={city ? 'show' : ''}>
      finding <span>{city}</span>…
    </div>
  )
}
