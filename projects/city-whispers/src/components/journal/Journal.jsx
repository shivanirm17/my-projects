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

// Phases: a bookshelf of saved journals → a setup card for a new one → the
// journal canvas. Membership is opt-in: a journal holds an explicit list of
// whisper ids, so whispers planted later don't auto-join.
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

  // one-time convert legacy exclude-based journals → opt-in include list
  useEffect(() => {
    if (journal && journal.included === undefined) {
      const ex = new Set(journal.excluded || [])
      updateJournal(journal.id, { included: mine.filter((m) => !ex.has(m.w.id)).map((m) => m.w.id) })
      refreshJournals()
    }
  }, [journal, mine])

  const included = useMemo(() => new Set(journal?.included || []), [journal])
  const selected = useMemo(() => mine.filter((m) => included.has(m.w.id)), [mine, included])
  const title = journal?.name || 'My City Whispers'

  const [page, setPage] = useState(0)
  const safePage = Math.min(page, Math.max(0, selected.length - 1))
  const active = selected[safePage]
  const activeWid = active?.w.id

  // ── per-page decorations + undo/redo history ──
  const [deco, setDeco] = useState(emptyDeco())
  const decoRef = useRef(deco)
  const committedRef = useRef(deco)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  useEffect(() => { decoRef.current = deco }, [deco])

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
    if (commit) { committedRef.current = next; saveDeco(activeId, activeWid, next) }
  }
  function updateDeco(partial, save = true) {
    const merged = { ...decoRef.current, ...partial }
    if (save) { setPast((p) => [...p, committedRef.current]); setFuture([]) }
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
    if (!window.confirm('Clear all decorations on this page?')) return
    setPast((p) => [...p, committedRef.current]); setFuture([])
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

  // ── page turn + vertical-swipe (touch) ──
  const [turnDir, setTurnDir] = useState('')
  function go(d) {
    setPage((p) => {
      const next = Math.max(0, Math.min(selected.length - 1, p + d))
      if (next !== p) setTurnDir(d > 0 ? 'up' : 'down')
      return next
    })
  }
  const touch = useRef(null)
  function onTouchStart(e) {
    if (drawMode || e.touches.length !== 1) { touch.current = null; return }
    touch.current = { y: e.touches[0].clientY, top: e.currentTarget.scrollTop, t: Date.now() }
  }
  function onTouchEnd(e) {
    const s = touch.current
    touch.current = null
    if (!s) return
    const dy = e.changedTouches[0].clientY - s.y
    const scrolled = Math.abs(e.currentTarget.scrollTop - s.top)
    // turn only on a deliberate vertical swipe that didn't scroll the canvas
    if (scrolled < 8 && Math.abs(dy) > 48 && Date.now() - s.t < 700) go(dy < 0 ? 1 : -1)
  }

  // name + membership (persist to the active journal)
  function setName(name) { updateJournal(activeId, { name }); refreshJournals() }
  function toggleWhisper(id) {
    const inc = new Set(journal?.included || [])
    inc.has(id) ? inc.delete(id) : inc.add(id)
    updateJournal(activeId, { included: [...inc] })
    refreshJournals()
  }

  // add a page: pick a whisper not yet in this journal
  const [addingPage, setAddingPage] = useState(false)
  const addable = useMemo(() => mine.filter((m) => !included.has(m.w.id)), [mine, included])
  function addPage(id) {
    const inc = [...(journal?.included || []), id]
    updateJournal(activeId, { included: inc })
    refreshJournals()
    const incSet = new Set(inc)
    const idx = mine.filter((m) => incSet.has(m.w.id)).findIndex((m) => m.w.id === id)
    if (idx >= 0) setPage(idx)
    setAddingPage(false)
  }

  // shelf actions
  function openJournal(id) { setActiveId(id); setPage(0); setPhase('edit') }
  function newJournal() {
    const j = createJournal('', mine.map((m) => m.w.id)) // start with your current whispers
    refreshJournals(); setActiveId(j.id); setPage(0); setPhase('setup')
  }
  function removeJournal(id) {
    if (!window.confirm('Delete this journal? This cannot be undone.')) return
    deleteJournal(id); refreshJournals()
  }
  function backToShelf() { refreshJournals(); setPhase('shelf'); setDrawMode(false) }
  function closeSetup() {
    // discard an unnamed, never-opened new draft so the shelf stays tidy
    if (journal && !journal.name) deleteJournal(activeId)
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
        <JournalShelf journals={journals} mine={mine} onOpen={openJournal} onNew={newJournal} onDelete={removeJournal} />
      </div>
    )
  }

  // ── phase: setup (name + choose whispers) ──
  if (phase === 'setup') {
    return (
      <div id="journal-overlay">
        <button className="j-close" onClick={closeSetup} aria-label="Close journal">×</button>
        <JournalSetup
          mine={mine}
          name={journal?.name || ''}
          onName={setName}
          included={included}
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

      <div className="j-canvas" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
          <div className="j-empty">
            <p>No pages in this journal yet.</p>
            <small>Tap “Add page” to bind in a whisper.</small>
          </div>
        )}
      </div>

      <div className="j-pagenav">
        <button className="j-page-arrow" onClick={() => go(-1)} disabled={safePage === 0 || selected.length < 2} aria-label="Previous page">‹</button>
        <div className="j-page-count">{selected.length ? `${safePage + 1} / ${selected.length}` : '0'}</div>
        <button className="j-page-arrow" onClick={() => go(1)} disabled={safePage >= selected.length - 1} aria-label="Next page">›</button>
        <span className="j-nav-sep" />
        <button className="j-page-add" onClick={() => setAddingPage(true)} disabled={!addable.length} title="Add a page">+</button>
      </div>

      <JournalToolbar
        onAddPhotos={addPhotos}
        onAddItem={addItem}
        busy={busy}
        drawMode={drawMode}
        onToggleDraw={() => setDrawMode((d) => !d)}
        drawColor={drawColor}
        onDrawColor={setDrawColor}
        onDrawUndo={undoStroke}
        onDrawClear={clearStrokes}
        onUndo={undo}
        onRedo={redo}
        onReset={resetPage}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
      />

      {selected.length > 1 && <JournalHint />}

      {addingPage && (
        <div className="j-addpage" onClick={() => setAddingPage(false)}>
          <div className="j-addpage-card" onClick={(e) => e.stopPropagation()}>
            <div className="j-addpage-head">
              <span>Add a page</span>
              <button className="j-addpage-x" onClick={() => setAddingPage(false)} aria-label="Close">×</button>
            </div>
            {addable.length ? (
              <div className="j-addpage-list">
                {addable.map(({ city, w }) => (
                  <button key={w.id} className="j-addpage-row" onClick={() => addPage(w.id)}>
                    <span className="j-addpage-city">{city}</span>
                    <span className="j-addpage-text">{w.place || w.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="j-addpage-empty">Every whisper is already in this journal.</p>
            )}
          </div>
        </div>
      )}

      {downloading && (
        <PrintGate title={title} selected={selected} coords={coords} onDone={() => setDownloading(false)} />
      )}
    </div>
  )
}
