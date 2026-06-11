// Gentle chimes, generated with the Web Audio API. No files, no background music.
let audioCtx = null
let soundOn = false

export function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

export function toggleSound() {
  ensureAudio()
  soundOn = !soundOn
  return soundOn
}

function chime(freq, when, dur, vol) {
  if (!soundOn || !audioCtx) return
  // browsers re-suspend idle contexts; wake it before playing
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const t = audioCtx.currentTime + (when || 0)
  const osc = audioCtx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const g = audioCtx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.4))
  osc.connect(g).connect(audioCtx.destination)
  osc.start(t)
  osc.stop(t + (dur || 1.4) + 0.1)
}

// pentatonic, so any combination sounds gentle
export function chimeOpen() {
  chime(880, 0, 1.2, 0.14)
  chime(1318.5, 0.09, 1.4, 0.10)
}

export function chimePlant() {
  chime(659.3, 0, 1.3, 0.15)
  chime(880, 0.12, 1.4, 0.13)
  chime(1108.7, 0.24, 1.6, 0.10)
}
