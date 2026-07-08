import { useEffect, useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'
import { sendFeedback } from '../lib/store'
import { TulipIcon, FaceLovelyIcon, FaceNiceIcon, FaceMehIcon } from '../lib/icons'

// ── Postcard hover preview, a small version of the reading card ──
export function DotTip({ tip }) {
  if (!tip) return <div id="dot-tip" />
  const flower = tip.whisper?.flower || 'other'
  const left = Math.min(tip.x + 14, window.innerWidth - 254)
  const top = Math.max(tip.y - 40, 40)
  return (
    <div id="dot-tip" className="show" style={{ left, top }}>
      <div
        className="tip-stamp"
        style={{ color: CATEGORY_COLORS[flower] }}
        dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }}
      />
      <div className="tip-postmark">
        <div className="tpm-city">{tip.city}</div>
        {tip.whisper && <div className="tpm-time">{tip.whisper.time}</div>}
      </div>
      <div className="tip-text">
        {tip.whisper ? tip.whisper.text : 'No whispers yet. Be the first.'}
      </div>
      <div className="tip-hint">Tap the stamp to open the whisper</div>
    </div>
  )
}

// ── Intro video: plays once, muted-by-default (autoplay rules), skippable ──
export function Intro({ open, onClose, onStartTour }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!open) return
    if (reduced) { onClose(); return }
    const v = videoRef.current
    if (v) { v.currentTime = 0; v.play().catch(() => {}) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="intro-overlay" className={open ? '' : 'hidden'}>
      <div id="intro-card">
        <button className="intro-close" onClick={onClose} aria-label="Skip intro">×</button>
        {open && !reduced && (
          <>
            <video
              ref={videoRef}
              id="intro-video"
              src="/video/intro.mp4"
              autoPlay
              muted={muted}
              playsInline
              onEnded={onClose}
            />
            <button
              className="intro-mute"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </>
        )}
      </div>
      {onStartTour && (
        <button className="intro-tour-link" onClick={onStartTour}>Replay the tour</button>
      )}
    </div>
  )
}

// ── First whisper in a city ──
export function FirstOverlay({ open, onClose }) {
  return (
    <div id="first-overlay" className={open ? 'show' : ''}>
      <button className="card-close first-close" onClick={onClose} aria-label="Close">×</button>
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
      <button className="card-close" onClick={onDismiss} aria-label="Close">×</button>
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
