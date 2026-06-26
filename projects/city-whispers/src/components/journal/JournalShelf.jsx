import { useRef } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'

const SPINES = ['place', 'food', 'people', 'weather', 'shop', 'other']
const spineColor = (i) => CATEGORY_COLORS[SPINES[i % SPINES.length]]

// The bookshelf: every saved journal is a little book; tap to open, plus a
// "new journal" book at the end. Arrows nudge the shelf when it overflows.
export default function JournalShelf({ journals, mine, onOpen, onNew, onDelete }) {
  const railRef = useRef(null)
  const nudge = (d) => railRef.current?.scrollBy({ left: d * 240, behavior: 'smooth' })

  const pageCount = (j) => {
    const ex = new Set(j.excluded || [])
    return mine.filter((m) => !ex.has(m.w.id)).length
  }

  return (
    <div className="j-shelf">
      <div className="j-shelf-head">
        <h2 className="j-shelf-title">My journals</h2>
        <p className="j-shelf-sub">Little keepsake books of your whispers. Make as many as you like.</p>
      </div>

      <div className="j-shelf-stage">
        {journals.length > 0 && (
          <button className="j-shelf-arrow left" onClick={() => nudge(-1)} aria-label="Scroll left">‹</button>
        )}

        <div className="j-shelf-rail" ref={railRef}>
          {journals.map((j, i) => (
            <div key={j.id} className="j-book" onClick={() => onOpen(j.id)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpen(j.id) }}>
              <div className="j-book-cover" style={{ '--spine': spineColor(i) }}>
                <span className="j-book-stamp" style={{ color: spineColor(i) }}
                  dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[SPINES[i % SPINES.length]] }} />
                <span className="j-book-name">{j.name || 'Untitled journal'}</span>
                <span className="j-book-count">{pageCount(j)} {pageCount(j) === 1 ? 'page' : 'pages'}</span>
              </div>
              <button className="j-book-del" aria-label="Delete journal"
                onClick={(e) => { e.stopPropagation(); onDelete(j.id) }}>×</button>
            </div>
          ))}

          <button className="j-book j-book-new" onClick={onNew}>
            <div className="j-book-cover j-book-cover-new">
              <span className="j-book-plus">+</span>
              <span className="j-book-name">New journal</span>
            </div>
          </button>
        </div>

        {journals.length > 0 && (
          <button className="j-shelf-arrow right" onClick={() => nudge(1)} aria-label="Scroll right">›</button>
        )}
      </div>

      <div className="j-shelf-plank" />
    </div>
  )
}
