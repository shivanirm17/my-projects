import { useRef, useState } from 'react'
import { MAPBOX_TOKEN } from '../lib/constants'
import { SoundOnIcon, SoundOffIcon } from '../lib/icons'
import Logo from './Logo'

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
        // Search Box API: the v5 geocoder barely knows landmarks like
        // the Brooklyn Bridge; this one does
        const res = await fetch(
          'https://api.mapbox.com/search/searchbox/v1/forward?q=' +
            encodeURIComponent(q) + '&types=place,locality,neighborhood,poi&limit=8&fuzzy_match=true&access_token=' + MAPBOX_TOKEN
        )
        const data = await res.json()
        geo = (data.features || [])
          .map((f) => ({
            name: f.properties.name,
            full: f.properties.full_address || f.properties.place_formatted
              ? f.properties.name + (f.properties.place_formatted ? ', ' + f.properties.place_formatted : '')
              : f.properties.name,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            isPlace: f.properties.feature_type !== 'place' && f.properties.feature_type !== 'locality',
            cityName: f.properties.context?.place?.name || f.properties.context?.locality?.name || '',
          }))
          .filter((g) => !local.some((c) => c.toLowerCase() === g.name.toLowerCase()))
          .filter((g, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === g.name.toLowerCase()) === i)
          .slice(0, 5 - local.length)
      } catch { /* offline is fine, local list still works */ }
    }

    setLocalMatches(local)
    setGeoMatches(geo)
    setOpen(local.length + geo.length > 0)
  }

  function submit() {
    hide()
    const q = query.trim()
    if (q) {
      onSearch(q)
      setQuery('') // the journey has started; leave the bar ready for the next one
    }
  }

  function clear() {
    setQuery('')
    hide()
  }

  return (
    <>
      <div id="topbar">
        <h1 onClick={onHome}><Logo size={26} /> City Whispers</h1>
      </div>

      <div id="search-wrap">
        <div id="search-row">
          <input
            id="search-input"
            type="text"
            placeholder="Type a city to see its whispers"
            autoComplete="off"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') hide()
            }}
            onBlur={() => setTimeout(hide, 150)}
          />
          {query && (
            <button id="search-clear" onMouseDown={(e) => e.preventDefault()} onClick={clear} aria-label="Clear search">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>
          )}
          <button id="search-btn" onClick={submit} aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 L21 21" />
            </svg>
          </button>
        </div>
        <div id="search-suggest" className={open ? 'open' : ''}>
          {localMatches.map((c) => (
            <div key={c} className="suggest-item" onMouseDown={() => { hide(); onSearch(c); setQuery('') }}>
              <span className="s-dot" />
              {c}
              <span className="s-count">
                {whispers[c].length} {whispers[c].length === 1 ? 'whisper' : 'whispers'}
              </span>
            </div>
          ))}
          {geoMatches.map((g) => (
            <div key={g.full} className="suggest-item" onMouseDown={() => { hide(); onPickGeoCity(g); setQuery('') }}>
              <span className="s-dot s-dot-empty" />
              {g.full}
            </div>
          ))}
        </div>
      </div>

      <div id="help-btn" onClick={onHelp} title="How it works">?</div>
      <div id="sound-btn" onClick={onToggleSound} title="Sound">
        {soundOn ? <SoundOnIcon size={22} /> : <SoundOffIcon size={22} />}
      </div>
    </>
  )
}
