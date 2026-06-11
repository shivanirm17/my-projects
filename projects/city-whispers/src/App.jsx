import { useEffect, useRef, useState } from 'react'
import MapView from './components/MapView'
import TopBar from './components/TopBar'
import WhisperSheet from './components/WhisperSheet'
import SubmitSheet from './components/SubmitSheet'
import { DotTip, Intro, FirstOverlay, FeedbackCard, Petals, ZoomToast } from './components/Overlays'
import { SEED_WHISPERS, SEED_COORDS, MEMORY_PROMPTS, currentDaypart } from './lib/constants'
import { toggleSound, chimeOpen, chimePlant } from './lib/audio'

const DAYPART = currentDaypart()

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
  const feedbackShownRef = useRef(false)
  const lastPlantedRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('theme-' + DAYPART)
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

  function handleStampHover(city, idx, x, y) {
    setTip({ city, whisper: (whispers[city] || [])[idx], x, y })
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

  function handleSubmit({ city, memory, flower }) {
    // "mumbai" and "Mumbai" are the same garden
    const existing = Object.keys(whispers).find((c) => c.toLowerCase() === city.toLowerCase())
    if (existing) city = existing

    const isFirst = !whispers[city]
    const fresh = { text: memory, time: 'just now', flower, likes: 0 }
    lastPlantedRef.current = fresh

    let newCoords = coords[city]
    if (!newCoords && mapRef.current) {
      const center = mapRef.current.getCenter()
      newCoords = [center.lng, center.lat]
      setCoords((prev) => ({ ...prev, [city]: newCoords }))
    }

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
    try { localStorage.setItem('cw-intro-seen', '1') } catch { /* private mode */ }
  }

  const list = selected ? whispers[selected.city] || [] : []

  return (
    <>
      <MapView
        whispers={whispers}
        coords={coords}
        daypart={DAYPART}
        mapRef={mapRef}
        onStampClick={openCity}
        onStampHover={handleStampHover}
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
        onToggleSound={() => setSoundOn(toggleSound())}
      />

      <button id="fab" onClick={openSubmit}>🌼 Leave a whisper</button>

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
                return { ...w, liked, likes: (w.likes || 0) + (liked ? 1 : -1) }
              }),
            }))
          }}
          onLeaveWhisper={() => { setSheetOpen(false); openSubmit() }}
        />
      )}

      <SubmitSheet
        open={submitOpen}
        prefillCity={selected?.city}
        prompt={submitPrompt}
        onCancel={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
        onCityPicked={(g) => setCoords((prev) => prev[g.name] ? prev : { ...prev, [g.name]: [g.lng, g.lat] })}
      />

      <DotTip tip={tip} />
      <ZoomToast city={zoomCity} />
      <Intro open={introOpen} onClose={closeIntro} />
      <FirstOverlay open={firstOpen} onClose={closeFirstOverlay} />
      <FeedbackCard open={feedbackOpen} onDismiss={() => setFeedbackOpen(false)} />
    </>
  )
}
