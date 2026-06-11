-- Migration 4: optional author name on whispers
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

alter table public.whispers
  add column author text check (char_length(author) <= 40);

-- re-grant column-level select including the new column
revoke select on public.whispers from anon, authenticated;
grant select (id, city, lng, lat, text, category, likes, created_at, author)
  on public.whispers to anon, authenticated;
