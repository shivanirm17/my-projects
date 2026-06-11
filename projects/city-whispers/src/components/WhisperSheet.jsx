import { useState } from 'react'
import { CATEGORIES, CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'
import { SproutIcon } from '../lib/icons'

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

export default function WhisperSheet({ open, city, whispers, index, isMine, onPrev, onNext, onLike, onEdit, onDelete, onLeaveWhisper }) {
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [draftFlower, setDraftFlower] = useState('other')

  const list = whispers || []
  const empty = list.length === 0
  const w = list[index]
  const flower = w?.flower || 'other'
  const mine = w && isMine?.(w)

  // leave edit mode whenever the visible whisper changes
  const [prevKey, setPrevKey] = useState(null)
  const key = city + ':' + index
  if (key !== prevKey) {
    setPrevKey(key)
    setEditing(false)
  }

  function startEdit() {
    setDraftText(w.text)
    setDraftFlower(w.flower || 'other')
    setEditing(true)
  }

  function saveEdit() {
    const text = draftText.trim()
    if (!text) return
    onEdit(text, draftFlower)
    setEditing(false)
  }

  return (
    <div id="sheet" className={'sheet-base' + (open ? ' open' : '') + (empty ? ' empty' : '')}>
      <div className="sheet-handle" />
      <div id="sheet-eyebrow">a memory from</div>
      <div id="sheet-city">{city}</div>
      <div id="whisper-card">
        {!empty && (
          <>
            <div
              id="whisper-stamp"
              style={{ color: CATEGORY_COLORS[editing ? draftFlower : flower] }}
              dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[editing ? draftFlower : flower] || CATEGORY_SVGS.other }}
            />
            <div id="whisper-postmark">
              <div className="pm-city">{city}</div>
              <div className="pm-time">{w?.time}</div>
            </div>
          </>
        )}
        {empty && <EmptyArt />}

        {editing ? (
          <div className="edit-area">
            <textarea
              className="field-input"
              maxLength={150}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
            />
            <div className="edit-flower-row">
              {CATEGORIES.map((name) => (
                <div
                  key={name}
                  className={'flower-opt mini' + (name === draftFlower ? ' selected' : '')}
                  style={{ color: CATEGORY_COLORS[name] }}
                  title={name}
                  onClick={() => setDraftFlower(name)}
                  dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[name] }}
                />
              ))}
            </div>
            <div className="edit-actions">
              <button className="btn-danger" onClick={() => { setEditing(false); onDelete() }}>delete</button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>cancel</button>
              <button className="btn-primary" onClick={saveEdit}>save</button>
            </div>
          </div>
        ) : (
          <>
            <div id="whisper-text">
              {empty
                ? <span style={{ color: 'var(--muted)' }}>No one has left a memory here yet.</span>
                : w?.text}
            </div>
            {!empty && (
              <div className="whisper-footer">
                <div className="footer-left">
                  <button id="whisper-like" className={w?.liked ? 'liked' : ''} onClick={onLike}>
                    ♥ <span id="like-count">{w?.likes || 0}</span>
                  </button>
                  {mine && (
                    <button className="edit-btn" onClick={startEdit} title="Edit your whisper">✎ edit</button>
                  )}
                </div>
                <div id="whisper-meta">{mine ? 'you, ' : 'a stranger, '}{w?.time}</div>
              </div>
            )}
          </>
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
          : '+ leave your own memory here'}
      </button>
    </div>
  )
}
