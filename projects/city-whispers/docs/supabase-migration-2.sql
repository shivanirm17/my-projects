-- Migration 2: "my whispers" + editing, with device_id hidden from public reads
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

-- 1. device_id is no longer publicly readable; likes is the only column
--    the client may update directly
revoke select, update on public.whispers from anon, authenticated;
grant select (id, city, lng, lat, text, category, likes, created_at)
  on public.whispers to anon, authenticated;
grant update (likes) on public.whispers to anon, authenticated;

-- 2. which whispers belong to this device (server-side, id never exposed)
create or replace function public.my_whisper_ids(p_device text)
returns setof uuid
language sql security definer as $$
  select id from public.whispers where device_id = p_device;
$$;

-- 3. edit your own whisper: only text and category, only if the device matches
create or replace function public.edit_my_whisper(
  p_id uuid, p_device text, p_text text, p_category text
)
returns boolean
language plpgsql security definer as $$
declare updated integer;
begin
  if char_length(p_text) > 150 or char_length(p_text) = 0 then
    raise exception 'whisper must be 1-150 characters';
  end if;
  if p_category not in ('food', 'weather', 'shop', 'people', 'place', 'other') then
    raise exception 'unknown category';
  end if;
  update public.whispers
     set text = p_text, category = p_category
   where id = p_id and device_id = p_device;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

grant execute on function public.my_whisper_ids(text) to anon, authenticated;
grant execute on function public.edit_my_whisper(uuid, text, text, text) to anon, authenticated;
