-- Migration 6: optional specific place within the city
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

alter table public.whispers
  add column place text check (char_length(place) <= 80);

-- re-grant column-level select including the new column
revoke select on public.whispers from anon, authenticated;
grant select (id, city, lng, lat, text, category, likes, created_at, author, place)
  on public.whispers to anon, authenticated;
