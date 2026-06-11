-- Migration 5: remove the 150-character limit on whispers
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

alter table public.whispers drop constraint whispers_text_check;

-- edit function loses its length cap too (still rejects empty text)
create or replace function public.edit_my_whisper(
  p_id uuid, p_device text, p_text text, p_category text
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
     set text = p_text, category = p_category
   where id = p_id and device_id = p_device;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;
