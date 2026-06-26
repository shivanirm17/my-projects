import { useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { STICKERS, TAPES, STAMPS, DRAW_COLORS } from './decoConstants'

// The sticky builder panel: name the journal, pick which whispers are in it,
// and decorate the page currently shown in the preview.
export default function JournalPanel({
  name, onName,
  mine, excluded, onToggleWhisper,
  active, deco, onCaption, onAddPhotos, onAddItem, busy,
  onShare, onDownload, shareLabel, downloading,
  drawMode, onToggleDraw, drawColor, onDrawColor, onUndoStroke, onClearStrokes,
}) {
  const [tray, setTray] = useState('tape')
  const [mOpen, setMOpen] = useState(false) // mobile bottom-sheet expanded?
  const fileRef = useRef(null)
  const photos = deco?.photos || []

  return (
    <div className={'j-panel' + (mOpen ? ' open' : '')}>
      <button className="j-panel-handle" onClick={() => setMOpen((o) => !o)} aria-label={mOpen ? 'Hide controls' : 'Customize journal'}>
        <span className="j-handle-grip" />
        <span className="j-handle-label">{mOpen ? 'Done' : 'Customize journal'}</span>
      </button>
      <section className="j-psec">
        <label className="j-plabel">Journal title</label>
        <input
          className="j-pname"
          value={name}
          placeholder="My City Whispers"
          onChange={(e) => onName(e.target.value)}
          maxLength={40}
        />
      </section>

      <section className="j-psec">
        <label className="j-plabel">Whispers in this journal</label>
        <div className="j-pwhispers">
          {mine.length === 0 && <p className="j-pmuted">No whispers yet.</p>}
          {mine.map(({ city, w }) => {
            const on = !excluded.has(w.id)
            return (
              <label key={w.id} className={'j-pwhisper' + (on ? '' : ' off')}>
                <input type="checkbox" checked={on} onChange={() => onToggleWhisper(w.id)} />
                <span className="j-pw-city">{city}</span>
                <span className="j-pw-text">{w.place || w.text}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="j-psec">
        <label className="j-plabel">Decorate this page</label>
        {!active ? (
          <p className="j-pmuted">Turn to a page in the preview to add photos, a note, and stickers.</p>
        ) : (
          <>
            <div className="j-pedit-row">
              <button className="j-pbtn" onClick={() => fileRef.current?.click()} disabled={busy || photos.length >= 6}>
                {busy ? 'adding…' : `＋ photo${photos.length ? ` (${photos.length}/6)` : ''}`}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => { onAddPhotos(e.target.files); e.target.value = '' }} />
            </div>

            <textarea
              className="j-pcaption"
              placeholder="write a little note…"
              value={deco?.caption || ''}
              onChange={(e) => onCaption(e.target.value)}
              rows={2}
            />

            <div className="j-ptabs">
              <button className={tray === 'tape' ? 'on' : ''} onClick={() => setTray('tape')}>Tape</button>
              <button className={tray === 'sticker' ? 'on' : ''} onClick={() => setTray('sticker')}>Stickers</button>
              <button className={tray === 'stamp' ? 'on' : ''} onClick={() => setTray('stamp')}>Stamps</button>
            </div>
            <div className="j-ppicks">
              {tray === 'tape' && TAPES.map((t) => (
                <button key={t.key} className="j-deco-pick" onClick={() => onAddItem('tape', t.key)}>
                  <span className="ji-tape" style={{ background: t.style, position: 'static', display: 'block' }} />
                </button>
              ))}
              {tray === 'sticker' && STICKERS.map((s) => (
                <button key={s.id} className="j-deco-pick" onClick={() => onAddItem('sticker', s.id)}>
                  <span className="ji-pick-sticker" dangerouslySetInnerHTML={{ __html: s.svg }} />
                </button>
              ))}
              {tray === 'stamp' && STAMPS.map((s) => (
                <button key={s} className="j-deco-pick" onClick={() => onAddItem('stamp', s)}>
                  <span className="ji-stamp" style={{ color: CATEGORY_COLORS[s] }} dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[s] }} />
                </button>
              ))}
            </div>
            <p className="j-phint">Drag pieces around on the page. Tap one to remove it.</p>

            {/* draw */}
            <div className="j-draw-row">
              <button className={'j-draw-toggle' + (drawMode ? ' on' : '')} onClick={onToggleDraw}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7a2 2 0 00-3-3l-7 7-1 4z" /><path d="M16 6l2 2" />
                </svg>
                {drawMode ? 'Drawing…' : 'Draw'}
              </button>
              {drawMode && (
                <>
                  <div className="j-draw-colors">
                    {DRAW_COLORS.map((c) => (
                      <button key={c} className={'j-swatch' + (drawColor === c ? ' on' : '')}
                        style={{ background: c }} onClick={() => onDrawColor(c)} aria-label="Pen colour" />
                    ))}
                  </div>
                  <button className="j-draw-mini" onClick={onUndoStroke} title="Undo last stroke">↶</button>
                  <button className="j-draw-mini" onClick={onClearStrokes} title="Clear drawing">✕</button>
                </>
              )}
            </div>
          </>
        )}
      </section>

      <section className="j-psec j-pactions">
        <button className="j-pact" onClick={onShare}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          {shareLabel || 'Share'}
        </button>
        <button className="j-pact solid" onClick={onDownload} disabled={downloading}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          {downloading ? 'Preparing…' : 'Download'}
        </button>
      </section>
    </div>
  )
}
