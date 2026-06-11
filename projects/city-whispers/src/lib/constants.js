// Postage stamps: perforated edge in the category colour, with a little
// memory symbol printed on the cream panel
function stampSVG(symbol) {
  return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="2" y="3" width="20" height="18" rx="1.5" fill="currentColor" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.2 1.6"/>' +
    '<rect x="5" y="6" width="14" height="12" rx="0.8" fill="#FFF8F0"/>' +
    symbol +
    '</svg>'
}

export const CATEGORY_SVGS = {
  food:    stampSVG('<path fill="currentColor" d="M7.5 12.5 Q12 16.5 16.5 12.5 L16 11 L8 11 Z"/><g stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"><path d="M10 9.5 C9.4 8.5 10.6 8 10 7"/><path d="M12 9.5 C11.4 8.5 12.6 8 12 7"/><path d="M14 9.5 C13.4 8.5 14.6 8 14 7"/></g>'),
  weather: stampSVG('<path fill="currentColor" d="M8.5 12 a2.6 2.6 0 0 1 1.6-4.6 a3.1 3.1 0 0 1 6 0.8 a2 2 0 0 1 -0.5 3.8 Z"/><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M9.5 14 L9 16"/><path d="M12 14 L11.5 16"/><path d="M14.5 14 L14 16"/></g>'),
  shop:    stampSVG('<path fill="currentColor" d="M7 10 L8 7.5 L16 7.5 L17 10 Q16.2 11.2 15.3 10 Q14.5 11.2 13.6 10 Q12.8 11.2 12 10 Q11.2 11.2 10.4 10 Q9.5 11.2 8.7 10 Q7.8 11.2 7 10 Z"/><path fill="none" stroke="currentColor" stroke-width="1.1" d="M8.2 11.5 L8.2 16 L15.8 16 L15.8 11.5"/><rect x="11" y="13" width="2" height="3" fill="currentColor"/>'),
  people:  stampSVG('<circle cx="10.3" cy="9.8" r="1.9" fill="currentColor"/><path fill="currentColor" d="M7.4 16 C7.4 13.2 8.8 11.8 10.3 11.8 C11.8 11.8 13.2 13.2 13.2 16 Z"/><circle cx="14.6" cy="10.6" r="1.5" fill="currentColor" opacity="0.6"/><path fill="currentColor" opacity="0.6" d="M12.6 16 C12.6 13.8 13.6 12.4 14.6 12.4 C15.8 12.4 16.8 13.8 16.8 16 Z"/>'),
  place:   stampSVG('<path fill="none" stroke="currentColor" stroke-width="1.2" d="M12 7 C14.6 7 16 9.2 16 10.8 C16 13.4 12 16.6 12 16.6 C12 16.6 8 13.4 8 10.8 C8 9.2 9.4 7 12 7 Z"/><circle cx="12" cy="10.7" r="1.6" fill="currentColor"/>'),
  other:   stampSVG('<g fill="currentColor"><circle cx="8.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="15.5" cy="12" r="1.3"/></g>'),
}

export const CATEGORY_COLORS = {
  food:    '#e8845e',
  weather: '#8fb6c9',
  shop:    '#dfaf4e',
  people:  '#d98e8e',
  place:   '#92c4a2',
  other:   '#b9a3d8',
}

export const CATEGORIES = Object.keys(CATEGORY_SVGS)

export const SEED_COORDS = {
  'Mumbai':    [72.88, 19.07],  'Paris':     [2.35,  48.85],
  'London':    [-0.12, 51.51],  'New York':  [-74.01, 40.71],
  'Cairo':     [31.24, 30.04],  'Beijing':   [116.4, 39.9],
  'São Paulo': [-46.63, -23.55], 'Sydney':   [151.21, -33.87],
  'Moscow':    [37.62, 55.75],  'Lagos':     [3.38, 6.52],
}

