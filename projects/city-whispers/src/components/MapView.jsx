import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CATEGORY_SVGS, CATEGORY_COLORS, MAP_THEMES, MAPBOX_TOKEN } from '../lib/constants'

// Lay stamps out like petals: golden-angle spiral around the city point.
// One stamp per whisper, so cities with more memories grow bigger clusters.
function gardenHTML(whispers) {
  const count = whispers.length || 1
  let html = '<div class="garden">'
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996
    const r = i === 0 ? 0 : 14 + 9 * Math.sqrt(i)
    const x = (r * Math.cos(angle)).toFixed(1)
    const y = (r * Math.sin(angle)).toFixed(1)
    const dur = (2.6 + ((i * 7) % 5) * 0.3).toFixed(1)
    const delay = ((i * 0.4) % 2).toFixed(1)
    const flower = whispers[i]?.flower || 'other'
    const svg = CATEGORY_SVGS[flower] || CATEGORY_SVGS.other
    const color = CATEGORY_COLORS[flower] ? 'color:' + CATEGORY_COLORS[flower] + ';' : ''
    html += '<div class="bud" data-idx="' + i + '" style="' + color +
      '--bx:' + x + 'px;--by:' + y + 'px;--flicker-dur:' + dur + 's;--bloom-delay:' + delay + 's">' + svg + '</div>'
  }
  return html + '</div>'
}

// Soften the standard light style into a storybook watercolor palette,
// tinted for the current time of day
// linear blend between two #rrggbb colours, for the fog cross-fade
function hexLerp(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const ch = (sh) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t)
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')'
}

const THEME_FADE_MS = 1400

