-- ============================================================
-- PS Control — Novo usuário admin: Campinas - SP
-- Execute no SQL Editor do projeto Supabase da obra de Campinas
-- (o usuário já deve ter sido criado em Authentication > Users
--  com o UUID abaixo — este script só ajusta o perfil/permissões)
-- ============================================================

insert into public.profiles (id, email, full_name, role, company_name, must_change_password)
values
  ('cc4811b6-5ac9-4bb4-8cb1-46448af264c3', 'gestao@pscontrol.app', 'Gestão Campinas', 'admin', 'Obra - Campinas - SP', false)
on conflict (id) do update set
  full_name            = excluded.full_name,
  role                 = excluded.role,
  company_name         = excluded.company_name,
  must_change_password = excluded.must_change_password;
