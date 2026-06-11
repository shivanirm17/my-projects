import { SunIcon, MoonIcon, AutoThemeIcon, SoundOnIcon, SoundOffIcon, StampIcon } from '../lib/icons'

const THEME_ICON = { auto: AutoThemeIcon, light: SunIcon, dark: MoonIcon }
const THEME_NAME = { auto: 'Auto (time of day)', light: 'Light', dark: 'Dark' }

export default function MobileMenu({
  open, onClose,
  mineOnly, onToggleMine,
  themeMode, onCycleTheme,
  soundOn, onToggleSound,
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
      </div>
    </>
  )
}
