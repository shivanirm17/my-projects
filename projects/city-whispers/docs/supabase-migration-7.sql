-- Migration 7: bug reports table
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

create table if not exists public.bug_reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  device_id   text,
  description text not null check (char_length(description) between 10 and 1000),
  email       text check (char_length(email) <= 120),
  page        text check (char_length(page) <= 120),
  user_agent  text check (char_length(user_agent) <= 300)
);

-- Anyone can insert a bug report (anon key); nobody can read them publicly —
-- the admin panel reads via a security-definer RPC (migration 8)
alter table public.bug_reports enable row level security;
grant insert on public.bug_reports to anon, authenticated;

drop policy if exists "anyone can report a bug" on public.bug_reports;
create policy "anyone can report a bug" on public.bug_reports
  for insert to anon, authenticated with check (true);
