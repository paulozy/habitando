-- Habitando · Tracking de cliques em outreach (URLs com ?ref=<nome>)
-- Vercel Web Analytics free não tem custom events, então gravamos as
-- visitas diretamente no Supabase. Anon insert (cliente sem login),
-- owner-only select (só corretor logado vê os contadores).

create table public.ref_visits (
  id         uuid primary key default gen_random_uuid(),
  ref        text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint ref_length check (char_length(ref) between 1 and 64)
);

create index ref_visits_ref_idx on public.ref_visits (ref);
create index ref_visits_created_idx on public.ref_visits (created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────
alter table public.ref_visits enable row level security;

-- Anon insert (cliente sem login clicando no link de outreach)
create policy "anon insert ref_visits" on public.ref_visits
  for insert to anon with check (true);

-- Authenticated insert (no caso do corretor mesmo testando o próprio link)
create policy "auth insert ref_visits" on public.ref_visits
  for insert to authenticated with check (true);

-- SELECT: só authenticated. Sem expor dados pra anon.
create policy "auth select ref_visits" on public.ref_visits
  for select to authenticated using (true);
