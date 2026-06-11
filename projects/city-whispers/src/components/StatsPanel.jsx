import { useEffect, useState } from 'react'
import { supabase } from '../lib/store'
import { FaceLovelyIcon, FaceNiceIcon, FaceMehIcon } from '../lib/icons'

// A small founder dashboard. Open with ?stats=1 (or #stats).
export default function StatsPanel({ onClose }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!supabase) return
    async function load() {
      const since = new Date()
      since.setHours(0, 0, 0, 0)

      const [whispers, today, feedback] = await Promise.all([
        supabase.from('whispers').select('city, category, likes, created_at'),
        supabase.from('whispers').select('id', { count: 'exact', head: true })
          .gte('created_at', since.toISOString()),
        supabase.from('feedback').select('rating'),
      ])

      const rows = whispers.data || []
      const byCity = {}
      const byCategory = {}
      let totalLikes = 0
      rows.forEach((r) => {
        byCity[r.city] = (byCity[r.city] || 0) + 1
        byCategory[r.category] = (byCategory[r.category] || 0) + 1
        totalLikes += r.likes || 0
      })
      const fb = { lovely: 0, nice: 0, meh: 0 }
      ;(feedback.data || []).forEach((r) => { fb[r.rating] = (fb[r.rating] || 0) + 1 })

      setStats({
        total: rows.length,
        today: today.count || 0,
        cities: Object.keys(byCity).length,
        totalLikes,
        byCity: Object.entries(byCity).sort((a, b) => b[1] - a[1]),
        byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
        feedback: fb,
      })
    }
    load()
  }, [])

  return (
    <div id="stats-panel">
      <div className="stats-head">
        <h2>City Whispers, the numbers</h2>
        <button onClick={onClose}>close</button>
      </div>

      {!supabase && <p className="stats-note">Supabase is not configured, nothing to count.</p>}
      {supabase && !stats && <p className="stats-note">counting…</p>}

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat"><b>{stats.total}</b><span>whispers</span></div>
            <div className="stat"><b>{stats.cities}</b><span>cities</span></div>
            <div className="stat"><b>{stats.today}</b><span>today</span></div>
            <div className="stat"><b>{stats.totalLikes}</b><span>likes</span></div>
          </div>

          <h3>by city</h3>
          <table className="stats-table">
            <tbody>
              {stats.byCity.map(([city, n]) => (
                <tr key={city}><td>{city}</td><td>{n}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>by category</h3>
          <table className="stats-table">
            <tbody>
              {stats.byCategory.map(([cat, n]) => (
                <tr key={cat}><td>{cat}</td><td>{n}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>feedback</h3>
          <table className="stats-table">
            <tbody>
              <tr><td><FaceLovelyIcon size={18} /> lovely</td><td>{stats.feedback.lovely}</td></tr>
              <tr><td><FaceNiceIcon size={18} /> nice</td><td>{stats.feedback.nice}</td></tr>
              <tr><td><FaceMehIcon size={18} /> meh</td><td>{stats.feedback.meh}</td></tr>
            </tbody>
          </table>

          <p className="stats-note">
            Map loads are metered by Mapbox, not us:{' '}
            <a href="https://console.mapbox.com/account/statistics/" target="_blank" rel="noreferrer">
              console.mapbox.com → Statistics
            </a>
            . Free tier is 50,000 loads/month.
          </p>
        </>
      )}
    </div>
  )
}
