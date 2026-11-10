-- ELNARE — BEYOND DISTANCE
-- 04 · Behaviour: media visibility, history, sealed views, the daily note, setup.

-- ---------------------------------------------------------------------------
-- Media visibility follows the content that wraps a file.
--   * published photo / voice memory  → visible to the space
--   * inside a published time capsule → visible, but sealed until it opens
--   * anything else                   → private to the uploader
-- ---------------------------------------------------------------------------
create or replace function app.refresh_asset_visibility(p_asset uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wrapped boolean;
  v_in_capsule boolean;
  v_seal timestamptz;
begin
  if p_asset is null then
    return;
  end if;

  select
    exists (
      select 1 from public.photos p
      where p.asset_id = p_asset and p.status = 'published' and p.deleted_at is null
    )
    or exists (
      select 1 from public.voice_memories v
      where v.asset_id = p_asset and v.status = 'published' and v.deleted_at is null
    )
  into v_wrapped;

  select
    exists (
      select 1 from public.time_capsule_items i
      join public.time_capsules c on c.id = i.capsule_id
      where i.asset_id = p_asset and c.status = 'published' and c.deleted_at is null
    ),
    (
      select max(c.unlock_at) from public.time_capsule_items i
      join public.time_capsules c on c.id = i.capsule_id
      where i.asset_id = p_asset and c.deleted_at is null
    )
  into v_in_capsule, v_seal;

  update public.media_assets a
  set visibility = case when v_wrapped or v_in_capsule then 'space' else 'private' end,
      sealed_until = case when v_wrapped then null else v_seal end
  where a.id = p_asset;
end;
$$;

create or replace function app.on_asset_wrapper_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform app.refresh_asset_visibility(old.asset_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform app.refresh_asset_visibility(new.asset_id);
  end if;
  return null;
end;
$$;

create trigger photos_asset_visibility
  after insert or update of status, deleted_at, asset_id or delete on public.photos
  for each row execute function app.on_asset_wrapper_change();

create trigger voice_memories_asset_visibility
  after insert or update of status, deleted_at, asset_id or delete on public.voice_memories
  for each row execute function app.on_asset_wrapper_change();

create trigger time_capsule_items_asset_visibility
  after insert or delete on public.time_capsule_items
  for each row execute function app.on_asset_wrapper_change();

create or replace function app.on_capsule_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset uuid;
begin
  for v_asset in select i.asset_id from public.time_capsule_items i where i.capsule_id = new.id loop
    perform app.refresh_asset_visibility(v_asset);
  end loop;
  return null;
end;
$$;

create trigger time_capsules_asset_visibility
  after update of status, deleted_at, unlock_at on public.time_capsules
  for each row execute function app.on_capsule_change();

-- ---------------------------------------------------------------------------
-- Is this row currently visible to the other member? Shared by the history
-- and audit triggers so personal drafts never surface in either.
-- ---------------------------------------------------------------------------
create or replace function app.row_is_shared(r jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(r ->> 'status', 'published') = 'published'
    and coalesce(r ->> 'visibility', 'shared') <> 'private'
    and ((r ->> 'unlock_at') is null or (r ->> 'unlock_at')::timestamptz <= now())
    and ((r ->> 'reveal_at') is null or (r ->> 'reveal_at')::timestamptz <= now());
$$;

-- ---------------------------------------------------------------------------
-- Versioned content: keep the previous state of a row whenever it changes.
-- ---------------------------------------------------------------------------
create or replace function app.snapshot_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
  ignored text[] := array['updated_at', 'sort_order', 'updated_by'];
begin
  if (o - ignored) = (n - ignored) then
    return new;
  end if;

  insert into public.content_versions (space_id, entity_table, entity_id, author_id, snapshot, changed_by)
  values (
    old.space_id,
    tg_table_name,
    old.id,
    nullif(o ->> 'created_by', '')::uuid,
    o,
    auth.uid()
  );

  -- Keep the 50 most recent versions per row.
  delete from public.content_versions v
  where v.entity_table = tg_table_name
    and v.entity_id = old.id
    and v.id not in (
      select k.id from public.content_versions k
      where k.entity_table = tg_table_name and k.entity_id = old.id
      order by k.created_at desc
      limit 50
    );

  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'letters', 'memories', 'journal_entries', 'daily_notes', 'content_sections',
    'special_days', 'special_day_editions', 'time_capsules', 'future_plans',
    'answers', 'relationship_dates', 'photos', 'albums'
  ] loop
    execute format(
      'create trigger snapshot_version before update on public.%I for each row execute function app.snapshot_version()',
      t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Change log. Records who changed what — never who looked at what.
-- ---------------------------------------------------------------------------
create or replace function app.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  r jsonb;
  o jsonb;
  v_action text;
  ignored text[] := array['updated_at', 'sort_order', 'updated_by'];
begin
  -- Server-side maintenance (setup, clean-up) is not a person's action.
  if v_actor is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    r := to_jsonb(new);
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    r := to_jsonb(old);
    v_action := 'purge';
  else
    r := to_jsonb(new);
    o := to_jsonb(old);
    if (o - ignored) = (r - ignored) then
      return null;
    end if;
    v_action := case
      when (o ->> 'deleted_at') is null and (r ->> 'deleted_at') is not null then 'trash'
      when (o ->> 'deleted_at') is not null and (r ->> 'deleted_at') is null then 'restore'
      when (o ->> 'status') = 'draft' and (r ->> 'status') = 'published' then 'publish'
      when (o ->> 'status') = 'published' and (r ->> 'status') = 'draft' then 'unpublish'
      else 'update'
    end;
  end if;

  insert into public.audit_logs (space_id, actor_id, action, entity_table, entity_id, shared, summary)
  values (
    (r ->> 'space_id')::uuid,
    v_actor,
    v_action,
    tg_table_name,
    nullif(r ->> 'id', '')::uuid,
    app.row_is_shared(r),
    left(coalesce(r ->> 'title', r ->> 'label', r ->> 'key', r ->> 'slug', ''), 200)
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'photos', 'albums', 'memories', 'letters', 'voice_memories', 'time_capsules',
    'journal_entries', 'future_plans', 'questions', 'answers', 'daily_notes',
    'distance_notes', 'special_days', 'special_day_editions', 'relationship_dates',
    'content_sections', 'space_invites'
  ] loop
    execute format(
      'create trigger audit after insert or update or delete on public.%I for each row execute function app.audit()',
      t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Sealed things. The other member may know that something is waiting and
-- when it opens — never what is inside.
-- ---------------------------------------------------------------------------
create or replace function public.sealed_letters(p_space uuid)
returns table (
  id uuid,
  title text,
  category text,
  envelope_style text,
  seal text,
  unlock_at timestamptz,
  created_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.title, l.category, l.envelope_style, l.seal, l.unlock_at, l.created_by
  from public.letters l
  where l.space_id = p_space
    and app.is_member(p_space)
    and l.status = 'published'
    and l.deleted_at is null
    and l.unlock_at > now()
    and l.created_by <> (select auth.uid())
  order by l.unlock_at asc;
$$;

create or replace function public.sealed_capsules(p_space uuid)
returns table (
  id uuid,
  title text,
  cover_style text,
  unlock_at timestamptz,
  created_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.title, c.cover_style, c.unlock_at, c.created_by
  from public.time_capsules c
  where c.space_id = p_space
    and app.is_member(p_space)
    and c.status = 'published'
    and c.deleted_at is null
    and c.unlock_at > now()
    and c.created_by <> (select auth.uid())
  order by c.unlock_at asc;
$$;

create or replace function public.sealed_editions(p_space uuid)
returns table (
  id uuid,
  special_day_id uuid,
  year smallint,
  reveal_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.special_day_id, e.year, e.reveal_at
  from public.special_day_editions e
  where e.space_id = p_space
    and app.is_member(p_space)
    and not app.is_owner(p_space)
    and e.status = 'published'
    and e.deleted_at is null
    and e.reveal_at > now()
  order by e.reveal_at asc;
$$;

grant execute on function public.sealed_letters(uuid) to authenticated, service_role;
grant execute on function public.sealed_capsules(uuid) to authenticated, service_role;
grant execute on function public.sealed_editions(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The note of the day. Assigns a note to every calendar day from the start
-- date up to `p_day`, whoever asks and whenever — so the archive never
-- reflects who opened the site on which day.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_daily_notes(p_space uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_start date;
  v_first_note date;
  v_last date;
  v_day date;
  v_until date := least(p_day, (now() at time zone 'Pacific/Kiritimati')::date);
  v_note uuid;
  v_guard integer := 0;
begin
  if not app.is_member(p_space) then
    raise exception 'not a member of this space' using errcode = '42501';
  end if;

  select s.reasons_mode, s.reasons_started_on into v_mode, v_start
  from public.private_spaces s where s.id = p_space;

  if v_start is null then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('daily_notes:' || p_space::text));

  select min(n.created_at)::date into v_first_note
  from public.daily_notes n
  where n.space_id = p_space and n.status = 'published' and n.deleted_at is null;

  if v_first_note is null then
    return;
  end if;

  select max(s.day) into v_last from public.daily_note_schedule s where s.space_id = p_space;

  v_day := greatest(v_start, v_first_note, coalesce(v_last + 1, v_start));

  while v_day <= v_until and v_guard < 800 loop
    v_guard := v_guard + 1;

    -- Least-used notes first, so nothing repeats until everything has been shown.
    select n.id into v_note
    from public.daily_notes n
    left join lateral (
      select count(*) as times from public.daily_note_schedule s where s.note_id = n.id
    ) used on true
    where n.space_id = p_space and n.status = 'published' and n.deleted_at is null
    order by used.times asc,
             case when v_mode = 'random' then random() else 0 end,
             n.sort_order asc,
             n.created_at asc
    limit 1;

    exit when v_note is null;

    insert into public.daily_note_schedule (space_id, day, note_id)
    values (p_space, v_day, v_note)
    on conflict (space_id, day) do nothing;

    v_day := v_day + 1;
  end loop;
end;
$$;

grant execute on function public.ensure_daily_notes(uuid, date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- One-time setup. Creates the space, the owner and the confirmed facts in a
-- single transaction. Refuses to run once a space exists.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_space(p_owner uuid, p_config jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_space uuid;
  v_date jsonb;
  v_day jsonb;
  v_memory jsonb;
  v_date_id uuid;
begin
  if exists (select 1 from public.private_spaces) then
    raise exception 'this site has already been set up' using errcode = 'P0001';
  end if;

  insert into public.private_spaces (
    name, tagline, owner_name, partner_name, partner_full_name,
    owner_city, partner_city, owner_timezone, partner_timezone, created_by
  )
  values (
    p_config ->> 'name',
    coalesce(p_config ->> 'tagline', ''),
    p_config #>> '{owner,name}',
    p_config #>> '{partner,name}',
    p_config #>> '{partner,fullName}',
    p_config #>> '{owner,city}',
    p_config #>> '{partner,city}',
    p_config #>> '{owner,timezone}',
    p_config #>> '{partner,timezone}',
    p_owner
  )
  returning id into v_space;

  insert into public.profiles (id, display_name, city, timezone, birthday_month, birthday_day)
  values (
    p_owner,
    p_config #>> '{owner,name}',
    p_config #>> '{owner,city}',
    p_config #>> '{owner,timezone}',
    (p_config #>> '{owner,birthday,month}')::smallint,
    (p_config #>> '{owner,birthday,day}')::smallint
  )
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.space_members (space_id, user_id, role) values (v_space, p_owner, 'owner');

  for v_date in select * from jsonb_array_elements(coalesce(p_config -> 'dates', '[]'::jsonb)) loop
    insert into public.relationship_dates (
      space_id, key, label, kind, person, month, day, year, recurs_yearly, happened, sort_order
    )
    values (
      v_space,
      v_date ->> 'key',
      v_date ->> 'label',
      v_date ->> 'kind',
      (v_date ->> 'person')::public.member_role,
      (v_date ->> 'month')::smallint,
      (v_date ->> 'day')::smallint,
      (v_date ->> 'year')::smallint,
      coalesce((v_date ->> 'recursYearly')::boolean, true),
      coalesce((v_date ->> 'happened')::boolean, true),
      coalesce((v_date ->> 'sortOrder')::integer, 0)
    );
  end loop;

  for v_day in select * from jsonb_array_elements(coalesce(p_config -> 'specialDays', '[]'::jsonb)) loop
    select d.id into v_date_id from public.relationship_dates d
    where d.space_id = v_space and d.key = v_day ->> 'dateKey';

    if v_date_id is null then
      raise exception 'special day % references unknown date %', v_day ->> 'slug', v_day ->> 'dateKey';
    end if;

    insert into public.special_days (
      space_id, slug, relationship_date_id, title, subtitle, theme, sort_order, status, created_by
    )
    values (
      v_space,
      v_day ->> 'slug',
      v_date_id,
      v_day ->> 'title',
      coalesce(v_day ->> 'subtitle', ''),
      coalesce(v_day ->> 'theme', 'classic'),
      coalesce((v_day ->> 'sortOrder')::integer, 0),
      'published',
      p_owner
    );
  end loop;

  for v_memory in select * from jsonb_array_elements(coalesce(p_config -> 'memories', '[]'::jsonb)) loop
    insert into public.memories (
      space_id, title, happened_on, category, relationship_date_key, star_size, star_tone,
      sort_order, status, created_by
    )
    values (
      v_space,
      v_memory ->> 'title',
      (v_memory ->> 'happenedOn')::date,
      coalesce(v_memory ->> 'category', 'milestone'),
      v_memory ->> 'dateKey',
      coalesce((v_memory ->> 'starSize')::smallint, 4),
      coalesce(v_memory ->> 'starTone', 'gold'),
      coalesce((v_memory ->> 'sortOrder')::integer, 0),
      'published',
      p_owner
    );
  end loop;

  insert into public.theme_settings (space_id, data, updated_by) values (v_space, '{}'::jsonb, p_owner);

  return v_space;
end;
$$;

revoke all on function public.bootstrap_space(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.bootstrap_space(uuid, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Accepting an invitation. Called by the server after it has created (or
-- found) the auth user for the invited e-mail.
-- ---------------------------------------------------------------------------
create or replace function public.accept_invite(p_token_hash text, p_user uuid, p_profile jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.space_invites%rowtype;
begin
  select * into v_invite from public.space_invites i
  where i.token_hash = p_token_hash
  for update;

  if not found
    or v_invite.revoked_at is not null
    or v_invite.accepted_at is not null
    or v_invite.expires_at <= now()
  then
    raise exception 'invite is not valid' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, display_name, city, timezone, birthday_month, birthday_day)
  values (
    p_user,
    coalesce(nullif(p_profile ->> 'displayName', ''), v_invite.display_name),
    p_profile ->> 'city',
    coalesce(p_profile ->> 'timezone', 'UTC'),
    (p_profile #>> '{birthday,month}')::smallint,
    (p_profile #>> '{birthday,day}')::smallint
  )
  on conflict (id) do nothing;

  insert into public.space_members (space_id, user_id, role)
  values (v_invite.space_id, p_user, 'partner')
  on conflict (space_id, user_id) do nothing;

  update public.space_invites
  set accepted_at = now(), accepted_by = p_user
  where id = v_invite.id;

  return v_invite.space_id;
end;
$$;

revoke all on function public.accept_invite(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.accept_invite(text, uuid, jsonb) to service_role;
