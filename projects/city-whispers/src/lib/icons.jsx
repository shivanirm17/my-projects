// Hand-drawn-feeling line icons matching the stamp style: rounded strokes,
// currentColor, sized by the parent's font/em box.
function Icon({ children, size = 18, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const HeartIcon = ({ filled, ...p }) => (
  <Icon {...p}>
    <path
      d="M12 19 C7 15.4 4.5 12.8 4.5 9.9 C4.5 7.7 6.2 6 8.3 6 C9.8 6 11.2 6.9 12 8.2 C12.8 6.9 14.2 6 15.7 6 C17.8 6 19.5 7.7 19.5 9.9 C19.5 12.8 17 15.4 12 19 Z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Icon>
)

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 L21 21" /></Icon>
)

// a little stamp with a heart, the app's mark
export const StampIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" strokeDasharray="2.6 2" />
    <path d="M12 15 C9.8 13.3 8.7 12 8.7 10.8 C8.7 9.9 9.4 9.2 10.3 9.2 C11 9.2 11.6 9.6 12 10.2 C12.4 9.6 13 9.2 13.7 9.2 C14.6 9.2 15.3 9.9 15.3 10.8 C15.3 12 14.2 13.3 12 15 Z" fill="currentColor" stroke="none" />
  </Icon>
)

export const SproutIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20 C12 15 12 13 12 10" />
    <path d="M12 13 C8.5 12.6 7 10 6.5 7.5 C9.5 7.5 11.4 9.5 12 13 Z" fill="currentColor" stroke="none" />
    <path d="M12 10.5 C15 10.2 16.7 8 17.5 5.5 C14.5 5.5 12.6 7.4 12 10.5 Z" fill="currentColor" stroke="none" opacity="0.7" />
  </Icon>
)

export const TulipIcon = (p) => (
  <Icon {...p}>
    <path d="M7 5 C7 9.5 8.8 12.5 12 12.5 C15.2 12.5 17 9.5 17 5 C15.6 6.8 14.5 7.1 14 5.7 C13.4 4.1 12.7 3.5 12 3.5 C11.3 3.5 10.6 4.1 10 5.7 C9.5 7.1 8.4 6.8 7 5 Z" fill="currentColor" stroke="none" />
    <path d="M12 12.5 L12 20.5" />
    <path d="M12 17 C10 16.8 8.8 15.6 8.3 14" />
  </Icon>
)

export const SunIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3.5 V5.5 M12 18.5 V20.5 M3.5 12 H5.5 M18.5 12 H20.5 M6 6 L7.4 7.4 M16.6 16.6 L18 18 M18 6 L16.6 7.4 M7.4 16.6 L6 18" />
  </Icon>
)

export const MoonIcon = (p) => (
  <Icon {...p}>
    <path d="M19 14.5 A8 8 0 1 1 9.5 5 A6.5 6.5 0 0 0 19 14.5 Z" />
  </Icon>
)

// auto mode: half sun, half moon
export const AutoThemeIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6.5" />
    <path d="M12 5.5 A6.5 6.5 0 0 1 12 18.5 Z" fill="currentColor" stroke="none" />
  </Icon>
)

export const SoundOnIcon = (p) => (
  <Icon {...p}>
    <path d="M5 9.5 H8 L12.5 5.5 V18.5 L8 14.5 H5 Z" fill="currentColor" stroke="none" />
    <path d="M15.5 9 A4.5 4.5 0 0 1 15.5 15" />
    <path d="M17.8 6.8 A8 8 0 0 1 17.8 17.2" />
  </Icon>
)

export const SoundOffIcon = (p) => (
  <Icon {...p}>
    <path d="M5 9.5 H8 L12.5 5.5 V18.5 L8 14.5 H5 Z" fill="currentColor" stroke="none" />
    <path d="M15.5 9.5 L20 14 M20 9.5 L15.5 14" />
  </Icon>
)

// feedback faces
export const FaceLovelyIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8 13.5 C9 16 15 16 16 13.5" />
    <path d="M8.6 9.6 C8.2 9 8.4 8.3 9 8.1 C9.4 8 9.8 8.2 10 8.5 C10.2 8.2 10.6 8 11 8.1 C11.6 8.3 11.8 9 11.4 9.6 L10 11 Z" fill="currentColor" stroke="none" />
    <path d="M12.6 9.6 C12.2 9 12.4 8.3 13 8.1 C13.4 8 13.8 8.2 14 8.5 C14.2 8.2 14.6 8 15 8.1 C15.6 8.3 15.8 9 15.4 9.6 L14 11 Z" fill="currentColor" stroke="none" />
  </Icon>
)

