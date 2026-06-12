import { SunIcon, MoonIcon, AutoThemeIcon, SoundOnIcon, SoundOffIcon, StampIcon } from '../lib/icons'

const THEME_ICON = { auto: AutoThemeIcon, light: SunIcon, dark: MoonIcon }
const THEME_NAME = { auto: 'Auto (time of day)', light: 'Light', dark: 'Dark' }

export default function MobileMenu({
  open, onClose,
  mineOnly, onToggleMine,
  themeMode, onCycleTheme,
  soundOn, onToggleSound,
  onReportBug,
}) {
  const ThemeIcon = THEME_ICON[themeMode]
  return (
    <>
      <div id="menu-backdrop" className={open ? 'show' : ''} onClick={onClose} />
      <div id="mobile-menu" className={open ? 'open' : ''}>
        <div className="mm-head">
          <span className="mm-title">City Whispers</span>
          <button className="mm-close" onClick={onClose} aria-label="Close menu">×</button>
        </div>

        <div className="mm-row" onClick={onToggleMine}>
          <StampIcon size={20} />
          <span className="mm-label">My whispers only</span>
          <span className={'mt-switch' + (mineOnly ? ' on' : '')}><span className="mt-knob" /></span>
        </div>

        <div className="mm-row" onClick={onCycleTheme}>
          <ThemeIcon size={20} />
          <span className="mm-label">Theme</span>
          <span className="mm-value">{THEME_NAME[themeMode]}</span>
        </div>

        <div className="mm-row" onClick={onToggleSound}>
          {soundOn ? <SoundOnIcon size={20} /> : <SoundOffIcon size={20} />}
          <span className="mm-label">Sound</span>
          <span className="mm-value">{soundOn ? 'On' : 'Off'}</span>
        </div>

        <div className="mm-row" onClick={() => { onClose(); onReportBug?.() }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <span className="mm-label">Report a bug</span>
        </div>
      </div>
    </>
  )
}
