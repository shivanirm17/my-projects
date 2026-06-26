import { CATEGORY_SVGS } from '../../lib/constants'

// ── Illustrative stickers ──
// Hand-drawn decorative SVGs in the app's palette: flowers, leaves, hearts,
// waves, lines, sparkles, borders. Charming and consistent on every device
// (no external fonts/emoji needed).
export const STICKERS = [
  { id: 'flower', svg: `<svg viewBox="0 0 40 40"><g transform="translate(20,19)" fill="#f0a8c0"><circle cx="0" cy="-9" r="6"/><circle cx="8.6" cy="-2.8" r="6"/><circle cx="5.3" cy="7.3" r="6"/><circle cx="-5.3" cy="7.3" r="6"/><circle cx="-8.6" cy="-2.8" r="6"/></g><circle cx="20" cy="19" r="4.6" fill="#dfaf4e"/></svg>` },
  { id: 'daisy', svg: `<svg viewBox="0 0 40 40"><g transform="translate(20,19)" fill="#fffdf7" stroke="#e3d9c4" stroke-width="0.8"><ellipse cx="0" cy="-9" rx="3" ry="7"/><ellipse cx="0" cy="9" rx="3" ry="7"/><ellipse cx="9" cy="0" rx="7" ry="3"/><ellipse cx="-9" cy="0" rx="7" ry="3"/><ellipse cx="6.4" cy="-6.4" rx="3" ry="7" transform="rotate(45 6.4 -6.4)"/><ellipse cx="-6.4" cy="6.4" rx="3" ry="7" transform="rotate(45 -6.4 6.4)"/><ellipse cx="6.4" cy="6.4" rx="3" ry="7" transform="rotate(-45 6.4 6.4)"/><ellipse cx="-6.4" cy="-6.4" rx="3" ry="7" transform="rotate(-45 -6.4 -6.4)"/></g><circle cx="20" cy="19" r="4.4" fill="#dfaf4e"/></svg>` },
  { id: 'leaf', svg: `<svg viewBox="0 0 40 40"><path d="M20 35 C20 25 20 15 23 7" stroke="#7d9376" stroke-width="1.6" fill="none" stroke-linecap="round"/><g fill="#a8bba0"><path d="M21 27 C14 25 12 19 12 16 C18 17 21 21 21 27Z"/><path d="M23 20 C30 18 32 12 32 9 C26 10 23 15 23 20Z"/></g></svg>` },
  { id: 'sprig', svg: `<svg viewBox="0 0 40 40"><path d="M20 35 C20 25 19 14 20 6" stroke="#9db897" stroke-width="1.5" fill="none" stroke-linecap="round"/><g stroke="#9db897" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M20 14 C24 12 27 13 29 10"/><path d="M20 19 C16 17 13 18 11 15"/><path d="M20 24 C24 22 27 23 29 20"/><path d="M20 28 C16 26 13 27 11 24"/></g></svg>` },
  { id: 'heart', svg: `<svg viewBox="0 0 40 40"><path d="M20 33 C7 23 5 16 5 12 C5 8 8 6 11 6 C14.5 6 18 8 20 11 C22 8 25.5 6 29 6 C32 6 35 8 35 12 C35 16 33 23 20 33Z" fill="#e88aa6"/></svg>` },
  { id: 'heart-line', svg: `<svg viewBox="0 0 40 40"><path d="M20 33 C7 23 5 16 5 12 C5 8 8 6 11 6 C14.5 6 18 8 20 11 C22 8 25.5 6 29 6 C32 6 35 8 35 12 C35 16 33 23 20 33Z" fill="none" stroke="#bd8163" stroke-width="2.2" stroke-linejoin="round"/></svg>` },
  { id: 'hearts', svg: `<svg viewBox="0 0 40 40"><g fill="#f0a8c0"><path d="M14 22 C7 17 6 13 6 11 C6 8.5 8 7 10 7 C12 7 13.5 8 14 10 C14.5 8 16 7 18 7 C20 7 22 8.5 22 11 C22 13 21 17 14 22Z"/><path d="M27 33 C22 29 21 26 21 24 C21 22 22.5 21 24 21 C25.5 21 26.6 22 27 23.4 C27.4 22 28.5 21 30 21 C31.5 21 33 22 33 24 C33 26 32 29 27 33Z"/></g></svg>` },
  { id: 'wave', svg: `<svg viewBox="0 0 40 40"><g stroke="#8fb6c9" stroke-width="2.1" fill="none" stroke-linecap="round"><path d="M4 16 C8 10 12 22 16 16 C20 10 24 22 28 16 C32 10 36 22 36 16"/><path d="M4 25 C8 19 12 31 16 25 C20 19 24 31 28 25 C32 19 36 31 36 25"/></g></svg>` },
  { id: 'squiggle', svg: `<svg viewBox="0 0 40 40"><path d="M4 20 C8 11 12 29 16 20 C20 11 24 29 28 20 C32 11 36 25 36 20" stroke="#bd8163" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>` },
  { id: 'dashes', svg: `<svg viewBox="0 0 40 40"><line x1="4" y1="20" x2="36" y2="20" stroke="#9db897" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.5 7"/></svg>` },
  { id: 'star', svg: `<svg viewBox="0 0 40 40"><path d="M20 5 L24 15 L35 16 L26.5 23 L29.5 34 L20 28 L10.5 34 L13.5 23 L5 16 L16 15Z" fill="#e8c06a"/></svg>` },
  { id: 'sparkle', svg: `<svg viewBox="0 0 40 40"><path d="M20 4 C21.4 14 26 18.6 36 20 C26 21.4 21.4 26 20 36 C18.6 26 14 21.4 4 20 C14 18.6 18.6 14 20 4Z" fill="#a8bba0"/></svg>` },
  { id: 'sun', svg: `<svg viewBox="0 0 40 40"><g stroke="#dfaf4e" stroke-width="2.2" stroke-linecap="round"><line x1="20" y1="3" x2="20" y2="8"/><line x1="20" y1="32" x2="20" y2="37"/><line x1="3" y1="20" x2="8" y2="20"/><line x1="32" y1="20" x2="37" y2="20"/><line x1="8" y1="8" x2="11.5" y2="11.5"/><line x1="28.5" y1="28.5" x2="32" y2="32"/><line x1="8" y1="32" x2="11.5" y2="28.5"/><line x1="28.5" y1="11.5" x2="32" y2="8"/></g><circle cx="20" cy="20" r="8" fill="#f0cf7e"/></svg>` },
  { id: 'bow', svg: `<svg viewBox="0 0 40 40"><g fill="#f0a8c0"><path d="M20 20 L7 13 L7 27Z"/><path d="M20 20 L33 13 L33 27Z"/><path d="M18 20 C18 24 16 30 17 33 L20 31 L23 33 C24 30 22 24 22 20Z"/></g><circle cx="20" cy="20" r="3.4" fill="#e88aa6"/></svg>` },
  { id: 'butterfly', svg: `<svg viewBox="0 0 40 40"><g fill="#c7b3e0" stroke="#9a86c4" stroke-width="0.9"><path d="M20 20 C13 8 3 9 6 18 C7.5 24 16 23 20 20Z"/><path d="M20 20 C27 8 37 9 34 18 C32.5 24 24 23 20 20Z"/><path d="M20 20 C15 24 8 27 10.5 32.5 C12.5 36 19 30 20 22Z"/><path d="M20 20 C25 24 32 27 29.5 32.5 C27.5 36 21 30 20 22Z"/></g><line x1="20" y1="10" x2="20" y2="30" stroke="#7d6aa0" stroke-width="1.6" stroke-linecap="round"/></svg>` },
  { id: 'arrow', svg: `<svg viewBox="0 0 40 40"><g stroke="#bd8163" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 27 C14 19 22 14 33 12"/><path d="M25 11 L34 12 L31 20"/></g></svg>` },
  { id: 'corner', svg: `<svg viewBox="0 0 40 40"><path d="M6 34 L6 13 C6 9 8.5 6.5 12.5 6.5 L34 6.5" stroke="#a8bba0" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="6" cy="34" r="2.2" fill="#a8bba0"/><circle cx="34" cy="6.5" r="2.2" fill="#a8bba0"/></svg>` },
]
export const STICKER_SVG = Object.fromEntries(STICKERS.map((s) => [s.id, s.svg]))

