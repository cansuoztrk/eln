-- ELNARE — BEYOND DISTANCE
-- 07 · Which reading rooms have something in them.
--
-- The menus leave an empty reading room out for the partner. Asking that in
-- one call instead of several keeps every page as quick as it can be.
--
-- The function runs with the caller's own rights, so it can only ever count
-- what row level security already lets that person read. Sealed letters and
-- capsules are counted through the same title-only functions the pages use.
-- It records nothing about who asked or when.

create or replace function public.room_presence(p_space uuid, p_day date)
returns table (gallery boolean, letters boolean, reasons boolean, capsules boolean)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Give every day up to today its note first, so "reasons" is honest.
  perform public.ensure_daily_notes(p_space, p_day);

  return query
  select
    exists (
      select 1 from public.photos p
      where p.space_id = p_space and p.status = 'published' and p.show_in_gallery and p.deleted_at is null
    ),
    exists (
      select 1 from public.letters l
      where l.space_id = p_space and l.status = 'published' and l.deleted_at is null
    ) or exists (select 1 from public.sealed_letters(p_space)),
    exists (
      select 1 from public.daily_note_schedule s
      where s.space_id = p_space and s.day <= p_day
    ),
    exists (
      select 1 from public.time_capsules c
      where c.space_id = p_space and c.status = 'published' and c.deleted_at is null
    ) or exists (select 1 from public.sealed_capsules(p_space));
end;
$$;

revoke all on function public.room_presence(uuid, date) from public, anon;
grant execute on function public.room_presence(uuid, date) to authenticated, service_role;
