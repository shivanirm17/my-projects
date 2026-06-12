-- Migration 7: bug reports table
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

create table public.bug_reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  device_id   text,
  description text not null check (char_length(description) between 10 and 1000),
  email       text check (char_length(email) <= 120),
  page        text check (char_length(page) <= 120),
  user_agent  text check (char_length(user_agent) <= 300)
);

-- Anyone can insert a bug report (anon key)
grant insert on public.bug_reports to anon, authenticated;

-- Only service role (admin panel) reads them — no public select grant
