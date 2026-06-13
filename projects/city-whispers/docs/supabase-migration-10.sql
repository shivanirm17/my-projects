-- Migration 10: richer admin_get_whispers for the stats dashboard.
-- Adds category, likes, author, lng, lat so the admin Overview can chart
-- category breakdown, most-liked whispers, and map locations.
--
-- The return signature changes, so the function must be dropped first
-- (Postgres can't CREATE OR REPLACE a function whose OUT columns differ).

drop function if exists public.admin_get_whispers(text);

create or replace function public.admin_get_whispers(p_token text)
returns table (
  id         uuid,
  city       text,
  text       text,
  created_at timestamptz,
  device_id  text,
  category   text,
  likes      int,
  author     text,
  lng        double precision,
  lat        double precision,
  place      text
)
language plpgsql security definer as $$
begin
  perform public.check_admin_token(p_token);
  return query
    select w.id, w.city, w.text, w.created_at, w.device_id,
           w.category, w.likes, w.author, w.lng, w.lat, w.place
    from public.whispers w
    order by w.created_at desc;
end;
$$;

grant execute on function public.admin_get_whispers(text) to anon, authenticated;
