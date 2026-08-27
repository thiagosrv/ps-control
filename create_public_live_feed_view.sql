-- Restaura o painel público (savegnago-painel) sem reabrir a tabela "visits" para o anon.
-- Expõe só os campos necessários para o "ao vivo" de entradas/saídas: sem CPF, RG, telefone etc.
-- Rodar uma vez em CADA um dos 6 projetos Supabase (SQL Editor).

create or replace view public.live_visits_feed as
select
  v.id,
  v.checked_in_at,
  v.checked_out_at,
  v.status,
  vi.full_name as visitor_name
from public.visits v
join public.visitors vi on vi.id = v.visitor_id
order by v.checked_in_at desc;

grant usage on schema public to anon;
grant select on public.live_visits_feed to anon;
