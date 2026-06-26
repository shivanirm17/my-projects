import { useEffect, useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { loadDeco, saveDeco, fileToDataUrl } from '../../lib/journalStore'

const MAX_PHOTOS = 6

// decoration palette ------------------------------------------------------------
const EMOJIS = ['🌸', '🌿', '☀️', '🌙', '⭐', '❤️', '✈️', '☕', '🍂', '🌊', '📷', '🎈', '🍷', '🗺️', '🐚', '🌅']
const TAPES = [
  { key: 'pink', color: 'rgba(244,166,192,0.55)' },
  { key: 'peach', color: 'rgba(247,207,159,0.6)' },
  { key: 'sage', color: 'rgba(168,187,160,0.6)' },
  { key: 'blue', color: 'rgba(143,182,201,0.55)' },
  { key: 'gold', color: 'rgba(223,175,78,0.5)' },
  { key: 'lilac', color: 'rgba(185,163,216,0.55)' },
]
const TAPE_COLOR = Object.fromEntries(TAPES.map((t) => [t.key, t.color]))
const STAMPS = Object.keys(CATEGORY_SVGS)

const rid = () => Math.random().toString(36).slice(2, 9)
const randRot = () => Math.round((Math.random() * 16 - 8))

// The decoratable right page: photos, a handwritten caption, and freely placed
// stickers/emojis/washi tape. Everything saved per whisper on the device.
export default function JournalScrap({ whisperId }) {
  const [caption, setCaption] = useState('')
  const [photos, setPhotos] = useState([])
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [tray, setTray] = useState(null) // 'emoji' | 'tape' | 'stamp' | null
  const [selected, setSelected] = useState(null)
  const fileRef = useRef(null)
  const pageRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const d = loadDeco(whisperId)
    setCaption(d.caption); setPhotos(d.photos); setItems(d.items)
    setSelected(null); setTray(null)
  }, [whisperId])

  function persist(next) {
    const merged = { caption, photos, items, ...next }
    if (next.caption !== undefined) setCaption(next.caption)
    if (next.photos !== undefined) setPhotos(next.photos)
    if (next.items !== undefined) setItems(next.items)
    saveDeco(whisperId, merged)
  }

  // ── photos ──
  async function onFiles(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      const added = []
      for (const f of files) { try { added.push(await fileToDataUrl(f)) } catch { /* skip */ } }
      persist({ photos: [...photos, ...added].slice(0, MAX_PHOTOS) })
    } finally { setBusy(false) }
  }
  const removePhoto = (i) => persist({ photos: photos.filter((_, j) => j !== i) })

  // ── decorations ──
  function addItem(kind, value) {
    const it = { id: rid(), kind, value, x: 42 + Math.random() * 16, y: 30 + Math.random() * 20, rot: randRot() }
    persist({ items: [...items, it] })
    setSelected(it.id)
    setTray(null)
  }
  const removeItem = (id) => { persist({ items: items.filter((it) => it.id !== id) }); setSelected(null) }

  // drag a placed item; positions stored as % of the page so they survive resize
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
    setItems((prev) => prev.map((it) => (it.id === d.id ? { ...it, x, y } : it)))
  }
  function endDrag() {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', endDrag)
    if (drag.current?.moved) saveDeco(whisperId, { caption, photos, items: itemsRef.current })
    drag.current = null
  }
  // keep a ref of the latest items for the pointerup save (closure-safe)
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  function renderItem(it) {
    if (it.kind === 'emoji') return <span className="ji-emoji">{it.value}</span>
    if (it.kind === 'tape') return <span className="ji-tape" style={{ background: TAPE_COLOR[it.value] || it.value }} />
    if (it.kind === 'stamp') return (
      <span className="ji-stamp" style={{ color: CATEGORY_COLORS[it.value] }}
        dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[it.value] || CATEGORY_SVGS.other }} />
    )
    return null
  }

  return (
    <div className="j-scrap" ref={pageRef} onPointerDown={() => setSelected(null)}>
      {/* placed decorations layer */}
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

      <div className="j-scrap-photos">
        {photos.map((src, i) => (
          <div className="j-photo" key={i}>
            <img src={src} alt="" />
            <button className="j-photo-x" onClick={() => removePhoto(i)} aria-label="Remove photo">×</button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button className="j-photo-add" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? '…' : '＋ photo'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      </div>

      <textarea
        className="j-caption"
        placeholder="write a little note…"
        value={caption}
        onChange={(e) => persist({ caption: e.target.value })}
        rows={2}
      />

      {/* decoration toolbar */}
      <div className="j-deco-bar" onPointerDown={(e) => e.stopPropagation()}>
        <button className={'j-deco-tab' + (tray === 'emoji' ? ' on' : '')} onClick={() => setTray(tray === 'emoji' ? null : 'emoji')}>😊</button>
        <button className={'j-deco-tab' + (tray === 'tape' ? ' on' : '')} onClick={() => setTray(tray === 'tape' ? null : 'tape')} title="Washi tape">▭</button>
        <button className={'j-deco-tab' + (tray === 'stamp' ? ' on' : '')} onClick={() => setTray(tray === 'stamp' ? null : 'stamp')} title="Stamps">✦</button>
      </div>

      {tray && (
        <div className="j-deco-tray" onPointerDown={(e) => e.stopPropagation()}>
          {tray === 'emoji' && EMOJIS.map((e) => (
            <button key={e} className="j-deco-pick" onClick={() => addItem('emoji', e)}>{e}</button>
          ))}
          {tray === 'tape' && TAPES.map((t) => (
            <button key={t.key} className="j-deco-pick" onClick={() => addItem('tape', t.key)}>
              <span className="ji-tape" style={{ background: t.color, position: 'static', display: 'block' }} />
            </button>
          ))}
          {tray === 'stamp' && STAMPS.map((s) => (
            <button key={s} className="j-deco-pick" onClick={() => addItem('stamp', s)}>
              <span className="ji-stamp" style={{ color: CATEGORY_COLORS[s] }} dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[s] }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
