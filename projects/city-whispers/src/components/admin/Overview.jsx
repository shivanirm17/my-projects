import { useMemo, useState } from 'react'
import { CATEGORY_COLORS } from '../../lib/constants'

// ── small date helpers (all local-time so day buckets line up with the admin) ──
function localDayKey(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
function startOfToday() {
  const x = new Date()
  x.setHours(0, 0, 0, 0)
  return x
}

// last `days` calendar days, oldest first, each with its count
function dailyBuckets(rows, days) {
  const today = startOfToday()
  const map = {}
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = localDayKey(d)
    map[key] = { key, date: d, count: 0 }
    out.push(map[key])
  }
  for (const w of rows) {
    const b = map[localDayKey(w.created_at)]
    if (b) b.count++
  }
  return out
}

// last `weeks` 7-day windows, oldest first
function weeklyBuckets(rows, weeks) {
  const today = startOfToday()
  const out = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(today)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    out.push({ start, end, count: 0 })
  }
  for (const w of rows) {
    const d = new Date(w.created_at)
    d.setHours(0, 0, 0, 0)
    const diff = Math.floor((today - d) / 86400000)
    if (diff < 0) continue
    const wi = weeks - 1 - Math.floor(diff / 7)
    if (wi >= 0 && wi < weeks) out[wi].count++
  }
  return out
}

// generic "count by field", returns [{ name, count }] sorted desc
function topBy(rows, field, limit) {
  const counts = {}
  for (const w of rows) {
    const k = w[field] || '—'
    counts[k] = (counts[k] || 0) + 1
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// ── presentational bits ───────────────────────────────────────────────────────
function StatCard({ label, value, hint }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-value">{value}</div>
      <div className="adm-stat-label">{label}</div>
      {hint && <div className="adm-stat-hint">{hint}</div>}
    </div>
  )
}

function VBars({ buckets, labelFor }) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  // show ~6 x-axis ticks so it doesn't crowd
  const step = Math.ceil(buckets.length / 6)
  return (
    <div className="adm-vbars">
      {buckets.map((b, i) => (
        <div className="adm-vbar-col" key={i} title={`${labelFor(b)}: ${b.count}`}>
          <div className="adm-vbar-wrap">
            <div className="adm-vbar" style={{ height: `${(b.count / max) * 100}%` }} />
          </div>
          <span className="adm-vbar-x">{i % step === 0 ? labelFor(b, true) : ''}</span>
        </div>
      ))}
    </div>
  )
}

function HBars({ items, colorFor }) {
  const max = Math.max(1, ...items.map((it) => it.count))
  if (items.length === 0) return <p className="adm-empty">No data yet.</p>
  return (
    <div className="adm-hbars">
      {items.map((it) => (
        <div className="adm-hbar-row" key={it.name}>
          <span className="adm-hbar-label" title={it.name}>{it.name}</span>
          <div className="adm-hbar-track">
            <div
              className="adm-hbar-fill"
              style={{ width: `${(it.count / max) * 100}%`, background: colorFor ? colorFor(it.name) : undefined }}
            />
          </div>
          <span className="adm-hbar-val">{it.count}</span>
        </div>
      ))}
    </div>
  )
}

// ── the dashboard ──────────────────────────────────────────────────────────────
export default function Overview({ rows }) {
  const [mode, setMode] = useState('day') // 'day' | 'week'

  const stats = useMemo(() => {
    const total = rows.length
    const devices = new Set(rows.map((w) => w.device_id).filter(Boolean))
    const cities = new Set(rows.map((w) => w.city).filter(Boolean))
    const likes = rows.reduce((n, w) => n + (w.likes || 0), 0)
    const today = startOfToday()
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6)
    const todayCount = rows.filter((w) => new Date(w.created_at) >= today).length
    const weekCount = rows.filter((w) => new Date(w.created_at) >= weekAgo).length
    return { total, devices: devices.size, cities: cities.size, likes, todayCount, weekCount }
  }, [rows])

  const buckets = useMemo(
    () => (mode === 'day' ? dailyBuckets(rows, 30) : weeklyBuckets(rows, 12)),
    [rows, mode],
  )
  const topCities = useMemo(() => topBy(rows, 'city', 8), [rows])
  const topDevices = useMemo(() => topBy(rows, 'device_id', 6), [rows])
  const categories = useMemo(() => topBy(rows, 'category', 8), [rows])
  const mostLiked = useMemo(
    () => [...rows].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 6),
    [rows],
  )

  const dayLabel = (b, short) =>
    b.date.toLocaleDateString(undefined, short ? { month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' })
  const weekLabel = (b, short) =>
    short
      ? b.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : `${b.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${b.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

  return (
    <section className="adm-section adm-overview">
      <div className="adm-stat-grid">
        <StatCard label="Total whispers" value={stats.total} />
        <StatCard label="Active users" value={stats.devices} hint="unique devices" />
        <StatCard label="Cities" value={stats.cities} />
        <StatCard label="Total likes" value={stats.likes} />
        <StatCard label="This week" value={stats.weekCount} hint="last 7 days" />
        <StatCard label="Today" value={stats.todayCount} />
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h3>Whispers over time</h3>
          <div className="adm-toggle">
            <button className={mode === 'day' ? 'active' : ''} onClick={() => setMode('day')}>30 days</button>
            <button className={mode === 'week' ? 'active' : ''} onClick={() => setMode('week')}>12 weeks</button>
          </div>
        </div>
        <VBars buckets={buckets} labelFor={mode === 'day' ? dayLabel : weekLabel} />
      </div>

      <div className="adm-card-row">
        <div className="adm-card">
          <div className="adm-card-head"><h3>Top cities</h3></div>
          <HBars items={topCities} />
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><h3>By category</h3></div>
          <HBars items={categories} colorFor={(name) => CATEGORY_COLORS[name] || '#7a6f5a'} />
        </div>
      </div>

      <div className="adm-card-row">
        <div className="adm-card">
          <div className="adm-card-head"><h3>Top contributors</h3></div>
          <HBars items={topDevices.map((d) => ({ ...d, name: d.name === '—' ? '—' : d.name.slice(0, 8) + '…' }))} />
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><h3>Most liked</h3></div>
          {mostLiked.length === 0 ? (
            <p className="adm-empty">No data yet.</p>
          ) : (
            <ul className="adm-liked">
              {mostLiked.map((w) => (
                <li key={w.id}>
                  <span className="adm-liked-likes">♥ {w.likes || 0}</span>
                  <span className="adm-liked-text" title={w.text}>{w.text}</span>
                  <span className="adm-liked-city">{w.city}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
