import { useEffect, useRef } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS, signatureFor } from '../../lib/constants'
import { TAPE_STYLE, STICKER_SVG } from './decoConstants'
import { loadDeco } from '../../lib/journalStore'
import JournalMap from './JournalMap'

function fmtDate(w) {
  if (w.created_at) {
    const d = new Date(w.created_at)
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return w.time || ''
}

function renderItem(it) {
  if (it.kind === 'sticker') return <span className="ji-sticker" dangerouslySetInnerHTML={{ __html: STICKER_SVG[it.value] || '' }} />
  if (it.kind === 'tape') return <span className="ji-tape" style={{ background: TAPE_STYLE[it.value] || it.value }} />
  if (it.kind === 'stamp') return (
    <span className="ji-stamp" style={{ color: CATEGORY_COLORS[it.value] }}
      dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[it.value] || CATEGORY_SVGS.other }} />
  )
  return null
}

// A print-only render of the whole journal: a title page + one spread per
// selected whisper, each with its saved decorations. Calls onReady once every
// image (maps, photos, stickers) has loaded so the caller can print cleanly.
export default function JournalPrint({ title, selected, coords }) {
  return (
    <div id="journal-print">
      <div className="jp-cover">
        <div className="jp-cover-stamp" style={{ color: CATEGORY_COLORS.place }}
          dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }} />
        <div className="jp-cover-title">{title}</div>
        <div className="jp-cover-sub">
          {selected.length} {selected.length === 1 ? 'memory' : 'memories'}
        </div>
      </div>

      {selected.map(({ city, w }) => {
        const deco = loadDeco(w.id)
        const flower = w.flower || 'other'
        return (
          <div className="jp-spread" key={w.id}>
            <div className="jp-page">
              <JournalMap whisper={w} cityCoords={coords?.[city]} />
              <div className="j-stamp" style={{ color: CATEGORY_COLORS[flower] }}
                dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[flower] || CATEGORY_SVGS.other }} />
              <div className="j-postmark">
                <div className="j-pm-city">{city}</div>
                <div className="j-pm-time">{w.time}</div>
              </div>
              {w.place && <div className="j-place">{w.place}</div>}
              <div className="j-text">{w.text}</div>
              <div className="j-foot">
                <span className="j-sig">{w.author || signatureFor(w)}</span>
                <span className="j-date">{fmtDate(w)}</span>
              </div>
            </div>
            <div className="jp-page jp-scrap">
              {(deco.strokes || []).length > 0 && (
                <svg className="j-draw" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {deco.strokes.map((s, i) => (
                    <path key={i} d={s.d} stroke={s.color} strokeWidth="2.4" fill="none"
                      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
              )}
              {(deco.items || []).map((it) => (
                <div className="j-item" key={it.id}
                  style={{ left: it.x + '%', top: it.y + '%', transform: `translate(-50%,-50%) rotate(${it.rot}deg)` }}>
                  {renderItem(it)}
                </div>
              ))}
              {(deco.photos || []).length > 0 && (
                <div className="j-scrap-photos">
                  {deco.photos.map((src, i) => <div className="j-photo" key={i}><img src={src} alt="" /></div>)}
                </div>
              )}
              {deco.caption && <div className="j-caption-read">{deco.caption}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Mounts the print view, waits for its images, prints, then unmounts.
export function PrintGate({ title, selected, coords, onDone }) {
  const ref = useRef(null)
  useEffect(() => {
    let cancelled = false
    let printed = false
    const fire = () => {
      if (cancelled || printed) return
      printed = true
      window.print()
      setTimeout(() => { if (!cancelled) onDone() }, 300)
    }
    const check = () => {
      if (cancelled) return
      const imgs = [...(ref.current?.querySelectorAll('img') || [])]
      if (imgs.length === 0 || imgs.every((im) => im.complete)) fire()
      else setTimeout(check, 250)
    }
    const t = setTimeout(check, 500) // give maps a beat to kick off
    const onAfter = () => { /* cleanup handled by onDone */ }
    window.addEventListener('afterprint', onAfter)
    return () => { cancelled = true; clearTimeout(t); window.removeEventListener('afterprint', onAfter) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref}><JournalPrint title={title} selected={selected} coords={coords} /></div>
}
