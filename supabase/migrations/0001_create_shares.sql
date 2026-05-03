-- Habitando · Schema inicial para compartilhamento corretor↔cliente
-- Single table `shares` com payload completo (scenarios + corretor) em jsonb.
-- RLS aberta pro role anon: segurança é o ID secreto (10-char nanoid).
-- delete fica fechado (default-deny) pra não dar gatilho de exclusão acidental.

create extension if not exists "pgcrypto";

create table public.shares (
  id          text primary key,
  payload     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger pra bumpar updated_at em todo update
create or replace function public.touch_shares_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shares_touch_updated_at
  before update on public.shares
  for each row execute procedure public.touch_shares_updated_at();

-- RLS
alter table public.shares enable row level security;

create policy "anon select" on public.shares
  for select to anon
  using (true);

create policy "anon insert" on public.shares
  for insert to anon
  with check (true);

create policy "anon update" on public.shares
  for update to anon
  using (true)
  with check (true);

-- delete: sem policy = nenhum acesso
