-- ELNARE — BEYOND DISTANCE
-- 02 · Content tables. Policies live in 03, behaviour (triggers/functions) in 04.

-- ---------------------------------------------------------------------------
-- Dates. The single source of truth for every counter on the site.
-- A date may have no year (birthdays) or no date at all (the first meeting).
-- ---------------------------------------------------------------------------
create table public.relationship_dates (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 120),
  kind text not null check (kind in ('milestone', 'birthday', 'future', 'custom')),
  person public.member_role,
  month smallint check (month between 1 and 12),
  day smallint check (day between 1 and 31),
  year smallint check (year between 1900 and 2200),
  recurs_yearly boolean not null default true,
  -- false while something is only hoped for. Never flipped automatically.
  happened boolean not null default true,
  note text not null default '' check (char_length(note) <= 2000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, key),
  check ((month is null) = (day is null)),
  check (year is null or month is not null),
  -- 2000 is a leap year, so 29 February stays valid for year-less dates.
  check (month is null or make_date(coalesce(year::int, 2000), month::int, day::int) is not null)
);

-- ---------------------------------------------------------------------------
-- Media. One row per uploaded file. The original is kept untouched; what the
-- site serves are re-encoded, metadata-free variants.
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('image', 'audio')),
  state text not null default 'pending' check (state in ('pending', 'ready', 'failed')),
  bucket text not null default 'media',
  original_path text not null unique,
  -- { "thumb": {path,width,height}, "medium": {...}, "large": {...} }
  variants jsonb not null default '{}'::jsonb,
  mime_type text not null,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  width integer,
  height integer,
  duration_ms integer,
  -- A ~16px blurred preview as a data URI, shown while the real image loads.
  placeholder text,
  checksum_sha256 text,
  original_filename text check (original_filename is null or char_length(original_filename) <= 255),
  -- Maintained by triggers (04): who may see this file, and from when.
  visibility text not null default 'private' check (visibility in ('private', 'space')),
  sealed_until timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index media_assets_space_idx on public.media_assets (space_id, created_at desc);
create index media_assets_uploader_idx on public.media_assets (uploaded_by);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  cover_photo_id uuid,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  album_id uuid references public.albums (id) on delete set null,
  caption text not null default '' check (char_length(caption) <= 1000),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  taken_on date,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  show_in_gallery boolean not null default true,
  display_style text not null default 'editorial' check (display_style in ('editorial', 'polaroid')),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (cardinality(tags) <= 20)
);

alter table public.albums
  add constraint albums_cover_photo_fk foreign key (cover_photo_id)
  references public.photos (id) on delete set null;

create index photos_space_idx on public.photos (space_id, status, sort_order, created_at desc);
create index photos_album_idx on public.photos (album_id);
create index photos_asset_idx on public.photos (asset_id);
create index photos_tags_idx on public.photos using gin (tags);
create index albums_space_idx on public.albums (space_id, sort_order);

-- ---------------------------------------------------------------------------
-- Voice memories
-- ---------------------------------------------------------------------------
create table public.voice_memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  recorded_on date not null default current_date,
  duration_ms integer not null default 0 check (duration_ms >= 0),
  -- Normalised peaks (0..1) captured while recording, for the waveform.
  waveform jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index voice_memories_space_idx on public.voice_memories (space_id, recorded_on desc);
create index voice_memories_asset_idx on public.voice_memories (asset_id);

-- ---------------------------------------------------------------------------
-- Memories (Our Story, Memory Universe)
-- ---------------------------------------------------------------------------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  happened_on date,
  date_precision text not null default 'day' check (date_precision in ('day', 'month', 'year')),
  summary text not null default '' check (char_length(summary) <= 400),
  description text not null default '' check (char_length(description) <= 20000),
  special_note text not null default '' check (char_length(special_note) <= 2000),
  category text not null default 'moment' check (char_length(category) <= 40),
  tags text[] not null default '{}',
  album_id uuid references public.albums (id) on delete set null,
  voice_memory_id uuid references public.voice_memories (id) on delete set null,
  -- Links the two seeded milestones to their relationship date.
  relationship_date_key text,
  star_size smallint not null default 2 check (star_size between 1 and 5),
  star_tone text not null default 'blush' check (star_tone in ('blush', 'rose', 'champagne', 'pearl', 'gold')),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (cardinality(tags) <= 20)
);

create index memories_space_idx on public.memories (space_id, status, happened_on, sort_order);
create index memories_tags_idx on public.memories using gin (tags);

create table public.memory_photos (
  memory_id uuid not null references public.memories (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (memory_id, photo_id)
);

create index memory_photos_photo_idx on public.memory_photos (photo_id);

-- ---------------------------------------------------------------------------
-- Letters. `unlock_at` turns a letter into a sealed one.
-- ---------------------------------------------------------------------------
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  category text not null default 'say' check (char_length(category) <= 40),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 60000),
  written_on date not null default current_date,
  font_style text not null default 'serif' check (font_style in ('serif', 'hand')),
  envelope_style text not null default 'blush'
    check (envelope_style in ('blush', 'ivory', 'rose', 'champagne', 'nude')),
  seal text not null default 'heart' check (seal in ('heart', 'bow', 'star', 'cat', 'moon')),
  unlock_at timestamptz,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index letters_space_idx on public.letters (space_id, status, written_on desc);

