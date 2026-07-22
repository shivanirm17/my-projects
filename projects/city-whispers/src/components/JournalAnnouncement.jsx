import { useEffect, useState } from 'react'
import { JournalIcon, SparkleIcon, PolaroidIcon, UndoIcon } from '../lib/icons'

const LS_KEY = 'cw-journal-visit-count'
const LS_SEEN_KEY = 'cw-journal-welcome-seen'

export function getJournalVisitCount() {
  try {
    const count = parseInt(localStorage.getItem(LS_KEY) || '0', 10)
    return Math.max(0, count)
  } catch {
    return 0
  }
}

export function incrementJournalVisitCount() {
  try {
    const count = getJournalVisitCount()
    localStorage.setItem(LS_KEY, String(count + 1))
    return count + 1
  } catch {
    return 0
  }
}

export function shouldShowJournalAnnouncement(visitNumber = null) {
  try {
    // Never show if already dismissed
    if (localStorage.getItem(LS_SEEN_KEY)) return false

    // visitNumber is provided for testing/override; otherwise use current count
    const visit = visitNumber !== null ? visitNumber : getJournalVisitCount()

    // Show on 1st visit (brand new - during tutorial) OR 2nd visit (returning user on launch)
    return visit === 1 || visit === 2
  } catch {
    return false
  }
}

function Petal({ i }) {
  return <div className="ja-petal" style={{ '--i': i }} aria-hidden="true" />
}

function FloatingPages() {
  return (
    <div className="ja-pages" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="ja-page" style={{ '--i': i }} />
      ))}
    </div>
  )
}

function BookIllustration() {
  return (
    <div className="ja-book-wrap">
      <svg className="ja-book-svg" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
        {/* left page */}
        <rect x="10" y="12" width="68" height="96" rx="4" fill="var(--paper)" stroke="var(--border)" strokeWidth="1.5" />
        {/* right page */}
        <rect x="82" y="12" width="68" height="96" rx="4" fill="var(--paper2)" stroke="var(--border)" strokeWidth="1.5" />
        {/* spine */}
        <rect x="76" y="10" width="8" height="100" rx="2" fill="var(--brown)" opacity="0.8" />
        {/* left page lines */}
        <line x1="22" y1="34" x2="66" y2="34" stroke="var(--border)" strokeWidth="1.2" />
        <line x1="22" y1="44" x2="66" y2="44" stroke="var(--border)" strokeWidth="1.2" />
        <line x1="22" y1="54" x2="55" y2="54" stroke="var(--border)" strokeWidth="1.2" />
        {/* stamp on left page */}
        <rect x="22" y="62" width="28" height="28" rx="2" fill="none" stroke="var(--brown)" strokeWidth="1.5" strokeDasharray="3,2" />
        <circle cx="36" cy="76" r="8" fill="var(--brown)" opacity="0.25" />
        <path d="M31 76 q5-8 10 0" fill="none" stroke="var(--brown)" strokeWidth="1.5" strokeLinecap="round" />
        {/* right page — sticker + tape decoration */}
        <rect x="92" y="24" width="46" height="30" rx="3" fill="#f2e8d9" stroke="var(--border)" strokeWidth="1" />
        {/* polaroid photo */}
        <rect x="95" y="27" width="40" height="24" rx="1" fill="#fff" />
        <rect x="97" y="29" width="36" height="16" rx="1" fill="var(--border)" opacity="0.4" />
        {/* tape strip */}
        <rect x="88" y="20" width="22" height="6" rx="2" fill="#a8c5b0" opacity="0.55" transform="rotate(-8 99 23)" />
        {/* right page lines */}
        <line x1="92" y1="68" x2="138" y2="68" stroke="var(--border)" strokeWidth="1.2" />
        <line x1="92" y1="78" x2="138" y2="78" stroke="var(--border)" strokeWidth="1.2" />
        <line x1="92" y1="88" x2="122" y2="88" stroke="var(--border)" strokeWidth="1.2" />
        {/* sparkle dots */}
        <circle cx="148" cy="18" r="2" fill="var(--brown)" opacity="0.6" />
        <circle cx="8" cy="30" r="1.5" fill="#a8c5b0" opacity="0.7" />
        <circle cx="152" cy="90" r="1.5" fill="#bd8163" opacity="0.5" />
      </svg>
    </div>
  )
}

export default function JournalAnnouncement({ onOpen, onDismiss }) {
  const [out, setOut] = useState(false)

  function dismiss(andOpen) {
    setOut(true)
    try { localStorage.setItem(LS_SEEN_KEY, '1') } catch { /* private */ }
    setTimeout(() => {
      onDismiss()
      if (andOpen) onOpen()
    }, 380)
  }

  return (
    <div className={'ja-overlay' + (out ? ' ja-out' : '')}>
      <div className="ja-confetti" aria-hidden="true">
        {Array.from({ length: 32 }, (_, i) => <Petal key={i} i={i} />)}
      </div>
      <FloatingPages />

      <div className="ja-card">
        <BookIllustration />

        <div className="ja-eyebrow">New feature</div>
        <h1 className="ja-title">Turn your whispers<br />into keepsakes.</h1>
        <p className="ja-body">
          One page per memory: yours to decorate with photos, stickers, and tape, and keep forever.
        </p>

        <ul className="ja-features">
          <li><span className="ja-feat-icon"><JournalIcon size={19} /></span> Two-page spreads: your whisper on the left, blank canvas on the right</li>
          <li><span className="ja-feat-icon"><SparkleIcon size={19} /></span> Add stickers, washi tape, and freehand drawings</li>
          <li><span className="ja-feat-icon"><PolaroidIcon size={19} /></span> Drop in polaroid photos and rotate them freely</li>
          <li><span className="ja-feat-icon"><UndoIcon size={19} /></span> Undo anything: every edit is reversible</li>
        </ul>

        <button className="ja-cta" onClick={() => dismiss(true)}>
          Open my Keepsakes →
        </button>
        <button className="ja-later" onClick={() => dismiss(false)}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
