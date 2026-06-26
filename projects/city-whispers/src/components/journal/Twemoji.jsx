import { useState } from 'react'
import { twemojiUrl } from './decoConstants'

// Render an emoji as a Twemoji SVG (consistent across devices), falling back to
// the native character if the image can't load (offline, blocked CDN, etc.).
export default function Twemoji({ emoji, className }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className={className}>{emoji}</span>
  return (
    <img
      className={className}
      src={twemojiUrl(emoji)}
      alt={emoji}
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}
