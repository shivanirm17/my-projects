import { useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../../lib/constants'
import { TAPE_STYLE, STICKER_SVG } from './decoConstants'
import JournalMap from './JournalMap'

function fmtDate(w) {
  if (w.created_at) {
    const d = new Date(w.created_at)
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return w.time || ''
}

function renderItem(it) {
  if (it.kind === 'sticker') return <span className="ji-sticker" dangerouslySetInnerHTML={{ __html: STICKER_SVG[it.value] || '' }} />
  if (it.kind === 'tape') return <span className="ji-tape" style={{ background: TAPE_STYLE[it.value] || it.value }} />
  if (it.kind === 'stamp') return (
    <span className="ji-stamp" style={{ color: CATEGORY_COLORS[it.value] }}
      dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[it.value] || CATEGORY_SVGS.other }} />
  )
  return null
}

const toPath = (pts) => pts.length ? `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ') : ''
const clamp = (v) => Math.max(0, Math.min(100, v))

// One spread in the preview: the whisper-as-postcard (left) and the scrapbook
// page (right). Display-only — content comes from `deco`; editing happens in
// the panel. Placed stickers stay draggable; draw mode captures pointer strokes.
export default function JournalEntry({ item, cityCoords, deco, onDecoChange, drawMode, drawColor }) {
  const { city, w } = item
  const flower = w.flower || 'other'
  const { photos = [], items = [], strokes = [] } = deco || {}

  const pageRef = useRef(null)
  const drag = useRef(null)
  const draw = useRef(null)
  const [selected, setSelected] = useState(null)
  const [activeStroke, setActiveStroke] = useState(null)

  // ── sticker drag ──
  function startDrag(e, id) {
    if (drawMode) return
    e.stopPropagation()
    setSelected(id)
    const rect = pageRef.current.getBoundingClientRect()
    drag.current = { id, rect, moved: false }
    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', endDrag)
  }
  function onDrag(e) {
    const d = drag.current
    if (!d) return
    d.moved = true
    const x = clamp(((e.clientX - d.rect.left) / d.rect.width) * 100)
    const y = clamp(((e.clientY - d.rect.top) / d.rect.height) * 100)
    onDecoChange({ items: items.map((it) => (it.id === d.id ? { ...it, x, y } : it)) }, false)
  }
  function endDrag() {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', endDrag)
    if (drag.current?.moved) onDecoChange({}, true)
    drag.current = null
  }

  // ── freehand draw ──
  const pt = (e) => {
    const r = draw.current.rect
    return [clamp(((e.clientX - r.left) / r.width) * 100), clamp(((e.clientY - r.top) / r.height) * 100)]
  }
  function startDraw(e) {
    if (!drawMode) return
    e.stopPropagation()
    draw.current = { rect: pageRef.current.getBoundingClientRect() }
    setActiveStroke({ color: drawColor, pts: [pt(e)] })
    window.addEventListener('pointermove', moveDraw)
    window.addEventListener('pointerup', endDraw)
  }
  function moveDraw(e) { setActiveStroke((s) => (s ? { ...s, pts: [...s.pts, pt(e)] } : s)) }
  function endDraw() {
    window.removeEventListener('pointermove', moveDraw)
    window.removeEventListener('pointerup', endDraw)
    setActiveStroke((s) => {
      if (s && s.pts.length > 1) onDecoChange({ strokes: [...strokes, { color: s.color, d: toPath(s.pts) }] })
      return null
    })
  }

  const removeItem = (id) => { onDecoChange({ items: items.filter((it) => it.id !== id) }); setSelected(null) }
  const removePhoto = (i) => onDecoChange({ photos: photos.filter((_, j) => j !== i) })

  return (
    <div className="j-spread">
      <div className="j-page j-page-left">
        <JournalMap whisper={w} cityCoords={cityCoords} />
        <div className="j-stamp" style={{ color: CATEGORY_COLORS[flower] }}
          dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }} />
        <div className="j-postmark">
          <div className="j-pm-city">{city}</div>
          <div className="j-pm-time">{w.time}</div>
        </div>
        {w.place && <div className="j-place">{w.place}</div>}
        <div className="j-text">{w.text}</div>
        <div className="j-foot">
          <span className="j-sig">{w.author || signatureFor(w)}</span>
          <span className="j-date">{fmtDate(w)}</span>
        </div>
      </div>

      <div className="j-page j-page-right">
        <div className={'j-scrap' + (drawMode ? ' drawing' : '')} ref={pageRef} onPointerDown={() => setSelected(null)}>
          {items.map((it) => (
            <div
              key={it.id}
              className={'j-item' + (selected === it.id ? ' sel' : '')}
              style={{ left: it.x + '%', top: it.y + '%', transform: `translate(-50%,-50%) rotate(${it.rot}deg)` }}
              onPointerDown={(e) => startDrag(e, it.id)}
            >
              {renderItem(it)}
              {selected === it.id && !drawMode && (
                <button className="j-item-x" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeItem(it.id)} aria-label="Remove">×</button>
              )}
            </div>
          ))}

          {photos.length > 0 && (
            <div className="j-scrap-photos">
              {photos.map((src, i) => (
                <div className="j-photo" key={i}>
                  <img src={src} alt="" />
                  <button className="j-photo-x" onClick={() => removePhoto(i)} aria-label="Remove photo">×</button>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && items.length === 0 && strokes.length === 0 && !drawMode && (
            <div className="j-scrap-empty">tap a tool below to decorate this page</div>
          )}

          {/* drawing layer */}
          <svg
            className="j-draw" viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ pointerEvents: drawMode ? 'auto' : 'none' }}
            onPointerDown={startDraw}
          >
            {strokes.map((s, i) => (
              <path key={i} d={s.d} stroke={s.color} strokeWidth="2.4" fill="none"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
            {activeStroke && (
              <path d={toPath(activeStroke.pts)} stroke={activeStroke.color} strokeWidth="2.4" fill="none"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}
