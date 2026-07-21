import { useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../../lib/constants'
import { TAPE_STYLE, STICKER_SVG } from './decoConstants'
import { RotateIcon, ResizeIcon } from '../../lib/icons'
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
  if (it.kind === 'photo') return (
    <div className="ji-polaroid">
      <img className="ji-photo-img" src={it.value} alt="" draggable={false} />
    </div>
  )
  return null
}

const toPath = (pts) => pts.length ? `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ') : ''
const clamp = (v) => Math.max(0, Math.min(100, v))

// One spread in the preview: the whisper-as-postcard (left) and the scrapbook
// page (right). Display-only — content comes from `deco`; editing happens in
// the panel. Placed stickers stay draggable; draw mode captures pointer strokes.
export default function JournalEntry({ item, cityCoords, deco, onDecoChange, drawMode, eraseMode, drawColor }) {
  const { city, w } = item
  const flower = w.flower || 'other'
  const { items = [], strokes = [] } = deco || {}

  const pageRef = useRef(null)
  const drag = useRef(null)
  const draw = useRef(null)
  const pinch = useRef(null)
  const resize = useRef(null)
  const rotate = useRef(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const [selected, setSelected] = useState(null)
  const [activeStroke, setActiveStroke] = useState(null)

  const touchAngle = (a, b) => (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI

  // ── corner handle: drag to RESIZE a photo (mouse or touch) ──
  function startResize(e, it) {
    e.stopPropagation()
    e.preventDefault()
    cancelDrag()
    setSelected(it.id)
    resize.current = { id: it.id, startX: e.clientX, startW: it.w || 60, pageW: pageRef.current.getBoundingClientRect().width }
    window.addEventListener('pointermove', onResize)
    window.addEventListener('pointerup', endResize)
  }
  function onResize(e) {
    const r = resize.current
    if (!r) return
    const w = Math.max(18, Math.min(92, r.startW + ((e.clientX - r.startX) / r.pageW) * 100))
    onDecoChange({ items: itemsRef.current.map((it) => (it.id === r.id ? { ...it, w } : it)) }, false)
  }
  function endResize() {
    window.removeEventListener('pointermove', onResize)
    window.removeEventListener('pointerup', endResize)
    if (resize.current) onDecoChange({}, true)
    resize.current = null
  }

  // ── top handle: drag to ROTATE a photo (mouse or touch) ──
  function startRotate(e, it) {
    e.stopPropagation()
    e.preventDefault()
    cancelDrag()
    setSelected(it.id)
    const rect = pageRef.current.getBoundingClientRect()
    const cx = rect.left + (it.x / 100) * rect.width
    const cy = rect.top + (it.y / 100) * rect.height
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
    rotate.current = { id: it.id, cx, cy, startAngle, startRot: it.rot || 0 }
    window.addEventListener('pointermove', onRotate)
    window.addEventListener('pointerup', endRotate)
  }
  function onRotate(e) {
    const r = rotate.current
    if (!r) return
    const angle = (Math.atan2(e.clientY - r.cy, e.clientX - r.cx) * 180) / Math.PI
    const rot = Math.round(r.startRot + (angle - r.startAngle))
    onDecoChange({ items: itemsRef.current.map((it) => (it.id === r.id ? { ...it, rot } : it)) }, false)
  }
  function endRotate() {
    window.removeEventListener('pointermove', onRotate)
    window.removeEventListener('pointerup', endRotate)
    if (rotate.current) onDecoChange({}, true)
    rotate.current = null
  }

  // ── two-finger twist to ROTATE a photo (touch shortcut alongside the handle above) ──
  function startPinch(e, it) {
    if (e.touches.length !== 2 || it.kind !== 'photo') return
    cancelDrag()
    setSelected(it.id)
    const [a, b] = e.touches
    pinch.current = { id: it.id, angle: touchAngle(a, b), rot: it.rot || 0 }
    window.addEventListener('touchmove', pinchMove, { passive: false })
    window.addEventListener('touchend', pinchEnd)
    window.addEventListener('touchcancel', pinchEnd)
  }
  function pinchMove(e) {
    const p = pinch.current
    if (!p || e.touches.length < 2) return
    e.preventDefault()
    const [a, b] = e.touches
    const rot = Math.round(p.rot + (touchAngle(a, b) - p.angle))
    onDecoChange({ items: itemsRef.current.map((it) => (it.id === p.id ? { ...it, rot } : it)) }, false)
  }
  function pinchEnd(e) {
    if (!pinch.current || (e.touches && e.touches.length >= 2)) return
    window.removeEventListener('touchmove', pinchMove)
    window.removeEventListener('touchend', pinchEnd)
    window.removeEventListener('touchcancel', pinchEnd)
    onDecoChange({}, true)
    pinch.current = null
  }
  function cancelDrag() {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', endDrag)
    drag.current = null
  }

  // ── sticker drag ──
  function startDrag(e, id) {
    if (drawMode || pinch.current) return
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
    if (!drawMode || eraseMode) return  // erase mode taps strokes, doesn't draw
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
              className={'j-item' + (it.kind === 'photo' ? ' j-item-photo' : '') + (selected === it.id ? ' sel' : '')}
              style={{
                left: it.x + '%', top: it.y + '%',
                width: it.kind === 'photo' ? (it.w || 60) + '%' : undefined,
                transform: `translate(-50%,-50%) rotate(${it.rot}deg)`,
              }}
              onPointerDown={(e) => startDrag(e, it.id)}
              onTouchStart={it.kind === 'photo' ? (e) => startPinch(e, it) : undefined}
            >
              {renderItem(it)}
              {selected === it.id && !drawMode && (
                <button className="j-item-x" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeItem(it.id)} aria-label="Remove">×</button>
              )}
              {selected === it.id && !drawMode && it.kind === 'photo' && (
                <>
                  <span className="j-item-rotate-line" />
                  <button className="j-item-handle j-item-rotate" onPointerDown={(e) => startRotate(e, it)} aria-label="Rotate photo">
                    <RotateIcon size={13} />
                  </button>
                  <button className="j-item-handle j-item-resize" onPointerDown={(e) => startResize(e, it)} aria-label="Resize photo">
                    <ResizeIcon size={13} />
                  </button>
                </>
              )}
            </div>
          ))}

          {items.length === 0 && strokes.length === 0 && !drawMode && (
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
            {/* erase mode: a wide transparent hit-line per stroke; tap to remove */}
            {eraseMode && strokes.map((s, i) => (
              <path key={'hit' + i} d={s.d} stroke="transparent" strokeWidth="16" fill="none"
                strokeLinecap="round" vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onPointerDown={(e) => { e.stopPropagation(); onDecoChange({ strokes: strokes.filter((_, j) => j !== i) }) }} />
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
