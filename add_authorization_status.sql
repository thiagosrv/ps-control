-- Novo modelo de autorização: credenciados pré-cadastrados vs. visitantes não credenciados.
-- Rodar manualmente em cada uma das 6 instâncias Supabase.

alter table public.visitors
  add column if not exists status text not null default 'nao_autorizado'
    check (status in ('autorizado', 'nao_autorizado'));

alter table public.visits
  add column if not exists authorized_by text;
