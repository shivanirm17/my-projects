// Journals live on the device (no accounts) in localStorage, like the rest of
// the app (cw-* keys). A *collection* of journals: an index of journal metas
// (cw-journals) plus per-journal, per-whisper decoration blobs
// (cw-jd-<journalId>-<whisperId>).
const INDEX_KEY = 'cw-journals'
const MIGRATED_KEY = 'cw-journals-migrated'
// legacy single-journal keys (migrated once, then removed)
const LEGACY_PREFIX = 'cw-journal-'        // cw-journal-<whisperId>
const LEGACY_META = 'cw-journal-meta'

const uid = () => Math.random().toString(36).slice(2, 9)
const decoPrefix = (journalId) => `cw-jd-${journalId}-`
const arr = (v) => (Array.isArray(v) ? v : [])
const emptyDeco = () => ({ caption: '', photos: [], items: [], strokes: [] })

// ── Journal index (the collection) ────────────────────────────────────────
export function listJournals() {
  migrateLegacy()
  try {
    const a = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]')
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

function writeIndex(list) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('journal: could not save collection', e?.message || e)
  }
}

export function createJournal(name, included = []) {
  // Opt-in membership: a journal holds an explicit `included` list of whisper
  // ids, so whispers planted later are NOT auto-added.
  const j = { id: uid(), name: name || '', included, createdAt: Date.now() }
  writeIndex([...listJournals(), j])
  return j
}

export function updateJournal(id, patch) {
  const list = listJournals().map((j) => (j.id === id ? { ...j, ...patch } : j))
  writeIndex(list)
  return list.find((j) => j.id === id)
}

export function deleteJournal(id) {
  // drop this journal's decoration blobs, then remove it from the index
  try {
    const pre = decoPrefix(id)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(pre)) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
  writeIndex(listJournals().filter((j) => j.id !== id))
}

// ── Per-page decorations (scoped to a journal) ──────────────────────────────
export function loadDeco(journalId, whisperId) {
  if (!journalId || !whisperId) return emptyDeco()
  try {
    const raw = localStorage.getItem(decoPrefix(journalId) + whisperId)
    if (!raw) return emptyDeco()
    const d = JSON.parse(raw)
    let items = arr(d.items)
    // legacy: photos were a string[] in a grid — convert to movable photo items
    const legacy = arr(d.photos).filter((p) => typeof p === 'string')
    if (legacy.length) {
      items = [...items, ...legacy.map((src, i) => ({
        id: 'ph' + Math.random().toString(36).slice(2, 7),
        kind: 'photo', value: src,
        x: 34 + (i % 2) * 30, y: 32 + Math.floor(i / 2) * 28, rot: i % 2 ? 4 : -4, w: 38,
      }))]
    }
    return { caption: d.caption || '', photos: [], items, strokes: arr(d.strokes) }
  } catch {
    return emptyDeco()
  }
}

export function saveDeco(journalId, whisperId, deco) {
  if (!journalId || !whisperId) return
  const key = decoPrefix(journalId) + whisperId
  try {
    const empty = !deco.caption &&
      !(deco.photos || []).length && !(deco.items || []).length && !(deco.strokes || []).length
    if (empty) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(deco))
  } catch (e) {
    // localStorage quota (photos are the usual culprit) — fail soft
    console.warn('journal: could not save decorations', e?.message || e)
  }
}

// ── One-time migration: the old single journal becomes the first book ───────
function migrateLegacy() {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return
    const alreadyHasIndex = localStorage.getItem(INDEX_KEY)
    const legacyMetaRaw = localStorage.getItem(LEGACY_META)
    if (!alreadyHasIndex && legacyMetaRaw) {
      let meta = {}
      try { meta = JSON.parse(legacyMetaRaw) } catch { /* default below */ }
      const j = {
        id: uid(),
        name: meta.name || 'My City Whispers',
        excluded: arr(meta.excluded),
        createdAt: Date.now(),
      }
      // re-key cw-journal-<whisperId>  →  cw-jd-<journalId>-<whisperId>
      const moves = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(LEGACY_PREFIX) && k !== LEGACY_META) {
          moves.push([k, decoPrefix(j.id) + k.slice(LEGACY_PREFIX.length)])
        }
      }
      moves.forEach(([from, to]) => {
        const v = localStorage.getItem(from)
        if (v != null) localStorage.setItem(to, v)
        localStorage.removeItem(from)
      })
      localStorage.setItem(INDEX_KEY, JSON.stringify([j]))
      localStorage.removeItem(LEGACY_META)
    }
    localStorage.setItem(MIGRATED_KEY, '1')
  } catch (e) {
    console.warn('journal: migration failed', e?.message || e)
  }
}

// Downscale + re-encode an image File to a compact JPEG data URL, so a few
// photos comfortably fit the localStorage budget.
export function fileToDataUrl(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const img = new Image()
    reader.onload = () => { img.src = reader.result }
    reader.onerror = reject
    img.onerror = reject
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width); width = maxDim
      } else if (height >= width && height > maxDim) {
        width = Math.round((width * maxDim) / height); height = maxDim
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e)
      }
    }
    reader.readAsDataURL(file)
  })
}
