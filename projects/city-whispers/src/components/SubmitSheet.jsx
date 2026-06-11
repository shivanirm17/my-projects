import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_SVGS, CATEGORY_COLORS, MAPBOX_TOKEN, MEMORY_PROMPTS } from '../lib/constants'
import { HeartIcon } from '../lib/icons'

export default function SubmitSheet({ open, prefillCity, prefillPlace, prefillPlaceCoords, prompt, onCancel, onSubmit, onError, onCityPicked, onPlacePicked, cityCoordsFor }) {
  const [city, setCity] = useState('')
  const [memory, setMemory] = useState('')
  const [author, setAuthor] = useState('')
  const [flower, setFlower] = useState('place')
  const [citySuggestions, setCitySuggestions] = useState([])
  const [place, setPlace] = useState('')
  const [placePick, setPlacePick] = useState(null) // { name, lng, lat }
  const [placeSuggestions, setPlaceSuggestions] = useState([])
  const debounceRef = useRef(null)
  const placeDebounceRef = useRef(null)

  // while the page sits empty, gently rotate through the memory prompts
  const [promptIdx, setPromptIdx] = useState(() => Math.max(0, MEMORY_PROMPTS.indexOf(prompt)))
  useEffect(() => {
    if (!open || memory) return
    const t = setInterval(() => {
      setPromptIdx((i) => (i + 1) % MEMORY_PROMPTS.length)
    }, 4500)
    return () => clearInterval(t)
  }, [open, memory])

  // prefill the city each time the form opens
  // (adjust-state-during-render pattern, per React docs)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCity(prefillCity || '')
      setPlace(prefillPlace || '')
      setPlacePick(prefillPlaceCoords ? { lng: prefillPlaceCoords[0], lat: prefillPlaceCoords[1] } : null)
    }
  }

  function handleCityInput(value) {
    setCity(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCities(value), 220)
  }

  async function fetchCities(q) {
    q = q.trim()
    if (!q || !MAPBOX_TOKEN) { setCitySuggestions([]); return }
    try {
      const res = await fetch(
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
          encodeURIComponent(q) + '.json?types=place&limit=4&access_token=' + MAPBOX_TOKEN
      )
      const data = await res.json()
      setCitySuggestions(
        (data.features || []).map((f) => ({ name: f.text, full: f.place_name, lng: f.center[0], lat: f.center[1] }))
      )
    } catch {
      setCitySuggestions([])
    }
  }

  function handlePlaceInput(value) {
    setPlace(value)
    setPlacePick(null)
    clearTimeout(placeDebounceRef.current)
    placeDebounceRef.current = setTimeout(() => fetchPlaces(value), 240)
  }

  async function fetchPlaces(q) {
    q = q.trim()
    if (!q || !MAPBOX_TOKEN) { setPlaceSuggestions([]); return }
    const cityName = city.trim()
    const near = cityCoordsFor?.(cityName)
    const proximity = near ? '&proximity=' + near[0] + ',' + near[1] : ''
    // with known city coords, proximity does the focusing and the query
    // stays clean (appending the city name produced junk address matches);
    // the city name joins the query only when we have no coordinates
    const query = near ? q : cityName ? q + ' ' + cityName : q
    try {
      const res = await fetch(
        'https://api.mapbox.com/search/searchbox/v1/forward?q=' +
          encodeURIComponent(query) + '&types=poi,street,neighborhood,locality&limit=4' +
          proximity + '&access_token=' + MAPBOX_TOKEN
      )
      const data = await res.json()
      setPlaceSuggestions(
        (data.features || []).map((f) => ({
          name: f.properties.name,
          full: f.properties.name + (f.properties.place_formatted ? ', ' + f.properties.place_formatted : ''),
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }))
      )
    } catch {
      setPlaceSuggestions([])
    }
  }

  async function submit() {
    const c = city.trim()
    const m = memory.trim()
    if (!c || !m) {
      onError?.('Your whisper needs both a city and a memory.')
      return
    }

    // typed a place but never tapped a suggestion: resolve it now, with the
    // city attached, so "Ghatkopar" lands in Mumbai and not at the city pin
    let resolvedPlaceCoords = placePick ? [placePick.lng, placePick.lat] : null
    const placeName = place.trim()
    if (placeName && !resolvedPlaceCoords && MAPBOX_TOKEN) {
      try {
        const res = await fetch(
          'https://api.mapbox.com/search/searchbox/v1/forward?q=' +
            encodeURIComponent(placeName + ' ' + c) +
            '&types=poi,street,neighborhood,locality,address&limit=1&access_token=' + MAPBOX_TOKEN
        )
        const data = await res.json()
        const f = (data.features || [])[0]
        if (f) resolvedPlaceCoords = [f.geometry.coordinates[0], f.geometry.coordinates[1]]
      } catch { /* fall back to the city anchor */ }
    }

    // sanity check: a place more than ~150km from its city is a bad geocode;
    // keep the name but pin to the city instead
    const anchor = cityCoordsFor?.(c)
    if (resolvedPlaceCoords && anchor) {
      const dLng = (resolvedPlaceCoords[0] - anchor[0]) * Math.cos((anchor[1] * Math.PI) / 180)
      const dLat = resolvedPlaceCoords[1] - anchor[1]
      const km = Math.sqrt(dLng * dLng + dLat * dLat) * 111
      if (km > 150) resolvedPlaceCoords = null
    }

    onSubmit({
      city: c,
      memory: m,
      flower,
      author: author.trim() || null,
      place: placeName || null,
      placeCoords: resolvedPlaceCoords,
    })
    setCity('')
    setMemory('')
    setAuthor('')
    setPlace('')
    setPlacePick(null)
  }

  function cancel() {
    setCity('')
    setMemory('')
    setPlace('')
    setPlacePick(null)
    onCancel()
  }

  return (
    <div id="submit-sheet" className={'sheet-base' + (open ? ' open' : '')}>
      <div className="sheet-handle" />
      <h2>Leave a whisper</h2>

      <div id="postcard-form">
        {/* the stamp you picked, where it will sit on the postcard */}
        <div
          id="pc-stamp"
          style={{ color: CATEGORY_COLORS[flower] }}
          dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] }}
        />

        <div className="pc-q">Which city do you miss?</div>
        <div className="city-field-wrap">
          <input
            className="pc-input"
            type="text"
            placeholder="A city you carry with you"
            value={city}
            onChange={(e) => handleCityInput(e.target.value)}
            onBlur={() => setTimeout(() => setCitySuggestions([]), 150)}
          />
          <div className={'suggest-panel' + (citySuggestions.length ? ' open' : '')}>
            {citySuggestions.map((g) => (
              <div
                key={g.full}
                className="suggest-item"
                onMouseDown={() => { setCity(g.name); setCitySuggestions([]); onCityPicked?.(g) }}
              >
                <span className="s-dot s-dot-empty" />
                {g.full}
              </div>
            ))}
          </div>
        </div>

        <div className="pc-q">Somewhere in particular? (optional)</div>
        <div className="city-field-wrap">
          <input
            className="pc-input"
            type="text"
            maxLength={80}
            placeholder="A street, a stall, a corner"
            value={place}
            onChange={(e) => handlePlaceInput(e.target.value)}
            onBlur={() => setTimeout(() => setPlaceSuggestions([]), 150)}
          />
          <div className={'suggest-panel' + (placeSuggestions.length ? ' open' : '')}>
            {placeSuggestions.map((g) => (
              <div
                key={g.full}
                className="suggest-item"
                onMouseDown={() => { setPlace(g.name); setPlacePick(g); setPlaceSuggestions([]); onPlacePicked?.([g.lng, g.lat]) }}
              >
                <span className="s-dot s-dot-empty" />
                {g.full}
              </div>
            ))}
          </div>
        </div>

        <div className="pc-q">What kind of memory is it?</div>
        <div className="stamp-row">
          {CATEGORIES.map((name) => (
            <div
              key={name}
              className={'stamp-opt' + (name === flower ? ' selected' : '')}
              style={{ color: CATEGORY_COLORS[name] }}
              title={name}
              onClick={() => setFlower(name)}
            >
              <span className="so-art" dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[name] }} />
              <span className="so-label">{name}</span>
            </div>
          ))}
        </div>

        <div className="pc-q">Write it down</div>
        <textarea
          className="pc-textarea"
          placeholder={MEMORY_PROMPTS[promptIdx]}
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
        />

        <div className="pc-q">Sign it, or stay anonymous</div>
        <input
          className="pc-input pc-signature"
          type="text"
          maxLength={40}
          placeholder="Your name or initials (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div id="submit-actions">
        <button className="link-cancel" onClick={cancel}>Never mind</button>
        <button className="btn-primary" onClick={submit}><HeartIcon size={16} /> Send your whisper</button>
      </div>
    </div>
  )
}
