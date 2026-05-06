-- ============================================================
-- PS Control — Schema Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ============================================================
-- PROFILES (criado automaticamente ao criar usuário Auth)
-- ============================================================
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text,
  full_name            text,
  role                 text not null default 'operator' check (role in ('admin', 'operator')),
  must_change_password boolean not null default true,
  company_name         text,
  company_logo_url     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Trigger: auto-cria profile ao criar usuário Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: atualiza updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
create table if not exists public.departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- COMPANY USERS (funcionários internos)
-- ============================================================
create table if not exists public.company_users (
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

-- Índice para autocomplete por nome
create index if not exists company_users_fullname_trgm_idx
  on public.company_users using gin (full_name gin_trgm_ops);

create trigger set_updated_at before update on public.company_users
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- VISITORS (visitantes externos)
-- ============================================================
create table if not exists public.visitors (
  id               uuid primary key default uuid_generate_v4(),
  full_name        text not null,
  cpf              text unique,
  rg               text,
  phone            text,
  blacklisted      boolean not null default false,
  blacklist_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índice para busca por prefixo de CPF/RG
create index if not exists visitors_cpf_idx on public.visitors (cpf);
create index if not exists visitors_rg_idx  on public.visitors (rg);

create trigger set_updated_at before update on public.visitors
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- VEHICLES
-- ============================================================
create table if not exists public.vehicles (
  id         uuid primary key default uuid_generate_v4(),
  plate      text not null unique,
  owner_name text not null,
  company    text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VISITS
-- ============================================================
do $$ begin
  create type public.visitor_type_enum as enum ('employee', 'supplier', 'contractor', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.visit_status_enum as enum ('active', 'completed');
exception when duplicate_object then null;
end $$;

create table if not exists public.visits (
  id              uuid primary key default uuid_generate_v4(),
  visitor_id      uuid not null references public.visitors(id) on delete restrict,
  company_user_id uuid references public.company_users(id) on delete set null,
  visitor_type    public.visitor_type_enum not null default 'other',
  purpose         text,
  vehicle_plate   text,
  status          public.visit_status_enum not null default 'active',
  checked_in_at   timestamptz not null default now(),
  checked_out_at  timestamptz,
  notes           text,
  badge_printed   boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists visits_status_idx        on public.visits (status);
create index if not exists visits_checked_in_at_idx on public.visits (checked_in_at desc);
create index if not exists visits_visitor_id_idx    on public.visits (visitor_id);

create trigger set_updated_at before update on public.visits
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.departments   enable row level security;
alter table public.company_users enable row level security;
alter table public.visitors      enable row level security;
alter table public.vehicles      enable row level security;
alter table public.visits        enable row level security;

-- Profiles: usuário vê e edita só o próprio row
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Demais tabelas: qualquer usuário autenticado pode ler e escrever
drop policy if exists "authenticated read" on public.departments;
drop policy if exists "authenticated write" on public.departments;
drop policy if exists "authenticated access" on public.departments;
create policy "authenticated read" on public.departments
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.departments
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.departments
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.departments
  for delete using (auth.uid() is not null);

drop policy if exists "authenticated read" on public.company_users;
drop policy if exists "authenticated write" on public.company_users;
drop policy if exists "authenticated access" on public.company_users;
create policy "authenticated read" on public.company_users
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.company_users
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.company_users
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.company_users
  for delete using (auth.uid() is not null);

drop policy if exists "authenticated read" on public.visitors;
drop policy if exists "authenticated write" on public.visitors;
drop policy if exists "authenticated access" on public.visitors;
create policy "authenticated read" on public.visitors
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.visitors
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.visitors
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.visitors
  for delete using (auth.uid() is not null);

drop policy if exists "authenticated read" on public.vehicles;
drop policy if exists "authenticated write" on public.vehicles;
drop policy if exists "authenticated access" on public.vehicles;
create policy "authenticated read" on public.vehicles
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.vehicles
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.vehicles
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.vehicles
  for delete using (auth.uid() is not null);

drop policy if exists "authenticated read" on public.visits;
drop policy if exists "authenticated write" on public.visits;
drop policy if exists "authenticated access" on public.visits;
create policy "authenticated read" on public.visits
  for select using (auth.uid() is not null);
create policy "authenticated write" on public.visits
  for insert with check (auth.uid() is not null);
create policy "authenticated update" on public.visits
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated delete" on public.visits
  for delete using (auth.uid() is not null);

-- ============================================================
-- FUNÇÕES RPC (gráficos do Dashboard)
-- ============================================================
create or replace function public.get_hourly_entries(p_day date)
returns table(hour int, count bigint)
language sql security definer as $$
  select
    extract(hour from checked_in_at)::int as hour,
    count(*) as count
  from public.visits
  where checked_in_at::date = p_day
  group by 1
  order by 1;
$$;

create or replace function public.get_weekly_entries()
returns table(day date, count bigint)
language sql security definer as $$
  select
    checked_in_at::date as day,
    count(*) as count
  from public.visits
  where checked_in_at >= now() - interval '7 days'
  group by 1
  order by 1;
$$;

-- ============================================================
-- STORAGE BUCKET (logo da empresa)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "authenticated storage access" on storage.objects;
create policy "authenticated storage read" on storage.objects
  for select using (bucket_id = 'company-assets' and auth.uid() is not null);
create policy "authenticated storage write" on storage.objects
  for insert with check (bucket_id = 'company-assets' and auth.uid() is not null);
create policy "authenticated storage update" on storage.objects
  for update using (bucket_id = 'company-assets' and auth.uid() is not null);
create policy "authenticated storage delete" on storage.objects
  for delete using (bucket_id = 'company-assets' and auth.uid() is not null);
