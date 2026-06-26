import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { loadDeco, saveDeco, fileToDataUrl, loadMeta, saveMeta } from '../../lib/journalStore'
import { newItem } from './decoConstants'
import JournalEntry from './JournalEntry'
import JournalPanel from './JournalPanel'

const MAX_PHOTOS = 6

// The journal builder: a live diary preview on the left, a sticky panel on the
// right for naming, choosing whispers, and decorating the current page.
export default function Journal({ whispers, coords, isMine, onClose, onLeaveWhisper }) {
  const mine = useMemo(() => {
    const out = []
    Object.entries(whispers || {}).forEach(([city, list]) =>
      list.forEach((w) => { if (isMine(w)) out.push({ city, w }) })
    )
    return out
  }, [whispers, isMine])

  // journal-level settings (title + which whispers are excluded)
  const [meta, setMeta] = useState(() => loadMeta())
  const excluded = useMemo(() => new Set(meta.excluded), [meta.excluded])
  const selected = useMemo(() => mine.filter((m) => !excluded.has(m.w.id)), [mine, excluded])

  const [page, setPage] = useState(0) // 0 = cover, 1..n = selected spreads
  const total = selected.length + 1
  const safePage = Math.min(page, total - 1)
  const active = safePage > 0 ? selected[safePage - 1] : null
  const activeId = active?.w.id

  // decorations for the page currently in the preview (lifted so the panel and
  // the preview stay in sync). A ref keeps drag saves closure-safe.
  const [deco, setDeco] = useState({ caption: '', photos: [], items: [] })
  const decoRef = useRef(deco)
  useEffect(() => { decoRef.current = deco }, [deco])
  const [busy, setBusy] = useState(false)

  useEffect(() => { setDeco(loadDeco(activeId)) }, [activeId])

  function updateDeco(partial, save = true) {
    const merged = { ...decoRef.current, ...partial }
    decoRef.current = merged
    setDeco(merged)
    if (save && activeId) saveDeco(activeId, merged)
  }

  // meta helpers
  function setName(name) { const m = { ...meta, name }; setMeta(m); saveMeta(m) }
  function toggleWhisper(id) {
    const ex = new Set(meta.excluded)
    ex.has(id) ? ex.delete(id) : ex.add(id)
    const m = { ...meta, excluded: [...ex] }
    setMeta(m); saveMeta(m)
  }

  // page editing (from the panel)
  function addItem(kind, value) { updateDeco({ items: [...(decoRef.current.items || []), newItem(kind, value)] }) }
  async function addPhotos(fileList) {
    const files = [...fileList]
    if (!files.length) return
    setBusy(true)
    try {
      const added = []
      for (const f of files) { try { added.push(await fileToDataUrl(f)) } catch { /* skip */ } }
      updateDeco({ photos: [...(decoRef.current.photos || []), ...added].slice(0, MAX_PHOTOS) })
    } finally { setBusy(false) }
  }

  const go = (d) => setPage(() => Math.max(0, Math.min(total - 1, safePage + d)))
  const title = meta.name || 'My City Whispers'
  const cities = [...new Set(selected.map((m) => m.city))]

  return (
    <div id="journal-overlay">
      <button className="j-close" onClick={onClose} aria-label="Close journal">×</button>

      <div className="j-builder">
        {/* ── left: live preview ── */}
        <div className="j-preview">
          <div className="j-book">
            {mine.length === 0 ? (
              <div className="j-empty">
                <p>Your journal is waiting.</p>
                <small>Leave a whisper or two and they'll gather here as pages.</small>
                <button className="btn-primary j-empty-cta" onClick={() => { onClose?.(); onLeaveWhisper?.() }}>
                  Leave your first whisper
                </button>
              </div>
            ) : selected.length === 0 ? (
              <div className="j-empty">
                <p>No pages selected.</p>
                <small>Tick a few whispers in the panel to add them.</small>
              </div>
            ) : safePage === 0 ? (
              <div className="j-cover">
                <div className="j-cover-stamp" style={{ color: CATEGORY_COLORS.place }}
                  dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }} />
                <div className="j-cover-title">{title}</div>
                <div className="j-cover-sub">
                  {selected.length} {selected.length === 1 ? 'memory' : 'memories'} · {cities.length}{' '}
                  {cities.length === 1 ? 'city' : 'cities'}
                </div>
                <div className="j-cover-hint">turn the page →</div>
              </div>
            ) : (
              <JournalEntry
                key={activeId}
                item={active}
                cityCoords={coords?.[active.city]}
                deco={deco}
                onDecoChange={updateDeco}
              />
            )}
          </div>

          {selected.length > 0 && (
            <div className="j-nav">
              <button className="j-nav-btn" onClick={() => go(-1)} disabled={safePage === 0} aria-label="Previous page">←</button>
              <span className="j-nav-count">{safePage === 0 ? 'Cover' : `${safePage} of ${selected.length}`}</span>
              <button className="j-nav-btn" onClick={() => go(1)} disabled={safePage === total - 1} aria-label="Next page">→</button>
            </div>
          )}
        </div>

        {/* ── right: sticky builder panel ── */}
        <JournalPanel
          name={meta.name}
          onName={setName}
          mine={mine}
          excluded={excluded}
          onToggleWhisper={toggleWhisper}
          active={active}
          deco={deco}
          onCaption={(caption) => updateDeco({ caption })}
          onAddPhotos={addPhotos}
          onAddItem={addItem}
          busy={busy}
        />
      </div>
    </div>
  )
}
