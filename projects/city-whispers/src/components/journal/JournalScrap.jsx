import { useEffect, useRef, useState } from 'react'
import { loadDeco, saveDeco, fileToDataUrl } from '../../lib/journalStore'

const MAX_PHOTOS = 6

// The decoratable right page: taped photos + a handwritten caption, saved
// per whisper on the device. Saves are imperative (in the handlers) so there's
// no effect race when navigating between spreads.
export default function JournalScrap({ whisperId }) {
  const [caption, setCaption] = useState('')
  const [photos, setPhotos] = useState([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  // load this whisper's decorations whenever the spread changes
  useEffect(() => {
    const d = loadDeco(whisperId)
    setCaption(d.caption)
    setPhotos(d.photos)
  }, [whisperId])

  // write through to storage with the latest values merged
  function persist(next) {
    const merged = { caption, photos, ...next }
    if (next.caption !== undefined) setCaption(next.caption)
    if (next.photos !== undefined) setPhotos(next.photos)
    saveDeco(whisperId, merged)
  }

  async function onFiles(e) {
    const files = [...e.target.files]
    e.target.value = '' // allow re-picking the same file later
    if (!files.length) return
    setBusy(true)
    try {
      const added = []
      for (const f of files) {
        try { added.push(await fileToDataUrl(f)) } catch { /* skip a bad file */ }
      }
      persist({ photos: [...photos, ...added].slice(0, MAX_PHOTOS) })
    } finally {
      setBusy(false)
    }
  }

  const removePhoto = (i) => persist({ photos: photos.filter((_, j) => j !== i) })

  return (
    <div className="j-scrap">
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
    </div>
  )
}
