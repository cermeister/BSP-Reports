create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  division_name text not null references public.divisions(name) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (division_name, name)
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  division_name text not null,
  district_name text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (division_name, district_name, name)
);

create table if not exists public.bsp_app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.divisions enable row level security;
alter table public.districts enable row level security;
alter table public.schools enable row level security;
alter table public.bsp_app_state enable row level security;

create policy "Allow public divisions access"
on public.divisions
for all
using (true)
with check (true);

create policy "Allow public districts access"
on public.districts
for all
using (true)
with check (true);

create policy "Allow public schools access"
on public.schools
for all
using (true)
with check (true);

create policy "Allow app access for public data"
on public.bsp_app_state
for all
using (true)
with check (true);

insert into public.divisions (name)
values
  ('Butuan City Division'),
  ('Cabadbaran City Division'),
  ('Agusan del Norte Division')
on conflict (name) do nothing;
