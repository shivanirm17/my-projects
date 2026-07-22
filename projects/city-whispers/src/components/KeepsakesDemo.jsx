import { useEffect, useState } from 'react'
import { ChevronRightIcon } from '../lib/icons'

const STEPS = [
  {
    title: 'Leave your first whisper',
    subtitle: 'Tell us about a memory from a city you miss',
    visual: 'step-whisper',
    description: 'Search any city and write a short memory. Add a specific place if you remember.',
  },
  {
    title: 'Turn it into a keepsake',
    subtitle: 'Bind your memories into a beautiful book',
    visual: 'step-keepsake',
    description: 'Create a keepsake, name it, and pick which whispers to include.',
  },
  {
    title: 'Two-page spreads',
    subtitle: 'Your memory on the left, blank canvas on the right',
    visual: 'step-spread',
    description: 'Each whisper becomes one page. See your city pinned on a map with a postmark.',
  },
  {
    title: 'Drop in photos',
    subtitle: 'Add polaroid photos and rotate them freely',
    visual: 'step-photos',
    description: 'Tap the photo tool and add images to the right page. Resize and rotate.',
  },
  {
    title: 'Decorate with stickers',
    subtitle: 'Washi tape, stickers, and hand-drawn marks',
    visual: 'step-decor',
    description: 'Add washi tape strips, emoji stickers, or freehand drawings. Undo anything.',
  },
  {
    title: 'Preview & save',
    subtitle: 'See it all together, then screenshot to keep',
    visual: 'step-preview',
    description: 'Preview your finished keepsake page and save it as an image.',
  },
]

function StepVisual({ type }) {
  if (type === 'step-whisper') {
    return (
      <div className="demo-visual">
        <div className="demo-form">
          <input type="text" placeholder="Which city do you miss?" disabled />
          <textarea placeholder="Tell us a memory..." disabled></textarea>
          <button disabled>Send your whisper</button>
        </div>
      </div>
    )
  }
  if (type === 'step-keepsake') {
    return (
      <div className="demo-visual">
        <div className="demo-shelf">
          <div className="demo-book">
            <div className="demo-left-page">
              <div className="demo-stamp">📍</div>
              <div className="demo-text">My City Whispers</div>
            </div>
            <div className="demo-right-page"></div>
          </div>
          <div className="demo-plus">+</div>
        </div>
      </div>
    )
  }
  if (type === 'step-spread') {
    return (
      <div className="demo-visual">
        <div className="demo-spread">
          <div className="demo-postcard">
            <div className="demo-map">🗺️</div>
            <div className="demo-postmark">📮</div>
            <div className="demo-text">Memory text</div>
          </div>
          <div className="demo-canvas"></div>
        </div>
      </div>
    )
  }
  if (type === 'step-photos') {
    return (
      <div className="demo-visual">
        <div className="demo-spread">
          <div className="demo-postcard">
            <div className="demo-map">🗺️</div>
          </div>
          <div className="demo-canvas">
            <div className="demo-photo">📷</div>
          </div>
        </div>
      </div>
    )
  }
  if (type === 'step-decor') {
    return (
      <div className="demo-visual">
        <div className="demo-spread">
          <div className="demo-postcard">
            <div className="demo-map">🗺️</div>
          </div>
          <div className="demo-canvas">
            <div className="demo-photo">📷</div>
            <div className="demo-sticker">✨</div>
            <div className="demo-tape"></div>
          </div>
        </div>
      </div>
    )
  }
  if (type === 'step-preview') {
    return (
      <div className="demo-visual">
        <div className="demo-spread demo-final">
          <div className="demo-postcard">
            <div className="demo-map">🗺️</div>
          </div>
          <div className="demo-canvas">
            <div className="demo-photo">📷</div>
            <div className="demo-sticker">✨</div>
            <div className="demo-tape"></div>
          </div>
        </div>
        <div className="demo-button">Save this page ↓</div>
      </div>
    )
  }
  return null
}

export default function KeepsakesDemo({ onClose }) {
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep(step + 1)
      } else {
        setAutoPlay(false)
      }
    }, 3500)
    return () => clearTimeout(timer)
  }, [step, autoPlay])

  const current = STEPS[step]

  return (
    <div className="demo-overlay">
      <button className="demo-close" onClick={onClose}>×</button>

      <div className="demo-container">
        <div className="demo-content">
          <div className="demo-visual-wrap">
            <StepVisual type={current.visual} />
          </div>

          <div className="demo-text-wrap">
            <h1 className="demo-title">{current.title}</h1>
            <p className="demo-subtitle">{current.subtitle}</p>
            <p className="demo-description">{current.description}</p>
          </div>
        </div>

        <div className="demo-progress">
          <div className="demo-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`demo-dot ${i === step ? 'active' : ''}`}
                onClick={() => { setStep(i); setAutoPlay(false) }}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="demo-controls">
            <button
              className="demo-prev"
              onClick={() => { setStep(Math.max(0, step - 1)); setAutoPlay(false) }}
              disabled={step === 0}
            >
              ← Back
            </button>
            <button
              className={`demo-play-pause ${autoPlay ? 'playing' : 'paused'}`}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? '⏸' : '▶'}
            </button>
            <button
              className="demo-next"
              onClick={() => { setStep(Math.min(STEPS.length - 1, step + 1)); setAutoPlay(false) }}
              disabled={step === STEPS.length - 1}
            >
              Next →
            </button>
          </div>

          <div className="demo-counter">
            {step + 1} / {STEPS.length}
          </div>
        </div>
      </div>
    </div>
  )
}