// ── Washi tapes ──
// Solid + patterned strips, all pure CSS so they print and theme cleanly.
const tape = (key, style) => ({ key, style })
const stripes = (c) => `repeating-linear-gradient(45deg, ${c} 0 7px, rgba(255,255,255,0.35) 7px 14px)`
const dots = (c) => `radial-gradient(${c} 32%, transparent 34%) 0 0/12px 12px`
const gingham = (c) => `repeating-linear-gradient(90deg, ${c} 0 7px, transparent 7px 14px), repeating-linear-gradient(0deg, ${c} 0 7px, transparent 7px 14px)`

export const TAPES = [
  tape('pink', 'rgba(244,166,192,0.55)'),
  tape('peach', 'rgba(247,207,159,0.6)'),
  tape('sage', 'rgba(168,187,160,0.6)'),
  tape('blue', 'rgba(143,182,201,0.55)'),
  tape('gold', 'rgba(223,175,78,0.5)'),
  tape('lilac', 'rgba(185,163,216,0.55)'),
  tape('stripe-pink', stripes('rgba(244,166,192,0.7)')),
  tape('stripe-sage', stripes('rgba(168,187,160,0.75)')),
  tape('stripe-blue', stripes('rgba(143,182,201,0.7)')),
  tape('dot-gold', `${dots('rgba(223,175,78,0.85)')}, rgba(247,207,159,0.5)`),
  tape('dot-pink', `${dots('rgba(244,166,192,0.9)')}, rgba(244,166,192,0.3)`),
  tape('gingham-sage', `${gingham('rgba(168,187,160,0.55)')}, rgba(255,253,247,0.6)`),
]
export const TAPE_STYLE = Object.fromEntries(TAPES.map((t) => [t.key, t.style]))

// ── App stamps as stickers ──
export const STAMPS = Object.keys(CATEGORY_SVGS)

// ── Draw mode ──
export const DRAW_COLORS = ['#5a4f3a', '#7d9376', '#e88aa6', '#8fb6c9', '#dfaf4e']

export const newItem = (kind, value) => ({
  id: Math.random().toString(36).slice(2, 9),
  kind,
  value,
  x: 42 + Math.random() * 16,
  y: 30 + Math.random() * 20,
  rot: Math.round(Math.random() * 16 - 8),
})
