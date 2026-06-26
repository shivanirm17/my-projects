import { CATEGORY_SVGS } from '../../lib/constants'

// The decoration palette, shared by the preview (renders placed items) and the
// panel (the picker).
export const EMOJIS = ['🌸', '🌿', '☀️', '🌙', '⭐', '❤️', '✈️', '☕', '🍂', '🌊', '📷', '🎈', '🍷', '🗺️', '🐚', '🌅']

export const TAPES = [
  { key: 'pink', color: 'rgba(244,166,192,0.55)' },
  { key: 'peach', color: 'rgba(247,207,159,0.6)' },
  { key: 'sage', color: 'rgba(168,187,160,0.6)' },
  { key: 'blue', color: 'rgba(143,182,201,0.55)' },
  { key: 'gold', color: 'rgba(223,175,78,0.5)' },
  { key: 'lilac', color: 'rgba(185,163,216,0.55)' },
]
export const TAPE_COLOR = Object.fromEntries(TAPES.map((t) => [t.key, t.color]))

export const STAMPS = Object.keys(CATEGORY_SVGS)

export const newItem = (kind, value) => ({
  id: Math.random().toString(36).slice(2, 9),
  kind,
  value,
  x: 42 + Math.random() * 16,
  y: 30 + Math.random() * 20,
  rot: Math.round(Math.random() * 16 - 8),
})
