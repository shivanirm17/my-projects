import { CATEGORY_SVGS, CATEGORY_COLORS } from '../../lib/constants'

// First screen: name the journal and choose which whispers go in it, then
// Generate. (Opt-in: we track the explicitly included whisper ids.)
export default function JournalSetup({ mine, name, onName, included, onToggle, onGenerate }) {
  const count = included.size

  return (
    <div className="j-setup">
      <div className="j-setup-stamp" style={{ color: CATEGORY_COLORS.place }}
        dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }} />
      <h2 className="j-setup-title">Make your journal</h2>
      <p className="j-setup-sub">Name it, pick the memories to bind in, and we'll lay out the pages.</p>

      <label className="j-setup-label">Journal title</label>
      <input
        className="j-setup-name"
        value={name}
        placeholder="My City Whispers"
        onChange={(e) => onName(e.target.value)}
        maxLength={40}
        autoFocus
      />

      <div className="j-setup-whead">
        <span className="j-setup-label">Choose your whispers</span>
        <span className="j-setup-count">{count} of {mine.length}</span>
      </div>
      <div className="j-setup-list">
        {mine.map(({ city, w }) => {
          const on = included.has(w.id)
          return (
            <label key={w.id} className={'j-setup-row' + (on ? ' on' : '')}>
              <input type="checkbox" checked={on} onChange={() => onToggle(w.id)} />
              <span className="j-setup-city">{city}</span>
              <span className="j-setup-text">{w.place || w.text}</span>
            </label>
          )
        })}
      </div>

      <button className="btn-primary j-setup-go" onClick={onGenerate} disabled={count === 0}>
        {count === 0 ? 'Pick at least one' : `Generate journal · ${count} ${count === 1 ? 'page' : 'pages'}`}
      </button>
    </div>
  )
}
