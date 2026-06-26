import { useEffect, useRef, useState } from 'react'
import { STICKERS, TAPES, DRAW_COLORS } from './decoConstants'

const I = (paths) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
)
const TOOL_ICON = {
  add: I(<><path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M12 11v6M9 14h6" /></>),
  photo: I(<><rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.3" /><path d="M8.5 6l1.2-2h4.6l1.2 2" /></>),
  decor: I(<><path d="M12 4l1.9 4.3 4.6.4-3.5 3 1.1 4.5L12 13.9 7.9 16.2 9 11.7 5.5 8.7l4.6-.4z" /></>),
  undo: I(<><path d="M9 7h6a4 4 0 0 1 0 8H7" /><path d="M9 4 5.5 7 9 10" /></>),
  redo: I(<><path d="M15 7H9a4 4 0 0 0 0 8h8" /><path d="M15 4l3.5 3L15 10" /></>),
  clear: I(<><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></>),
}

// Floating tool bar: Add / Photo / Decor on the left, then Undo / Redo / Clear.
// "Decor" opens a tabbed panel: Stickers · Tape · Draw (draw holds pen/eraser).
export default function JournalToolbar({
  onAddPhotos, onAddItem, onAddPage, canAddPage, busy,
  drawMode, onDraw, eraseMode, onErase, drawColor, onDrawColor,
  onUndo, onRedo, onReset, canUndo, canRedo,
}) {
  const [open, setOpen] = useState(null)   // 'decor' | null
  const [tab, setTab] = useState('sticker')
  const fileRef = useRef(null)
  const rootRef = useRef(null)

  const closeAll = () => { setOpen(null); onDraw(false); onErase(false) }
  const selectTab = (t) => { setTab(t); onDraw(t === 'draw'); if (t !== 'draw') onErase(false) }
  const toggleDecor = () => { if (open === 'decor') closeAll(); else { setOpen('decor'); selectTab('sticker') } }
  const pickPhoto = () => { closeAll(); fileRef.current?.click() }

  // close the panel when tapping OUTSIDE the toolbar — but never while drawing
  // (the canvas needs taps) and never for taps inside the toolbar itself.
  useEffect(() => {
    if (open !== 'decor' || tab === 'draw') return
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) closeAll() }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, tab])

  return (
    <div className="j-toolbar" ref={rootRef}>
      {open === 'decor' && (
        <div className="j-tool-pop">
          <div className="j-decor-tabs">
            <button className={'j-decor-tab' + (tab === 'sticker' ? ' on' : '')} onClick={() => selectTab('sticker')}>Stickers</button>
            <button className={'j-decor-tab' + (tab === 'tape' ? ' on' : '')} onClick={() => selectTab('tape')}>Tape</button>
            <button className={'j-decor-tab' + (tab === 'draw' ? ' on' : '')} onClick={() => selectTab('draw')}>Draw</button>
          </div>

          {tab === 'sticker' && (
            <div className="j-decor-grid">
              {STICKERS.map((s) => (
                <button key={s.id} className="j-deco-pick" onClick={() => onAddItem('sticker', s.id)}>
                  <span className="ji-pick-sticker" dangerouslySetInnerHTML={{ __html: s.svg }} />
                </button>
              ))}
            </div>
          )}
          {tab === 'tape' && (
            <div className="j-decor-grid">
              {TAPES.map((t) => (
                <button key={t.key} className="j-deco-pick" onClick={() => onAddItem('tape', t.key)}>
                  <span className="ji-tape" style={{ background: t.style, position: 'static', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
          {tab === 'draw' && (
            <div className="j-draw-panel">
              <div className="j-draw-swatches">
                {DRAW_COLORS.map((c) => (
                  <button key={c} className={'j-swatch' + (drawColor === c ? ' on' : '')} style={{ background: c }}
                    onClick={() => onDrawColor(c)} aria-label="Pen colour" />
                ))}
              </div>
              <button className="j-draw-tick" onClick={closeAll} aria-label="Done drawing">✓</button>
            </div>
          )}
        </div>
      )}

      <div className="j-tool-row">
        <button className="j-tool" onClick={() => { closeAll(); onAddPage?.() }} disabled={!canAddPage} title="Add a page">
          {TOOL_ICON.add}<span className="j-tool-label">Add</span>
        </button>
        <button className="j-tool" onClick={pickPhoto} disabled={busy} title="Add photo">
          {TOOL_ICON.photo}<span className="j-tool-label">Photo</span>
        </button>
        <button className={'j-tool' + (open === 'decor' ? ' on' : '')} onClick={toggleDecor} title="Stickers, tape & draw">
          {TOOL_ICON.decor}<span className="j-tool-label">Decor</span>
        </button>

        <span className="j-tool-divider" />

        <button className="j-tool j-tool-hist" onClick={onUndo} disabled={!canUndo} title="Undo">
          {TOOL_ICON.undo}<span className="j-tool-label">Undo</span>
        </button>
        <button className="j-tool j-tool-hist" onClick={onRedo} disabled={!canRedo} title="Redo">
          {TOOL_ICON.redo}<span className="j-tool-label">Redo</span>
        </button>
        <button className="j-tool j-tool-hist" onClick={onReset} title="Clear page">
          {TOOL_ICON.clear}<span className="j-tool-label">Clear</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { onAddPhotos(e.target.files); e.target.value = '' }} />
    </div>
  )
}
