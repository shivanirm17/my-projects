# City Whispers — Links & Keys

Everything you need to find the project, in one place.

## Live App

| What | URL |
|---|---|
| Production app | https://city-whispers.app |
| Founder stats dashboard | https://city-whispers.app/?stats=1 |
| Theme preview | add `?theme=morning` / `day` / `dusk` / `night` |
| No-map test mode (zero Mapbox loads) | add `?nomap=1` |

## Local Development

| What | URL / command |
|---|---|
| Dev server | `npm run dev` → http://localhost:5180 |
| Dev without map loads | http://localhost:5180/?nomap=1 |
| Prototype (standalone HTML) | `docs/prototype.html?token=pk.your_token` |

## Dashboards

| Service | URL | Used for |
|---|---|---|
| GitHub repo | https://github.com/shivanirm17/my-projects/tree/main/projects/city-whispers | code, auto-deploys on push |
| Vercel project | https://vercel.com/shivanirm17s-projects/city-whispers | deploys, env vars, domains |
| Supabase project | https://supabase.com/dashboard/project/fzvffpqjolqdbmmmvsxc | Table Editor (see whisper rows), SQL Editor (migrations) |
| Mapbox tokens | https://console.mapbox.com/account/access-tokens/ | token URL restrictions |
| Mapbox usage | https://console.mapbox.com/account/statistics/ | map load count (free tier: 50k/month) |

## Keys

The app needs three env vars (see `.env.example`):

| Key | Where to get it |
|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox → Access tokens → the URL-restricted `city-whispers` token |
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → publishable key |

They live in three places, kept in sync by hand:

1. `projects/city-whispers/.env` on your machine (gitignored)
2. Vercel → Settings → Environment Variables (for deploys)
3. Nowhere else — GitHub push protection rejects them in commits

To set up a fresh machine: copy `.env.example` to `.env`, fill in the
values from the dashboards above, then `npm install && npm run dev`.

## Never Commit These

- The Supabase **database password** (Settings → Database) — admin access
- Any Supabase **service_role / secret key** — bypasses row-level security
- Unrestricted Mapbox tokens

## Database Migrations (run in Supabase SQL Editor, in order)

1. `docs/supabase-schema.sql` — tables, RLS, 5/day limit ✅ applied
2. `docs/supabase-migration-2.sql` — mine/edit functions, device_id privacy ✅ applied
3. `docs/supabase-migration-3.sql` — owner-checked delete ✅ applied
