import { useRef, useState } from 'react'
import { MAPBOX_TOKEN } from '../lib/constants'
import { SoundOnIcon, SoundOffIcon } from '../lib/icons'
import Logo from './Logo'

export default function TopBar({ whispers, onSearch, onPickGeoCity, onHome, onHelp, soundOn, onToggleSound, getProximity }) {
  const [query, setQuery] = useState('')
  const [localMatches, setLocalMatches] = useState([])
  const [geoMatches, setGeoMatches] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  // One session token groups all keystrokes of a single search into one billed
  // request (and lets Mapbox rank the typeahead). It's reset after each pick.
  const sessionRef = useRef(crypto.randomUUID())

  const hide = () => setOpen(false)

  function handleInput(value) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 220)
  }

  // Misspellings too far gone for Mapbox's fuzzy matching
  const TYPO_ALIASES = {
    banglore: 'bangalore', bengalore: 'bangalore', banglaore: 'bangalore',
    dehli: 'delhi', dilli: 'delhi',
    kolkatta: 'kolkata', calcuta: 'calcutta',
    hyderbad: 'hyderabad', mumbi: 'mumbai',
  }

  // Map a /suggest result into our row shape. Coordinates aren't included
  // here — the Search Box API hands those over only on /retrieve (see pickGeo).
  function suggestionRow(s) {
    const isCity = ['place', 'locality', 'region'].includes(s.feature_type)
    return {
      mapboxId: s.mapbox_id,
      name: s.name,
      full: s.name + (s.place_formatted ? ', ' + s.place_formatted : ''),
      isPlace: !isCity,
      cityName: s.context?.place?.name || s.context?.locality?.name || '',
    }
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
        const fixed = TYPO_ALIASES[ql] || q
        // /suggest is the autocomplete endpoint (not /forward, the batch
        // geocoder) — it ranks typeahead properly, so "borough market" finds
        // Borough Market, "eiffel tower" finds the tower, etc. Bias to wherever
        // the user is looking on the map; 'ip' before they've zoomed in.
        const prox = getProximity?.() || 'ip'
        const url = 'https://api.mapbox.com/search/searchbox/v1/suggest?q=' +
          encodeURIComponent(fixed) +
          '&session_token=' + sessionRef.current +
          '&proximity=' + encodeURIComponent(prox) +
          '&limit=6&access_token=' + MAPBOX_TOKEN
        const data = await (await fetch(url)).json()
        // Re-rank by how many typed words appear in the name, so an exact city
        // ("Delhi") beats fuzzy noise ("New Delhi Diamonds") that Mapbox's
        // IP-bias floated up. Only drop zero-score rows when something genuinely
        // matched — otherwise (e.g. "nyc" → "New York City") keep Mapbox's order.
        const qWords = ql.split(/\s+/).filter(Boolean)
        const score = (g) => {
          const name = g.name.toLowerCase()
          let s = qWords.reduce((n, w) => n + (name.includes(w) ? 1 : 0), 0)
          if (name === ql) s += 2
          return s
        }
        const SKIP_TYPES = ['category', 'brand'] // "Deli — Category", "Paris Baguette — Brand"
        const rows = (data.suggestions || [])
          .filter((s) => !SKIP_TYPES.includes(s.feature_type))
          .map(suggestionRow)
          .map((g, i) => ({ g, s: score(g), i }))
          .sort((a, b) => b.s - a.s || (a.g.isPlace ? 1 : 0) - (b.g.isPlace ? 1 : 0) || a.i - b.i)
        const hasHit = rows.some((r) => r.s > 0)
        geo = rows
          .filter((r) => !hasHit || r.s > 0)
          .map((r) => r.g)
          .filter((g) => !local.some((c) => c.toLowerCase() === g.name.toLowerCase()))
          .filter((g, i, arr) => arr.findIndex((x) => x.full === g.full) === i)
          .slice(0, 5 - local.length)
      } catch { /* offline is fine, local list still works */ }
    }

    setLocalMatches(local)
    setGeoMatches(geo)
    setOpen(local.length + geo.length > 0)
  }

  // A suggestion was picked: /retrieve resolves its coordinates, then we hand
  // off to the map. Resetting the session token closes this search's billing
  // group so the next search starts fresh.
  async function pickGeo(g) {
    hide()
    setQuery('')
    try {
      const url = 'https://api.mapbox.com/search/searchbox/v1/retrieve/' + g.mapboxId +
        '?session_token=' + sessionRef.current + '&access_token=' + MAPBOX_TOKEN
      const data = await (await fetch(url)).json()
      const feat = data.features?.[0]
      const [lng, lat] = feat?.geometry?.coordinates || []
      sessionRef.current = crypto.randomUUID()
      if (lng == null) { onSearch(g.name); return } // retrieve failed: text search
      onPickGeoCity({ ...g, lng, lat })
    } catch {
      onSearch(g.name) // offline / error: fall back to a plain text search
    }
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
            placeholder="City, neighbourhood, street..."
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
              <span className="s-label">{c}</span>
              <span className="s-count">
                {whispers[c].length} {whispers[c].length === 1 ? 'whisper' : 'whispers'}
              </span>
            </div>
          ))}
          {geoMatches.map((g) => (
            <div key={g.full} className="suggest-item" onMouseDown={() => pickGeo(g)} title={g.full}>
              <span className="s-dot s-dot-empty" />
              <span className="s-label">{g.full}</span>
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
