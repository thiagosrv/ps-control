-- ============================================================
-- PS Control — Cria tabela visit_photos: Mogi Guaçu - SP
-- Corrige "Entrada registrada, mas erro ao salvar foto"
-- (a tabela nunca foi incluída no script de provisionamento da obra)
-- Execute TODO de uma vez no SQL Editor do projeto wloetniezrnjcodaqcxq
-- ============================================================

create table if not exists public.visit_photos (
  id         uuid primary key default uuid_generate_v4(),
  visit_id   uuid not null references public.visits(id) on delete cascade,
  photo_url  text not null,
  tipo       text not null default 'entrada',
  created_at timestamptz not null default now()
);

create index if not exists visit_photos_visit_id_idx on public.visit_photos (visit_id);

alter table public.visit_photos enable row level security;

drop policy if exists "authenticated read" on public.visit_photos;
drop policy if exists "authenticated write" on public.visit_photos;
drop policy if exists "authenticated update" on public.visit_photos;
drop policy if exists "authenticated delete" on public.visit_photos;

create policy "authenticated read" on public.visit_photos
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.visit_photos
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.visit_photos
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.visit_photos
  for delete using (auth.uid() is not null);

grant select, insert, update, delete
  on public.visit_photos
  to authenticated;
