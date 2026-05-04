-- Habitando · Captura de leads do cliente
-- Tabela leads ligada a (share_id, owner_id) com check constraint
-- "email OR whatsapp". Snapshot do payload do cenário no momento do
-- submit pra contexto histórico (cliente pode editar depois).

create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  share_id         text not null references public.shares(id) on delete cascade,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  nome             text,
  email            text,
  whatsapp         text,                                -- 12-13 dígitos com DDI
  consent_lgpd     boolean not null default false,
  consent_at       timestamptz not null default now(),
  user_agent       text,
  payload_snapshot jsonb,                               -- snapshot do scenarios no submit
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint contact_required check (email is not null or whatsapp is not null)
);

-- ── Dedupe + indexes ───────────────────────────────────────────────
-- Unique por (share, contato) — coalesce(email, whatsapp) garante que
-- cliente não cria N leads no mesmo share. Upsert silencioso atualiza
-- updated_at em vez de erro.
create unique index leads_share_contact_uniq
  on public.leads (share_id, coalesce(email, whatsapp));

create index leads_owner_idx on public.leads (owner_id);
create index leads_share_idx on public.leads (share_id);

-- ── Trigger updated_at ─────────────────────────────────────────────
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute procedure public.touch_shares_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────
alter table public.leads enable row level security;

-- Anon insert: cliente sem login submete contato. Validação:
-- - consent_lgpd = true (LGPD)
-- - share existe E owner_id da row bate com owner_id real do share
--   (evita inserir lead apontando pra outro corretor)
create policy "anon insert lead" on public.leads
  for insert to anon
  with check (
    consent_lgpd = true
    and exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_id = leads.owner_id
    )
  );

-- Authenticated insert (corretor logado testando próprio link)
create policy "auth insert lead" on public.leads
  for insert to authenticated
  with check (
    consent_lgpd = true
    and exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_id = leads.owner_id
    )
  );

-- SELECT: só o dono dos shares lê seus próprios leads
create policy "owner reads leads" on public.leads
  for select to authenticated
  using (owner_id = auth.uid());

-- UPDATE: anon precisa atualizar updated_at no upsert
create policy "anon update lead" on public.leads
  for update to anon
  using (
    exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_id = leads.owner_id
    )
  )
  with check (
    consent_lgpd = true
    and exists (
      select 1 from public.shares s
      where s.id = share_id and s.owner_id = leads.owner_id
    )
  );

create policy "auth update own leads" on public.leads
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- DELETE: só dono
create policy "owner deletes leads" on public.leads
  for delete to authenticated
  using (owner_id = auth.uid());
