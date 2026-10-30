create table if not exists public.bsp_app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.bsp_app_state enable row level security;

create policy "Allow app access for public data"
on public.bsp_app_state
for all
using (true)
with check (true);
