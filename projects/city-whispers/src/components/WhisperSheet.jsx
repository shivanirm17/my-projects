import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../lib/constants'
import { SproutIcon, HeartIcon } from '../lib/icons'

function EmptyArt() {
  return (
    <div id="empty-art">
      <svg viewBox="0 0 200 84" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(28,18) rotate(-8)" opacity="0.35">
          <rect width="34" height="30" rx="2" fill="none" stroke="#e8845e" strokeWidth="2" strokeDasharray="3.5 2.5" />
        </g>
        <g transform="translate(86,12) rotate(3)" opacity="0.5">
          <rect width="34" height="30" rx="2" fill="none" stroke="#8fb6c9" strokeWidth="2" strokeDasharray="3.5 2.5" />
        </g>
        <g transform="translate(142,20) rotate(9)" opacity="0.35">
          <rect width="34" height="30" rx="2" fill="none" stroke="#92c4a2" strokeWidth="2" strokeDasharray="3.5 2.5" />
        </g>
        <g transform="translate(100,52)">
          <path d="M0 16 C0 8 0 6 0 2" stroke="#92c4a2" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M0 6 C-7 5 -9 -1 -10 -4 C-4 -4 -1 0 0 6 Z" fill="#92c4a2" />
          <path d="M0 3 C6 2 9 -3 10 -7 C4 -7 1 -2 0 3 Z" fill="#a8cba8" />
        </g>
        <path d="M58 70 Q100 78 142 70" stroke="#d8cfb8" strokeWidth="1.5" fill="none" strokeDasharray="2 4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function WhisperSheet({ open, city, whispers, index, isMine, onPrev, onNext, onLike, onStartEdit, onLeaveWhisper, onClose }) {
  const list = whispers || []
  const empty = list.length === 0
  const w = list[index]
  const flower = w?.flower || 'other'
  const mine = w && isMine?.(w)

  return (
    <div id="sheet" className={'sheet-base' + (open ? ' open' : '') + (empty ? ' empty' : '')}>
      <button className="card-close" onClick={onClose} aria-label="Close">×</button>
      <div id="sheet-eyebrow">A memory from</div>
      <div id="sheet-city">{city}</div>
      <div id="whisper-card">
        {!empty && (
          <>
            <div
              id="whisper-stamp"
              style={{ color: CATEGORY_COLORS[flower] }}
              dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }}
            />
            <div id="whisper-postmark">
              <div className="pm-city">{city}</div>
              <div className="pm-time">{w?.time}</div>
            </div>
          </>
        )}
        {empty && <EmptyArt />}
        {!empty && w?.place && <div className="whisper-place">{w.place}</div>}
        <div id="whisper-text">
          {empty
            ? <span style={{ color: 'var(--muted)' }}>No one has left a memory here yet.</span>
            : w?.text}
        </div>
        {!empty && (
          <div className="whisper-footer">
            <div className="footer-left">
              <button id="whisper-like" className={w?.liked ? 'liked' : ''} onClick={onLike}>
                <HeartIcon size={15} filled={!!w?.liked} /> <span id="like-count">{w?.likes || 0}</span>
              </button>
              {mine && (
                <button className="edit-btn" onClick={() => onStartEdit?.(w)}>✎ Edit</button>
              )}
            </div>
            <div id="whisper-meta">
              <span className="sig-name">{w?.author ? w.author : mine ? 'You' : signatureFor(w)}</span>
              {mine && w?.author ? ' (you)' : ''}, {w?.time}
            </div>
          </div>
        )}
      </div>
      <div id="sheet-nav">
        <div className="nav-btn" onClick={onPrev}>←</div>
        <div id="sheet-counter">{empty ? '' : `${index + 1} of ${list.length}`}</div>
        <div className="nav-btn" onClick={onNext}>→</div>
      </div>
      <button id="sheet-leave-btn" onClick={onLeaveWhisper}>
        {empty
          ? <><SproutIcon size={18} /> Be the first to whisper from {city}</>
          : mine
            ? <><SproutIcon size={18} /> Plant another memory here</>
            : '+ Leave your own memory here'}
      </button>
    </div>
  )
}
