import { useEffect, useState } from 'react'

// A self-playing ~26s animation of the keepsakes flow, meant to be screen
// recorded (menu → "See keepsakes demo"). No interaction: every element is
// choreographed with CSS animation-delays on one master timeline, and the
// whole stage remounts (key bump) to loop seamlessly.

const LOOP_MS = 26500

const PIN_SVG = (
  <svg viewBox="0 0 24 24" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5 C16.5 2.5 19 6 19 9 C19 13.5 12 21 12 21 C12 21 5 13.5 5 9 C5 6 7.5 2.5 12 2.5 Z" fill="#bd8163" stroke="#fff" strokeWidth="1.6" />
    <path d="M12 12.2 C9.8 10.5 8.8 9.3 8.8 8.1 C8.8 7.2 9.5 6.5 10.4 6.5 C11 6.5 11.6 6.9 12 7.5 C12.4 6.9 13 6.5 13.6 6.5 C14.5 6.5 15.2 7.2 15.2 8.1 C15.2 9.3 14.2 10.5 12 12.2 Z" fill="#fff" />
  </svg>
)

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

        {/* ── scene 1: the whisper form ── */}
        <div className="kd-scene kd-s1">
          <div className="kd-form">
            <div className="kd-form-title">Leave a whisper</div>
            <div className="kd-label">Which city do you miss?</div>
            <div className="kd-field"><span className="kd-type kd-t-city">New York</span></div>
            <div className="kd-label">Somewhere in particular?</div>
            <div className="kd-field"><span className="kd-type kd-t-place">Radio City Hall</span></div>
            <div className="kd-label">Write it down</div>
            <div className="kd-field"><span className="kd-type kd-t-memory">Graduated with my best friends</span></div>
            <div className="kd-send">♡ Send your whisper</div>
          </div>
        </div>

        {/* ── scene 2: bound into a book ── */}
        <div className="kd-scene kd-s2">
          <div className="kd-cover">
            <div className="kd-cover-spine" />
            <div className="kd-cover-stamp">{PIN_SVG}</div>
            <div className="kd-cover-name"><span className="kd-type kd-t-name">NYC Memories</span></div>
            <div className="kd-cover-pages">1 page</div>
          </div>
        </div>

        {/* ── scene 3: the spread, decorated live ── */}
        <div className="kd-scene kd-s3">
          <div className="kd-spread">
            <div className="kd-page-left">
              <div className="kd-map">
                <div className="kd-pin">{PIN_SVG}</div>
                <div className="kd-postmark"><i>NEW YORK</i><em>just now</em></div>
              </div>
              <div className="kd-place">Radio City Hall</div>
              <div className="kd-whisper">Graduated with my best friends</div>
              <div className="kd-sig">A neighbour from far away</div>
            </div>
            <div className="kd-page-right">
              <div className="kd-polaroid"><div className="kd-photo">🎓</div></div>
              <div className="kd-tape kd-tape1" />
              <div className="kd-sticker kd-stick1">✨</div>
              <div className="kd-tape kd-tape2" />
              <div className="kd-sticker kd-stick2">💛</div>
            </div>
          </div>
          <div className="kd-saveui">
            <div className="kd-savebtn">↓ Save this page</div>
            <div className="kd-savedchip">nyc-memories.png saved ✓</div>
          </div>
          <div className="kd-flash" />
        </div>

        {/* ── scene 4: end card ── */}
        <div className="kd-scene kd-end">
          <div className="kd-end-stamp">{PIN_SVG}</div>
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
