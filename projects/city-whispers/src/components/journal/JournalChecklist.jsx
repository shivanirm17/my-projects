import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'

// Shared whisper-card checklist used in both the setup step and the "Add
// whisper" modal. Each card toggles membership; an optional "plant a new
// whisper" card sits at the end.
export default function JournalChecklist({ mine, included, onToggle, onPlantNew }) {
  return (
    <div className="wc-list">
      {mine.map(({ city, w }) => {
        const on = included.has(w.id)
        return (
          <button key={w.id} className={'wc-card' + (on ? ' on' : '')} onClick={() => onToggle(w.id)}>
            <span className="wc-stamp" style={{ color: CATEGORY_COLORS[w.flower || 'other'] }}
              dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[w.flower || 'other'] || CATEGORY_SVGS.other }} />
            <span className="wc-body">
              <span className="wc-city">{city}</span>
              <span className="wc-text">{w.place || w.text}</span>
            </span>
            <span className={'wc-check' + (on ? ' on' : '')} aria-hidden="true">{on ? '✓' : ''}</span>
          </button>
        )
      })}
      {onPlantNew && (
        <button className="wc-card wc-new" onClick={onPlantNew}>
          <span className="wc-new-plus">＋</span>
          <span className="wc-text">Plant a new whisper</span>
        </button>
      )}
    </div>
  )
}
