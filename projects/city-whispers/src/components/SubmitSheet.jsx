import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, CATEGORY_SVGS, CATEGORY_COLORS, MAPBOX_TOKEN, MEMORY_PROMPTS } from '../lib/constants'
import { HeartIcon } from '../lib/icons'

const MAX_LEN = 150

export default function SubmitSheet({ open, prefillCity, prompt, onCancel, onSubmit, onError, onCityPicked }) {
  const [city, setCity] = useState('')
  const [memory, setMemory] = useState('')
  const [author, setAuthor] = useState('')
  const [flower, setFlower] = useState('place')
  const [citySuggestions, setCitySuggestions] = useState([])
  const debounceRef = useRef(null)

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
      onError?.('Your whisper needs both a city and a memory.')
      return
    }
    onSubmit({ city: c, memory: m, flower, author: author.trim() || null })
    setCity('')
    setMemory('')
    setAuthor('')
  }

  function cancel() {
    setCity('')
    setMemory('')
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
          maxLength={MAX_LEN}
          placeholder={MEMORY_PROMPTS[promptIdx]}
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
        />
        <div className={'pc-count' + (memory.length > 130 ? ' warn' : '')}>
          {memory.length} / {MAX_LEN}
        </div>

        <div className="pc-q">Sign it, or stay anonymous</div>
        <input
          className="pc-input"
          type="text"
          maxLength={40}
          placeholder="Your name (optional)"
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
