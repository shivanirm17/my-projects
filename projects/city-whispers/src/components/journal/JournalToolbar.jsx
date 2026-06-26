import { useRef, useState } from 'react'
import { STICKERS, TAPES, DRAW_COLORS } from './decoConstants'

// Fresh, consistent line icons (24px, currentColor).
const I = (paths) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
)
const TOOL_ICON = {
  photo: I(<><rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.3" /><path d="M8.5 6l1.2-2h4.6l1.2 2" /></>),
  decor: I(<><path d="M12 4l1.9 4.3 4.6.4-3.5 3 1.1 4.5L12 13.9 7.9 16.2 9 11.7 5.5 8.7l4.6-.4z" /></>),
  draw: I(<><path d="M5 19l1-4 9-9a2.1 2.1 0 0 1 3 3l-9 9-4 1Z" /><path d="M14.5 7.5l2 2" /></>),
}

// Floating tool bar over the journal canvas. Decor (stickers + tape) and Draw
// open panels; a second row holds undo / redo / reset for the page.
export default function JournalToolbar({
  onAddPhotos, onAddItem, busy,
  drawMode, onToggleDraw, drawColor, onDrawColor, onDrawUndo, onDrawClear,
  onUndo, onRedo, onReset, canUndo, canRedo,
}) {
  const [open, setOpen] = useState(null)   // 'decor' | null
  const [tab, setTab] = useState('sticker') // 'sticker' | 'tape'
  const fileRef = useRef(null)

  return (
    <div className="j-toolbar">
      {open === 'decor' && (
        <div className="j-tool-pop">
          <div className="j-decor-tabs">
            <button className={'j-decor-tab' + (tab === 'sticker' ? ' on' : '')} onClick={() => setTab('sticker')}>Stickers</button>
            <button className={'j-decor-tab' + (tab === 'tape' ? ' on' : '')} onClick={() => setTab('tape')}>Tape</button>
          </div>
          <div className="j-decor-grid">
            {tab === 'sticker' && STICKERS.map((s) => (
              <button key={s.id} className="j-deco-pick" onClick={() => onAddItem('sticker', s.id)}>
                <span className="ji-pick-sticker" dangerouslySetInnerHTML={{ __html: s.svg }} />
              </button>
            ))}
            {tab === 'tape' && TAPES.map((t) => (
              <button key={t.key} className="j-deco-pick" onClick={() => onAddItem('tape', t.key)}>
                <span className="ji-tape" style={{ background: t.style, position: 'static', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {drawMode && (
        <div className="j-tool-draw">
          {DRAW_COLORS.map((c) => (
            <button key={c} className={'j-swatch' + (drawColor === c ? ' on' : '')} style={{ background: c }}
              onClick={() => onDrawColor(c)} aria-label="Pen colour" />
          ))}
          <span className="j-draw-sep" />
          <button className="j-draw-mini" onClick={onDrawUndo} title="Undo last stroke">↶</button>
          <button className="j-draw-mini" onClick={onDrawClear} title="Erase drawing">⌫</button>
          <button className="j-draw-done" onClick={onToggleDraw}>Done</button>
        </div>
      )}

      <div className="j-tool-row">
        <button className="j-tool" onClick={() => { setOpen(null); fileRef.current?.click() }} disabled={busy} title="Add photo">
          {TOOL_ICON.photo}<span className="j-tool-label">Photo</span>
        </button>
        <button className={'j-tool' + (open === 'decor' ? ' on' : '')} onClick={() => setOpen((o) => (o === 'decor' ? null : 'decor'))} title="Stickers & tape">
          {TOOL_ICON.decor}<span className="j-tool-label">Decor</span>
        </button>
        <button className={'j-tool' + (drawMode ? ' on' : '')} onClick={() => { setOpen(null); onToggleDraw() }} title="Draw">
          {TOOL_ICON.draw}<span className="j-tool-label">Draw</span>
        </button>
      </div>

      <div className="j-tool-history">
        <button className="j-hist-btn" onClick={onUndo} disabled={!canUndo} title="Undo" aria-label="Undo">↶</button>
        <button className="j-hist-btn" onClick={onRedo} disabled={!canRedo} title="Redo" aria-label="Redo">↷</button>
        <span className="j-hist-sep" />
        <button className="j-hist-btn" onClick={onReset} title="Reset page" aria-label="Reset page">⟲</button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { onAddPhotos(e.target.files); e.target.value = '' }} />
    </div>
  )
}
