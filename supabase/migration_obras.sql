-- ================================================================
-- PS Control — Migração para módulo de Obras
-- Execute este script no Supabase SQL Editor
-- ================================================================

-- 1. Nova tabela: empreiteiras
create table if not exists public.empreiteiras (
  id           uuid primary key default uuid_generate_v4(),
  razao_social text not null,
  cnpj         text,
  contato      text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.empreiteiras enable row level security;

create policy "authenticated access empreiteiras" on public.empreiteiras
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- 2. Alterações em visitors (trabalhadores)
alter table public.visitors
  add column if not exists funcao         text,
  add column if not exists empreiteira_id uuid references public.empreiteiras(id) on delete set null,
  add column if not exists aso_validade   date,
  add column if not exists epi_ok         boolean not null default false;

-- 3. Alterações em visits (registros de entrada)
alter table public.visits
  add column if not exists epi_verificado boolean not null default false,
  add column if not exists atividade      text;

-- 4. Adicionar empreiteiras ao Realtime (opcional)
-- alter publication supabase_realtime add table public.empreiteiras;

-- ================================================================
-- Verificação (execute para confirmar):
-- select column_name from information_schema.columns
--   where table_name = 'empreiteiras' order by ordinal_position;
-- ================================================================
