// Admin data layer — calls security-definer RPC functions via the anon key.
// The functions bypass RLS server-side but validate the admin token before
// doing anything, so no service role key is needed in the browser.
import { supabase } from './store'

export const hasAdminClient = !!supabase

const TOKEN = import.meta.env.VITE_ADMIN_PASSWORD || ''

export async function fetchAllWhispers() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_get_whispers', { p_token: TOKEN })
  if (error) { console.error('fetchAllWhispers:', error.message); return [] }
  return data || []
}

export async function adminDeleteWhisper(id) {
  if (!supabase) return { ok: false, error: 'No Supabase client' }
  const { error } = await supabase.rpc('admin_delete_whisper', { p_token: TOKEN, p_id: id })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchBugReports() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_get_bug_reports', { p_token: TOKEN })
  if (error) { console.error('fetchBugReports:', error.message); return [] }
  return data || []
}
