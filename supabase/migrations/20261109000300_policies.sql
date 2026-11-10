-- ELNARE — BEYOND DISTANCE
-- 03 · Row level security for content.
--
-- The rules, in plain words:
--   * You must be a member of the space to see anything.
--   * A draft belongs to its author. Nobody else — not even the owner — sees it.
--   * Published content is visible to both members.
--   * Sealed content (letters / capsules / editions with a future date) is not
--     readable by the other member until that moment.
--   * Only the author changes their own writing. For curated collections
--     (photos, memories, albums) the owner may also tidy up *published* rows.

-- ---------------------------------------------------------------------------
-- Policy generators. Used only at migration time so every table gets exactly
-- the same shape of rules.
-- ---------------------------------------------------------------------------
create or replace function app.apply_member_content_policies(
  p_table regclass,
  p_moderated boolean default false,
  p_extra_visible text default 'true'
)
returns void
language plpgsql
set search_path = ''
as $fn$
declare
  t text := p_table::text;
  see_deleted text := case when p_moderated then 'app.is_owner(space_id)' else 'false' end;
  moderate text := case when p_moderated then '(app.is_owner(space_id) and status = ''published'')' else 'false' end;
begin
  execute format('alter table %s enable row level security', t);

  execute format($p$
    create policy "members read visible" on %s for select to authenticated using (
      app.is_member(space_id) and (
        created_by = (select auth.uid())
        or (status = 'published' and (%s) and (deleted_at is null or %s))
      )
    )$p$, t, p_extra_visible, see_deleted);

  execute format($p$
    create policy "members insert own" on %s for insert to authenticated with check (
      app.is_member(space_id) and created_by = (select auth.uid())
    )$p$, t);

  execute format($p$
    create policy "authors update" on %s for update to authenticated using (
      app.is_member(space_id) and (created_by = (select auth.uid()) or %s)
    ) with check (
      app.is_member(space_id) and (created_by = (select auth.uid()) or %s)
    )$p$, t, moderate, moderate);

  execute format($p$
    create policy "authors delete" on %s for delete to authenticated using (
      app.is_member(space_id) and (created_by = (select auth.uid()) or %s)
    )$p$, t, moderate);

  execute format('grant select, insert, update, delete on %s to authenticated', t);
  execute format('grant all on %s to service_role', t);
  execute format(
    'create trigger protect_identity before update on %s for each row execute function app.protect_identity()', t);
  execute format(
    'create trigger touch_updated_at before update on %s for each row execute function app.touch_updated_at()', t);
end;
$fn$;

-- Tables only the owner writes. The partner reads published rows.
create or replace function app.apply_owner_managed_policies(
  p_table regclass,
  p_has_status boolean default true,
  p_extra_visible text default 'true'
)
returns void
language plpgsql
set search_path = ''
as $fn$
declare
  t text := p_table::text;
  visible text := case
    when p_has_status then format('(status = ''published'' and deleted_at is null and (%s))', p_extra_visible)
    else 'true'
  end;
begin
  execute format('alter table %s enable row level security', t);

  execute format($p$
    create policy "members read published" on %s for select to authenticated using (
      app.is_member(space_id) and (app.is_owner(space_id) or %s)
    )$p$, t, visible);

  execute format($p$
    create policy "owner inserts" on %s for insert to authenticated with check (app.is_owner(space_id))$p$, t);
  execute format($p$
    create policy "owner updates" on %s for update to authenticated
      using (app.is_owner(space_id)) with check (app.is_owner(space_id))$p$, t);
  execute format($p$
    create policy "owner deletes" on %s for delete to authenticated using (app.is_owner(space_id))$p$, t);

  execute format('grant select, insert, update, delete on %s to authenticated', t);
  execute format('grant all on %s to service_role', t);
  execute format(
    'create trigger protect_identity before update on %s for each row execute function app.protect_identity()', t);
  execute format(
    'create trigger touch_updated_at before update on %s for each row execute function app.touch_updated_at()', t);
end;
$fn$;

-- Has the current user already published an answer to this question?
-- SECURITY DEFINER so the answers policy does not recurse into itself.
create or replace function app.has_answered(p_question uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.answers a
    where a.question_id = p_question
      and a.created_by = (select auth.uid())
      and a.status = 'published'
      and a.deleted_at is null
  );
$$;

create or replace function app.question_is_together(p_question uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select q.together from public.questions q where q.id = p_question), false);
$$;