export const FaceNiceIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 14 C10 15.8 14 15.8 15 14" />
    <circle cx="9.2" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.8" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
)

export const FaceMehIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 14.8 H15" />
    <circle cx="9.2" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.8" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
)

export const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 V14.5" />
    <path d="M7.5 10.5 L12 15 L16.5 10.5" />
    <path d="M4.5 18 H19.5" />
  </Icon>
)

// Instagram-style bookmark — for "save"
export const BookmarkIcon = (p) => (
  <Icon {...p}>
    <path d="M6 3.5 H18 A1 1 0 0 1 19 4.5 V20.5 L12 15.5 L5 20.5 V4.5 A1 1 0 0 1 6 3.5 Z" />
  </Icon>
)

// Paper plane — a friendlier "send" mark for sharing
export const PaperPlaneIcon = (p) => (
  <Icon {...p}>
    <path d="M20.5 3.5 L2.5 11 L10 13.2 L12.5 20.5 Z" />
    <path d="M10 13.2 L20.5 3.5" />
  </Icon>
)

// iOS-style share: box with arrow rising from it
export const ShareIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 V13.5" />
    <path d="M8 7.5 L12 3.5 L16 7.5" />
    <path d="M8 11 H5.5 A1.5 1.5 0 0 0 4 12.5 V19.5 A1.5 1.5 0 0 0 5.5 21 H18.5 A1.5 1.5 0 0 0 20 19.5 V12.5 A1.5 1.5 0 0 0 18.5 11 H16" />
  </Icon>
)

// the journal's own mark: a closed notebook with a spine — matches #journal-btn
export const JournalIcon = (p) => (
  <Icon {...p}>
    <path d="M4 4.5A1.5 1.5 0 015.5 3H19a1 1 0 011 1v15a1 1 0 01-1 1H5.5A1.5 1.5 0 014 18.5z" />
    <path d="M8 3v17" />
  </Icon>
)

// a four-point twinkle, for decoration/stickers
export const SparkleIcon = (p) => (
  <Icon {...p}>
    <path
      d="M12 3 C12.5 7.2 12.8 10.5 17 11 C12.8 11.5 12.5 14.8 12 19 C11.5 14.8 11.2 11.5 7 11 C11.2 10.5 11.5 7.2 12 3 Z"
      fill="currentColor" stroke="none"
    />
  </Icon>
)

// a polaroid: tall frame, photo near the top, blank caption strip below
export const PolaroidIcon = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="3" width="15" height="18" rx="1.3" />
    <rect x="6.8" y="5.3" width="10.4" height="9.4" rx="0.6" fill="currentColor" opacity="0.18" stroke="none" />
  </Icon>
)

// a curved back-arrow, for undo
export const UndoIcon = (p) => (
  <Icon {...p}>
    <path d="M7.5 8.5 L4.3 11 L7.5 13.5" />
    <path d="M4.3 11 H14.5 C17 11 19 13 19 15.5 C19 17.6 17.6 19.2 15.7 19.7" />
  </Icon>
)

// a pencil, for editing
export const EditIcon = (p) => (
  <Icon {...p}>
    <path d="M14 4.5 L19.5 10 L8.5 21 H3 V15.5 Z" />
    <path d="M11.5 7 L17 12.5" />
  </Icon>
)

// a wastebasket with a lid, for deleting
export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4.5 7 H19.5" />
    <path d="M9 7 V4.8 A1 1 0 0 1 10 3.8 H14 A1 1 0 0 1 15 4.8 V7" />
    <path d="M6.5 7 L7.4 20 A1 1 0 0 0 8.4 21 H15.6 A1 1 0 0 0 16.6 20 L17.5 7" />
  </Icon>
)

// a simple circular arrow, for rotating a photo
export const RotateIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4.5 A7.5 7.5 0 1 1 5 9" />
    <path d="M4 6 L5 9 L8 8" />
  </Icon>
)

// a plain diagonal double-headed arrow, for resizing a photo
export const ResizeIcon = (p) => (
  <Icon {...p}>
    <path d="M7.5 16.5 L16.5 7.5" />
    <path d="M13.5 7.5 L16.5 7.5 L16.5 10.5" />
    <path d="M7.5 13.5 L7.5 16.5 L10.5 16.5" />
  </Icon>
)
