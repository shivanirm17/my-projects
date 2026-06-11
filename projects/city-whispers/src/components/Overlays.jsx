import { useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'
import { sendFeedback } from '../lib/store'
import { SearchIcon, StampIcon, SproutIcon, TulipIcon, FaceLovelyIcon, FaceNiceIcon, FaceMehIcon } from '../lib/icons'

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

// ── Intro: the story told a page at a time, skippable to the how-to ──
const STORY = [
  {
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        {/* the city left behind */}
        <g fill="var(--paper2)" stroke="#bd8163" strokeWidth="1.6" strokeLinejoin="round">
          <rect x="18" y="34" width="18" height="38" rx="1.5" />
          <rect x="40" y="20" width="22" height="52" rx="1.5" />
          <rect x="66" y="42" width="16" height="30" rx="1.5" />
        </g>
        <g fill="#bd8163" opacity="0.6">
          <rect x="23" y="40" width="4" height="5" rx="1" /><rect x="29" y="40" width="4" height="5" rx="1" />
          <rect x="23" y="50" width="4" height="5" rx="1" /><rect x="29" y="50" width="4" height="5" rx="1" />
          <rect x="46" y="27" width="4" height="5" rx="1" /><rect x="53" y="27" width="4" height="5" rx="1" />
          <rect x="46" y="37" width="4" height="5" rx="1" /><rect x="53" y="37" width="4" height="5" rx="1" />
          <rect x="46" y="47" width="4" height="5" rx="1" /><rect x="71" y="48" width="4" height="5" rx="1" />
        </g>
        <path d="M14 72 H120" stroke="var(--border)" strokeWidth="1.6" strokeLinecap="round" />
        {/* the suitcase walking away */}
        <g transform="translate(108,46) rotate(3)">
          <rect x="0" y="8" width="30" height="20" rx="3" fill="#bd8163" stroke="var(--card)" strokeWidth="1.6" />
          <path d="M10 8 V4 Q10 2 12 2 H18 Q20 2 20 4 V8" fill="none" stroke="#bd8163" strokeWidth="2.2" />
          <line x1="9" y1="8" x2="9" y2="28" stroke="var(--card)" strokeWidth="1.6" />
        </g>
        <path d="M96 64 C100 62 103 65 106 62" stroke="var(--muted)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
    ),
    text: <>I moved away for a new life, and it was the right call. What caught
      me off guard was missing the small stuff: my street in the morning, the
      way rain sounded on my old window.</>,
  },
  {
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        {/* a memory with nowhere to go: one full bubble, no reply */}
        <g>
          <path d="M28 22 H92 Q98 22 98 28 V50 Q98 56 92 56 H48 L36 66 L38 56 H28 Q22 56 22 50 V28 Q22 22 28 22 Z"
            fill="var(--card)" stroke="#bd8163" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M60 46 C53.5 41 50.5 37.5 50.5 34 C50.5 31.2 52.6 29 55.4 29 C57.4 29 59.2 30.2 60 32 C60.8 30.2 62.6 29 64.6 29 C67.4 29 69.5 31.2 69.5 34 C69.5 37.5 66.5 41 60 46 Z"
            fill="#f4a6c0" />
        </g>
        <g opacity="0.45">
          <path d="M112 44 H134 Q138 44 138 48 V58 Q138 62 134 62 H124 L118 68 L119.5 62 H112 Q108 62 108 58 V48 Q108 44 112 44 Z"
            fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
        </g>
      </svg>
    ),
    text: <>And there was nowhere to put that. Friends here never saw those
      streets. Friends back home still live on them, so they don't even
      notice them anymore.</>,
  },
  {
    art: (
      <svg viewBox="0 0 160 90" aria-hidden="true">
        {/* two stamps, far apart, connected on the map */}
        <rect x="14" y="12" width="132" height="66" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1.6" />
        <path d="M14 50 Q40 38 60 48 T110 42 T146 50" stroke="var(--paper2)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M44 40 C70 18 96 60 120 36" stroke="#bd8163" strokeWidth="1.6" fill="none" strokeDasharray="4 4" strokeLinecap="round" />
        <g transform="translate(28,28) rotate(-6)">
          <rect width="26" height="24" rx="2" fill="#e8845e" stroke="var(--card)" strokeWidth="2" strokeDasharray="3 2.2" />
          <rect x="5" y="5" width="16" height="14" rx="1" fill="var(--paper)" />
        </g>
        <g transform="translate(110,26) rotate(7)">
          <rect width="26" height="24" rx="2" fill="#8fb6c9" stroke="var(--card)" strokeWidth="2" strokeDasharray="3 2.2" />
          <rect x="5" y="5" width="16" height="14" rx="1" fill="var(--paper)" />
        </g>
      </svg>
    ),
    text: <>So I made this map. Leave the small thing you miss. Read what other
      people miss about the same place. <b>That's the whole app.</b></>,
  },
]

export function Intro({ open, onClose }) {
  // returning visitors who reopen via "?" land straight on the how-to
  const seenBefore = (() => {
    try { return !!localStorage.getItem('cw-intro-seen') } catch { return false }
  })()
  const [stage, setStage] = useState(seenBefore ? STORY.length : 0)

  // restart the story each time the intro opens fresh
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setStage(seenBefore ? STORY.length : 0)
  }

  const onStory = stage < STORY.length

  return (
    <div id="intro-overlay" className={open ? '' : 'hidden'}>
      <div id="intro-card" className={onStory ? 'story-mode' : ''}>
        <h2>City Whispers</h2>
        <div className="intro-tagline">Little memories from the places we left</div>

        {onStory ? (
          <>
            <div className="story-page" key={stage}>
              <div className="story-art">{STORY[stage].art}</div>
              <p className="intro-story-page">{STORY[stage].text}</p>
            </div>
            <div className="story-dots">
              {STORY.map((_, i) => (
                <span key={i} className={'story-dot' + (i === stage ? ' on' : '')} />
              ))}
            </div>
            <button id="intro-start" onClick={() => setStage(stage + 1)}>
              {stage < STORY.length - 1 ? 'Go on' : 'How it works'}
            </button>
            <button className="story-skip" onClick={() => setStage(STORY.length)}>
              Skip to how it works
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
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
