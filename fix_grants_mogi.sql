-- ============================================================
-- PS Control — Fix de GRANTs: Mogi Guaçu - SP
-- Corrige "permission denied for table visitors" (e demais tabelas)
-- Execute TODO de uma vez no SQL Editor do projeto wloetniezrnjcodaqcxq
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on public.profiles, public.departments, public.company_users,
     public.empreiteiras, public.visitors, public.vehicles, public.visits
  to authenticated;

grant select
  on public.visits, public.visitors, public.empreiteiras
  to anon;

-- Garante que tabelas futuras também recebam os grants automaticamente
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select on tables to anon;
