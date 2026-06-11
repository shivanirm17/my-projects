import { useEffect, useRef } from 'react'
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
function styleWatercolor(map, daypart) {
  const MT = MAP_THEMES[daypart]
  const set = (layer, prop, val) => {
    try { map.setPaintProperty(layer, prop, val) } catch { /* layer may not exist */ }
  }
  const hide = (layer) => {
    try { map.setLayoutProperty(layer, 'visibility', 'none') } catch { /* layer may not exist */ }
  }

  map.getStyle().layers.forEach((layer) => {
    const id = layer.id
    if (id.includes('label')) {
      if (id.startsWith('country-label') || id.startsWith('settlement-major-label')) {
        set(id, 'text-color', MT.label)
        set(id, 'text-halo-color', MT.halo)
        set(id, 'text-halo-width', 1.4)
        set(id, 'text-opacity', 0.55)
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
    if (id.includes('road') || id.includes('bridge') || id.includes('tunnel')) hide(id)
  })

  map.setFog({
    color: MT.fog[0],
    'high-color': MT.fog[1],
    'horizon-blend': 0.08,
    'space-color': MT.fog[2],
    'star-intensity': MT.stars,
  })
}

export default function MapView({ whispers, coords, daypart, onStampClick, onStampHover, onStampLeave, mapRef }) {
  const containerRef = useRef(null)
  const markersRef = useRef({})
  const loadedRef = useRef(false)

  // latest handlers without re-subscribing markers
  const handlersRef = useRef({})
  useEffect(() => {
    handlersRef.current = { onStampClick, onStampHover, onStampLeave }
  })

  useEffect(() => {
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
      maxZoom: 7, // country/city level only, no streets or buildings
      projection: 'globe',
    })
    mapRef.current = map
    map.on('load', () => {
      loadedRef.current = true
      styleWatercolor(map, daypart)
      map.fire('whispers:ready')
    })
    return () => {
      map.remove()
      mapRef.current = null
      loadedRef.current = false
    }
    // map is created once; daypart is fixed per page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // retint the watercolor when the theme mode changes
  useEffect(() => {
    const map = mapRef.current
    if (map && loadedRef.current) styleWatercolor(map, daypart)
  }, [daypart, mapRef])

  // (re)render one marker per city whenever whispers change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const render = () => {
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}
      Object.entries(whispers).forEach(([city, list]) => {
        if (!coords[city] || !list.length) return
        const el = document.createElement('div')
        el.innerHTML = gardenHTML(list)
        el.style.cursor = 'pointer'
        const budIndex = (e) => {
          const bud = e.target.closest('.bud')
          return bud ? parseInt(bud.dataset.idx, 10) || 0 : 0
        }
        el.onclick = (e) => handlersRef.current.onStampClick(city, budIndex(e))
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
  }, [whispers, coords, mapRef])

  return <div id="map" ref={containerRef} />
}
