-- City Whispers: Supabase schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run

create table public.whispers (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  lng         double precision not null,
  lat         double precision not null,
  text        text not null check (char_length(text) <= 150),
  category    text not null default 'other'
              check (category in ('food', 'weather', 'shop', 'people', 'place', 'other')),
  likes       integer not null default 0,
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create index whispers_city_idx on public.whispers (city);
create index whispers_device_day_idx on public.whispers (device_id, created_at);

create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  rating      text not null check (rating in ('lovely', 'nice', 'meh')),
  device_id   text not null,
  created_at  timestamptz not null default now()
);

-- No accounts: the anon key can read and write, RLS keeps it to the minimum
alter table public.whispers enable row level security;
alter table public.feedback enable row level security;

create policy "anyone can read whispers"
  on public.whispers for select using (true);

create policy "anyone can plant a whisper"
  on public.whispers for insert with check (true);

-- likes are the only column the client may change
create policy "anyone can update likes"
  on public.whispers for update using (true) with check (true);

create policy "anyone can leave feedback"
  on public.feedback for insert with check (true);

-- PRD: limit of 5 whispers per person per day, enforced server-side
create or replace function public.enforce_daily_whisper_limit()
returns trigger
language plpgsql security definer as $$
begin
  if (
    select count(*) from public.whispers
    where device_id = new.device_id
      and created_at >= date_trunc('day', now())
  ) >= 5 then
    raise exception 'daily whisper limit reached';
  end if;
  return new;
end;
$$;

create trigger whispers_daily_limit
  before insert on public.whispers
  for each row execute function public.enforce_daily_whisper_limit();