grant execute on function app.has_answered(uuid) to authenticated, service_role;
grant execute on function app.question_is_together(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Member content
-- ---------------------------------------------------------------------------
select app.apply_member_content_policies('public.photos', true);
select app.apply_member_content_policies('public.memories', true);
select app.apply_member_content_policies('public.voice_memories');
select app.apply_member_content_policies('public.letters', false, 'unlock_at is null or unlock_at <= now()');
select app.apply_member_content_policies('public.time_capsules', false, 'unlock_at <= now()');
select app.apply_member_content_policies('public.journal_entries', false, 'visibility = ''shared''');
select app.apply_member_content_policies('public.questions');
select app.apply_member_content_policies(
  'public.answers', false,
  'not app.question_is_together(question_id) or app.has_answered(question_id)');
select app.apply_member_content_policies('public.distance_notes');

-- ---------------------------------------------------------------------------
-- Owner-managed content
-- ---------------------------------------------------------------------------
select app.apply_owner_managed_policies('public.albums');
select app.apply_owner_managed_policies('public.special_days');
select app.apply_owner_managed_policies(
  'public.special_day_editions', true, 'reveal_at is null or reveal_at <= now()');
select app.apply_owner_managed_policies('public.relationship_dates', false);
select app.apply_owner_managed_policies('public.content_sections', false);

-- 365 notes: the partner only ever sees notes whose day has already come.
alter table public.daily_note_schedule enable row level security;

create or replace function app.note_is_revealed(p_note uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.daily_note_schedule s
    where s.note_id = p_note
      -- "today" at the latest timezone on Earth; the server never schedules past the viewer's own today.
      and s.day <= (now() at time zone 'Pacific/Kiritimati')::date
  );
$$;

grant execute on function app.note_is_revealed(uuid) to authenticated, service_role;

select app.apply_owner_managed_policies('public.daily_notes', true, 'app.note_is_revealed(id)');

create policy "members read schedule" on public.daily_note_schedule
  for select to authenticated using (
    app.is_member(space_id) and day <= (now() at time zone 'Pacific/Kiritimati')::date
  );
grant select on public.daily_note_schedule to authenticated;
grant all on public.daily_note_schedule to service_role;

-- ---------------------------------------------------------------------------
-- Our Future is a shared list: either of them may edit any plan.
-- ---------------------------------------------------------------------------
alter table public.future_plans enable row level security;

create policy "members read plans" on public.future_plans for select to authenticated using (
  app.is_member(space_id)
  and (deleted_at is null or created_by = (select auth.uid()) or app.is_owner(space_id))
);
create policy "members add plans" on public.future_plans for insert to authenticated with check (
  app.is_member(space_id) and created_by = (select auth.uid())
);
create policy "members edit plans" on public.future_plans for update to authenticated
  using (
    app.is_member(space_id)
    and (deleted_at is null or created_by = (select auth.uid()) or app.is_owner(space_id))
  )
  with check (app.is_member(space_id));
create policy "author or owner removes plans" on public.future_plans for delete to authenticated using (
  app.is_member(space_id) and (created_by = (select auth.uid()) or app.is_owner(space_id))
);

grant select, insert, update, delete on public.future_plans to authenticated;
grant all on public.future_plans to service_role;
create trigger protect_identity before update on public.future_plans
  for each row execute function app.protect_identity();
create trigger touch_updated_at before update on public.future_plans
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Media. Rows are written through the server; members can only read what the
-- visibility triggers have opened for them.
-- ---------------------------------------------------------------------------
alter table public.media_assets enable row level security;

create policy "members read visible assets" on public.media_assets for select to authenticated using (
  app.is_member(space_id) and (
    uploaded_by = (select auth.uid())
    or (
      visibility = 'space'
      and deleted_at is null
      and state = 'ready'
      and (sealed_until is null or sealed_until <= now())
    )
  )
);
create policy "members register uploads" on public.media_assets for insert to authenticated with check (
  app.is_member(space_id)
  and uploaded_by = (select auth.uid())
  and state = 'pending'
  and visibility = 'private'
);

grant select, insert on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create trigger protect_identity before update on public.media_assets
  for each row execute function app.protect_identity();

-- ---------------------------------------------------------------------------
-- Join tables follow their parent: you may link what you may edit.
-- ---------------------------------------------------------------------------
alter table public.memory_photos enable row level security;

create policy "read with memory" on public.memory_photos for select to authenticated using (
  app.is_member(space_id)
  and exists (select 1 from public.memories m where m.id = memory_id)
);
create policy "link own memory" on public.memory_photos for insert to authenticated with check (
  app.is_member(space_id)
  and exists (
    select 1 from public.memories m
    where m.id = memory_id and m.space_id = memory_photos.space_id
      and (m.created_by = (select auth.uid()) or (app.is_owner(m.space_id) and m.status = 'published'))
  )
  and exists (select 1 from public.photos p where p.id = photo_id and p.space_id = memory_photos.space_id)
);
create policy "reorder own memory" on public.memory_photos for update to authenticated
  using (
    exists (
      select 1 from public.memories m
      where m.id = memory_id
        and (m.created_by = (select auth.uid()) or (app.is_owner(m.space_id) and m.status = 'published'))
    )
  )
  with check (app.is_member(space_id));
create policy "unlink own memory" on public.memory_photos for delete to authenticated using (
  exists (
    select 1 from public.memories m
    where m.id = memory_id
      and (m.created_by = (select auth.uid()) or (app.is_owner(m.space_id) and m.status = 'published'))
  )
);
grant select, insert, update, delete on public.memory_photos to authenticated;
grant all on public.memory_photos to service_role;

alter table public.journal_entry_photos enable row level security;

create policy "read with entry" on public.journal_entry_photos for select to authenticated using (
  app.is_member(space_id)
  and exists (select 1 from public.journal_entries e where e.id = entry_id)
);
create policy "link own entry" on public.journal_entry_photos for insert to authenticated with check (
  app.is_member(space_id)
  and exists (
    select 1 from public.journal_entries e
    where e.id = entry_id and e.space_id = journal_entry_photos.space_id and e.created_by = (select auth.uid())
  )
  and exists (select 1 from public.photos p where p.id = photo_id and p.space_id = journal_entry_photos.space_id)
);
create policy "unlink own entry" on public.journal_entry_photos for delete to authenticated using (
  exists (select 1 from public.journal_entries e where e.id = entry_id and e.created_by = (select auth.uid()))
);
grant select, insert, delete on public.journal_entry_photos to authenticated;
grant all on public.journal_entry_photos to service_role;

alter table public.time_capsule_items enable row level security;

create policy "read with capsule" on public.time_capsule_items for select to authenticated using (
  app.is_member(space_id)
  and exists (select 1 from public.time_capsules c where c.id = capsule_id)
);
create policy "fill own capsule" on public.time_capsule_items for insert to authenticated with check (
  app.is_member(space_id)
  and exists (
    select 1 from public.time_capsules c
    where c.id = capsule_id and c.space_id = time_capsule_items.space_id and c.created_by = (select auth.uid())
  )
  and exists (
    select 1 from public.media_assets a
    where a.id = asset_id and a.space_id = time_capsule_items.space_id and a.uploaded_by = (select auth.uid())
  )
);
create policy "empty own capsule" on public.time_capsule_items for delete to authenticated using (
  exists (select 1 from public.time_capsules c where c.id = capsule_id and c.created_by = (select auth.uid()))
);
grant select, insert, delete on public.time_capsule_items to authenticated;
grant all on public.time_capsule_items to service_role;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
alter table public.content_section_drafts enable row level security;
create policy "owner only drafts" on public.content_section_drafts for all to authenticated
  using (app.is_owner(space_id)) with check (app.is_owner(space_id));
grant select, insert, update, delete on public.content_section_drafts to authenticated;
grant all on public.content_section_drafts to service_role;

alter table public.theme_settings enable row level security;
create policy "members read theme" on public.theme_settings for select to authenticated
  using (app.is_member(space_id));
create policy "owner writes theme" on public.theme_settings for insert to authenticated
  with check (app.is_owner(space_id));
create policy "owner updates theme" on public.theme_settings for update to authenticated
  using (app.is_owner(space_id)) with check (app.is_owner(space_id));
grant select, insert, update on public.theme_settings to authenticated;
grant all on public.theme_settings to service_role;

alter table public.user_preferences enable row level security;
create policy "own preferences" on public.user_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and app.is_member(space_id));
grant select, insert, update, delete on public.user_preferences to authenticated;
grant all on public.user_preferences to service_role;

-- ---------------------------------------------------------------------------
-- History. Written only by triggers; read by the person it concerns.
-- ---------------------------------------------------------------------------
alter table public.content_versions enable row level security;
-- History of a row is for its author alone. Site copy (no author) belongs to the owner.
create policy "read own history" on public.content_versions for select to authenticated using (
  app.is_member(space_id)
  and (author_id = (select auth.uid()) or (author_id is null and app.is_owner(space_id)))
);
grant select on public.content_versions to authenticated;
grant all on public.content_versions to service_role;

alter table public.audit_logs enable row level security;
create policy "read own or shared log" on public.audit_logs for select to authenticated using (
  app.is_member(space_id)
  and (actor_id = (select auth.uid()) or (app.is_owner(space_id) and shared))
);
create policy "owner clears log" on public.audit_logs for delete to authenticated using (
  app.is_owner(space_id) and (actor_id = (select auth.uid()) or shared)
);
grant select, delete on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
