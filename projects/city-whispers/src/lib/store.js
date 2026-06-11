// Data layer. Uses Supabase when configured, otherwise falls back to the
// in-memory seed data so the app always runs.
import { createClient } from '@supabase/supabase-js'
import { SEED_WHISPERS, SEED_COORDS } from './constants'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isLive = !!supabase

// Anonymous, no accounts: a stable per-device id for the 5/day limit
function deviceId() {
  try {
    let id = localStorage.getItem('cw-device-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('cw-device-id', id)
    }
    return id
  } catch {
    return 'unknown-device'
  }
}

function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`
}

// → { whispers: { city: [...] }, coords: { city: [lng, lat] } }
export async function fetchWhispers() {
  if (!supabase) return { whispers: SEED_WHISPERS, coords: SEED_COORDS }

  const { data, error } = await supabase
    .from('whispers')
    .select('id, city, lng, lat, text, category, likes, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchWhispers:', error.message)
    return { whispers: SEED_WHISPERS, coords: SEED_COORDS }
  }

  const whispers = {}
  const coords = {}
  for (const row of data) {
    if (!whispers[row.city]) whispers[row.city] = []
    whispers[row.city].push({
      id: row.id,
      text: row.text,
      flower: row.category,
      likes: row.likes,
      time: relativeTime(row.created_at),
    })
    if (!coords[row.city]) coords[row.city] = [row.lng, row.lat]
  }
  return { whispers, coords }
}

// PRD: limit of 5 whispers per person per day
export async function whispersLeftToday() {
  if (!supabase) return 5
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  const { count, error } = await supabase
    .from('whispers')
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId())
    .gte('created_at', since.toISOString())
  if (error) return 5
  return Math.max(0, 5 - (count || 0))
}

export async function addWhisper({ city, lng, lat, text, category }) {
  if (!supabase) return { id: null }
  const { data, error } = await supabase
    .from('whispers')
    .insert({ city, lng, lat, text, category, device_id: deviceId() })
    .select('id')
    .single()
  if (error) {
    console.error('addWhisper:', error.message)
    return { id: null, error: error.message }
  }
  return { id: data.id }
}

export async function setLikes(id, likes) {
  if (!supabase || !id) return
  const { error } = await supabase.from('whispers').update({ likes }).eq('id', id)
  if (error) console.error('setLikes:', error.message)
}

export async function sendFeedback(rating) {
  if (!supabase) {
    console.log('whisper feedback:', rating)
    return
  }
  const { error } = await supabase.from('feedback').insert({ rating, device_id: deviceId() })
  if (error) console.error('sendFeedback:', error.message)
}
