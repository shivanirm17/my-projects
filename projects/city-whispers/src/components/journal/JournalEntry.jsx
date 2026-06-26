import { useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../../lib/constants'
import { TAPE_COLOR } from './decoConstants'
import JournalMap from './JournalMap'

function fmtDate(w) {
  if (w.created_at) {
    const d = new Date(w.created_at)
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return w.time || ''
}

function renderItem(it) {
  if (it.kind === 'emoji') return <span className="ji-emoji">{it.value}</span>
  if (it.kind === 'tape') return <span className="ji-tape" style={{ background: TAPE_COLOR[it.value] || it.value }} />
  if (it.kind === 'stamp') return (
    <span className="ji-stamp" style={{ color: CATEGORY_COLORS[it.value] }}
      dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[it.value] || CATEGORY_SVGS.other }} />
  )
  return null
}

// One spread in the live preview: the whisper-as-postcard (left) and the
// scrapbook page (right). Display-only — photos/caption/decorations come from
// `deco`; editing happens in the panel. Placed items stay draggable here.
export default function JournalEntry({ item, cityCoords, deco, onDecoChange }) {
  const { city, w } = item
  const flower = w.flower || 'other'
  const { caption = '', photos = [], items = [] } = deco || {}

  const pageRef = useRef(null)
  const drag = useRef(null)
  const [selected, setSelected] = useState(null)

  function startDrag(e, id) {
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
    const x = Math.max(2, Math.min(98, ((e.clientX - d.rect.left) / d.rect.width) * 100))
    const y = Math.max(2, Math.min(98, ((e.clientY - d.rect.top) / d.rect.height) * 100))
    onDecoChange({ items: items.map((it) => (it.id === d.id ? { ...it, x, y } : it)) }, false)
  }
  function endDrag() {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', endDrag)
    if (drag.current?.moved) onDecoChange({}, true) // commit current items
    drag.current = null
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
        <div className="j-scrap" ref={pageRef} onPointerDown={() => setSelected(null)}>
          {items.map((it) => (
            <div
              key={it.id}
              className={'j-item' + (selected === it.id ? ' sel' : '')}
              style={{ left: it.x + '%', top: it.y + '%', transform: `translate(-50%,-50%) rotate(${it.rot}deg)` }}
              onPointerDown={(e) => startDrag(e, it.id)}
            >
              {renderItem(it)}
              {selected === it.id && (
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

          {caption && <div className="j-caption-read">{caption}</div>}
          {!caption && photos.length === 0 && items.length === 0 && (
            <div className="j-scrap-empty">Decorate this page →</div>
          )}
        </div>
      </div>
    </div>
  )
}
