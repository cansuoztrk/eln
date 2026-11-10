-- ELNARE — BEYOND DISTANCE
-- 05 · Storage. One private bucket. No policies for members on purpose:
-- files are only ever reached through short-lived signed URLs created by the
-- server after `media_assets` RLS has said the person may see the row.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  52428800, -- 50 MB
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
