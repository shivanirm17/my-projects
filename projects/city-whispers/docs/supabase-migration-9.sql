-- Migration 9: extend edit_my_whisper to also update place and author
-- Run in Supabase SQL Editor

create or replace function public.edit_my_whisper(
  p_id       uuid,
  p_device   text,
  p_text     text,
  p_category text,
  p_place    text    default null,
  p_author   text    default null
)
returns boolean
language plpgsql security definer as $$
declare updated integer;
begin
  if char_length(p_text) = 0 then
    raise exception 'whisper cannot be empty';
  end if;
  if p_category not in ('food', 'weather', 'shop', 'people', 'place', 'other') then
    raise exception 'unknown category';
  end if;
  update public.whispers
     set text     = p_text,
         category = p_category,
         place    = p_place,
         author   = p_author
   where id = p_id and device_id = p_device;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

grant execute on function public.edit_my_whisper(uuid, text, text, text, text, text) to anon, authenticated;
