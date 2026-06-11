import { useEffect, useRef, useState } from 'react'
import MapView from './components/MapView'
import TopBar from './components/TopBar'
import WhisperSheet from './components/WhisperSheet'
import SubmitSheet from './components/SubmitSheet'
import { DotTip, Intro, FirstOverlay, FeedbackCard, Petals, ZoomToast } from './components/Overlays'
import StatsPanel from './components/StatsPanel'
import Tour from './components/Tour'
import { SEED_WHISPERS, SEED_COORDS, MEMORY_PROMPTS, currentDaypart } from './lib/constants'
import { toggleSound, chimeOpen, chimePlant } from './lib/audio'
import { StampIcon, SproutIcon, SunIcon, MoonIcon, AutoThemeIcon } from './lib/icons'
import { fetchWhispers, addWhisper, setLikes, whispersLeftToday, fetchMyIds, editWhisper, deleteWhisper, isLive } from './lib/store'

const MODE_LABEL = {
  auto: <AutoThemeIcon size={22} />,
  light: <SunIcon size={22} />,
  dark: <MoonIcon size={22} />,
}

export default function App() {
  const [whispers, setWhispers] = useState(SEED_WHISPERS)
  const [coords, setCoords] = useState(SEED_COORDS)
  const [selected, setSelected] = useState(null) // { city, index }
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [tip, setTip] = useState(null) // { city, whisper, x, y }
  const [zoomCity, setZoomCity] = useState(null)
  const [introOpen, setIntroOpen] = useState(() => {
    try { return !localStorage.getItem('cw-intro-seen') } catch { return true }
  })
  const [firstOpen, setFirstOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [submitPrompt, setSubmitPrompt] = useState(MEMORY_PROMPTS[0])
  const [myIds, setMyIds] = useState(() => new Set())
  const [mineOnly, setMineOnly] = useState(false)
  const [statsOpen, setStatsOpen] = useState(() =>
    new URLSearchParams(window.location.search).has('stats') || window.location.hash === '#stats')
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem('cw-mode') || 'auto' } catch { return 'auto' }
  })
  const [toast, setToast] = useState(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [loading, setLoading] = useState(isLive)
  const toastTimer = useRef(null)

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  const daypart = themeMode === 'light' ? 'day'
    : themeMode === 'dark' ? 'night'
    : currentDaypart()
  const feedbackShownRef = useRef(false)
  const lastPlantedRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    document.body.classList.remove('theme-morning', 'theme-day', 'theme-dusk', 'theme-night')
    document.body.classList.add('theme-' + daypart)
  }, [daypart])

  // #stats can be typed at any time, not just on first load
  useEffect(() => {
    const onHash = () => { if (window.location.hash === '#stats') setStatsOpen(true) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function cycleThemeMode() {
    const next = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto'
    setThemeMode(next)
    try { localStorage.setItem('cw-mode', next) } catch { /* private mode */ }
  }

  // load persisted whispers (falls back to seeds when Supabase is not configured)
  useEffect(() => {
    if (!isLive) return
    fetchWhispers().then(({ whispers: w, coords: c }) => {
      setWhispers(w)
      setCoords((prev) => ({ ...prev, ...c }))
    }).finally(() => setLoading(false))
    fetchMyIds().then(setMyIds)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('sheet-open', sheetOpen || submitOpen)
  }, [sheetOpen, submitOpen])

  function flyTo(city, cityCoords) {
    const c = cityCoords || coords[city]
    if (mapRef.current && c) {
      mapRef.current.flyTo({ center: c, zoom: 5.5, duration: 1400, essential: true })
    }
    setZoomCity(city)
    setTimeout(() => setZoomCity(null), 1800)
  }

  function openCity(city, index = 0) {
    setTip(null)
    setSelected({ city, index })
    setSheetOpen(true)
    chimeOpen()
  }

  function handleSearch(query) {
    const match = Object.keys(whispers).find((c) => c.toLowerCase() === query.toLowerCase())
    const city = match || query
    flyTo(city)
    setTimeout(() => openCity(city), 900)
  }

  function handlePickGeoCity(g) {
    setCoords((prev) => ({ ...prev, [g.name]: [g.lng, g.lat] }))
    flyTo(g.name, [g.lng, g.lat])
    setTimeout(() => openCity(g.name), 900)
  }

  // show the freshly planted whisper over its garden once the map lands
  function popAfterFly(city, cityCoords) {
    const map = mapRef.current
    const show = () => {
      const c = cityCoords || coords[city]
      const p = map && c
        ? map.project(c)
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      setTip({ city, whisper: lastPlantedRef.current, x: p.x, y: p.y - 30 })
      setTimeout(() => setTip(null), 4500)
      setTimeout(() => {
        if (!feedbackShownRef.current) {
          feedbackShownRef.current = true
          setFeedbackOpen(true)
        }
      }, 5200)
    }
    if (map) map.once('moveend', show)
    else setTimeout(show, 600)
  }

  async function handleSubmit({ city, memory, flower, author }) {
    // "mumbai" and "Mumbai" are the same garden
    const existing = Object.keys(whispers).find((c) => c.toLowerCase() === city.toLowerCase())
    if (existing) city = existing

    if ((await whispersLeftToday()) <= 0) {
      showToast("You've planted 5 whispers today. Come back tomorrow.")
      return
    }

    const isFirst = !whispers[city]
    const fresh = { text: memory, time: 'just now', flower, likes: 0, author: author || null }
    lastPlantedRef.current = fresh

    let newCoords = coords[city]
    if (!newCoords && mapRef.current) {
      const center = mapRef.current.getCenter()
      newCoords = [center.lng, center.lat]
      setCoords((prev) => ({ ...prev, [city]: newCoords }))
    }

    // persist, then carry the row id into local state so likes can sync
    const { id } = await addWhisper({ city, lng: newCoords[0], lat: newCoords[1], text: memory, category: flower, author })
    fresh.id = id
    fresh.mine = true
    if (id) setMyIds((prev) => new Set(prev).add(id))

    setWhispers((prev) => ({ ...prev, [city]: [fresh, ...(prev[city] || [])] }))
    setSelected({ city, index: 0 })
    setSubmitOpen(false)
    setSheetOpen(false)
    chimePlant()

    if (isFirst) {
      setTimeout(() => setFirstOpen(true), 350)
    } else {
      setTimeout(() => { flyTo(city); popAfterFly(city) }, 350)
    }
  }

  function closeFirstOverlay() {
    setFirstOpen(false)
    if (selected) {
      flyTo(selected.city)
      popAfterFly(selected.city)
    }
  }

  function goHome() {
    setSheetOpen(false)
    setSubmitOpen(false)
    setTip(null)
    setFeedbackOpen(false)
    setFirstOpen(false)
    setSelected(null)
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [20, 15], zoom: 1.8, duration: 1600, essential: true })
    }
  }

  // a different nostalgic doorway each time the form opens
  function openSubmit() {
    setSubmitPrompt(MEMORY_PROMPTS[Math.floor(Math.random() * MEMORY_PROMPTS.length)])
    setSubmitOpen(true)
  }

  function closeIntro() {
    setIntroOpen(false)
    try {
      localStorage.setItem('cw-intro-seen', '1')
      // first visit: follow the intro with a short tour
      if (!localStorage.getItem('cw-tour-done')) {
        localStorage.setItem('cw-tour-done', '1')
        setTimeout(() => setTourOpen(true), 450)
      }
    } catch { /* private mode */ }
  }

  function closeTour() {
    setTourOpen(false)
    showToast('That is everything. Welcome home.')
  }

  const isMine = (w) => !!(w.mine || (w.id && myIds.has(w.id)))
  const myWhisperCount = Object.values(whispers).reduce(
    (n, list) => n + list.filter(isMine).length, 0)

  // map stamps index into the (possibly filtered) garden; the sheet uses
  // the full list, so translate before opening
  function handleStampClick(city, idx) {
    const source = mineOnly ? (whispers[city] || []).filter(isMine) : whispers[city] || []
    const w = source[idx]
    const fullIdx = w ? (whispers[city] || []).indexOf(w) : 0
    openCity(city, Math.max(fullIdx, 0))
  }

  function handleStampHoverFiltered(city, idx, x, y) {
    const source = mineOnly ? (whispers[city] || []).filter(isMine) : whispers[city] || []
    setTip({ city, whisper: source[idx], x, y })
  }

  async function handleDelete() {
    const w = whispers[selected.city][selected.index]
    if (!window.confirm('Delete this whisper? It cannot be brought back.')) return
    const { ok } = await deleteWhisper(w.id)
    if (!ok && isLive) {
      showToast('Could not delete the whisper.')
      return
    }
    setWhispers((prev) => {
      const rest = prev[selected.city].filter((_, i) => i !== selected.index)
      const copy = { ...prev }
      if (rest.length) copy[selected.city] = rest
      else delete copy[selected.city]
      return copy
    })
    setSelected((s) => ({ ...s, index: 0 }))
  }

  // the map shows only this device's whispers when the filter is on
  const mapWhispers = mineOnly
    ? Object.fromEntries(
        Object.entries(whispers)
          .map(([city, list]) => [city, list.filter(isMine)])
          .filter(([, list]) => list.length > 0)
      )
    : whispers

  async function handleEdit(text, flower) {
    const w = whispers[selected.city][selected.index]
    const { ok } = await editWhisper(w.id, text, flower)
    if (!ok && isLive) {
      showToast('Could not save your edit.')
      return
    }
    setWhispers((prev) => ({
      ...prev,
      [selected.city]: prev[selected.city].map((x, i) =>
        i === selected.index ? { ...x, text, flower } : x
      ),
    }))
  }

  const list = selected ? whispers[selected.city] || [] : []

  return (
    <>
      <MapView
        whispers={mapWhispers}
        coords={coords}
        daypart={daypart}
        mapRef={mapRef}
        onStampClick={handleStampClick}
        onStampHover={handleStampHoverFiltered}
        onStampLeave={() => setTip(null)}
      />
      <Petals />

      <TopBar
        whispers={whispers}
        onSearch={handleSearch}
        onPickGeoCity={handlePickGeoCity}
        onHome={goHome}
        onHelp={() => setIntroOpen(true)}
        soundOn={soundOn}
        onToggleSound={() => {
          const on = toggleSound()
          setSoundOn(on)
          if (on) chimeOpen() // immediate feedback that sound works
        }}
      />

      <div
        id="mine-toggle"
        className={mineOnly ? 'on' : ''}
        onClick={() => setMineOnly((v) => !v)}
        title="Show only your whispers"
      >
        <span className="mt-label">My whispers</span>
        <span className="mt-switch"><span className="mt-knob" /></span>
      </div>

      {mineOnly && myWhisperCount === 0 && (
        <div id="mine-empty">
          <div className="me-art"><SproutIcon size={52} /></div>
          <p>You haven't planted any whispers yet.</p>
          <button className="btn-primary" onClick={openSubmit}>Leave your first whisper</button>
        </div>
      )}

      <button id="theme-btn" onClick={cycleThemeMode} title={'Theme: ' + themeMode}>
        {MODE_LABEL[themeMode]}
      </button>

      <button id="fab" onClick={openSubmit}><StampIcon size={20} /> Leave a whisper</button>

      <div
        id="backdrop"
        className={sheetOpen || submitOpen ? 'active' : ''}
        onClick={() => { setSheetOpen(false); setSubmitOpen(false) }}
      />

      {selected && (
        <WhisperSheet
          open={sheetOpen}
          city={selected.city}
          whispers={list}
          index={Math.min(selected.index, Math.max(list.length - 1, 0))}
          onPrev={() => list.length && setSelected((s) => ({ ...s, index: (s.index - 1 + list.length) % list.length }))}
          onNext={() => list.length && setSelected((s) => ({ ...s, index: (s.index + 1) % list.length }))}
          onLike={() => {
            setWhispers((prev) => ({
              ...prev,
              [selected.city]: prev[selected.city].map((w, i) => {
                if (i !== selected.index) return w
                const liked = !w.liked
                const likes = (w.likes || 0) + (liked ? 1 : -1)
                setLikes(w.id, likes)
                return { ...w, liked, likes }
              }),
            }))
          }}
          onLeaveWhisper={() => { setSheetOpen(false); openSubmit() }}
          isMine={isMine}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <SubmitSheet
        open={submitOpen}
        prefillCity={selected?.city}
        prompt={submitPrompt}
        onCancel={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
        onError={showToast}
        onCityPicked={(g) => setCoords((prev) => prev[g.name] ? prev : { ...prev, [g.name]: [g.lng, g.lat] })}
      />

      <DotTip tip={tip} />
      <div id="app-toast" className={toast ? 'show' : ''}>{toast}</div>
      {loading && <div id="loading-pill">Gathering whispers…</div>}
      <ZoomToast city={zoomCity} />
      <Intro open={introOpen} onClose={closeIntro} />
      <FirstOverlay open={firstOpen} onClose={closeFirstOverlay} />
      <FeedbackCard open={feedbackOpen} onDismiss={() => setFeedbackOpen(false)} />
      <Tour open={tourOpen} onClose={closeTour} />
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}
    </>
  )
}
