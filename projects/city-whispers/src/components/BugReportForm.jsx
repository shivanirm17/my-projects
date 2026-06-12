import { useState } from 'react'
import { supabase } from '../lib/store'

function deviceId() {
  try { return localStorage.getItem('cw-device-id') || 'unknown' } catch { return 'unknown' }
}

export default function BugReportForm({ open, onClose }) {
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'ok' | 'err'

  async function submit(e) {
    e.preventDefault()
    if (description.trim().length < 10) return
    setStatus('sending')

    if (!supabase) {
      // dev fallback — log and pretend success
      console.log('Bug report (no Supabase):', { description, email })
      setStatus('ok')
      return
    }

    const { error } = await supabase.from('bug_reports').insert({
      description: description.trim(),
      email: email.trim() || null,
      page: window.location.pathname + window.location.search,
      user_agent: navigator.userAgent.slice(0, 300),
      device_id: deviceId(),
    })

    setStatus(error ? 'err' : 'ok')
  }

  function handleClose() {
    setDescription('')
    setEmail('')
    setStatus(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card bug-form" onClick={(e) => e.stopPropagation()}>
        <button className="card-close" onClick={handleClose} aria-label="Close">×</button>
        <h2>Report a bug</h2>

        {status === 'ok' ? (
          <div className="bug-thanks">
            <p>Thanks — we'll take a look.</p>
            <button className="btn-primary" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              What went wrong?
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you expected and what happened instead…"
                rows={5}
                maxLength={1000}
                required
                minLength={10}
                autoFocus
              />
            </label>
            <label>
              Email (optional — only if you'd like a reply)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            </label>
            {status === 'err' && (
              <p className="adm-err">Something went wrong. Please try again.</p>
            )}
            <div className="bug-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'sending' || description.trim().length < 10}
              >
                {status === 'sending' ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