function styleWatercolor(map, daypart, fadeFrom) {
  const MT = MAP_THEMES[daypart]
  const set = (layer, prop, val) => {
    try {
      // when fading between themes, let Mapbox tween the paint change
      if (fadeFrom && (prop.endsWith('-color') || prop.endsWith('-opacity'))) {
        map.setPaintProperty(layer, prop + '-transition', { duration: THEME_FADE_MS })
      }
      map.setPaintProperty(layer, prop, val)
    } catch { /* layer may not exist */ }
  }
  const hide = (layer) => {
    try { map.setLayoutProperty(layer, 'visibility', 'none') } catch { /* layer may not exist */ }
  }

  map.getStyle().layers.forEach((layer) => {
    const id = layer.id
    if (id.includes('label')) {
      const ink = (opacity) => {
        set(id, 'text-color', MT.label)
        set(id, 'text-halo-color', MT.halo)
        set(id, 'text-halo-width', 1.4)
        set(id, 'text-opacity', opacity)
      }
      if (id.startsWith('country-label') || id.startsWith('settlement-major-label')) {
        ink(0.55)
      } else if (id.startsWith('settlement-minor-label') || id.startsWith('settlement-subdivision-label')) {
        // towns and neighbourhoods fade in as you approach the city
        ink(['interpolate', ['linear'], ['zoom'], 9, 0, 11, 0.6])
      } else if (id.includes('road-label')) {
        // street names appear at street level
        ink(['interpolate', ['linear'], ['zoom'], 12, 0, 13.5, 0.75])
      } else if (id.startsWith('poi-label')) {
        // landmarks and parks, only when fully leaned in
        ink(['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, 0.65])
      } else if (id.includes('water') && id.includes('label')) {
        ink(['interpolate', ['linear'], ['zoom'], 8, 0, 10, 0.45])
      } else {
        hide(id)
      }
      return
    }
    if (id === 'water' || id.startsWith('water')) { set(id, 'fill-color', MT.water); return }
    if (id.includes('waterway')) { set(id, 'line-color', MT.water); return }
    if (id === 'land' || id === 'background') { set(id, 'background-color', MT.land); return }
    if (id.includes('landcover') || id.includes('landuse')) {
      set(id, 'fill-color', MT.cover)
      set(id, 'fill-opacity', 0.5)
      return
    }
    if (id.includes('national-park') || id.includes('park')) {
      set(id, 'fill-color', MT.park)
      set(id, 'fill-opacity', 0.6)
      return
    }
    if (id.includes('hillshade')) { hide(id); return }
    if (id.includes('admin')) {
      set(id, 'line-color', MT.admin)
      set(id, 'line-opacity', 0.35)
      return
    }
    if (id.includes('road') || id.includes('bridge') || id.includes('tunnel')) {
      if (layer.type === 'line') {
        set(id, 'line-color', MT.admin)
        set(id, 'line-opacity', ['interpolate', ['linear'], ['zoom'], 10, 0, 12, 0.35, 14, 0.55])
      } else {
        hide(id) // shields and road labels stay quiet
      }
    }
  })

  // fog has no built-in transition, so cross-fade it by hand
  const FROM = fadeFrom ? MAP_THEMES[fadeFrom] : null
  if (FROM) {
    const start = performance.now()
    const tick = () => {
      const t = Math.min((performance.now() - start) / THEME_FADE_MS, 1)
      map.setFog({
        color: hexLerp(FROM.fog[0], MT.fog[0], t),
        'high-color': hexLerp(FROM.fog[1], MT.fog[1], t),
        'horizon-blend': 0.08,
        'space-color': hexLerp(FROM.fog[2], MT.fog[2], t),
        'star-intensity': FROM.stars + (MT.stars - FROM.stars) * t,
      })
      if (t < 1) requestAnimationFrame(tick)
    }
    tick()
  } else {
    map.setFog({
      color: MT.fog[0],
      'high-color': MT.fog[1],
      'horizon-blend': 0.08,
      'space-color': MT.fog[2],
      'star-intensity': MT.stars,
    })
  }
}

const SCATTER_ZOOM = 10

export default function MapView({ whispers, coords, daypart, onStampClick, onStampHover, onStampLeave, onMapPick, onPinMoved, previewPin, mapRef }) {
  const [scatter, setScatter] = useState(false)
  const containerRef = useRef(null)
  const markersRef = useRef({})
  const loadedRef = useRef(false)
  const daypartRef = useRef(daypart)

  // latest handlers/data without re-subscribing markers
  const handlersRef = useRef({})
  const whispersRef = useRef(whispers)
  useEffect(() => {
    handlersRef.current = { onStampClick, onStampHover, onStampLeave, onMapPick, onPinMoved }
    whispersRef.current = whispers
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // ?nomap=1: test the UI without burning a Mapbox map load
    if (params.has('nomap')) {
      console.info('nomap mode: Mapbox not initialized, zero map loads.')
      return
    }
    // In local dev the map is opt-in (?map=1) so hot-reloads from code
    // changes never burn Mapbox loads in a forgotten tab. Production
    // always loads the map.
    if (import.meta.env.DEV && !params.has('map')) {
      console.info('dev: map skipped. Add ?map=1 to the URL to load it.')
      return
    }
    if (!MAPBOX_TOKEN) {
      console.warn('VITE_MAPBOX_TOKEN is not set; the map cannot load.')
      return
    }
    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [20, 15],
      zoom: 1.8,
      minZoom: 1.2,
      maxZoom: 16, // street level: whispers can pin to specific places
      projection: 'globe',
    })
    mapRef.current = map
    if (import.meta.env.DEV) window.__cwMap = map // console/debug access
    map.on('zoomend', () => setScatter(map.getZoom() >= SCATTER_ZOOM))
    // at street zoom, tapping the open map starts a whisper from that spot
    map.on('click', (e) => {
      // pinning works from country level up; below that taps just spin the globe
      if (map.getZoom() < 4) return
      // a tap on a labelled POI carries its name straight into the form
      let poiName = ''
      try {
        const hits = map.queryRenderedFeatures(
          [[e.point.x - 12, e.point.y - 12], [e.point.x + 12, e.point.y + 12]],
          { layers: map.getStyle().layers.filter((l) => l.id.startsWith('poi-label')).map((l) => l.id) }
        )
        poiName = hits[0]?.properties?.name || ''
      } catch { /* fall back to reverse geocoding */ }
      handlersRef.current.onMapPick?.([e.lngLat.lng, e.lngLat.lat], poiName)
    })
    map.on('load', () => {
      loadedRef.current = true
      map.resize() // the container may have settled after init (iOS URL bar)
      styleWatercolor(map, daypartRef.current)
      // some label layers settle after load; tint again once the map is idle
      map.once('idle', () => styleWatercolor(map, daypartRef.current))
      map.fire('whispers:ready')
    })

    // keep the canvas matched to the container: mobile browsers resize the
    // viewport when URL bars collapse, and a stale canvas leaves the map
    // rendering as a strip with markers floating over blank paper
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)
    const onOrient = () => setTimeout(() => map.resize(), 250)
    window.addEventListener('orientationchange', onOrient)

    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', onOrient)
      map.remove()
      mapRef.current = null
      loadedRef.current = false
    }
    // map is created once; daypart is fixed per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // theme change: retint the existing style in place so every colour
  // tweens smoothly (a full setStyle reload flashed the default map).
  // The idle pass re-runs the tint to catch any layers that settle late —
  // the stale-label problem the old reload was working around.
  useEffect(() => {
    const changed = daypartRef.current !== daypart
    const prev = daypartRef.current
    daypartRef.current = daypart
    const map = mapRef.current
    if (!map || !loadedRef.current || !changed) return
    styleWatercolor(map, daypart, prev)
    map.once('idle', () => styleWatercolor(map, daypartRef.current))
  }, [daypart, mapRef])

  // markers only need rebuilding when the gardens themselves change
  // (cities, whisper counts, stamp types) — not when a like count ticks,
  // which used to make every stamp flicker
  const gardenSig = (scatter ? 'S|' : 'G|') + Object.entries(whispers)
    .map(([city, list]) => city + ':' + list.map((w) => w.flower).join(','))
    .sort()
    .join('|')

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      const whispersNow = whispersRef.current
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}
      Object.entries(whispersNow).forEach(([city, list]) => {
        if (!coords[city] || !list.length) return
        const el = document.createElement('div')
        el.innerHTML = gardenHTML(list)
        el.style.cursor = 'pointer'
        const budIndex = (e) => {
          const bud = e.target.closest('.bud')
          return bud ? parseInt(bud.dataset.idx, 10) || 0 : 0
        }
        el.onclick = (e) => { e.stopPropagation(); handlersRef.current.onStampClick(city, budIndex(e)) }
        el.onmouseenter = (e) => handlersRef.current.onStampHover(city, budIndex(e), e.clientX, e.clientY)
        el.onmousemove = (e) => handlersRef.current.onStampHover(city, budIndex(e), e.clientX, e.clientY)
        el.onmouseleave = () => handlersRef.current.onStampLeave()
        markersRef.current[city] = new mapboxgl.Marker({ element: el })
          .setLngLat(coords[city])
          .addTo(map)
      })
    }

    if (loadedRef.current) render()
    else map.on('whispers:ready', render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gardenSig, coords, mapRef, scatter])

  // a single pin previews the place being whispered about
  const previewRef = useRef(null)
  useEffect(() => {
    const map = mapRef.current
    if (previewRef.current) { previewRef.current.remove(); previewRef.current = null }
    if (!map || !previewPin) return
    const el = document.createElement('div')
    el.innerHTML =
      '<div class="preview-pin">' +
      '<svg viewBox="0 0 24 24" width="34" height="34" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 2.5 C16.5 2.5 19 6 19 9 C19 13.5 12 21 12 21 C12 21 5 13.5 5 9 C5 6 7.5 2.5 12 2.5 Z" fill="#bd8163" stroke="#fff" stroke-width="1.6"/>' +
      '<path d="M12 12.2 C9.8 10.5 8.8 9.3 8.8 8.1 C8.8 7.2 9.5 6.5 10.4 6.5 C11 6.5 11.6 6.9 12 7.5 C12.4 6.9 13 6.5 13.6 6.5 C14.5 6.5 15.2 7.2 15.2 8.1 C15.2 9.3 14.2 10.5 12 12.2 Z" fill="#fff"/>' +
      '</svg></div>'
    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', draggable: true })
      .setLngLat(previewPin)
      .addTo(map)
    marker.on('dragend', () => {
      const p = marker.getLngLat()
      handlersRef.current.onPinMoved?.([p.lng, p.lat])
    })
    previewRef.current = marker
    return () => {
      if (previewRef.current) { previewRef.current.remove(); previewRef.current = null }
    }
  }, [previewPin, mapRef])

  return <div id="map" ref={containerRef} />
}
