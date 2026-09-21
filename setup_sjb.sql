-- ============================================================
-- PS Control — Setup Completo: São Joaquim da Barra - SP (SJB)
-- Execute TODO de uma vez no SQL Editor do NOVO projeto Supabase (selecionar tudo → Run)
-- Já inclui: modelo de autorização (status/authorized_by), grants e view do painel ao vivo.
-- Passo final (seção 15) só funciona DEPOIS de criar os 2 usuários em Authentication → Users.
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- 2. TIPOS ENUM
create type public.visitor_type_enum as enum
  ('employee', 'supplier', 'contractor', 'other', 'unregistered');

create type public.visit_status_enum as enum ('active', 'completed');

-- 3. FUNÇÃO updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- 4. PROFILES
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  full_name            text,
  role                 text not null default 'operator' check (role in ('admin', 'operator')),
  must_change_password boolean not null default false,
  company_name         text,
  company_logo_url     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. DEPARTMENTS
create table public.departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- 6. COMPANY USERS
create table public.company_users (
  id            uuid primary key default uuid_generate_v4(),
  full_name     text not null,
  department_id uuid references public.departments(id) on delete set null,
  ramal         text,
  phone         text,
  email         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index company_users_name_idx on public.company_users using gin (full_name gin_trgm_ops);

create trigger set_updated_at before update on public.company_users
  for each row execute procedure public.set_updated_at();

-- 7. EMPREITEIRAS
create table public.empreiteiras (
  id           uuid primary key default uuid_generate_v4(),
  razao_social text not null,
  cnpj         text,
  contato      text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 8. VISITORS
create table public.visitors (
  id               uuid primary key default uuid_generate_v4(),
  full_name        text not null,
  cpf              text unique,
  rg               text,
  phone            text,
  company          text,
  funcao           text,
  empreiteira_id   uuid references public.empreiteiras(id) on delete set null,
  aso_validade     date,
  epi_ok           boolean not null default false,
  blacklisted      boolean not null default false,
  blacklist_reason text,
  status           text not null default 'nao_autorizado'
                     check (status in ('autorizado', 'nao_autorizado')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index visitors_cpf_idx  on public.visitors (cpf);
create index visitors_rg_idx   on public.visitors (rg);
create index visitors_name_idx on public.visitors using gin (full_name gin_trgm_ops);

create trigger set_updated_at before update on public.visitors
  for each row execute procedure public.set_updated_at();

-- 9. VEHICLES
create table public.vehicles (
  id         uuid primary key default uuid_generate_v4(),
  plate      text not null unique,
  owner_name text not null,
  company    text,
  notes      text,
  created_at timestamptz not null default now()
);

-- 10. VISITS
create table public.visits (
  id              uuid primary key default uuid_generate_v4(),
  visitor_id      uuid not null references public.visitors(id) on delete restrict,
  company_user_id uuid references public.company_users(id) on delete set null,
  visitor_type    public.visitor_type_enum not null default 'other',
  purpose         text,
  atividade       text,
  vehicle_plate   text,
  epi_verificado  boolean not null default false,
  status          public.visit_status_enum not null default 'active',
  checked_in_at   timestamptz not null default now(),
  checked_out_at  timestamptz,
  notes           text,
  badge_printed   boolean not null default false,
  authorized_by   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index visits_status_idx        on public.visits (status);
create index visits_checked_in_at_idx on public.visits (checked_in_at desc);
create index visits_visitor_id_idx    on public.visits (visitor_id);

create trigger set_updated_at before update on public.visits
  for each row execute procedure public.set_updated_at();

-- 10b. VISIT_PHOTOS
create table public.visit_photos (
  id         uuid primary key default uuid_generate_v4(),
  visit_id   uuid not null references public.visits(id) on delete cascade,
  photo_url  text not null,
  tipo       text not null default 'entrada' check (tipo in ('entrada', 'saida')),
  created_at timestamptz not null default now()
);

create index visit_photos_visit_id_idx on public.visit_photos (visit_id);

-- 11. ROW LEVEL SECURITY
alter table public.profiles      enable row level security;
alter table public.departments   enable row level security;
alter table public.company_users enable row level security;
alter table public.empreiteiras  enable row level security;
alter table public.visitors      enable row level security;
alter table public.vehicles      enable row level security;
alter table public.visits        enable row level security;
alter table public.visit_photos  enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "auth_sel_dep" on public.departments for select using (auth.uid() is not null);
create policy "auth_ins_dep" on public.departments for insert with check (auth.uid() is not null);
create policy "auth_upd_dep" on public.departments for update using (auth.uid() is not null);
create policy "auth_del_dep" on public.departments for delete using (auth.uid() is not null);

create policy "auth_sel_cu" on public.company_users for select using (auth.uid() is not null);
create policy "auth_ins_cu" on public.company_users for insert with check (auth.uid() is not null);
create policy "auth_upd_cu" on public.company_users for update using (auth.uid() is not null);
create policy "auth_del_cu" on public.company_users for delete using (auth.uid() is not null);

create policy "auth_all_emp" on public.empreiteiras
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "auth_sel_vis" on public.visitors for select using (auth.uid() is not null);
create policy "auth_ins_vis" on public.visitors for insert with check (auth.uid() is not null);
create policy "auth_upd_vis" on public.visitors for update using (auth.uid() is not null);
create policy "auth_del_vis" on public.visitors for delete using (auth.uid() is not null);

create policy "auth_sel_veh" on public.vehicles for select using (auth.uid() is not null);
create policy "auth_ins_veh" on public.vehicles for insert with check (auth.uid() is not null);
create policy "auth_upd_veh" on public.vehicles for update using (auth.uid() is not null);
create policy "auth_del_veh" on public.vehicles for delete using (auth.uid() is not null);

create policy "auth_sel_vst" on public.visits for select using (auth.uid() is not null);
create policy "auth_ins_vst" on public.visits for insert with check (auth.uid() is not null);
create policy "auth_upd_vst" on public.visits for update using (auth.uid() is not null);
create policy "auth_del_vst" on public.visits for delete using (auth.uid() is not null);

create policy "auth_sel_vph" on public.visit_photos for select using (auth.uid() is not null);
create policy "auth_ins_vph" on public.visit_photos for insert with check (auth.uid() is not null);
create policy "auth_upd_vph" on public.visit_photos for update using (auth.uid() is not null);
create policy "auth_del_vph" on public.visit_photos for delete using (auth.uid() is not null);

-- 12. FUNÇÕES RPC
create or replace function public.get_hourly_entries(p_day date)
returns table(hour int, count bigint)
language sql security definer as $$
  select extract(hour from checked_in_at)::int, count(*)
  from public.visits where checked_in_at::date = p_day
  group by 1 order by 1;
$$;

create or replace function public.get_weekly_entries()
returns table(day date, count bigint)
language sql security definer as $$
  select checked_in_at::date, count(*)
  from public.visits where checked_in_at >= now() - interval '7 days'
  group by 1 order by 1;
$$;

-- 13. STORAGE (fotos de entrada/saída)
insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do nothing;

create policy "auth_upload_visit_photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'visit-photos');
create policy "auth_update_visit_photos" on storage.objects
  for update to authenticated using (bucket_id = 'visit-photos');
create policy "public_read_visit_photos" on storage.objects
  for select to public using (bucket_id = 'visit-photos');

-- 14. GRANTS + VIEW PÚBLICA DO PAINEL AO VIVO
-- (o anon NÃO lê a tabela visits direto: só a view abaixo, sem CPF/RG/telefone)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on public.profiles, public.departments, public.company_users,
     public.empreiteiras, public.visitors, public.vehicles,
     public.visits, public.visit_photos
  to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

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

grant select on public.live_visits_feed to anon;

-- 15. PERFIS DOS USUÁRIOS
-- Rodar SÓ DEPOIS de criar em Authentication → Users (Auto Confirm ligado):
--   portariasjb@pscontrol.app  e  adminsjb@pscontrol.app
insert into public.profiles (id, email, full_name, role, company_name, must_change_password)
select u.id, u.email,
       case u.email when 'adminsjb@pscontrol.app' then 'Admin SJB' else 'Porteiro SJB' end,
       case u.email when 'adminsjb@pscontrol.app' then 'admin' else 'operator' end,
       'Obra - São Joaquim da Barra - SP',
       false
from auth.users u
where u.email in ('portariasjb@pscontrol.app', 'adminsjb@pscontrol.app')
on conflict (id) do update set
  full_name            = excluded.full_name,
  role                 = excluded.role,
  company_name         = excluded.company_name,
  must_change_password = excluded.must_change_password;
