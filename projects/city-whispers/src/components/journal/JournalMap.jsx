import { useEffect, useState } from 'react'
import { MAPBOX_TOKEN } from '../../lib/constants'

// The brand teardrop pin (same shape as the map's preview pin in MapView.jsx),
// overlaid on the static map so every entry points to the exact spot.
const PIN_SVG =
  '<svg viewBox="0 0 24 24" width="38" height="38" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M12 2.5 C16.5 2.5 19 6 19 9 C19 13.5 12 21 12 21 C12 21 5 13.5 5 9 C5 6 7.5 2.5 12 2.5 Z" fill="#bd8163" stroke="#fff" stroke-width="1.6"/>' +
  '<path d="M12 12.2 C9.8 10.5 8.8 9.3 8.8 8.1 C8.8 7.2 9.5 6.5 10.4 6.5 C11 6.5 11.6 6.9 12 7.5 C12.4 6.9 13 6.5 13.6 6.5 C14.5 6.5 15.2 7.2 15.2 8.1 C15.2 9.3 14.2 10.5 12 12.2 Z" fill="#fff"/>' +
  '</svg>'

// A faded, zoomed-in map of where a whisper was pinned. Uses the Mapbox Static
// Images API; the aged look comes from CSS (.jm-img filter + .jm-fade overlay).
export default function JournalMap({ whisper, cityCoords }) {
  const lng = whisper?.lng ?? cityCoords?.[0]
  const lat = whisper?.lat ?? cityCoords?.[1]
  // a placed whisper zooms to the street; a city-only one stays wide
  const zoom = whisper?.place ? 14.4 : 11
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (lng == null || lat == null || !MAPBOX_TOKEN) { setFailed(true); return }
    let objUrl
    let cancelled = false
    const api = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
      `${lng},${lat},${zoom},0/640x360@2x?access_token=${MAPBOX_TOKEN}` +
      `&logo=false&attribution=false`
    // fetch as a blob so the image is same-origin to a future <canvas>/PDF export
    fetch(api)
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((blob) => { if (cancelled) return; objUrl = URL.createObjectURL(blob); setSrc(objUrl) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; if (objUrl) URL.revokeObjectURL(objUrl) }
  }, [lng, lat, zoom])

  return (
    <div className="jm-frame">
      {src && <img className="jm-img" src={src} alt="" />}
      {!src && !failed && <div className="jm-loading" />}
      {failed && <div className="jm-failed" />}
      <div className="jm-fade" />
      <div className="jm-pin" dangerouslySetInnerHTML={{ __html: PIN_SVG }} />
    </div>
  )
}
