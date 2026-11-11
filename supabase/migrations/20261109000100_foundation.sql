-- ELNARE — BEYOND DISTANCE
-- 01 · Foundation: schemas, roles, people, the private space, invites, rate limits.
--
-- Conventions used by every migration in this project:
--   * `app` schema holds helpers that are NOT exposed through the Data API.
--   * Every table has RLS enabled. Nothing is readable by `anon`.
--   * `created_by` / `space_id` are immutable once written (see app.protect_identity).

create schema if not exists app;

revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

-- Nothing in this project is ever served to anonymous visitors.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;
alter default privileges in schema public revoke all on sequences from anon;
-- Functions are private by default; each one is granted explicitly.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema app revoke execute on functions from public;

create type public.content_status as enum ('draft', 'published');
create type public.member_role as enum ('owner', 'partner');

-- ---------------------------------------------------------------------------
-- The private space. This deployment hosts exactly one.
-- ---------------------------------------------------------------------------
create table public.private_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  tagline text not null default '' check (char_length(tagline) <= 240),
  owner_name text not null check (char_length(owner_name) between 1 and 60),
  partner_name text not null check (char_length(partner_name) between 1 and 60),
  partner_full_name text check (partner_full_name is null or char_length(partner_full_name) <= 60),
  owner_city text not null,
  partner_city text not null,
  owner_timezone text not null,
  partner_timezone text not null,
  -- 365 notes: how the note of the day is chosen, and the first day it applies to.
  reasons_mode text not null default 'sequential' check (reasons_mode in ('sequential', 'random')),
  reasons_started_on date,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One space per deployment: a second insert fails no matter who attempts it.
create unique index private_spaces_singleton on public.private_spaces ((true));

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  city text check (city is null or char_length(city) <= 80),
  timezone text not null default 'UTC',
  birthday_month smallint check (birthday_month between 1 and 12),
  birthday_day smallint check (birthday_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((birthday_month is null) = (birthday_day is null))
);

create table public.space_members (
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

-- Two people: one owner, one partner.
create unique index space_members_one_per_role on public.space_members (space_id, role);
create index space_members_user_idx on public.space_members (user_id);

-- ---------------------------------------------------------------------------
-- Membership helpers. SECURITY DEFINER so policies never recurse into
-- space_members' own RLS.
-- ---------------------------------------------------------------------------
create or replace function app.is_member(p_space uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = p_space and m.user_id = (select auth.uid())
  );
$$;

create or replace function app.is_owner(p_space uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members m
    where m.space_id = p_space
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create or replace function app.shares_space_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members mine
    join public.space_members theirs on theirs.space_id = mine.space_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

grant execute on function app.is_member(uuid) to authenticated, service_role;
grant execute on function app.is_owner(uuid) to authenticated, service_role;
grant execute on function app.shares_space_with(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- `space_id` and `created_by` can never be rewritten, so nobody can move a row
-- into another space or take authorship of someone else's words.
create or replace function app.protect_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
begin
  if (n ->> 'space_id') is distinct from (o ->> 'space_id') then
    raise exception 'space_id is immutable' using errcode = '42501';
  end if;
  if o ? 'created_by' and (n ->> 'created_by') is distinct from (o ->> 'created_by') then
    raise exception 'created_by is immutable' using errcode = '42501';
  end if;
  if o ? 'uploaded_by' and (n ->> 'uploaded_by') is distinct from (o ->> 'uploaded_by') then
    raise exception 'uploaded_by is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger private_spaces_touch before update on public.private_spaces
  for each row execute function app.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Invitations. Only a SHA-256 hash of the token is stored; the link itself is
-- shown to the owner once and never again.
-- ---------------------------------------------------------------------------
create table public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  email text not null check (char_length(email) between 3 and 254),
  display_name text not null default 'Eln' check (char_length(display_name) between 1 and 60),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index space_invites_space_idx on public.space_invites (space_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Rate limiting. Keys are salted HMACs computed by the server — never a raw IP
-- address or e-mail. Rows are short-lived and pruned on every call.
-- ---------------------------------------------------------------------------
create table app.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);

create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_hits integer;
begin
  if p_key is null or char_length(p_key) < 16 or p_max < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  delete from app.rate_limits where window_start < v_now - interval '1 hour';

  insert into app.rate_limits as r (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set hits = case
          when r.window_start < v_now - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end,
        window_start = case
          when r.window_start < v_now - make_interval(secs => p_window_seconds) then v_now
          else r.window_start
        end
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.private_spaces enable row level security;
alter table public.profiles enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
alter table app.rate_limits enable row level security;

create policy "members read their space" on public.private_spaces
  for select to authenticated using (app.is_member(id));
create policy "owner updates the space" on public.private_spaces
  for update to authenticated using (app.is_owner(id)) with check (app.is_owner(id));

create policy "read own or co-member profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or app.shares_space_with(id));
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read membership" on public.space_members
  for select to authenticated using (app.is_member(space_id));
-- Membership is only ever written by the server (setup / invite acceptance).

create policy "owner reads invites" on public.space_invites
  for select to authenticated using (app.is_owner(space_id));
create policy "owner creates invites" on public.space_invites
  for insert to authenticated
  with check (app.is_owner(space_id) and created_by = (select auth.uid()));
create policy "owner revokes invites" on public.space_invites
  for update to authenticated using (app.is_owner(space_id)) with check (app.is_owner(space_id));

create trigger private_spaces_identity before update on public.private_spaces
  for each row execute function app.protect_identity();
create trigger space_invites_identity before update on public.space_invites
  for each row execute function app.protect_identity();

grant select, update on public.private_spaces to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.space_members to authenticated;
grant select, insert, update on public.space_invites to authenticated;
grant all on public.private_spaces, public.profiles, public.space_members, public.space_invites to service_role;
grant all on app.rate_limits to service_role;
