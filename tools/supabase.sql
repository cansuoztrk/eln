-- Eln'in Krallığı — ortak kale için Supabase kurulumu
-- Supabase panelinde: SQL Editor > New query > bunu yapıştır > Run
-- Tabloya giden her şey tarayıcıda kasa anahtarıyla şifrelenir; burada sadece anlamsız metin durur.

create table if not exists public.kale (
  id uuid primary key default gen_random_uuid(),
  space text not null,
  kind text not null,
  author text not null default 'her',
  data text not null,
  created_at timestamptz not null default now()
);

create index if not exists kale_space_kind_idx on public.kale (space, kind, created_at);

alter table public.kale enable row level security;

drop policy if exists "kale okur" on public.kale;
drop policy if exists "kale yazar" on public.kale;
drop policy if exists "kale siler" on public.kale;
create policy "kale okur" on public.kale for select to anon using (true);
create policy "kale yazar" on public.kale for insert to anon with check (length(data) < 4000000 and author in ('her', 'me'));
create policy "kale siler" on public.kale for delete to anon using (true);

-- Canlı güncellemeler (yeni mektup, defter sayfası, cevap anında düşsün)
do $$
begin
  alter publication supabase_realtime add table public.kale;
exception when duplicate_object then null;
end $$;