export const SEED_WHISPERS = {
  'Mumbai': [
    { text: 'The smell of vada pav stalls outside Dadar station at 8am, the oil just starting to heat.', time: 'two days ago', flower: 'food', likes: 7 },
    { text: "Monsoon rain hammering the tin roof of the chawl, so loud you can't hear yourself think.", time: 'five days ago', flower: 'weather', likes: 12 },
    { text: 'The specific blue of the Arabian Sea at Marine Drive just before sunset.', time: 'a week ago', flower: 'place', likes: 9 },
  ],
  'Paris': [
    { text: 'Warm bread smell drifting out of a boulangerie at 7am before the city fully wakes.', time: 'yesterday', flower: 'food', likes: 5 },
    { text: "The echo of shoes on cobblestone in Le Marais when it's quiet enough to hear it.", time: 'three days ago', flower: 'place', likes: 8 },
  ],
  'London': [
    { text: 'The Tube smell, warm rubber and old metal, that hits you before the train even arrives.', time: 'four hours ago', flower: 'other', likes: 4 },
    { text: 'Grey Sunday mornings in a greasy spoon with steamed-up windows and milky tea.', time: 'six days ago', flower: 'shop', likes: 11 },
  ],
  'New York': [
    { text: 'Hot pretzel cart steam rising up through a cold November morning in Midtown.', time: 'three days ago', flower: 'food', likes: 6 },
  ],
  'Cairo': [
    { text: 'The call to prayer layered across rooftops at dusk, each mosque slightly out of sync.', time: 'two weeks ago', flower: 'other', likes: 14 },
  ],
  'Beijing': [
    { text: 'Jianbing from a street cart on a winter morning, egg cracking on the griddle.', time: 'a week ago', flower: 'food', likes: 3 },
  ],
  'São Paulo': [
    { text: 'Traffic noise and coffee smell mixing in the elevator of a Paulista office tower.', time: 'three days ago', flower: 'place', likes: 5 },
  ],
  'Sydney': [
    { text: 'The harbour at 6am before tourists arrive, just joggers and pelicans.', time: 'five days ago', flower: 'place', likes: 8 },
  ],
  'Moscow': [
    { text: 'Frozen breath and fur coat smell on the Metro platform at Mayakovskaya.', time: 'two weeks ago', flower: 'people', likes: 6 },
  ],
  'Lagos': [
    { text: 'Danfo horns and Afrobeats bleeding from a barbershop on a Saturday afternoon.', time: 'a week ago', flower: 'shop', likes: 10 },
  ],
}

export const MEMORY_PROMPTS = [
  'What did your street smell like at 6am?',
  'What sound do you only hear there?',
  'What did the rain do differently back home?',
  'Which corner shop do you still dream about?',
  'What did summer evenings taste like?',
  "What's the first thing you'd hear waking up there?",
  'Which walk could you still do with your eyes closed?',
  'What would you smell if you opened your old window?',
]

// When a whisper is unsigned, sign it warmly. Picked per whisper, stable.
export const ANON_SIGNATURES = [
  'Someone who misses it too',
  'A neighbour from far away',
  'Someone who left',
  'A homesick heart',
  'Someone who remembers',
  'A fellow wanderer',
  'Someone far from home',
]

export function signatureFor(w) {
  if (w.author) return w.author
  const key = String(w.id || w.text || '')
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return ANON_SIGNATURES[h % ANON_SIGNATURES.length]
}

export const MAP_THEMES = {
  morning: { water: '#cfdfdb', land: '#fdf3e3', cover: '#f3e9d2', park: '#dde8d4', label: '#7d937a', halo: '#FFF8F0', admin: '#c3cdb6', fog: ['#fdf3e3', '#f3e2c7', '#FFF8F0'], stars: 0 },
  day:     { water: '#d4e2de', land: '#fef7e9', cover: '#f6eddb', park: '#e1ebd9', label: '#7d937a', halo: '#fffdf7', admin: '#c3cdb6', fog: ['#fef7e9', '#f6e9cf', '#fffdf7'], stars: 0 },
  dusk:    { water: '#c2d1cc', land: '#f2e6d2', cover: '#e8dcc2', park: '#d3decb', label: '#7d937a', halo: '#f6ecdd', admin: '#b8c2ab', fog: ['#f2e6d2', '#e6d4b4', '#f6ecdd'], stars: 0 },
  night:   { water: '#1d211e', land: '#2a2d26', cover: '#31342c', park: '#2d332b', label: '#9db897', halo: '#23211d', admin: '#4d5747', fog: ['#2a2d26', '#39403a', '#23211d'], stars: 0.25 },
}

export function currentDaypart() {
  const forced = new URLSearchParams(window.location.search).get('theme')
  if (MAP_THEMES[forced]) return forced
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'dusk'
  return 'night'
}

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
