import { useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { STICKERS, TAPES, STAMPS, DRAW_COLORS } from './decoConstants'

const TOOL_ICON = {
  photo: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.2" /><path d="M8 6l1.5-2h5L16 6" /></svg>,
  sticker: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 109 9c-4 0-9-1-9 9z" transform="translate(0 -1)" /><circle cx="9.5" cy="10" r="1" fill="currentColor" /><circle cx="14" cy="10" r="1" fill="currentColor" /></svg>,
  tape: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="6" rx="1" transform="rotate(-8 12 12)" /></svg>,
  stamp: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5" width="16" height="14" rx="1.4" strokeDasharray="2 1.6" /><rect x="7" y="8" width="10" height="8" rx="0.8" /></svg>,
  draw: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7a2 2 0 00-3-3l-7 7-1 4z" /><path d="M16 6l2 2" /></svg>,
}

// The floating tool pill that sits over the journal canvas. Each tool opens a
// small popover (or acts directly), and pieces land on the page.
export default function JournalToolbar({
  onAddPhotos, onAddItem, busy,
  drawMode, onToggleDraw, drawColor, onDrawColor, onUndo, onClear,
}) {
  const [open, setOpen] = useState(null) // 'sticker' | 'tape' | 'stamp' | null
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
      {open === 'stamp' && (
        <div className="j-tool-pop">
          {STAMPS.map((s) => (
            <button key={s} className="j-deco-pick" onClick={() => onAddItem('stamp', s)}>
              <span className="ji-stamp" style={{ color: CATEGORY_COLORS[s] }} dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[s] }} />
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
          {TOOL_ICON.photo}
        </button>
        <button className={'j-tool' + (open === 'sticker' ? ' on' : '')} onClick={() => toggle('sticker')} title="Stickers">{TOOL_ICON.sticker}</button>
        <button className={'j-tool' + (open === 'tape' ? ' on' : '')} onClick={() => toggle('tape')} title="Washi tape">{TOOL_ICON.tape}</button>
        <button className={'j-tool' + (open === 'stamp' ? ' on' : '')} onClick={() => toggle('stamp')} title="Stamps">{TOOL_ICON.stamp}</button>
        <button className={'j-tool' + (drawMode ? ' on' : '')} onClick={() => { setOpen(null); onToggleDraw() }} title="Draw">{TOOL_ICON.draw}</button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { onAddPhotos(e.target.files); e.target.value = '' }} />
    </div>
  )
}
