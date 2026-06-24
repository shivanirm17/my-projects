import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../../lib/constants'
import JournalMap from './JournalMap'

// Prefer a real date from created_at; fall back to the relative time string.
function fmtDate(w) {
  if (w.created_at) {
    const d = new Date(w.created_at)
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return w.time || ''
}

// One two-page spread: the whisper-as-postcard on the left, a blank scrapbook
// page on the right (decoration arrives in Phase 2).
export default function JournalEntry({ item, cityCoords }) {
  const { city, w } = item
  const flower = w.flower || 'other'

  return (
    <div className="j-spread">
      <div className="j-page j-page-left">
        <JournalMap whisper={w} cityCoords={cityCoords} />

        <div
          className="j-stamp"
          style={{ color: CATEGORY_COLORS[flower] }}
          dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }}
        />
        <div className="j-postmark">
          <div className="j-pm-city">{city}</div>
          <div className="j-pm-time">{w.time}</div>
        </div>

        {w.place && <div className="j-place">{w.place}</div>}
        <div className="j-text">{w.text}</div>

        <div className="j-foot">
          <span className="j-sig">{w.author || signatureFor(w)}</span>
          <span className="j-date">{fmtDate(w)}</span>
        </div>
      </div>

      <div className="j-page j-page-right">
        <div className="j-scrap-hint">
          <span className="j-scrap-title">Your page</span>
          <small>a photo, a doodle, a note — soon</small>
        </div>
      </div>
    </div>
  )
}
