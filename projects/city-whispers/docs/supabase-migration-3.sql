-- Migration 3: delete your own whisper
-- Run in Supabase dashboard: SQL Editor → New query → paste → Run

create or replace function public.delete_my_whisper(p_id uuid, p_device text)
returns boolean
language plpgsql security definer as $$
declare deleted integer;
begin
  delete from public.whispers
   where id = p_id and device_id = p_device;
  get diagnostics deleted = row_count;
  return deleted > 0;
end;
$$;

grant execute on function public.delete_my_whisper(uuid, text) to anon, authenticated;
