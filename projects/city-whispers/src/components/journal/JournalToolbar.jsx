import { useRef, useState } from 'react'
import { STICKERS, TAPES, DRAW_COLORS } from './decoConstants'

// Fresh, consistent line icons (24px, currentColor).
const I = (paths) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
)
const TOOL_ICON = {
  photo: I(<><rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.3" /><path d="M8.5 6l1.2-2h4.6l1.2 2" /></>),
  sticker: I(<><path d="M14 3.5H6.5A2.5 2.5 0 0 0 4 6v12a2.5 2.5 0 0 0 2.5 2.5H14L20 14V6A2.5 2.5 0 0 0 17.5 3.5" /><path d="M14 20.5V16a2 2 0 0 1 2-2h4.5" /></>),
  tape: I(<><rect x="2.5" y="9" width="19" height="6" rx="1" transform="rotate(-7 12 12)" /><path d="M7 8.2l1.6 7.4M12 7.6l1.4 7.6M16.8 7.6l1.4 7.2" opacity="0.5" /></>),
  draw: I(<><path d="M5 19l1-4 9-9a2.1 2.1 0 0 1 3 3l-9 9-4 1Z" /><path d="M14.5 7.5l2 2" /></>),
}

// Floating tool bar over the journal canvas: each tool has an icon + label;
// stickers/tape open a popover, draw toggles a draw mode, photo opens a picker.
export default function JournalToolbar({
  onAddPhotos, onAddItem, busy,
  drawMode, onToggleDraw, drawColor, onDrawColor, onUndo, onClear,
}) {
  const [open, setOpen] = useState(null) // 'sticker' | 'tape' | null
  const fileRef = useRef(null)
  const toggle = (t) => setOpen((o) => (o === t ? null : t))

  return (
    <div className="j-toolbar">
      {open === 'sticker' && (
        <div className="j-tool-pop">
          {STICKERS.map((s) => (
            <button key={s.id} className="j-deco-pick" onClick={() => onAddItem('sticker', s.id)}>
              <span className="ji-pick-sticker" dangerouslySetInnerHTML={{ __html: s.svg }} />
            </button>
          ))}
        </div>
      )}
      {open === 'tape' && (
        <div className="j-tool-pop">
          {TAPES.map((t) => (
            <button key={t.key} className="j-deco-pick" onClick={() => onAddItem('tape', t.key)}>
              <span className="ji-tape" style={{ background: t.style, position: 'static', display: 'block' }} />
            </button>
          ))}
        </div>
      )}

      {drawMode && (
        <div className="j-tool-draw">
          {DRAW_COLORS.map((c) => (
            <button key={c} className={'j-swatch' + (drawColor === c ? ' on' : '')} style={{ background: c }}
              onClick={() => onDrawColor(c)} aria-label="Pen colour" />
          ))}
          <span className="j-draw-sep" />
          <button className="j-draw-mini" onClick={onUndo} title="Undo last stroke">↶</button>
          <button className="j-draw-mini" onClick={onClear} title="Erase drawing">⌫</button>
          <button className="j-draw-done" onClick={onToggleDraw}>Done</button>
        </div>
      )}

      <div className="j-tool-row">
        <button className="j-tool" onClick={() => { setOpen(null); fileRef.current?.click() }} disabled={busy} title="Add photo">
          {TOOL_ICON.photo}<span className="j-tool-label">Photo</span>
        </button>
        <button className={'j-tool' + (open === 'sticker' ? ' on' : '')} onClick={() => toggle('sticker')} title="Stickers">
          {TOOL_ICON.sticker}<span className="j-tool-label">Stickers</span>
        </button>
        <button className={'j-tool' + (open === 'tape' ? ' on' : '')} onClick={() => toggle('tape')} title="Washi tape">
          {TOOL_ICON.tape}<span className="j-tool-label">Tape</span>
        </button>
        <button className={'j-tool' + (drawMode ? ' on' : '')} onClick={() => { setOpen(null); onToggleDraw() }} title="Draw">
          {TOOL_ICON.draw}<span className="j-tool-label">Draw</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { onAddPhotos(e.target.files); e.target.value = '' }} />
    </div>
  )
}
