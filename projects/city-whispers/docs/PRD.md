# Product Requirements Document — City Whispers

> A place for people who left home to leave behind a small sensory memory — and find they're not the only ones missing it.

**Version:** 1.3 · **Platform:** Mobile-first · **Build type:** Solo build · **Target:** June 2026

---

## Problem

Millions of people leave their home cities to pursue careers, education, or new lives. They carry small, sensory memories — a smell, a sound, a street at a specific hour — that no one around them in their new city understands. There's no place to put these memories, no way to find others who share them, and no acknowledgement that the city you left still holds something of you.

---

## Who It's For

- First-gen immigrants
- Students abroad
- Remote workers, relocated
- Anyone chasing a dream far from home

Their shared trait: they left willingly, they'd probably do it again, and they still ache for something small and specific about where they came from.

---

## North Star

Someone opens the app, finds their home city, reads a whisper from a stranger — and feels seen. That moment of "yes, exactly that" is what we're building toward.

---

## Core User Flows

### Discover a Whisper

1. Full-screen world map with soft glowing dots on cities that have whispers. Search bar floats at the bottom.
2. Type a city name in the search bar, then hit search or press enter. The map zooms smoothly to that city on submit.
3. A bottom sheet appears showing one whisper at a time — city name and the memory (150 char max). Simple, no extras.
4. "Next whisper" cycles through whispers for that city, newest first.

### Leave a Whisper

1. Simple form: city field (auto-filled if they came from a city) and memory text (150 char max).
2. Whisper is saved and immediately live on the map. Limit of 5 whispers per person per day.
3. If it's the first whisper for that city, a new dot glows on the map with a special "you're the first here" moment.

---

## Key Interactions

| Interaction | Behaviour |
|---|---|
| **Map zoom** | Map zooms to the city after the user submits their search, not while typing |
| **Bottom sheet** | Whisper card slides up from bottom; map stays visible behind it |
| **Dot tap** | Tapping a glowing dot on the map opens that city's whispers directly |
| **First whisper** | Special state when you're the first to leave a memory for a city |

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| **Frontend** | React + Vite | The part you see and interact with. React is the most common tool for building interfaces like this. Vite makes it start fast on your machine. |
| **Map** | Mapbox GL JS | Powers the interactive map — dots, zoom animation, panning. Free tier covers ~50K map loads/month, more than enough to start. |
| **Database** | Supabase | Stores all the whispers. Think of it as a spreadsheet in the cloud your app can read and write to. Free tier, no backend code needed. |
| **Hosting** | Vercel | Where your app lives on the internet. Free, connects to GitHub, and updates automatically every time you push a change. |
| **Code** | GitHub | Where your code is saved and versioned. Like a Google Drive for code — nothing gets lost, you can always go back. |

---

## MVP Scope

### What's In

- [x] Full-screen map with glowing dots
- [x] Search with map zoom on submit
- [x] Dot tap to open city
- [x] Whisper card bottom sheet
- [x] Submit a whisper
- [x] Newest-first ordering
- [x] 5 whispers per day limit
- [x] Trust and remove moderation
- [x] First whisper special state

### What's Out (for now)

- [ ] AI-generated responses
- [ ] User accounts or login
- [ ] Likes, saves, or social features
- [ ] "Now living in" field
- [ ] Push notifications
- [ ] Native app (iOS/Android)

---

## Decisions Log

| Decision | Status | Notes |
|---|---|---|
| Moderation approach | Open | TBD |
| "Now living in" field | Open | TBD |
| Whisper ordering | Open | TBD |
| Rate limiting | Revisit later | 5/day is provisional |
