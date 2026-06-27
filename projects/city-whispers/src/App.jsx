import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import MapView from './components/MapView'
import TopBar from './components/TopBar'
import WhisperSheet from './components/WhisperSheet'
import SubmitSheet from './components/SubmitSheet'
import { DotTip, Intro, FirstOverlay, FeedbackCard, Petals, ZoomToast } from './components/Overlays'
import StatsPanel from './components/StatsPanel'
import Tour from './components/Tour'
import MobileMenu from './components/MobileMenu'
import Splash from './components/Splash'
import BugReportForm from './components/BugReportForm'
import Journal from './components/journal/Journal'
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
  const [editingWhisper, setEditingWhisper] = useState(null) // whisper being edited
  const [tip, setTip] = useState(null) // { city, whisper, x, y }
  const [zoomCity, setZoomCity] = useState(null)
  const [introOpen, setIntroOpen] = useState(() => {
    try { return !localStorage.getItem('cw-intro-seen') } catch { return true }
  })
  const [splashOpen, setSplashOpen] = useState(() => {
    try { return !localStorage.getItem('cw-intro-seen') } catch { return true }
  })
  const [firstOpen, setFirstOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [submitPrompt, setSubmitPrompt] = useState(MEMORY_PROMPTS[0])
  const [pinDraft, setPinDraft] = useState(null) // { city, place, coords } from a map tap
  const pickSeqRef = useRef(0) // guards against out-of-order reverse lookups
  const [previewPin, setPreviewPin] = useState(null) // picked place, shown on the map
  const [myIds, setMyIds] = useState(() => new Set())
  const [mineOnly, setMineOnly] = useState(false)
  const [statsOpen, setStatsOpen] = useState(() =>
    new URLSearchParams(window.location.search).has('stats') || window.location.hash === '#stats')
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem('cw-mode') || 'auto' } catch { return 'auto' }
  })
  const [toast, setToast] = useState(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bugFormOpen, setBugFormOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [journalInitial, setJournalInitial] = useState(null) // reopen target after planting
  const pendingJournalRef = useRef(null)
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false)
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

  function closeSubmit() {
    setSubmitOpen(false)
    setPreviewPin(null)
    setPinDraft(null)
  }

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

  // ── ?demo=1: scripted camera tour for recording social videos ──
  // Revolve the globe, then hop across three cities showing one real
  // whisper in each, pull back out, and let night fall. Runs once;
  // triggered by a postMessage('cw-demo-start') from the wrapper page
  // (or instantly when opened standalone). Zero effect without the flag.
  const demoMode = new URLSearchParams(window.location.search).has('demo')
  const demoRanRef = useRef(false)
  useEffect(() => {
    if (!demoMode || loading || demoRanRef.current) return
    const timers = []
    const at = (s, fn) => timers.push(setTimeout(fn, s * 1000))

    // the exact cards the video shows, regardless of what's in the database
    const DEMO_COORDS = {
      'Mumbai': [72.88, 19.07],
      'New York City': [-74.0, 40.73],
      'Asheville': [-82.55, 35.6],
    }
    const DEMO_WHISPERS = {
      'Mumbai': [{
        place: 'Ghatkopar East Mumbai',
        text: 'Lalta Pavbhaji ghatkopar Vikrant circle and Sardar Pavbhaji at Tardeo.',
        time: '12 hours ago', flower: 'place', likes: 9, author: 'Rakesh mehta',
      }],
      'New York City': [{
        place: 'Parsons The New School for Design',
        text: 'discovered myself all over again at this place where all my design dreams came true!',
        time: '9 hours ago', flower: 'place', likes: 3, author: 'Someone who left',
      }],
      'Asheville': [{
        text: 'The place is special as i found the love my life here',
        time: '10 hours ago', flower: 'people', likes: 6, author: 'AS',
      }],
    }

    function run() {
      if (demoRanRef.current) return
      // demo plants real whispers — only safe on localhost
      if (isLive && !window.location.hostname.includes('localhost')) return
      demoRanRef.current = true
      setSplashOpen(false)
      setIntroOpen(false)
      setThemeMode('light')
      // use the app's real data as-is — the globe shows the actual stamp
      // clusters that exist right now. Each stop finds its featured card
      // inside the live list by its opening words; a city missing from the
      // database (e.g. seeds-only dev) gets the scripted card injected.
      const live = { ...whispers }
      const stops = [
        ['Mumbai', 'Lalta Pavbhaji', 14],
        ['New York City', 'discovered myself', 8],
        ['Asheville', 'The place is special', 12],
      ].map(([wanted, snippet, likeBoost]) => {
        const city = Object.keys(live).find((c) => c.toLowerCase() === wanted.toLowerCase())
        if (city) {
          const i = Math.max((live[city] || []).findIndex((w) => (w.text || '').startsWith(snippet)), 0)
          // camera-friendly like counts — display only, never persisted
          live[city] = live[city].map((w, j) => j === i ? { ...w, likes: Math.max(w.likes || 0, likeBoost) } : w)
          return { city, index: i }
        }
        live[wanted] = DEMO_WHISPERS[wanted].map((w) => ({ ...w, likes: likeBoost }))
        return { city: wanted, index: 0 }
      })
      // the planting beat ends on the "you're the first to whisper here"
      // celebration — so Paris starts empty and our whisper plants its
      // very first stamp (coords stay, only the whispers go)
      delete live['Paris']
      setWhispers(live)
      // real coords win; DEMO_COORDS only fill cities the data didn't have
      setCoords((prev) => ({ Paris: [2.35, 48.85], ...DEMO_COORDS, ...prev }))
      const where = (stop) => coords[stop.city] || DEMO_COORDS[stop.city]

      // wait until the map exists AND has finished loading tiles — easing
      // the camera while tiles are still popping in is what caused the
      // glitchy-looking globe spin
      const start = () => {
        const map = mapRef.current
        if (!map) { timers.push(setTimeout(start, 300)); return }
        const begin = () => {
        // a soft expanding ring wherever the demo "taps", so viewers can
        // follow what's being pressed
        const ripple = (x, y) => {
          const dot = document.createElement('div')
          dot.style.cssText =
            'position:fixed;left:' + (x - 22) + 'px;top:' + (y - 22) + 'px;' +
            'width:44px;height:44px;border-radius:50%;z-index:9999;pointer-events:none;' +
            'background:rgba(157,184,151,0.45);border:2px solid #6f8a68;' +
            'transform:scale(0.4);opacity:0.95;transition:transform 0.5s ease,opacity 0.5s ease'
          document.body.appendChild(dot)
          requestAnimationFrame(() => { dot.style.transform = 'scale(1.7)'; dot.style.opacity = '0' })
          timers.push(setTimeout(() => dot.remove(), 650))
        }
        // ripple over an element, then press it a beat later
        const tap = (selector) => {
          const el = document.querySelector(selector)
          if (!el) return
          const r = el.getBoundingClientRect()
          ripple(r.left + r.width / 2, r.top + r.height / 2)
          timers.push(setTimeout(() => el.click(), 240))
        }
        const tapLike = () => tap('#whisper-like')
        const typeInto = (selector, text, msPerChar = 60) => {
          const el = document.querySelector(selector)
          if (!el) return
          const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
          const setValue = Object.getOwnPropertyDescriptor(proto, 'value').set
          let i = 0
          const iv = setInterval(() => {
            i++
            setValue.call(el, text.slice(0, i))
            el.dispatchEvent(new Event('input', { bubbles: true }))
            if (i >= text.length) clearInterval(iv)
          }, msPerChar)
          timers.push(iv)
        }

        // tell the wrapper the camera is actually moving, so its captions
        // stay in sync however long the map took to load
        if (window.parent !== window) window.parent.postMessage('cw-demo-began', '*')
        // mount the whisper sheet closed, so the very first card slides up
        // from the bottom like the rest instead of popping in fully open
        setSelected({ city: stops[0].city, index: stops[0].index })
        // revolve from wherever the map already sits (no jump cut) and end
        // near Mumbai's longitude so the dive continues the same direction
        at(0.3, () => map.easeTo({ center: [95, 15], zoom: 1.8, duration: 3600, easing: (t) => t, essential: true }))
        at(3.9, () => map.flyTo({ center: where(stops[0]), zoom: 10.5, duration: 3000, essential: true }))
        at(7.9, () => openCity(stops[0].city, stops[0].index)) // a breath after landing
        at(9.5, tapLike) // heart fills, count ticks up
        at(11.5, () => setSheetOpen(false))
        at(11.8, () => map.flyTo({ center: where(stops[1]), zoom: 10.5, duration: 3400, essential: true }))
        at(16.2, () => openCity(stops[1].city, stops[1].index)) // same breath as Mumbai
        at(17.8, tapLike)
        at(19.8, () => setSheetOpen(false))
        at(20.1, () => map.flyTo({ center: where(stops[2]), zoom: 10.5, duration: 2400, essential: true }))
        at(23.5, () => openCity(stops[2].city, stops[2].index)) // same breath as Mumbai
        at(25.1, tapLike)
        at(27.1, () => setSheetOpen(false))

        // ── leave a whisper of our own: pin first, then the form ──
        // glide to Paris, tap the map, confirm the pin, and the form opens
        // with city + place already filled — cleaner than form-first
        const PIN_SPOT = [2.3375, 48.8583] // Pont des Arts, Paris
        at(27.5, () => map.flyTo({ center: PIN_SPOT, zoom: 13, duration: 3000, essential: true }))
        at(31.5, () => { // the tap on the map: ripple, then the pin + chip
          const p = map.project(PIN_SPOT)
          const r = map.getContainer().getBoundingClientRect()
          ripple(r.left + p.x, r.top + p.y)
        })
        at(31.9, () => {
          setPreviewPin(PIN_SPOT)
          setPinDraft({ city: 'Paris', place: 'Pont des Arts', coords: PIN_SPOT })
        })
        at(33.7, () => tap('.pcf-yes')) // confirm → form opens, city + place filled
        at(34.9, () => tap('.stamp-opt[title="people"]'))
        at(35.6, () => typeInto('.pc-textarea', 'We still walk here every Sunday, hand in hand.', 55))
        at(39.0, () => typeInto('.pc-signature', 'S & J', 90))
        at(40.2, () => tap('#submit-actions .btn-primary'))
        // Paris had no whispers, so this is its very first: the
        // "you're the first to whisper here" celebration appears
        at(43.8, () => tap('#first-overlay .btn-primary')) // "see it bloom"
        // → flies to the fresh stamp and pops the postcard, which
        //   fades away on its own ~4.5s later

        at(49.8, () => map.flyTo({ center: [-50, 20], zoom: 1.8, duration: 3000, essential: true }))
        at(53.0, () => setThemeMode('dark')) // night falls
        // one more slow revolve under the stars, stamps still glowing
        at(53.8, () => map.easeTo({ center: [80, 15], duration: 5000, easing: (t) => t, essential: true }))
        }
        // don't move the camera until the style has rendered (plus a short
        // settle for tiles) — easing while tiles pop in looks glitchy, but
        // waiting for full 'idle' can stall for a minute on a slow network
        let begun = false
        const beginOnce = () => { if (!begun) { begun = true; begin() } }
        const waitStyle = () => {
          if (map.isStyleLoaded()) at(0.8, beginOnce)
          else timers.push(setTimeout(waitStyle, 300))
        }
        waitStyle()
      }
      start()
    }

    const onMsg = (e) => { if (e.data === 'cw-demo-start') run() }
    window.addEventListener('message', onMsg)
    if (window.parent === window) run() // standalone: no wrapper to wait for
    return () => { window.removeEventListener('message', onMsg); timers.forEach(clearTimeout) }
  }, [demoMode, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(query) {
    const match = Object.keys(whispers).find((c) => c.toLowerCase() === query.toLowerCase())
    if (match || coords[query]) {
      const city = match || query
      flyTo(city)
      setTimeout(() => openCity(city), 900)
      return
    }
    // Unknown place — geocode it first, then fly
    const token = import.meta.env.VITE_MAPBOX_TOKEN || ''
    if (token) {
      try {
        // Cities first; only fall back to landmarks/POIs if no city matches
        const base = 'https://api.mapbox.com/search/searchbox/v1/forward?q=' +
          encodeURIComponent(query) + '&limit=1&access_token=' + token
        let res = await fetch(base + '&types=place,locality')
        let data = await res.json()
        if (!data.features?.length) {
          res = await fetch(base)
          data = await res.json()
        }
        const f = data.features?.[0]
        if (f) {
          const isCity = ['place', 'locality'].includes(f.properties.feature_type)
          const g = {
            name: f.properties.name,
            full: f.properties.name,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            isPlace: !isCity,
            cityName: f.properties.context?.place?.name || f.properties.context?.locality?.name || '',
          }
          handlePickGeoCity(g)
          return
        }
      } catch { /* fall through */ }
    }
    // Fallback: open as-is (offline / no token)
    flyTo(query)
    setTimeout(() => openCity(query), 900)
  }

  function handlePickGeoCity(g) {
    if (g.isPlace) {
      // a specific spot: fly in and drop the pin; the confirm chip waits
      // until the camera lands so the spot can actually be seen first
      setZoomCity(g.name)
      setTimeout(() => setZoomCity(null), 1800)
      setPreviewPin([g.lng, g.lat])
      const showChip = () => setPinDraft({ city: g.cityName || '', place: g.name, coords: [g.lng, g.lat] })
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [g.lng, g.lat], zoom: 14, duration: 1600, essential: true })
        mapRef.current.once('moveend', showChip)
      } else {
        showChip()
      }
      return
    }
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
        if (!demoMode && !feedbackShownRef.current) {
          feedbackShownRef.current = true
          setFeedbackOpen(true)
        }
      }, 5200)
    }
    if (map) map.once('moveend', show)
    else setTimeout(show, 600)
  }

  async function handleSubmit({ city, memory, flower, author, place, placeCoords }) {
    // "mumbai" and "Mumbai" are the same garden
    const existing = Object.keys(whispers).find((c) => c.toLowerCase() === city.toLowerCase())
    if (existing) city = existing

    if (!demoMode && (await whispersLeftToday()) <= 0) {
      showToast("You've planted 5 whispers today. Come back tomorrow.")
      return
    }

    const isFirst = !whispers[city]

    let cityAnchor = coords[city]
    if (!cityAnchor) {
      // an unknown city typed by hand: geocode it rather than pinning the
      // whisper at wherever the map happens to be centred
      try {
        const res = await fetch(
          'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
            encodeURIComponent(city) + '.json?types=place,locality&limit=1&access_token=' +
            (import.meta.env.VITE_MAPBOX_TOKEN || '')
        )
        const data = await res.json()
        const f = (data.features || [])[0]
        if (f) cityAnchor = [f.center[0], f.center[1]]
      } catch { /* fall through to map centre */ }
      if (!cityAnchor && mapRef.current) {
        const center = mapRef.current.getCenter()
        cityAnchor = [center.lng, center.lat]
      }
      setCoords((prev) => ({ ...prev, [city]: cityAnchor }))
    }
    // a chosen place pins the whisper to its exact spot
    const pin = placeCoords || cityAnchor

    const fresh = {
      text: memory, time: 'just now', flower, likes: 0,
      author: author || null, place: place || null,
      lng: pin[0], lat: pin[1],
    }
    lastPlantedRef.current = fresh

    // persist, then carry the row id into local state so likes can sync
    // (demo takes plant on screen only — nothing is written to the database)
    const { id } = demoMode
      ? { id: null }
      : await addWhisper({ city, lng: pin[0], lat: pin[1], text: memory, category: flower, author, place })
    fresh.id = id
    fresh.mine = true
    if (id) setMyIds((prev) => new Set(prev).add(id))

    setWhispers((prev) => ({ ...prev, [city]: [fresh, ...(prev[city] || [])] }))
    setSelected({ city, index: 0 })
    closeSubmit()
    setSheetOpen(false)
    chimePlant()

    // planted from "add a whisper to journal" → reopen that journal on the new page
    if (pendingJournalRef.current) {
      const jid = pendingJournalRef.current
      pendingJournalRef.current = null
      setJournalInitial({ id: jid, openAdd: true })
      setTimeout(() => setJournalOpen(true), 500)
      return
    }

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
    closeSubmit()
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
    setPinDraft(null)
    setPreviewPin(null)
    setSubmitPrompt(MEMORY_PROMPTS[Math.floor(Math.random() * MEMORY_PROMPTS.length)])
    setSubmitOpen(true)
  }

  // turning the filter on opens your latest whisper, since a lone stamp
  // on the world map is easy to miss
  function toggleMine() {
    const next = !mineOnly
    setMineOnly(next)
    if (!next) { setSheetOpen(false); return }
    for (const [city, list] of Object.entries(whispers)) {
      const idx = list.findIndex(isMine)
      if (idx !== -1) {
        setMineIndex(0)
        flyTo(city)
        setTimeout(() => openCity(city, idx), 900)
        return
      }
    }
  }

  async function reverseName(lngLat) {
    try {
      const res = await fetch(
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
          lngLat[0] + ',' + lngLat[1] + '.json?types=poi,address,neighborhood,locality,place&access_token=' +
          (import.meta.env.VITE_MAPBOX_TOKEN || '')
      )
      const data = await res.json()
      const feats = data.features || []
      // best name available: POI, street, neighbourhood, then locality
      const spot = feats.find((f) => f.place_type.includes('poi'))
        || feats.find((f) => f.place_type.includes('address'))
        || feats.find((f) => f.place_type.includes('neighborhood'))
        || feats.find((f) => f.place_type.includes('locality'))
      const cityF = feats.find((f) => f.place_type.includes('place')) || feats.find((f) => f.place_type.includes('locality'))
      return { placeName: spot ? spot.text : '', cityName: cityF ? cityF.text : '' }
    } catch {
      return { placeName: '', cityName: '' }
    }
  }

  // tapping the map drops the pin (or moves it); the form waits for the
  // confirm chip. While the form is open, taps relocate the pin live.
  async function handleMapPick(lngLat, tappedName) {
    if (sheetOpen || introOpen || tourOpen) return
    if (submitOpen && !previewPin) return // form opened the plain way: ignore map taps
    setPreviewPin(lngLat)
    const seq = ++pickSeqRef.current
    const { placeName, cityName } = await reverseName(lngLat)
    if (seq !== pickSeqRef.current) return // a newer tap already took over
    setPinDraft({ city: cityName, place: tappedName || placeName, coords: lngLat })
  }

  // dragging the pin re-labels the draft for its new spot
  async function handlePinMoved(lngLat) {
    setPreviewPin(lngLat)
    const seq = ++pickSeqRef.current
    const { placeName, cityName } = await reverseName(lngLat)
    if (seq !== pickSeqRef.current) return
    setPinDraft((d) => ({ city: cityName || d?.city || '', place: placeName || d?.place || '', coords: lngLat }))
  }

  function confirmPin() {
    setSubmitPrompt(MEMORY_PROMPTS[Math.floor(Math.random() * MEMORY_PROMPTS.length)])
    setSubmitOpen(true)
  }

  function dismissPin() {
    setPinDraft(null)
    setPreviewPin(null)
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
  const [mineIndex, setMineIndex] = useState(0)

  // every whisper of mine, across all cities, for browsing as one set
  const mineList = []
  if (mineOnly) {
    Object.entries(whispers).forEach(([city, list]) =>
      list.forEach((w, i) => { if (isMine(w)) mineList.push({ city, w, cityIdx: i }) })
    )
  }

  function goToMine(i) {
    const item = mineList[(i + mineList.length) % mineList.length]
    if (!item) return
    const idx = (i + mineList.length) % mineList.length
    setMineIndex(idx)
    setSelected({ city: item.city, index: item.cityIdx })
    if (mineList[mineIndex]?.city !== item.city) flyTo(item.city)
  }
  const myWhisperCount = Object.values(whispers).reduce(
    (n, list) => n + list.filter(isMine).length, 0)

  // map stamps index into the (possibly filtered) garden; the sheet uses
  // the full list, so translate before opening
  function handleStampClick(city, idx) {
    const source = mineOnly ? (whispers[city] || []).filter(isMine) : whispers[city] || []
    const w = source[idx]
    const fullIdx = w ? (whispers[city] || []).indexOf(w) : 0
    if (mineOnly) {
      const mi = mineList.findIndex((x) => x.city === city && x.cityIdx === fullIdx)
      if (mi !== -1) setMineIndex(mi)
    }
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

  function handleStartEdit(w) {
    setEditingWhisper({ ...w, city: selected.city })
    setSheetOpen(false)
    setSubmitOpen(true)
  }

  async function handleEdit({ memory, flower, author, place }) {
    const w = editingWhisper
    if (!w) return
    const { ok } = await editWhisper(w.id, memory, flower, place, author)
    if (!ok && isLive) {
      showToast('Could not save your edit.')
      setEditingWhisper(null)
      return
    }
    setWhispers((prev) => {
      const list = prev[w.city] || []
      return {
        ...prev,
        [w.city]: list.map((x) =>
          x.id === w.id ? { ...x, text: memory, flower, author: author || x.author, place: place || null } : x
        ),
      }
    })
    setEditingWhisper(null)
    setSubmitOpen(false)
    setSheetOpen(true)
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
        onMapPick={handleMapPick}
        onPinMoved={handlePinMoved}
        previewPin={previewPin}
      />
      <Petals />

      <TopBar
        whispers={whispers}
        onSearch={handleSearch}
        onPickGeoCity={handlePickGeoCity}
        getProximity={() => {
          // bias search to the current view; 'ip' while zoomed out at the globe
          const m = mapRef.current
          if (!m?.getCenter) return 'ip'
          if ((m.getZoom?.() ?? 0) < 4) return 'ip'
          const c = m.getCenter()
          return `${c.lng},${c.lat}`
        }}
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
        onClick={toggleMine}
        title="Show only your whispers"
      >
        <span className="mt-label">My whispers</span>
        <span className="mt-switch"><span className="mt-knob" /></span>
      </div>

      {mineOnly && myWhisperCount === 0 && (
        <div id="mine-empty">
          <button className="card-close" onClick={() => setMineOnly(false)} aria-label="Close">×</button>
          <div className="me-art"><SproutIcon size={52} /></div>
          <p>You haven't planted any whispers yet.</p>
          <button className="btn-primary" onClick={openSubmit}>Leave your first whisper</button>
        </div>
      )}

      <button
        id="theme-btn"
        onClick={cycleThemeMode}
        title={themeMode === 'auto' ? 'Theme: auto (changes with the time of day)' : 'Theme: ' + themeMode}
      >
        {MODE_LABEL[themeMode]}
      </button>

      {/* desktop entry to the journal (mobile reaches it via the menu) */}
      <button id="journal-btn" onClick={() => setJournalOpen(true)} title="My journal" aria-label="My journal">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4.5A1.5 1.5 0 015.5 3H19a1 1 0 011 1v15a1 1 0 01-1 1H5.5A1.5 1.5 0 014 18.5z" />
          <path d="M8 3v17" />
        </svg>
      </button>

      <button id="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
          <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
        </svg>
      </button>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        mineOnly={mineOnly}
        onToggleMine={toggleMine}
        themeMode={themeMode}
        onCycleTheme={cycleThemeMode}
        soundOn={soundOn}
        onToggleSound={() => {
          const on = toggleSound()
          setSoundOn(on)
          if (on) chimeOpen()
        }}
        onReportBug={() => setBugFormOpen(true)}
        onLeaveFeedback={() => setFeedbackFormOpen(true)}
        onLeaveWhisper={() => { setMenuOpen(false); setJournalOpen(false); openSubmit() }}
        hasMine={myWhisperCount > 0}
        onOpenJournal={() => { setMenuOpen(false); setJournalOpen(true) }}
      />

      {journalOpen && (
        <Journal
          whispers={whispers}
          coords={coords}
          isMine={isMine}
          initial={journalInitial}
          onClose={() => { setJournalOpen(false); setJournalInitial(null) }}
          onLeaveWhisper={openSubmit}
          onAddWhisper={(jid) => { pendingJournalRef.current = jid; setJournalOpen(false); openSubmit() }}
          onOpenMenu={() => setMenuOpen(true)}
        />
      )}

      <div id="zoom-controls" aria-label="Map zoom">
        <button onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">+</button>
        <button onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">−</button>
      </div>

      {!(mineOnly && myWhisperCount === 0) && (
        <button id="fab" onClick={openSubmit}><StampIcon size={20} /> Leave a whisper</button>
      )}

      <div
        id="backdrop"
        className={sheetOpen || submitOpen ? 'active' : ''}
        onClick={() => { setSheetOpen(false); closeSubmit() }}
      />

      {selected && (
        <WhisperSheet
          open={sheetOpen}
          city={mineOnly && mineList.length ? mineList[Math.min(mineIndex, mineList.length - 1)].city : selected.city}
          whispers={mineOnly ? mineList.map((x) => x.w) : list}
          index={mineOnly ? Math.min(mineIndex, Math.max(mineList.length - 1, 0)) : Math.min(selected.index, Math.max(list.length - 1, 0))}
          onPrev={() => mineOnly
            ? mineList.length && goToMine(mineIndex - 1)
            : list.length && setSelected((s) => ({ ...s, index: (s.index - 1 + list.length) % list.length }))}
          onNext={() => mineOnly
            ? mineList.length && goToMine(mineIndex + 1)
            : list.length && setSelected((s) => ({ ...s, index: (s.index + 1) % list.length }))}
          onLike={() => {
            setWhispers((prev) => ({
              ...prev,
              [selected.city]: prev[selected.city].map((w, i) => {
                if (i !== selected.index) return w
                const liked = !w.liked
                const likes = (w.likes || 0) + (liked ? 1 : -1)
                // demo takes tap likes on real cards — animate, don't persist
                if (!demoMode) setLikes(w.id, likes)
                return { ...w, liked, likes }
              }),
            }))
          }}
          onLeaveWhisper={() => { setSheetOpen(false); openSubmit() }}
          onClose={() => setSheetOpen(false)}
          isMine={isMine}
          onStartEdit={handleStartEdit}
          onDelete={handleDelete}
        />
      )}

      <SubmitSheet
        open={submitOpen}
        prefillCity={pinDraft?.city ?? selected?.city}
        prefillPlace={pinDraft?.place}
        prefillPlaceCoords={pinDraft?.coords}
        pinOverride={submitOpen ? previewPin : null}
        pinLabel={pinDraft?.place || ''}
        pinCity={pinDraft?.city || ''}
        prompt={submitPrompt}
        editMode={!!editingWhisper}
        editWhisper={editingWhisper}
        onEdit={handleEdit}
        onDelete={editingWhisper ? () => { setEditingWhisper(null); setSubmitOpen(false); handleDelete() } : undefined}
        onCancel={() => {
          if (editingWhisper) { setEditingWhisper(null); setSubmitOpen(false); setSheetOpen(true) }
          else closeSubmit()
        }}
        onSubmit={handleSubmit}
        onError={showToast}
        onCityPicked={(g) => setCoords((prev) => prev[g.name] ? prev : { ...prev, [g.name]: [g.lng, g.lat] })}
        onPickOnMap={async (cityName) => {
          setSubmitOpen(false) // memory text survives; the chip's check brings the form back
          showToast('Tap the map to drop your pin, then confirm to keep writing.')
          if (!cityName || !mapRef.current) return
          // take them to their city so there is something to pin
          const match = Object.keys(coords).find((k) => k.toLowerCase() === cityName.toLowerCase())
          let target = match ? coords[match] : null
          if (!target) {
            try {
              const res = await fetch(
                'https://api.mapbox.com/search/searchbox/v1/forward?q=' +
                  encodeURIComponent(cityName) + '&types=place&limit=1&access_token=' +
                  (import.meta.env.VITE_MAPBOX_TOKEN || '')
              )
              const data = await res.json()
              const f = (data.features || [])[0]
              if (f) target = f.geometry.coordinates
            } catch { /* stay where we are */ }
          }
          if (target) {
            mapRef.current.flyTo({ center: target, zoom: 11.5, duration: 1600, essential: true })
          }
        }}
        onPlacePicked={(lngLat) => {
          setPreviewPin(lngLat)
          if (mapRef.current) {
            mapRef.current.flyTo({ center: lngLat, zoom: 13, duration: 1400, essential: true })
          }
        }}
        cityCoordsFor={(c) => {
          const match = Object.keys(coords).find((k) => k.toLowerCase() === c.toLowerCase())
          return match ? coords[match] : null
        }}
      />

      {pinDraft && !submitOpen && !sheetOpen && (
        <div id="pin-confirm">
          <div className="pcf-text">
            <b>Whisper from here?</b>
            <span className="pcf-loc">{[pinDraft.place, pinDraft.city].filter(Boolean).join(', ') || 'This spot'}</span>
            <em>Drag the pin or tap elsewhere to move it</em>
          </div>
          <div className="pcf-actions">
            <button className="pcf-no" onClick={dismissPin} aria-label="Dismiss">×</button>
            <button className="pcf-yes" onClick={confirmPin} aria-label="Whisper from this spot">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 L10 17.5 L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <DotTip tip={tip} />
      <div id="app-footer">
        © {new Date().getFullYear()} City Whispers · Made with ♡ by Shivani Mehta
      </div>
      <div id="app-toast" className={toast ? 'show' : ''}>{toast}</div>
      {loading && <div id="loading-pill">Gathering whispers…</div>}
      <ZoomToast city={zoomCity} />
      <Intro
        open={introOpen}
        onClose={closeIntro}
        onStartTour={() => {
          closeIntro()
          setTimeout(() => setTourOpen(true), 400)
        }}
      />
      <Splash open={splashOpen} onDone={() => setSplashOpen(false)} />
      <FirstOverlay open={firstOpen} onClose={closeFirstOverlay} />
      <FeedbackCard open={feedbackOpen} onDismiss={() => setFeedbackOpen(false)} />
      <Tour open={tourOpen} onClose={closeTour} />
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}
      <BugReportForm open={bugFormOpen} onClose={() => setBugFormOpen(false)} />
      <BugReportForm open={feedbackFormOpen} onClose={() => setFeedbackFormOpen(false)} mode="feedback" />
      <Analytics />
    </>
  )
}
