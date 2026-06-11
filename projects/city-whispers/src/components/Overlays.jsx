import { useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'
import { sendFeedback } from '../lib/store'
import { SearchIcon, StampIcon, SproutIcon, TulipIcon, FaceLovelyIcon, FaceNiceIcon, FaceMehIcon } from '../lib/icons'

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
      <div className="tip-hint">Tap the stamp to open the whisper</div>
    </div>
  )
}

// ── Intro letter ──
export function Intro({ open, onClose }) {
  return (
    <div id="intro-overlay" className={open ? '' : 'hidden'}>
      <div id="intro-card">
        <h2>City Whispers</h2>
        <div className="intro-tagline">Little memories from the places we left</div>

        <p className="intro-story">
          I left my city for a new life, and I'd choose it again. But nobody warned me
          about the small things. Not missing people, missing <b>mornings</b>. A street
          at a certain hour. The way rain sounded on my window and nowhere else.
        </p>
        <p className="intro-story">
          When it hits, there's no one to tell. The people here never knew that street.
          The people back home are living on it and can't see it the way I do now.
        </p>
        <p className="intro-story">
          So I built this map. Leave the small thing you miss, and find the strangers
          who miss it too. <b>You're not the only one who remembers.</b>
        </p>

        <div className="intro-step">
          <div className="step-icon"><SearchIcon size={20} /></div>
          <div className="step-text"><b>Find your city</b>, or tap any stamp on the map, to read what others still carry with them.</div>
        </div>
        <div className="intro-step">
          <div className="step-icon"><StampIcon size={20} /></div>
          <div className="step-text"><b>Leave a whisper</b> of your own: pick its shape, plant your memory.</div>
        </div>
        <div className="intro-step">
          <div className="step-icon"><SproutIcon size={20} /></div>
          <div className="step-text">If your city is still bare, <b>yours will be the first whisper</b>. Someone will find it.</div>
        </div>

        <button id="intro-start" onClick={onClose}>Start whispering</button>
      </div>
    </div>
  )
}

// ── First whisper in a city ──
export function FirstOverlay({ open, onClose }) {
  return (
    <div id="first-overlay" className={open ? 'show' : ''}>
      <div className="first-flower"><TulipIcon size={72} /></div>
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
    sendFeedback(rating)
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
            <button onClick={() => send('lovely')}><FaceLovelyIcon size={32} /><span>Lovely</span></button>
            <button onClick={() => send('nice')}><FaceNiceIcon size={32} /><span>Nice</span></button>
            <button onClick={() => send('meh')}><FaceMehIcon size={32} /><span>Meh</span></button>
          </div>
          <button className="fb-skip" onClick={onDismiss}>Skip</button>
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
      Finding <span>{city}</span>…
    </div>
  )
}
