import { CATEGORY_SVGS } from '../../lib/constants'

// ── Stickers ──
// A big, fun, curated set. Rendered as Twemoji (Twitter's open-source emoji,
// served free from the jsDelivr CDN) so they look consistent and playful on
// every device, with a native-emoji fallback if the image can't load.
export const EMOJIS = [
  // flora
  '🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🪻', '🌿', '🍀', '🍁', '🍂', '🌱', '🌵', '🌴',
  // sky & weather
  '☀️', '🌙', '⭐', '✨', '⛅', '🌈', '🌊', '❄️', '🔥',
  // hearts & love
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '💕', '💌', '💫',
  // travel & places
  '✈️', '🗺️', '🧭', '🏔️', '🏖️', '⛩️', '🗼', '🎡', '🎠', '🏰',
  // little joys
  '📷', '🎞️', '🎈', '🎀', '🕯️', '☕', '🍷', '🍰', '🍓', '🍋', '🐚', '🦋', '🕊️', '🌅',
]

// emoji → Twemoji SVG url (drop variation/zero-width selectors)
export function twemojiUrl(emoji) {
  const cps = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((cp) => cp !== 'fe0f' && cp !== '200d')
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/${cps.join('-')}.svg`
}

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

export const newItem = (kind, value) => ({
  id: Math.random().toString(36).slice(2, 9),
  kind,
  value,
  x: 42 + Math.random() * 16,
  y: 30 + Math.random() * 20,
  rot: Math.round(Math.random() * 16 - 8),
})
