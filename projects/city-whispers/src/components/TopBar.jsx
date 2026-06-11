import { useRef, useState } from 'react'
import { MAPBOX_TOKEN } from '../lib/constants'
import { SoundOnIcon, SoundOffIcon } from '../lib/icons'

export default function TopBar({ whispers, onSearch, onPickGeoCity, onHome, onHelp, soundOn, onToggleSound }) {
  const [query, setQuery] = useState('')
  const [localMatches, setLocalMatches] = useState([])
  const [geoMatches, setGeoMatches] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const hide = () => setOpen(false)

  function handleInput(value) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 220)
  }

  async function fetchSuggestions(q) {
    q = q.trim()
    if (!q) { hide(); return }
    const ql = q.toLowerCase()

    const local = Object.keys(whispers)
      .filter((c) => c.toLowerCase().includes(ql))
      .sort((a, b) => a.toLowerCase().indexOf(ql) - b.toLowerCase().indexOf(ql))
      .slice(0, 3)

    let geo = []
    if (MAPBOX_TOKEN) {
      try {
        const res = await fetch(
          'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
            encodeURIComponent(q) + '.json?types=place&limit=5&access_token=' + MAPBOX_TOKEN
        )
        const data = await res.json()
        geo = (data.features || [])
          .map((f) => ({ name: f.text, full: f.place_name, lng: f.center[0], lat: f.center[1] }))
          .filter((g) => !local.some((c) => c.toLowerCase() === g.name.toLowerCase()))
          .slice(0, 5 - local.length)
      } catch { /* offline is fine, local list still works */ }
    }

    setLocalMatches(local)
    setGeoMatches(geo)
    setOpen(local.length + geo.length > 0)
  }

  function submit() {
    hide()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <>
      <div id="topbar">
        <h1 onClick={onHome}>City Whispers</h1>
      </div>

      <div id="search-wrap">
        <div id="search-row">
          <input
            id="search-input"
            type="text"
            placeholder="type a city to see its whispers"
            autoComplete="off"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') hide()
            }}
            onBlur={() => setTimeout(hide, 150)}
          />
          <button id="search-btn" onClick={submit} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 L21 21" />
            </svg>
          </button>
        </div>
        <div id="search-suggest" className={open ? 'open' : ''}>
          {localMatches.map((c) => (
            <div key={c} className="suggest-item" onMouseDown={() => { setQuery(c); hide(); onSearch(c) }}>
              <span className="s-dot" />
              {c}
              <span className="s-count">
                {whispers[c].length} {whispers[c].length === 1 ? 'whisper' : 'whispers'}
              </span>
            </div>
          ))}
          {geoMatches.map((g) => (
            <div key={g.full} className="suggest-item" onMouseDown={() => { setQuery(g.name); hide(); onPickGeoCity(g) }}>
              <span className="s-dot s-dot-empty" />
              {g.full}
            </div>
          ))}
        </div>
      </div>

      <div id="help-btn" onClick={onHelp} title="How it works">?</div>
      <div id="sound-btn" onClick={onToggleSound} title="Sound">
        {soundOn ? <SoundOnIcon size={17} /> : <SoundOffIcon size={17} />}
      </div>
    </>
  )
}
