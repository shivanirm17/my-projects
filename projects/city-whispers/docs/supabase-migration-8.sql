-- Migration 8: admin RPC functions (replaces service-role approach)
-- These run as the DB owner (security definer), so they bypass RLS,
-- but they validate a token before doing anything.
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

-- Store the admin token so it can be checked without a hardcoded string in JS
create table if not exists public.admin_config (
  key   text primary key,
  value text not null
);
-- No grants: anon/authenticated cannot read this table directly

-- Set the token (REPLACE the placeholder with your VITE_ADMIN_PASSWORD before running;
-- never commit the real value)
insert into public.admin_config (key, value)
  values ('token', 'YOUR_ADMIN_PASSWORD_HERE')
  on conflict (key) do update set value = excluded.value;

-- ── Helper ────────────────────────────────────────────────────────────────────
create or replace function public.check_admin_token(p_token text)
returns void language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.admin_config where key = 'token' and value = p_token
  ) then
    raise exception 'Unauthorized' using errcode = 'PGRST301';
  end if;
end;
$$;

-- ── Whisper manager ───────────────────────────────────────────────────────────
create or replace function public.admin_get_whispers(p_token text)
returns table (
  id         uuid,
  city       text,
  text       text,
  created_at timestamptz,
  device_id  text
)
language plpgsql security definer as $$
begin
  perform public.check_admin_token(p_token);
  return query
    select w.id, w.city, w.text, w.created_at, w.device_id
    from public.whispers w
    order by w.created_at desc;
end;
$$;

create or replace function public.admin_delete_whisper(p_token text, p_id uuid)
returns void language plpgsql security definer as $$
begin
  perform public.check_admin_token(p_token);
  delete from public.whispers where id = p_id;
end;
$$;

-- ── Bug reports ───────────────────────────────────────────────────────────────
create or replace function public.admin_get_bug_reports(p_token text)
returns table (
  id          uuid,
  created_at  timestamptz,
  device_id   text,
  description text,
  email       text,
  page        text,
  user_agent  text
)
language plpgsql security definer as $$
begin
  perform public.check_admin_token(p_token);
  return query
    select r.id, r.created_at, r.device_id, r.description, r.email, r.page, r.user_agent
    from public.bug_reports r
    order by r.created_at desc;
end;
$$;

-- Grant execute to anon so the browser can call these via .rpc()
grant execute on function public.check_admin_token(text) to anon, authenticated;
grant execute on function public.admin_get_whispers(text) to anon, authenticated;
grant execute on function public.admin_delete_whisper(text, uuid) to anon, authenticated;
grant execute on function public.admin_get_bug_reports(text) to anon, authenticated;
