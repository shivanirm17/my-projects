import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'
import { EditIcon, PreviewIcon, TrashIcon } from '../../lib/icons'

const SPINES = ['place', 'food', 'people', 'weather', 'shop', 'other']
const spineColor = (i) => CATEGORY_COLORS[SPINES[i % SPINES.length]]

export default function JournalShelf({ journals, mine, onOpen, onNew, onDelete, onPreview }) {
  const pageCount = (j) => {
    const ex = new Set(j.excluded || [])
    return mine.filter((m) => !ex.has(m.w.id)).length
  }

  return (
    <div className="j-shelf">
      <div className="j-shelf-head">
        <h2 className="j-shelf-title">My Keepsakes</h2>
        <p className="j-shelf-sub">Turn your whispers into keepsakes. Make as many as you like.</p>
      </div>

      <div className="j-shelf-grid">
        {journals.map((j, i) => (
          <div key={j.id} className="j-book">
            <div className="j-book-cover" style={{ '--spine': spineColor(i) }}
              onClick={() => onOpen(j.id)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpen(j.id) }}>
              <span className="j-book-stamp" style={{ color: spineColor(i) }}
                dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[SPINES[i % SPINES.length]] }} />
              <span className="j-book-name">{j.name || 'Untitled keepsake'}</span>
              <span className="j-book-count">{pageCount(j)} {pageCount(j) === 1 ? 'page' : 'pages'}</span>
            </div>
            <div className="j-book-actions">
              <button className="j-book-action" title="Edit" aria-label="Edit keepsake"
                onClick={(e) => { e.stopPropagation(); onOpen(j.id) }}>
                <EditIcon size={17} />
              </button>
              <button className="j-book-action" title="Preview" aria-label="Preview keepsake"
                onClick={(e) => { e.stopPropagation(); onPreview(j.id) }}>
                <PreviewIcon size={17} />
              </button>
              <button className="j-book-action j-book-action-del" title="Delete" aria-label="Delete keepsake"
                onClick={(e) => { e.stopPropagation(); onDelete(j.id) }}>
                <TrashIcon size={17} />
              </button>
            </div>
          </div>
        ))}

        <button className="j-book j-book-new" onClick={onNew}>
          <div className="j-book-cover j-book-cover-new">
            <span className="j-book-plus">+</span>
            <span className="j-book-name">New keepsake</span>
          </div>
        </button>
      </div>
    </div>
  )
}