-- ---------------------------------------------------------------------------
-- Special days: the celebration around a relationship date, plus one
-- "edition" per year so every birthday can carry a new surprise.
-- ---------------------------------------------------------------------------
create table public.special_days (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  relationship_date_id uuid not null references public.relationship_dates (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subtitle text not null default '' check (char_length(subtitle) <= 240),
  theme text not null default 'classic'
    check (theme in ('birthday-partner', 'birthday-owner', 'meeting', 'together', 'first-meeting', 'classic')),
  intro text not null default '' check (char_length(intro) <= 4000),
  cover_photo_id uuid references public.photos (id) on delete set null,
  show_countdown boolean not null default true,
  sort_order integer not null default 0,
  status public.content_status not null default 'published',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (space_id, slug)
);

create table public.special_day_editions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  special_day_id uuid not null references public.special_days (id) on delete cascade,
  year smallint not null check (year between 1900 and 2200),
  title text not null default '' check (char_length(title) <= 160),
  note text not null default '' check (char_length(note) <= 20000),
  letter_id uuid references public.letters (id) on delete set null,
  cover_photo_id uuid references public.photos (id) on delete set null,
  album_id uuid references public.albums (id) on delete set null,
  -- When set, the partner cannot read this edition before that instant.
  reveal_at timestamptz,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (special_day_id, year)
);

-- ---------------------------------------------------------------------------
-- Time capsules
-- ---------------------------------------------------------------------------
create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  message text not null default '' check (char_length(message) <= 60000),
  note text not null default '' check (char_length(note) <= 2000),
  video_url text check (video_url is null or (char_length(video_url) <= 500 and video_url ~ '^https://')),
  cover_style text not null default 'rose' check (cover_style in ('blush', 'ivory', 'rose', 'champagne', 'nude')),
  unlock_at timestamptz not null,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.time_capsule_items (
  capsule_id uuid not null references public.time_capsules (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 500),
  sort_order integer not null default 0,
  primary key (capsule_id, asset_id)
);

create index time_capsule_items_asset_idx on public.time_capsule_items (asset_id);

-- ---------------------------------------------------------------------------
-- Shared journal
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 160),
  body text not null default '' check (char_length(body) <= 40000),
  entry_date date not null default current_date,
  tags text[] not null default '{}',
  -- 'shared' entries are visible to both once published; 'private' never leave the author.
  visibility text not null default 'shared' check (visibility in ('shared', 'private')),
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (cardinality(tags) <= 20)
);

create index journal_entries_space_idx on public.journal_entries (space_id, entry_date desc);

create table public.journal_entry_photos (
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (entry_id, photo_id)
);

-- ---------------------------------------------------------------------------
-- Our Future
-- ---------------------------------------------------------------------------
create table public.future_plans (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  category text not null default 'dream' check (char_length(category) <= 40),
  state text not null default 'dream' check (state in ('dream', 'planned', 'done')),
  target_date date,
  -- Set only when a person explicitly confirms it happened.
  completed_on date,
  memory_id uuid references public.memories (id) on delete set null,
  sort_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (state = 'done' or completed_on is null)
);

create index future_plans_space_idx on public.future_plans (space_id, state, sort_order);

-- ---------------------------------------------------------------------------
-- Our Questions
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  category text not null default 'daily' check (char_length(category) <= 40),
  prompt text not null check (char_length(prompt) between 1 and 500),
  -- "Together" questions hide the other answer until you have written yours.
  together boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'published',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  status public.content_status not null default 'published',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (question_id, created_by)
);

-- ---------------------------------------------------------------------------
-- 365 little notes
-- ---------------------------------------------------------------------------
create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  category text not null default 'thought' check (char_length(category) <= 40),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index daily_notes_space_idx on public.daily_notes (space_id, status, sort_order);

-- Which note belongs to which calendar day. Filled for every day regardless of
-- who opened the site, so it says nothing about anyone's visits.
create table public.daily_note_schedule (
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  day date not null,
  note_id uuid not null references public.daily_notes (id) on delete cascade,
  primary key (space_id, day)
);

create index daily_note_schedule_note_idx on public.daily_note_schedule (note_id);

-- ---------------------------------------------------------------------------
-- Beyond Distance: short notes to each other and the longing journal
-- ---------------------------------------------------------------------------
create table public.distance_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'longing')),
  body text not null check (char_length(body) between 1 and 600),
  status public.content_status not null default 'published',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index distance_notes_space_idx on public.distance_notes (space_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Editable site copy. Published data and the owner's draft live in separate
-- tables so a draft can never be read through the published row.
-- ---------------------------------------------------------------------------
create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_.-]{1,60}$'),
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, key)
);

create table public.content_section_drafts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_.-]{1,60}$'),
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (space_id, key)
);

create table public.theme_settings (
  space_id uuid primary key references public.private_spaces (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Each person's own choices (theme, sticker board…). Never visible to the other.
create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- History: previous versions of written content, and a change log.
-- Neither records views, reads or visits.
-- ---------------------------------------------------------------------------
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  entity_table text not null,
  entity_id uuid not null,
  -- The author of the row at the time. Only they can read its history.
  author_id uuid references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index content_versions_entity_idx on public.content_versions (entity_table, entity_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.private_spaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete cascade,
  action text not null check (char_length(action) <= 40),
  entity_table text not null,
  entity_id uuid,
  -- false for anything that is still someone's personal draft.
  shared boolean not null default false,
  summary text not null default '' check (char_length(summary) <= 200),
  created_at timestamptz not null default now()
);

create index audit_logs_space_idx on public.audit_logs (space_id, created_at desc);
