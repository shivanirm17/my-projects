import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listJournals, createJournal, updateJournal, deleteJournal,
  loadDeco, saveDeco, fileToDataUrl,
} from '../../lib/journalStore'
import { newItem } from './decoConstants'
import JournalShelf from './JournalShelf'
import JournalSetup from './JournalSetup'
import JournalEntry from './JournalEntry'
import JournalToolbar from './JournalToolbar'
import JournalHint from './JournalHint'
import { PrintGate } from './JournalPrint'

const MAX_PHOTOS = 6
const emptyDeco = () => ({ caption: '', photos: [], items: [], strokes: [] })

// Three phases: a bookshelf of saved journals, a setup card for a new one, then
// the journal canvas you decorate in place. Decorations are scoped per journal.
export default function Journal({ whispers, coords, isMine, onClose, onLeaveWhisper }) {
  const mine = useMemo(() => {
    const out = []
    Object.entries(whispers || {}).forEach(([city, list]) =>
      list.forEach((w) => { if (isMine(w)) out.push({ city, w }) })
    )
    return out
  }, [whispers, isMine])

  const [journals, setJournals] = useState(() => listJournals())
  const refreshJournals = () => setJournals(listJournals())

  const [phase, setPhase] = useState('shelf') // 'shelf' | 'setup' | 'edit'
  const [activeId, setActiveId] = useState(null)
  const journal = useMemo(() => journals.find((j) => j.id === activeId) || null, [journals, activeId])

  const excluded = useMemo(() => new Set(journal?.excluded || []), [journal])
  const selected = useMemo(() => mine.filter((m) => !excluded.has(m.w.id)), [mine, excluded])
  const title = journal?.name || 'My City Whispers'

  const [page, setPage] = useState(0)
  const safePage = Math.min(page, Math.max(0, selected.length - 1))
  const active = selected[safePage]
  const activeWid = active?.w.id

  // ── per-page decorations + undo/redo history ──
  const [deco, setDeco] = useState(emptyDeco())
  const decoRef = useRef(deco)
  const committedRef = useRef(deco)   // last persisted snapshot (history anchor)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  useEffect(() => { decoRef.current = deco }, [deco])

  // load decorations when the page (or journal) changes; reset history
  useEffect(() => {
    const d = loadDeco(activeId, activeWid)
    decoRef.current = d
    committedRef.current = d
    setDeco(d)
    setPast([])
    setFuture([])
  }, [activeId, activeWid])

  const [busy, setBusy] = useState(false)

  function applyDeco(next, commit) {
    decoRef.current = next
    setDeco(next)
    if (commit) {
      committedRef.current = next
      saveDeco(activeId, activeWid, next)
    }
  }

  // partial merge; save=true commits a history step
  function updateDeco(partial, save = true) {
    const merged = { ...decoRef.current, ...partial }
    if (save) {
      setPast((p) => [...p, committedRef.current])
      setFuture([])
    }
    applyDeco(merged, save)
  }

  function undo() {
    setPast((p) => {
      if (!p.length) return p
      setFuture((f) => [committedRef.current, ...f])
      applyDeco(p[p.length - 1], true)
      return p.slice(0, -1)
    })
  }
  function redo() {
    setFuture((f) => {
      if (!f.length) return f
      setPast((p) => [...p, committedRef.current])
      applyDeco(f[0], true)
      return f.slice(1)
    })
  }
  function resetPage() {
    if (committedRef.current && !window.confirm('Clear all decorations on this page?')) return
    setPast((p) => [...p, committedRef.current])
    setFuture([])
    applyDeco(emptyDeco(), true)
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

  // ── page turn (with vertical-swipe support on touch) ──
  const [turnDir, setTurnDir] = useState('')
  function go(d) {
    setPage((p) => {
      const next = Math.max(0, Math.min(selected.length - 1, p + d))
      if (next !== p) setTurnDir(d > 0 ? 'up' : 'down')
      return next
    })
  }
  const swipe = useRef(null)
  function onCanvasPointerDown(e) {
    if (e.pointerType !== 'touch' || drawMode) { swipe.current = null; return }
    swipe.current = { y: e.clientY, t: Date.now() }
  }
  function onCanvasPointerUp(e) {
    const s = swipe.current
    swipe.current = null
    if (!s || e.pointerType !== 'touch') return
    const dy = e.clientY - s.y
    if (Math.abs(dy) > 60 && Date.now() - s.t < 800) go(dy < 0 ? 1 : -1)  // swipe up = next page
  }

  // name + whisper selection (persist to the active journal)
  function setName(name) { updateJournal(activeId, { name }); refreshJournals() }
  function toggleWhisper(id) {
    const ex = new Set(journal?.excluded || [])
    ex.has(id) ? ex.delete(id) : ex.add(id)
    updateJournal(activeId, { excluded: [...ex] })
    refreshJournals()
  }

  // shelf actions
  function openJournal(id) { setActiveId(id); setPage(0); setPhase('edit') }
  function newJournal() { const j = createJournal(''); refreshJournals(); setActiveId(j.id); setPage(0); setPhase('setup') }
  function removeJournal(id) {
    if (!window.confirm('Delete this journal? This cannot be undone.')) return
    deleteJournal(id); refreshJournals()
  }
  function backToShelf() { refreshJournals(); setPhase('shelf'); setDrawMode(false) }
  // closing setup: drop a never-finished, empty draft so the shelf stays tidy
  function closeSetup() {
    if (journal && !journal.name && (journal.excluded || []).length === 0) deleteJournal(activeId)
    backToShelf()
  }

  const [saved, setSaved] = useState(false)
  function save() {
    if (activeWid) saveDeco(activeId, activeWid, decoRef.current)
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

  // ── phase: bookshelf collection ──
  if (phase === 'shelf') {
    return (
      <div id="journal-overlay">
        <button className="j-close" onClick={onClose} aria-label="Close journal">×</button>
        <JournalShelf
          journals={journals}
          mine={mine}
          onOpen={openJournal}
          onNew={newJournal}
          onDelete={removeJournal}
        />
      </div>
    )
  }

  // ── phase: setup (name + choose whispers) for the active journal ──
  if (phase === 'setup') {
    return (
      <div id="journal-overlay">
        <button className="j-close" onClick={closeSetup} aria-label="Close journal">×</button>
        <JournalSetup
          mine={mine}
          name={journal?.name || ''}
          onName={setName}
          excluded={excluded}
          onToggle={toggleWhisper}
          onGenerate={() => { setPage(0); setPhase('edit') }}
        />
      </div>
    )
  }

  // ── phase: the journal canvas ──
  return (
    <div id="journal-overlay" className="j-editing">
      <div className="j-topbar">
        <button className="j-top-back" onClick={backToShelf} title="Back to shelf" aria-label="Back to shelf">‹</button>
        <input className="j-top-name" value={journal?.name || ''} placeholder="My City Whispers"
          onChange={(e) => setName(e.target.value)} maxLength={40} />
        <button className="j-top-btn" onClick={() => setDownloading(true)} title="Download PDF">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
        </button>
        <button className="j-top-save" onClick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
        <button className="j-close j-close-inline" onClick={onClose} aria-label="Close journal">×</button>
      </div>

      <div className="j-canvas" onPointerDown={onCanvasPointerDown} onPointerUp={onCanvasPointerUp}>
        {active ? (
          <div className={'j-turn' + (turnDir ? ' turn-' + turnDir : '')} key={activeId + ':' + activeWid}>
            <JournalEntry
              item={active}
              cityCoords={coords?.[active.city]}
              deco={deco}
              onDecoChange={updateDeco}
              drawMode={drawMode}
              drawColor={drawColor}
            />
          </div>
        ) : (
          <div className="j-empty"><p>No pages selected.</p><small>Go back and tick a whisper.</small></div>
        )}
      </div>

      {/* undo / redo / reset */}
      <div className="j-history">
        <button className="j-hist-btn" onClick={undo} disabled={!past.length} title="Undo" aria-label="Undo">↶</button>
        <button className="j-hist-btn" onClick={redo} disabled={!future.length} title="Redo" aria-label="Redo">↷</button>
        <button className="j-hist-btn" onClick={resetPage} title="Reset page" aria-label="Reset page">⟲</button>
      </div>

      {selected.length > 1 && (
        <div className="j-pagenav">
          <button className="j-page-arrow" onClick={() => go(-1)} disabled={safePage === 0} aria-label="Previous page">‹</button>
          <div className="j-page-count">{safePage + 1} / {selected.length}</div>
          <button className="j-page-arrow" onClick={() => go(1)} disabled={safePage === selected.length - 1} aria-label="Next page">›</button>
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

      {selected.length > 1 && <JournalHint />}

      {downloading && (
        <PrintGate title={title} selected={selected} coords={coords} onDone={() => setDownloading(false)} />
      )}
    </div>
  )
}
