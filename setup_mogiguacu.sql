-- ============================================================
-- PS Control — Setup Completo: Mogi Guaçu - SP
-- SQL Editor: https://supabase.com/dashboard/project/wloetniezrnjcodaqcxq
-- Execute TODO de uma vez (selecionar tudo → Run)
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
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index visits_status_idx        on public.visits (status);
create index visits_checked_in_at_idx on public.visits (checked_in_at desc);
create index visits_visitor_id_idx    on public.visits (visitor_id);

create trigger set_updated_at before update on public.visits
  for each row execute procedure public.set_updated_at();

-- 11. ROW LEVEL SECURITY
alter table public.profiles      enable row level security;
alter table public.departments   enable row level security;
alter table public.company_users enable row level security;
alter table public.empreiteiras  enable row level security;
alter table public.visitors      enable row level security;
alter table public.vehicles      enable row level security;
alter table public.visits        enable row level security;

-- Profiles: só o próprio usuário
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Departments
create policy "auth_sel_dep" on public.departments for select using (auth.uid() is not null);
create policy "auth_ins_dep" on public.departments for insert with check (auth.uid() is not null);
create policy "auth_upd_dep" on public.departments for update using (auth.uid() is not null);
create policy "auth_del_dep" on public.departments for delete using (auth.uid() is not null);

-- Company users
create policy "auth_sel_cu" on public.company_users for select using (auth.uid() is not null);
create policy "auth_ins_cu" on public.company_users for insert with check (auth.uid() is not null);
create policy "auth_upd_cu" on public.company_users for update using (auth.uid() is not null);
create policy "auth_del_cu" on public.company_users for delete using (auth.uid() is not null);

-- Empreiteiras
create policy "auth_all_emp" on public.empreiteiras
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Visitors
create policy "auth_sel_vis" on public.visitors for select using (auth.uid() is not null);
create policy "auth_ins_vis" on public.visitors for insert with check (auth.uid() is not null);
create policy "auth_upd_vis" on public.visitors for update using (auth.uid() is not null);
create policy "auth_del_vis" on public.visitors for delete using (auth.uid() is not null);

-- Vehicles
create policy "auth_sel_veh" on public.vehicles for select using (auth.uid() is not null);
create policy "auth_ins_veh" on public.vehicles for insert with check (auth.uid() is not null);
create policy "auth_upd_veh" on public.vehicles for update using (auth.uid() is not null);
create policy "auth_del_veh" on public.vehicles for delete using (auth.uid() is not null);

-- Visits
create policy "auth_sel_vst" on public.visits for select using (auth.uid() is not null);
create policy "auth_ins_vst" on public.visits for insert with check (auth.uid() is not null);
create policy "auth_upd_vst" on public.visits for update using (auth.uid() is not null);
create policy "auth_del_vst" on public.visits for delete using (auth.uid() is not null);

-- Anon read (painel TV)
create policy "anon_read_visits"       on public.visits       for select to anon using (true);
create policy "anon_read_visitors"     on public.visitors     for select to anon using (true);
create policy "anon_read_empreiteiras" on public.empreiteiras for select to anon using (true);

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

-- 13. PERFIS DOS USUÁRIOS
-- (insere ou atualiza — seguro rodar mesmo que o perfil já exista)
insert into public.profiles (id, email, full_name, role, company_name, must_change_password)
values
  ('026579da-4f7d-4c8c-b6c5-895dfaa1714d', 'portariamogi@pscontrol.app', 'Porteiro Mogi Guaçu', 'operator', 'Obra - Mogi Guaçu - SP', false),
  ('03c9398d-fe4a-4b0a-88fb-b8736e512e9f', 'adminmogi@pscontrol.app',   'Admin Mogi Guaçu',    'admin',    'Obra - Mogi Guaçu - SP', false)
on conflict (id) do update set
  full_name            = excluded.full_name,
  role                 = excluded.role,
  company_name         = excluded.company_name,
  must_change_password = excluded.must_change_password;
