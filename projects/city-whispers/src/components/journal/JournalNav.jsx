import { useState } from 'react'

// App-style navigation hamburger shown on every journal screen. `items` is a
// list of { label, icon, onClick }. `inline` drops the absolute positioning so
// it can live inside the editor topbar.
export default function JournalNav({ items, inline }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={'j-nav' + (inline ? ' inline' : '')}>
      <button className="j-hamburger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && (
        <>
          <div className="j-menu-scrim" onClick={() => setOpen(false)} />
          <div className="j-menu">
            {items.map((it, i) => (
              <button key={i} className="j-menu-item" onClick={() => { setOpen(false); it.onClick() }}>
                <span className="j-menu-ico">{it.icon}</span> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
