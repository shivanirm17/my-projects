import { useEffect, useState } from 'react'
import { CATEGORY_SVGS, CATEGORY_COLORS } from '../lib/constants'
import { HeartIcon, DownloadIcon } from '../lib/icons'
import JournalEntry from './journal/JournalEntry'

// A self-playing ~26s animation of the keepsakes flow, meant to be screen
// recorded (menu → "See keepsakes demo"). Every scene renders the app's real
// markup — the actual form field/stamp classes, the actual shelf book cover,
// and the real JournalEntry component with demo data — so it IS the app's
// design; the demo only adds choreography (kd-* classes) on top. The stage
// remounts (key bump) every LOOP_MS to loop seamlessly.

const LOOP_MS = 26500

// a stand-in polaroid: sage paper with a graduation cap, as a data URI so the
// real photo pipeline (.ji-polaroid > img) renders it like any user photo
const DEMO_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200">' +
  '<rect width="240" height="200" fill="#dfe7dc"/>' +
  '<text x="120" y="124" font-size="76" text-anchor="middle">🎓</text></svg>'
)

const DEMO_WHISPER = {
  id: 'demo', flower: 'place', text: 'Graduated with my best friends',
  place: 'Radio City Hall', author: null, time: 'just now',
  lng: -73.9799, lat: 40.76,
}

// fixed positions (newItem() randomises; the demo must be identical every loop)
const DEMO_DECO = {
  strokes: [],
  items: [
    { id: 'p1', kind: 'photo', value: DEMO_PHOTO, x: 50, y: 34, w: 56, rot: -7 },
    { id: 't1', kind: 'tape', value: 'stripe-sage', x: 16, y: 9, rot: -35 },
    { id: 's1', kind: 'sticker', value: 'sparkle', x: 18, y: 68, rot: 0 },
    { id: 't2', kind: 'tape', value: 'dot-gold', x: 80, y: 82, rot: 18 },
    { id: 's2', kind: 'sticker', value: 'heart', x: 82, y: 54, rot: 8 },
  ],
}

const STAMP_ORDER = ['food', 'weather', 'shop', 'people', 'place', 'other']

export default function KeepsakesDemo({ onClose }) {
  const [run, setRun] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setRun((r) => r + 1), LOOP_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="kd-overlay">
      <button className="kd-close" onClick={onClose} aria-label="Close demo">×</button>

      <div className="kd-stage" key={run}>

        {/* ── scene 1: the whisper form (real field classes) ── */}
        <div className="kd-scene kd-s1">
          <div className="kd-formcard">
            <h2 className="kd-form-title">Leave a whisper</h2>
            <div className="pc-q">Which city do you miss?</div>
            <div className="pc-input kd-fauxfield"><span className="kd-type kd-t-city">New York</span></div>
            <div className="pc-q">Somewhere in particular? (optional)</div>
            <div className="pc-input kd-fauxfield"><span className="kd-type kd-t-place">Radio City Hall</span></div>
            <div className="pc-q">What kind of memory is it?</div>
            <div className="stamp-row kd-stamprow">
              {STAMP_ORDER.map((name) => (
                <span key={name} className={'stamp-opt' + (name === 'place' ? ' selected kd-pick' : '')}
                  style={{ color: CATEGORY_COLORS[name] }}>
                  <span className="so-art" dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS[name] }} />
                  {name === 'place' && <span className="so-label">{name}</span>}
                </span>
              ))}
            </div>
            <div className="pc-q">Write it down</div>
            <div className="pc-input kd-fauxfield"><span className="kd-type kd-t-memory">Graduated with my best friends</span></div>
            <div className="btn-primary kd-send"><HeartIcon size={16} /> Send your whisper</div>
          </div>
        </div>

        {/* ── scene 2: bound into a keepsake (real shelf cover) ── */}
        <div className="kd-scene kd-s2">
          <div className="j-book kd-book">
            <div className="j-book-cover" style={{ '--spine': CATEGORY_COLORS.place }}>
              <span className="j-book-stamp" style={{ color: CATEGORY_COLORS.place }}
                dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }} />
              <span className="j-book-name"><span className="kd-type kd-t-name">NYC Memories</span></span>
              <span className="j-book-count">1 page</span>
            </div>
          </div>
        </div>

        {/* ── scene 3: the real spread, decorating itself ── */}
        <div className="kd-scene kd-s3">
          <div className="kd-spreadwrap">
            <JournalEntry
              item={{ city: 'New York', w: DEMO_WHISPER }}
              deco={DEMO_DECO}
              onDecoChange={() => {}}
              readOnly
            />
          </div>
          <div className="j-preview-foot kd-saveui">
            <div className="j-preview-save kd-savebtn"><DownloadIcon size={16} /> Save this page</div>
            <div className="j-preview-hint kd-savedchip">nyc-memories.png saved ✓</div>
          </div>
          <div className="kd-flash" />
        </div>

        {/* ── scene 4: end card ── */}
        <div className="kd-scene kd-end">
          <div className="j-setup-stamp" style={{ color: CATEGORY_COLORS.place }}
            dangerouslySetInnerHTML={{ __html: CATEGORY_SVGS.place }} />
          <div className="kd-end-title">Turn your whispers<br />into keepsakes.</div>
          <div className="kd-end-sub">City Whispers</div>
        </div>

        {/* ── captions, on their own track ── */}
        <div className="kd-cap kd-cap1">Leave a whisper about a city you miss</div>
        <div className="kd-cap kd-cap2">Bind it into a keepsake</div>
        <div className="kd-cap kd-cap3">One page per memory</div>
        <div className="kd-cap kd-cap4">Decorate with photos, tape and stickers</div>
        <div className="kd-cap kd-cap5">Save it forever</div>
      </div>
    </div>
  )
}
