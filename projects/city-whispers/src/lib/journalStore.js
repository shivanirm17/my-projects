// Journal decorations live on the device (no accounts), keyed by whisper id —
// same anonymous, localStorage model as the rest of the app (cw-* keys).
const PREFIX = 'cw-journal-'
const META_KEY = 'cw-journal-meta'

// Journal-level settings: the title, and which whispers are left out. Whispers
// are included by default (we store the *excluded* ids) so newly planted ones
// show up automatically.
export function loadMeta() {
  try {
    const d = JSON.parse(localStorage.getItem(META_KEY) || '{}')
    return { name: d.name || '', excluded: Array.isArray(d.excluded) ? d.excluded : [] }
  } catch {
    return { name: '', excluded: [] }
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({
      name: meta.name || '',
      excluded: meta.excluded || [],
    }))
  } catch (e) {
    console.warn('journal: could not save settings', e?.message || e)
  }
}

const EMPTY = { caption: '', photos: [], items: [] }

export function loadDeco(id) {
  if (!id) return { caption: '', photos: [], items: [] }
  try {
    const raw = localStorage.getItem(PREFIX + id)
    if (!raw) return { caption: '', photos: [], items: [] }
    const d = JSON.parse(raw)
    return {
      caption: d.caption || '',
      photos: Array.isArray(d.photos) ? d.photos : [],
      items: Array.isArray(d.items) ? d.items : [],
    }
  } catch {
    return { caption: '', photos: [], items: [] }
  }
}

export function saveDeco(id, deco) {
  if (!id) return
  try {
    const empty = !deco.caption &&
      (!deco.photos || deco.photos.length === 0) &&
      (!deco.items || deco.items.length === 0)
    if (empty) localStorage.removeItem(PREFIX + id)
    else localStorage.setItem(PREFIX + id, JSON.stringify(deco))
  } catch (e) {
    // localStorage quota (photos are the usual culprit) — fail soft
    console.warn('journal: could not save decorations', e?.message || e)
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
