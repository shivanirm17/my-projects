# City Whispers — Design System

The single source of truth for how the app looks and behaves. When adding
anything new, find the pattern here first. If a new pattern is genuinely
needed, add it here in the same change.

**The metaphor that decides everything:** the app is paper mail. Cards are
postcards, categories are stamps, attributions are signatures, actions are
seals and stamps. If a new element wouldn't exist in a shoebox of letters,
question it.

---

## 1. Color

Defined as CSS variables in `src/index.css` (`:root`, with per-theme
overrides). Never hard-code a hex in a component; use the token.

| Token | Light value | Role |
|---|---|---|
| `--paper` | `#FFF8F0` | App background, sheets |
| `--paper2` | `#f3ecd9` | Aged paper: selected patches, card edges |
| `--card` | `#ffffff` | Postcards, inputs, popovers |
| `--ink` | `#45413a` | All reading text. Warm charcoal, never pure black |
| `--muted` | `#6a7282` | Secondary text, timestamps, counters |
| `--brown` | `#62775e` | **Sage. Primary actions only** |
| `--accent2` | `#bd8163` | **Clay. States and secondary utilities** |
| `--pink` | `#f4a6c0` | The heart/like family only |
| `--danger` | `#a85858` | Destructive actions, limit warnings |
| `--border` | sage @ 18% | Hairlines, dividers, resting borders |

**The two-tone rule:** sage means "you can do this" (search, send, save).
Clay means "this is how things are" (toggle on, utility icons, selected
state). Never use sage for state or clay for a primary action.

**Stamp category pastels** (fixed, used only by stamps and their previews):
food `#e8845e` · weather `#8fb6c9` · shop `#dfaf4e` · people `#d98e8e` ·
place `#92c4a2` · other `#b9a3d8`.

**Themes:** four modes (morning/day/dusk/night) shift *brightness only* —
same hue families, same contrast relationships. Night lifts sage to
`#9db897` and clay to `#d2a183`. Map colors live in `MAP_THEMES`
(`src/lib/constants.js`) and follow the same rule.

**Contrast floors (verified):** ink ≥ 9.6:1, muted ≥ 4.6:1, sage ≥ 4.6:1,
clay decorative-only at small sizes. Any new text color must clear 4.5:1
on `--paper` and `--card`.

## 2. Typography

Two families, no more:

| Family | Use | Never |
|---|---|---|
| **Dancing Script** | Title, city names, signatures, drawer title | Body text, buttons, labels |
| **DM Sans** | Everything else | — |

Scale (sizes in px):

| Style | Spec | Where |
|---|---|---|
| Display | Dancing Script 700, 24–34 | "City Whispers", city names |
| Signature | Dancing Script 600, 17–22 | Sign-it field, card attribution |
| Body | DM Sans 400–500, 14–15, lh 1.5+ | Whisper text, intro story |
| Question label | DM Sans 600, 12, caps, +0.08em, sage | Form questions ("WHICH CITY…") |
| Button | DM Sans 700, 13–15 | All buttons |
| Meta | DM Sans 400–600, 10–12, muted | Timestamps, counters, hints |

Sentence case everywhere ("Leave a whisper", never "leave a whisper" or
"LEAVE A WHISPER" — caps are reserved for the small question labels).
No italics for readable text. No em dashes in UI copy.

## 3. Surfaces

| Surface | Spec |
|---|---|
| **Postcard** | `--card`, 1.5px `--paper2` border, radius 6–8, soft sage shadow, optional 1° tilt. Stamp top-right, postmark over its corner |
| **Sheet** | `--paper`, radius 26 top, max-width 480 centered, drag handle |
| **Popover/toast/menu** | `--card`, 1.5px `--border`, radius 12–16 |
| Radii | 6–9 paper things · 12–16 UI cards · 999 pills/switches |
| Shadows | resting `0 4px 16px` sage @ 10% · floating `0 6–8px 20–28px` |

## 4. Buttons

| Kind | Look | Examples |
|---|---|---|
| **Primary (stamp-edge)** | Sage fill, white text, radius 9, 2px dashed white inner edge. Press: tilt -1° + scale .97 ("stuck down") | Send, Leave a whisper, Save, Next |
| **Primary seal** | Sage blob (irregular radius, slight rotation), white mark | Search |
| **Secondary seal** | `--card` blob, clay mark + soft clay border | ?, sound, theme, menu |
| **Text link** | DM Sans 600 12.5–13.5, muted/danger, dotted underline | Never mind, Cancel, Skip, Delete |
| **Stateful pill** | Card pill; state shown by a clay switch or pink fill, not by border shouting | My whispers, like button |

States, all buttons: hover lifts ~1.5px with deeper shadow (pointer
devices only) · press sinks/squashes · `:focus-visible` shows a 2.5px sage
ring · everything stills under `prefers-reduced-motion`.

Minimum hit area 40px; 44px for anything in the thumb zone.

## 5. Forms

- One postcard container; **no boxed fields inside it**
- Labels are the caps question style, phrased as questions
- Text inputs: bare with dashed underline; solid sage underline on focus
- Long text: ruled-paper lines (repeating gradient), three lines tall
- Signature input: Dancing Script, looks like signing
- Pickers: bare stamps in a row; selected = `--paper2` patch + -4° tilt +
  name revealed beneath
- Validation: in-app toast, never `alert()`

## 6. Motion

| Motion | Spec |
|---|---|
| Sheets | 0.45s `cubic-bezier(0.32,0.72,0,1)` slide-up |
| Stamps on map | gentle tilt sway, 2.6–4s, staggered delays |
| Petals | 7 max, 20–38s drift, behind all UI |
| Heart | pop keyframe (1 → 1.5 → 0.9 → 1) on like |
| Popovers/toasts | 0.18–0.3s fade + small translate |

Rules: decorative motion must be interruptible and invisible to
`prefers-reduced-motion` users. Nothing moves under text while typing.

## 7. Voice

- Warm, first-person, plain words. The app speaks like a person, not a product
- Questions over labels ("Which city do you miss?" not "City")
- Anonymous users get homely signatures ("Someone who misses it too"),
  rotated deterministically per whisper — never "User" or "Anonymous"
- Errors are gentle and specific: "Your whisper needs both a city and a memory"
- Sentence case, no exclamation marks, no emoji (use the line icon set)

## 8. Icons

`src/lib/icons.jsx` only — rounded line icons, 2.1 stroke, `currentColor`,
on a 24px grid. Sizes: 15–17 inline · 20–22 buttons · 32+ feature art.
New icons must look hand-drawn-adjacent: rounded caps, slight asymmetry
welcome, no sharp corners.

## 9. Map

Watercolor treatment per theme (`MAP_THEMES`): only country + major city
labels, no roads, fog matching the paper. Zoom locked to 1.2–7 (no street
level). Markers are stamp gardens: golden-angle spiral, one stamp per
whisper, 28px.

## 10. Checklist for any new UI

1. Uses tokens only (no raw hex, no new fonts)
2. Sage for the action, clay for state, one primary per screen
3. Sentence case, question-style labels, voice rules
4. Hover + press + focus-visible + reduced-motion handled
5. 40px+ hit areas, AA contrast on paper *and* card
6. Works in all four themes (`?theme=night` etc.)
7. Fits the mail metaphor — and if it adds a pattern, it's added here
