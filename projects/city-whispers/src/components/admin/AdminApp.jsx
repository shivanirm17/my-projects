import { useState, useEffect, useCallback } from 'react'
import { fetchAllWhispers, adminDeleteWhisper, fetchBugReports, hasAdminClient } from '../../lib/adminStore'

const PASS = import.meta.env.VITE_ADMIN_PASSWORD || ''
const SESSION_KEY = 'cw-admin-auth'

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

// ── Auth gate ────────────────────────────────────────────────────────────────

function LoginForm({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (pw === PASS && PASS) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setErr('Wrong password.')
      setPw('')
    }
  }

  return (
    <div className="adm-login">
      <h1>City Whispers Admin</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr('') }}
          autoFocus
        />
        <button type="submit">Enter</button>
        {err && <p className="adm-err">{err}</p>}
      </form>
    </div>
  )
}

// ── Whisper manager ───────────────────────────────────────────────────────────

function WhisperManager() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAllWhispers().then((data) => { if (!cancelled) { setRows(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchAllWhispers()
    setRows(data)
    setLoading(false)
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this whisper permanently?')) return
    setDeleting(id)
    const { ok, error } = await adminDeleteWhisper(id)
    if (ok) {
      setRows((r) => r.filter((w) => w.id !== id))
    } else {
      setErr('Delete failed: ' + error)
    }
    setDeleting(null)
  }

  return (
    <section className="adm-section">
      <div className="adm-section-head">
        <h2>Whispers</h2>
        <button className="adm-refresh" onClick={load}>Refresh</button>
      </div>
      {err && <p className="adm-err">{err}</p>}
      {loading ? (
        <p className="adm-loading">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="adm-empty">No whispers found.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Text</th>
                <th>Created</th>
                <th>Device</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <td className="adm-city">{w.city}</td>
                  <td className="adm-text">{w.text}</td>
                  <td className="adm-date">{fmt(w.created_at)}</td>
                  <td className="adm-device" title={w.device_id}>{w.device_id ? w.device_id.slice(0, 8) + '…' : '—'}</td>
                  <td>
                    <button
                      className="adm-del"
                      onClick={() => handleDelete(w.id)}
                      disabled={deleting === w.id}
                    >
                      {deleting === w.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Bug reports ───────────────────────────────────────────────────────────────

function BugReports() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBugReports().then((data) => { if (!cancelled) { setRows(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchBugReports()
    setRows(data)
    setLoading(false)
  }, [])

  return (
    <section className="adm-section">
      <div className="adm-section-head">
        <h2>Bug Reports</h2>
        <button className="adm-refresh" onClick={load}>Refresh</button>
      </div>
      {loading ? (
        <p className="adm-loading">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="adm-empty">No bug reports yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Email</th>
                <th>Page</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="adm-date">{fmt(r.created_at)}</td>
                  <td className="adm-text">{r.description}</td>
                  <td>{r.email || '—'}</td>
                  <td>{r.page || '—'}</td>
                  <td className="adm-device" title={r.device_id}>{r.device_id ? r.device_id.slice(0, 8) + '…' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY))
  const [tab, setTab] = useState('whispers')

  if (!authed) return <LoginForm onAuth={() => setAuthed(true)} />

  if (!hasAdminClient) {
    return (
      <div className="adm-login">
        <h1>City Whispers Admin</h1>
        <p className="adm-err">
          Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <div className="adm-shell">
      <header className="adm-header">
        <span className="adm-logo">City Whispers Admin</span>
        <nav className="adm-nav">
          <button className={tab === 'whispers' ? 'active' : ''} onClick={() => setTab('whispers')}>Whispers</button>
          <button className={tab === 'bugs' ? 'active' : ''} onClick={() => setTab('bugs')}>Bug Reports</button>
        </nav>
        <button className="adm-logout" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}>
          Log out
        </button>
      </header>

      <main className="adm-main">
        {tab === 'whispers' && <WhisperManager />}
        {tab === 'bugs' && <BugReports />}
      </main>
    </div>
  )
}
