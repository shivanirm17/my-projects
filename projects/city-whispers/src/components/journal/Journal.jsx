import { useEffect, useMemo, useRef, useState } from 'react'
import { loadDeco, saveDeco, fileToDataUrl, loadMeta, saveMeta } from '../../lib/journalStore'
import { newItem } from './decoConstants'
import JournalSetup from './JournalSetup'
import JournalEntry from './JournalEntry'
import JournalToolbar from './JournalToolbar'
import { PrintGate } from './JournalPrint'

const MAX_PHOTOS = 6

// Two phases: a setup card (name + choose whispers → Generate), then the
// journal itself as a full-screen canvas you decorate in place and save.
export default function Journal({ whispers, coords, isMine, onClose, onLeaveWhisper }) {
  const mine = useMemo(() => {
    const out = []
    Object.entries(whispers || {}).forEach(([city, list]) =>
      list.forEach((w) => { if (isMine(w)) out.push({ city, w }) })
    )
    return out
  }, [whispers, isMine])

  const [meta, setMeta] = useState(() => loadMeta())
  const excluded = useMemo(() => new Set(meta.excluded), [meta.excluded])
  const selected = useMemo(() => mine.filter((m) => !excluded.has(m.w.id)), [mine, excluded])
  const title = meta.name || 'My City Whispers'

  const [phase, setPhase] = useState('setup') // 'setup' | 'edit'
  const [page, setPage] = useState(0) // index into selected
  const safePage = Math.min(page, Math.max(0, selected.length - 1))
  const active = selected[safePage]
  const activeId = active?.w.id

  // decorations for the current page (lifted; ref keeps drag/draw saves fresh)
  const [deco, setDeco] = useState({ caption: '', photos: [], items: [], strokes: [] })
  const decoRef = useRef(deco)
  useEffect(() => { decoRef.current = deco }, [deco])
  useEffect(() => { setDeco(loadDeco(activeId)) }, [activeId])
  const [busy, setBusy] = useState(false)

  function updateDeco(partial, save = true) {
    const merged = { ...decoRef.current, ...partial }
    decoRef.current = merged
    setDeco(merged)
    if (save && activeId) saveDeco(activeId, merged)
  }

  // meta
  function setName(name) { const m = { ...meta, name }; setMeta(m); saveMeta(m) }
  function toggleWhisper(id) {
    const ex = new Set(meta.excluded)
    ex.has(id) ? ex.delete(id) : ex.add(id)
    const m = { ...meta, excluded: [...ex] }
    setMeta(m); saveMeta(m)
  }

  // decorate
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

  // draw
  const [drawMode, setDrawMode] = useState(false)
  const [drawColor, setDrawColor] = useState('#5a4f3a')
  const undoStroke = () => updateDeco({ strokes: (decoRef.current.strokes || []).slice(0, -1) })
  const clearStrokes = () => updateDeco({ strokes: [] })

  const go = (d) => setPage((p) => Math.max(0, Math.min(selected.length - 1, p + d)))

  // save (everything already persists; this confirms + closes) + download
  const [saved, setSaved] = useState(false)
  function save() {
    if (activeId) saveDeco(activeId, decoRef.current)
    saveMeta(meta)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }
  const [downloading, setDownloading] = useState(false)

  // ── empty: no whispers yet ──
  if (mine.length === 0) {
    return (
      <div id="journal-overlay">
        <button className="j-close" onClick={onClose} aria-label="Close journal">×</button>
        <div className="j-empty j-empty-center">
          <p>Your journal is waiting.</p>
          <small>Leave a whisper or two and they'll gather here as pages.</small>
          <button className="btn-primary j-empty-cta" onClick={() => { onClose?.(); onLeaveWhisper?.() }}>
            Leave your first whisper
          </button>
        </div>
      </div>
    )
  }

  // ── phase 1: setup ──
  if (phase === 'setup') {
    return (
      <div id="journal-overlay">
        <button className="j-close" onClick={onClose} aria-label="Close journal">×</button>
        <JournalSetup
          mine={mine}
          name={meta.name}
          onName={setName}
          excluded={excluded}
          onToggle={toggleWhisper}
          onGenerate={() => { setPage(0); setPhase('edit') }}
        />
      </div>
    )
  }

  // ── phase 2: the journal canvas ──
  return (
    <div id="journal-overlay" className="j-editing">
      <div className="j-topbar">
        <button className="j-top-back" onClick={() => setPhase('setup')} title="Back to setup" aria-label="Back to setup">‹</button>
        <input className="j-top-name" value={meta.name} placeholder="My City Whispers"
          onChange={(e) => setName(e.target.value)} maxLength={40} />
        <button className="j-top-btn" onClick={() => setDownloading(true)} title="Download PDF">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
        </button>
        <button className="j-top-save" onClick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
        <button className="j-close j-close-inline" onClick={onClose} aria-label="Close journal">×</button>
      </div>

      <div className="j-canvas">
        {active ? (
          <JournalEntry
            key={activeId}
            item={active}
            cityCoords={coords?.[active.city]}
            deco={deco}
            onDecoChange={updateDeco}
            drawMode={drawMode}
            drawColor={drawColor}
          />
        ) : (
          <div className="j-empty"><p>No pages selected.</p><small>Go back and tick a whisper.</small></div>
        )}
      </div>

      {selected.length > 1 && (
        <div className="j-nav j-nav-float">
          <button className="j-nav-btn" onClick={() => go(-1)} disabled={safePage === 0} aria-label="Previous page">←</button>
          <span className="j-nav-count">{safePage + 1} of {selected.length}</span>
          <button className="j-nav-btn" onClick={() => go(1)} disabled={safePage === selected.length - 1} aria-label="Next page">→</button>
        </div>
      )}

      <JournalToolbar
        onAddPhotos={addPhotos}
        onAddItem={addItem}
        busy={busy}
        drawMode={drawMode}
        onToggleDraw={() => setDrawMode((d) => !d)}
        drawColor={drawColor}
        onDrawColor={setDrawColor}
        onUndo={undoStroke}
        onClear={clearStrokes}
      />

      {downloading && (
        <PrintGate title={title} selected={selected} coords={coords} onDone={() => setDownloading(false)} />
      )}
    </div>
  )
}
