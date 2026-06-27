import { useRef } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'

const SPINES = ['place', 'food', 'people', 'weather', 'shop', 'other']
const spineColor = (i) => CATEGORY_COLORS[SPINES[i % SPINES.length]]

const IconEdit = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 3.5a1.414 1.414 0 012 2L6 16H4v-2L14.5 3.5z" />
  </svg>
)
const IconShare = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3v10M6 7l4-4 4 4" />
    <path d="M5 13v3h10v-3" />
  </svg>
)
const IconDownload = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3v10M6 9l4 4 4-4" />
    <path d="M5 16h10" />
  </svg>
)
const IconDelete = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
)

export default function JournalShelf({ journals, mine, onOpen, onNew, onDelete, onDownload, onShare }) {
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
            <div key={j.id} className="j-book">
              <div className="j-book-cover" style={{ '--spine': spineColor(i) }}
                onClick={() => onOpen(j.id)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpen(j.id) }}>
                <span className="j-book-stamp" style={{ color: spineColor(i) }}
                  dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[SPINES[i % SPINES.length]] }} />
                <span className="j-book-name">{j.name || 'Untitled journal'}</span>
                <span className="j-book-count">{pageCount(j)} {pageCount(j) === 1 ? 'page' : 'pages'}</span>
              </div>
              <div className="j-book-actions">
                <button className="j-book-action" title="Edit" aria-label="Edit journal"
                  onClick={(e) => { e.stopPropagation(); onOpen(j.id) }}>
                  <IconEdit />
                </button>
                <button className="j-book-action" title="Share" aria-label="Share journal"
                  onClick={(e) => { e.stopPropagation(); onShare(j) }}>
                  <IconShare />
                </button>
                <button className="j-book-action" title="Download" aria-label="Download journal"
                  onClick={(e) => { e.stopPropagation(); onDownload(j.id) }}>
                  <IconDownload />
                </button>
                <button className="j-book-action j-book-action-del" title="Delete" aria-label="Delete journal"
                  onClick={(e) => { e.stopPropagation(); onDelete(j.id) }}>
                  <IconDelete />
                </button>
              </div>
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
