import { useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_SVGS, CATEGORY_COLORS, MAPBOX_TOKEN } from '../lib/constants'

const MAX_LEN = 150

export default function SubmitSheet({ open, prefillCity, prompt, onCancel, onSubmit, onCityPicked }) {
  const [city, setCity] = useState('')
  const [memory, setMemory] = useState('')
  const [flower, setFlower] = useState('place')
  const [citySuggestions, setCitySuggestions] = useState([])
  const debounceRef = useRef(null)
  // prefill the city each time the form opens
  // (adjust-state-during-render pattern, per React docs)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setCity(prefillCity || '')
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

  function submit() {
    const c = city.trim()
    const m = memory.trim()
    if (!c || !m) {
      alert('Both fields are needed.')
      return
    }
    onSubmit({ city: c, memory: m, flower })
    setCity('')
    setMemory('')
  }

  function cancel() {
    setCity('')
    setMemory('')
    onCancel()
  }

  return (
    <div id="submit-sheet" className={'sheet-base' + (open ? ' open' : '')}>
      <div className="sheet-handle" />
      <div className="sheet-eyebrow">add yours</div>
      <h2>Leave a whisper</h2>
      <p className="subtitle">A small sensory memory. The kind no one else in your new city would understand.</p>

      <div className="field-label">which city?</div>
      <div className="city-field-wrap">
        <input
          className="field-input"
          type="text"
          placeholder="where did you grow up?"
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

      <div className="field-label">what kind of memory?</div>
      <div id="flower-pick">
        {CATEGORIES.map((name) => (
          <div
            key={name}
            className={'flower-opt' + (name === flower ? ' selected' : '')}
            style={{ color: CATEGORY_COLORS[name] }}
            title={name}
            onClick={() => setFlower(name)}
          >
            <span dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[name] }} />
            <span className="opt-label">{name}</span>
          </div>
        ))}
      </div>

      <div className="field-label">your memory</div>
      <textarea
        className="field-input"
        maxLength={MAX_LEN}
        placeholder={prompt}
        value={memory}
        onChange={(e) => setMemory(e.target.value)}
      />
      <div id="char-count" className={memory.length > 130 ? 'warn' : ''}>
        {memory.length} / {MAX_LEN}
      </div>

      <div id="submit-actions">
        <button className="btn-ghost" onClick={cancel}>never mind</button>
        <button className="btn-primary" onClick={submit}>whisper it ♡</button>
      </div>
    </div>
  )
}
