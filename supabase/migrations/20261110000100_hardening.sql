-- ELNARE — BEYOND DISTANCE
-- 06 · Hardening found in the quality review.
--
-- None of these gaps was reachable through the app (the browser holds no API
-- key and never learns the id of a hidden file), but the database should not
-- depend on that. Each rule below closes a path at the row level.

-- ---------------------------------------------------------------------------
-- 1. A registered upload may only point at its own slot in storage.
--    Without this, a member could register a row whose `original_path` named
--    some other file and have the server process it as theirs.
-- ---------------------------------------------------------------------------
alter table public.media_assets
  add constraint media_assets_path_shape check (
    original_path ~ '\.[a-z0-9]{2,5}$'
    and original_path = space_id::text
      || '/' || (case kind when 'image' then 'originals' else 'audio' end)
      || '/' || id::text
      || '/original.' || split_part(original_path, '.', -1)
  );

-- ---------------------------------------------------------------------------
-- 2. A photo or a voice memory can only wrap a file its author uploaded, and
--    cannot be re-pointed at another file afterwards. Without this, wrapping
--    someone else's private file in a published photo would have opened it.
-- ---------------------------------------------------------------------------
create or replace function app.owns_asset(p_asset uuid, p_kind text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.media_assets a
    where a.id = p_asset and a.kind = p_kind and a.uploaded_by = (select auth.uid())
  );
$$;

grant execute on function app.owns_asset(uuid, text) to authenticated, service_role;

drop policy "members insert own" on public.photos;
create policy "members insert own" on public.photos for insert to authenticated with check (
  app.is_member(space_id) and created_by = (select auth.uid()) and app.owns_asset(asset_id, 'image')
);

drop policy "members insert own" on public.voice_memories;
create policy "members insert own" on public.voice_memories for insert to authenticated with check (
  app.is_member(space_id) and created_by = (select auth.uid()) and app.owns_asset(asset_id, 'audio')
);

create or replace function app.protect_asset_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_id is distinct from old.asset_id then
    raise exception 'asset_id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_asset_link before update on public.photos
  for each row execute function app.protect_asset_link();
create trigger protect_asset_link before update on public.voice_memories
  for each row execute function app.protect_asset_link();

-- ---------------------------------------------------------------------------
-- 3. Reordering attachments in place. Lets the app write a new set of links
--    before removing the old ones, so a failed save never leaves a journal
--    entry or a capsule without its files.
-- ---------------------------------------------------------------------------
create policy "reorder own entry" on public.journal_entry_photos for update to authenticated
  using (exists (select 1 from public.journal_entries e where e.id = entry_id and e.created_by = (select auth.uid())))
  with check (app.is_member(space_id));
grant update on public.journal_entry_photos to authenticated;

create policy "reorder own capsule" on public.time_capsule_items for update to authenticated
  using (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.created_by = (select auth.uid())))
  with check (app.is_member(space_id));
grant update on public.time_capsule_items to authenticated;
