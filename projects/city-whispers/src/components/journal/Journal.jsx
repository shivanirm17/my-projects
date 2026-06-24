import { useMemo, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import JournalEntry from './JournalEntry'

// A keepsake book of this device's own whispers. Page 0 is the cover; each
// following page is a two-page spread for one whisper.
export default function Journal({ whispers, coords, isMine, onClose }) {
  const mine = useMemo(() => {
    const out = []
    Object.entries(whispers || {}).forEach(([city, list]) =>
      list.forEach((w) => { if (isMine(w)) out.push({ city, w }) })
    )
    return out // already newest-first from fetchWhispers
  }, [whispers, isMine])

  const [page, setPage] = useState(0)
  const total = mine.length + 1 // cover + one per whisper
  const go = (d) => setPage((p) => Math.max(0, Math.min(total - 1, p + d)))

  const cities = [...new Set(mine.map((m) => m.city))]

  return (
    <div id="journal-overlay">
      <button className="j-close" onClick={onClose} aria-label="Close journal">×</button>

      <div className="j-book">
        {mine.length === 0 ? (
          <div className="j-empty">
            <p>Your journal is waiting.</p>
            <small>Leave a whisper or two and they'll gather here.</small>
          </div>
        ) : page === 0 ? (
          <div className="j-cover">
            <div
              className="j-cover-stamp"
              style={{ color: CATEGORY_COLORS.place }}
              dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }}
            />
            <div className="j-cover-title">My City<br />Whispers</div>
            <div className="j-cover-sub">
              {mine.length} {mine.length === 1 ? 'memory' : 'memories'} · {cities.length}{' '}
              {cities.length === 1 ? 'city' : 'cities'}
            </div>
            <div className="j-cover-hint">turn the page →</div>
          </div>
        ) : (
          <JournalEntry item={mine[page - 1]} cityCoords={coords?.[mine[page - 1].city]} />
        )}
      </div>

      {mine.length > 0 && (
        <div className="j-nav">
          <button className="j-nav-btn" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous page">←</button>
          <span className="j-nav-count">{page === 0 ? 'Cover' : `${page} of ${mine.length}`}</span>
          <button className="j-nav-btn" onClick={() => go(1)} disabled={page === total - 1} aria-label="Next page">→</button>
        </div>
      )}
    </div>
  )
}
