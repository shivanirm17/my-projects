import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listJournals, createJournal, updateJournal, deleteJournal,
  loadDeco, saveDeco, fileToDataUrl,
} from '../../lib/journalStore'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { supabase } from '../../lib/store'
import html2canvas from 'html2canvas'
import { SparkleIcon, PolaroidIcon, DownloadIcon, PreviewIcon } from '../../lib/icons'
import { newItem } from './decoConstants'
import JournalShelf from './JournalShelf'
import JournalSetup from './JournalSetup'
import JournalChecklist from './JournalChecklist'
import JournalEntry from './JournalEntry'
import JournalToolbar from './JournalToolbar'
import JournalHint from './JournalHint'

function track(event, journalId, pageCount) {
  if (!supabase) return
  supabase.from('journal_events').insert({ event, journal_id: journalId, page_count: pageCount ?? null }).then(() => {})
}

const MAX_PHOTOS = 3
const emptyDeco = () => ({ caption: '', photos: [], items: [], strokes: [] })

// Phases: a bookshelf of saved journals → a setup card for a new one → the
// journal canvas. Membership is opt-in: a journal holds an explicit list of
// whisper ids, so whispers planted later don't auto-join.
export default function Journal({ whispers, coords, isMine, initial, onClose, onLeaveWhisper, onAddWhisper, onOpenMenu }) {
  const mine = useMemo(() => {
    const out = []
    Object.entries(whispers || {}).forEach(([city, list]) =>
      list.forEach((w) => { if (isMine(w)) out.push({ city, w }) })
    )
    return out
  }, [whispers, isMine])

  const [journals, setJournals] = useState(() => listJournals())
  const refreshJournals = () => setJournals(listJournals())

  const [phase, setPhase] = useState(initial?.id ? 'edit' : 'shelf') // 'shelf' | 'setup' | 'edit' | 'preview'
  const [activeId, setActiveId] = useState(initial?.id || null)
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

  // ── decorations + ONE global undo/redo history ──
  // The stack holds ops across the whole journal session: deco edits on any page
  // (stickers, tape, photos, drags, resizes, draw, clear) AND page add/remove.
  const [deco, setDeco] = useState(emptyDeco())
  const decoRef = useRef(deco)
  const committedRef = useRef(deco)        // last-saved deco of the CURRENT page
  const hist = useRef({ stack: [], idx: -1 })
  const [, forceHist] = useState(0)
  const bumpHist = () => forceHist((n) => n + 1)
  const canUndo = hist.current.idx >= 0
  const canRedo = hist.current.idx < hist.current.stack.length - 1
  useEffect(() => { decoRef.current = deco }, [deco])

  // load the current page's deco when the page changes (history is NOT reset)
  useEffect(() => {
    const d = loadDeco(activeId, activeWid)
    decoRef.current = d
    committedRef.current = d
    setDeco(d)
  }, [activeId, activeWid])

  // reset the whole history when switching to a different journal
  useEffect(() => { hist.current = { stack: [], idx: -1 }; bumpHist() }, [activeId])


  const [busy, setBusy] = useState(false)

  function pushOp(op) {
    const h = hist.current
    h.stack = h.stack.slice(0, h.idx + 1)
    h.stack.push(op)
    h.idx = h.stack.length - 1
    bumpHist()
  }

  function applyDeco(next, commit) {
    decoRef.current = next
    setDeco(next)
    if (commit) { committedRef.current = next; saveDeco(activeId, activeWid, next) }
  }
  // record a deco op against a specific page (defaults to the current one)
  function updateDeco(partial, save = true) {
    const merged = { ...decoRef.current, ...partial }
    if (save) {
      const before = committedRef.current
      applyDeco(merged, true)
      pushOp({ kind: 'deco', wid: activeWid, before, after: merged })
    } else {
      applyDeco(merged, false)
    }
  }

  // jump to the page holding a whisper id (so the undone change is visible)
  function goToWid(wid, incList) {
    const incSet = new Set(incList || journal?.included || [])
    const idx = mine.filter((m) => incSet.has(m.w.id)).findIndex((m) => m.w.id === wid)
    if (idx >= 0) setPage(idx)
  }

  function applyOp(op, dir) {
    if (op.kind === 'deco') {
      const d = dir === 'undo' ? op.before : op.after
      saveDeco(activeId, op.wid, d)
      goToWid(op.wid)
      if (op.wid === activeWid) { decoRef.current = d; committedRef.current = d; setDeco(d) }
    } else if (op.kind === 'include') {
      const inc = dir === 'undo' ? op.before : op.after
      updateJournal(activeId, { included: inc })
      refreshJournals()
      if (op.wid) goToWid(op.wid, inc)
    }
  }
  function undo() {
    const h = hist.current
    if (h.idx < 0) return
    const op = h.stack[h.idx]
    h.idx -= 1; bumpHist()
    applyOp(op, 'undo')
  }
  function redo() {
    const h = hist.current
    if (h.idx >= h.stack.length - 1) return
    h.idx += 1; bumpHist()
    applyOp(h.stack[h.idx], 'redo')
  }
  function resetPage() {
    if (!window.confirm('Clear all decorations on this page?')) return
    updateDeco({ caption: '', photos: [], items: [], strokes: [] }, true)
  }

  // decorate
  function addItem(kind, value) { updateDeco({ items: [...(decoRef.current.items || []), newItem(kind, value)] }) }
  async function addPhotos(fileList) {
    const files = [...fileList]
    if (!files.length) return
    const have = (decoRef.current.items || []).filter((i) => i.kind === 'photo').length
    const room = MAX_PHOTOS - have
    if (room <= 0) { window.alert(`A page can hold up to ${MAX_PHOTOS} photos.`); return }
    setBusy(true)
    try {
      const added = []
      for (const f of files.slice(0, room)) { try { added.push(await fileToDataUrl(f)) } catch { /* skip */ } }
      const photoItems = added.map((src) => ({ ...newItem('photo', src), w: 54 }))
      updateDeco({ items: [...(decoRef.current.items || []), ...photoItems] })
    } finally { setBusy(false) }
  }

  // draw
  const [drawMode, setDrawMode] = useState(false)
  const [eraseMode, setEraseMode] = useState(false)
  const [drawColor, setDrawColor] = useState('#5a4f3a')
  const setDraw = (v) => { setDrawMode(v); if (!v) setEraseMode(false) }

  // ── page turn + vertical-swipe (touch) ──
  const [turnDir, setTurnDir] = useState('')
  const touch = useRef(null)
  function onTouchStart(e) {
    if (drawMode || e.touches.length !== 1) { touch.current = null; return }
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }
  function onTouchEnd(e) {
    const s = touch.current
    touch.current = null
    if (!s) return
    const dx = e.changedTouches[0].clientX - s.x
    const dy = e.changedTouches[0].clientY - s.y
    // horizontal swipe (left = next), ignoring mostly-vertical scrolls
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) && Date.now() - s.t < 700) go(dx < 0 ? 1 : -1)
  }

  // name + membership (persist to the active journal)
  function setName(name) { updateJournal(activeId, { name }); refreshJournals() }
  // toggle a whisper in/out of the journal (recorded for global undo)
  function toggleWhisper(id) {
    const before = [...(journal?.included || [])]
    const after = before.includes(id) ? before.filter((x) => x !== id) : [...before, id]
    updateJournal(activeId, { included: after })
    refreshJournals()
    if (phase === 'edit') pushOp({ kind: 'include', before, after, wid: id })
  }

  // "Add whisper" modal — a checklist of all your whispers
  const [addingPage, setAddingPage] = useState(!!initial?.openAdd)
  function removePage() {
    if (!activeWid) return
    if (!window.confirm('Remove this page from the keepsake?\n\nYour whisper itself stays on the map. This only takes it out of this keepsake.')) return
    const before = [...(journal?.included || [])]
    const inc = before.filter((id) => id !== activeWid)
    updateJournal(activeId, { included: inc })
    refreshJournals()
    pushOp({ kind: 'include', before, after: inc, wid: activeWid })
    setPage((p) => Math.max(0, Math.min(p, inc.length - 1)))
  }

  // shelf actions
  function openJournal(id) {
    const j = journals.find(x => x.id === id)
    const pc = j ? mine.filter(m => !new Set(j.excluded || []).has(m.w.id)).length : undefined
    track('opened', id, pc)
    setActiveId(id); setPage(0); setPhase('edit')
  }
  function previewJournal(id) {
    track('previewed', id)
    setActiveId(id); setPage(0); setPhase('preview')
  }
  // preview the page currently open in the editor, without resetting to page 0
  function previewFromEdit() {
    if (activeId && activeWid) saveDeco(activeId, activeWid, decoRef.current)
    track('previewed', activeId)
    setPhase('preview')
  }
  function newJournal() {
    const j = createJournal('', mine.map((m) => m.w.id))
    track('created', j.id, mine.length)
    refreshJournals(); setActiveId(j.id); setPage(0); setPhase('setup')
  }
  function removeJournal(id) {
    if (!window.confirm('Delete this keepsake? This cannot be undone.')) return
    deleteJournal(id); refreshJournals()
  }
  function backToShelf() {
    if (activeId && activeWid) saveDeco(activeId, activeWid, decoRef.current)
    refreshJournals(); setPhase('shelf'); setDraw(false)
  }

  function chrome(back, title) {
    return (
      <div className="j-header">
        <button className="j-header-btn" onClick={back} aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
        </button>
        {title && <span className="j-header-title">{title}</span>}
        <button className="j-header-btn j-header-menu" onClick={() => onOpenMenu?.()} aria-label="Menu">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
    )
  }
  function closeSetup() {
    // discard an unnamed, never-opened new draft so the shelf stays tidy
    if (journal && !journal.name) deleteJournal(activeId)
    backToShelf()
  }

  // ── auto-save: persist deco 600ms after any change ──
  const autoSaveTimer = useRef(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saved'
  useEffect(() => {
    if (phase !== 'edit' || !activeId || !activeWid) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveDeco(activeId, activeWid, decoRef.current)
      setSaveStatus('saved')
      autoSaveTimer.current = setTimeout(() => setSaveStatus('idle'), 1800)
    }, 600)
    return () => clearTimeout(autoSaveTimer.current)
  }, [deco]) // eslint-disable-line react-hooks/exhaustive-deps

  // save current page when navigating away from it
  function go(d) {
    if (activeId && activeWid) saveDeco(activeId, activeWid, decoRef.current)
    setPage((p) => {
      const next = Math.max(0, Math.min(selected.length - 1, p + d))
      if (next !== p) setTurnDir(d > 0 ? 'next' : 'prev')
      return next
    })
  }

  function save() {
    if (activeWid) saveDeco(activeId, activeWid, decoRef.current)
    track('saved', activeId, selected.length)
    backToShelf()
  }

  // ── preview: save the current page as a PNG (a real screenshot of the
  //    on-screen spread, not a hand-recreated one, so it's an exact match) ──
  const previewRef = useRef(null)
  const [imgStatus, setImgStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  async function saveImage() {
    if (!active || !previewRef.current) return
    setImgStatus('saving')
    try {
      await document.fonts.ready
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--card') || '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = ((journal?.name || active.city || 'keepsake').replace(/[^a-z0-9]/gi, '-').toLowerCase()) + '.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setImgStatus('saved')
      setTimeout(() => setImgStatus('idle'), 1800)
    } catch (err) {
      console.error('Save image failed:', err)
      setImgStatus('error')
      setTimeout(() => setImgStatus('idle'), 2200)
    }
  }

  // ── empty: no whispers yet ──
  if (mine.length === 0) {
    return (
      <div id="journal-overlay">
        {chrome(onClose, 'My Keepsakes')}
        <div className="j-empty j-empty-center">
          <div className="j-empty-illus" aria-hidden="true">
            <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="10" width="58" height="80" rx="4" fill="var(--paper)" stroke="var(--border)" strokeWidth="1.5" />
              <rect x="74" y="10" width="58" height="80" rx="4" fill="var(--paper2)" stroke="var(--border)" strokeWidth="1.5" />
              <rect x="68" y="8" width="6" height="84" rx="2" fill="var(--brown)" opacity="0.75" />
              <rect x="18" y="24" width="38" height="52" rx="2" fill="none" stroke="var(--border)" strokeWidth="1.4" strokeDasharray="3 3" />
              <rect x="84" y="24" width="38" height="52" rx="2" fill="none" stroke="var(--border)" strokeWidth="1.4" strokeDasharray="3 3" />
              <circle cx="126" cy="14" r="2" fill="#dfaf4e" opacity="0.8" />
              <circle cx="10" cy="86" r="1.6" fill="#a8bba0" opacity="0.8" />
            </svg>
            <span className="j-empty-float j-empty-float-a"><SparkleIcon size={18} /></span>
            <span className="j-empty-float j-empty-float-b"><PolaroidIcon size={18} /></span>
          </div>
          <p>Your keepsakes are waiting.</p>
          <small>Leave a whisper or two and they'll gather here as pages, ready to decorate.</small>
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
        {chrome(onClose, 'My Keepsakes')}
        <JournalShelf journals={journals} mine={mine} onOpen={openJournal} onNew={newJournal} onDelete={removeJournal} onPreview={previewJournal} />
      </div>
    )
  }

  // ── phase: setup (name + choose whispers) ──
  if (phase === 'setup') {
    return (
      <div id="journal-overlay">
        {chrome(closeSetup, 'New keepsake')}
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

  // ── phase: preview (read-only, screenshot-friendly) ──
  if (phase === 'preview') {
    return (
      <div id="journal-overlay">
        {chrome(backToShelf, journal?.name || 'Untitled keepsake')}
        <div className="j-canvas j-preview" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {active ? (
            <div ref={previewRef} className={'j-turn' + (turnDir ? ' turn-' + turnDir : '')} key={activeId + ':' + activeWid}>
              <JournalEntry
                item={active}
                cityCoords={coords?.[active.city]}
                deco={deco}
                onDecoChange={() => {}}
                readOnly
              />
            </div>
          ) : (
            <div className="j-empty">
              <p>No pages in this keepsake yet.</p>
            </div>
          )}

          {selected.length > 0 && (
            <div className="j-pagenav">
              <button className="j-page-arrow" onClick={() => go(-1)} disabled={safePage === 0 || selected.length < 2} aria-label="Previous page">‹</button>
              <div className="j-page-count">{safePage + 1} / {selected.length}</div>
              <button className="j-page-arrow" onClick={() => go(1)} disabled={safePage >= selected.length - 1} aria-label="Next page">›</button>
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="j-preview-foot">
            <button className="j-preview-save" onClick={saveImage} disabled={imgStatus === 'saving'}>
              <DownloadIcon size={16} />
              {imgStatus === 'saving' ? 'Saving…' : imgStatus === 'saved' ? 'Saved ✓' : imgStatus === 'error' ? "Couldn't save" : 'Save this page'}
            </button>
            <p className="j-preview-hint">Saves both sides of the page as one image.</p>
          </div>
        )}
      </div>
    )
  }

  // ── phase: the journal canvas ──
  return (
    <div id="journal-overlay" className="j-editing">
      <div className="j-header">
        <button className="j-header-btn" onClick={backToShelf} aria-label="Back to shelf">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
        </button>
        <input className="j-header-name" value={journal?.name || ''} placeholder="Untitled keepsake"
          onChange={(e) => setName(e.target.value)} maxLength={40} />
        {saveStatus === 'saved' && <span className="j-autosave">✓</span>}
        <button className="j-top-save" onClick={save}>Done</button>
        <button className="j-header-btn j-header-menu" onClick={() => onOpenMenu?.()} aria-label="Menu">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      <div className="j-canvas" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {active ? (
          <div className={'j-turn' + (turnDir ? ' turn-' + turnDir : '')} key={activeId + ':' + activeWid}>
            <button className="j-page-del" onClick={removePage} aria-label="Delete this page" title="Delete this page">×</button>
            <JournalEntry
              item={active}
              cityCoords={coords?.[active.city]}
              deco={deco}
              onDecoChange={updateDeco}
              drawMode={drawMode}
              eraseMode={eraseMode}
              drawColor={drawColor}
            />
          </div>
        ) : (
          <div className="j-empty">
            <p>No pages in this keepsake yet.</p>
            <small>Tap the + tool to bind in a whisper.</small>
          </div>
        )}

        {selected.length > 0 && (
          <div className="j-pagenav">
            <button className="j-page-arrow" onClick={() => go(-1)} disabled={safePage === 0 || selected.length < 2} aria-label="Previous page">‹</button>
            <div className="j-page-count">{safePage + 1} / {selected.length}</div>
            <button className="j-page-arrow" onClick={() => go(1)} disabled={safePage >= selected.length - 1} aria-label="Next page">›</button>
            <button className="j-page-arrow j-page-preview" onClick={previewFromEdit} aria-label="Preview this page" title="Preview">
              <PreviewIcon size={17} />
            </button>
          </div>
        )}
      </div>

      <JournalToolbar
        onAddPhotos={addPhotos}
        onAddItem={addItem}
        onAddPage={() => setAddingPage(true)}
        busy={busy}
        drawMode={drawMode}
        onDraw={setDraw}
        eraseMode={eraseMode}
        onErase={setEraseMode}
        drawColor={drawColor}
        onDrawColor={setDrawColor}
        onUndo={undo}
        onRedo={redo}
        onReset={resetPage}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {selected.length > 1 && <JournalHint />}

      {addingPage && (
        <div className="j-addpage" onClick={() => setAddingPage(false)}>
          <div className="j-addpage-card" onClick={(e) => e.stopPropagation()}>
            <div className="j-addpage-head">
              <span>Manage pages</span>
              <button className="j-addpage-x" onClick={() => setAddingPage(false)} aria-label="Close">×</button>
            </div>
            <p className="j-addpage-hint">Tap a whisper to add it as a page, tap again to remove it. Or plant a new whisper to add.</p>
            <JournalChecklist
              mine={mine}
              included={included}
              onToggle={toggleWhisper}
              onPlantNew={() => { setAddingPage(false); onAddWhisper?.(activeId) }}
            />
            <div className="j-addpage-foot">
              <button className="btn-primary" onClick={() => setAddingPage(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
