-- Habitando · Status do lead + vínculo cenário→lead
-- Habilita workflow ativo: corretor trabalha fila de leads, cria cenário
-- customizado e marca como respondido.

-- ── leads.status ───────────────────────────────────────────────────
alter table public.leads
  add column status text not null default 'novo'
    check (status in ('novo', 'respondido', 'ignorado'));

create index leads_status_idx on public.leads (status);

-- RLS já cobre via policy "auth update own leads" (owner_id = auth.uid())

-- ── shares.lead_id (FK opcional) ──────────────────────────────────
-- Cenário criado especificamente pra um lead — habilita métricas
-- futuras (% conversão lead→cenário) e a UI de "qual cenário foi
-- mandado pra esse lead".
alter table public.shares
  add column lead_id uuid references public.leads(id) on delete set null;

create index shares_lead_idx on public.shares (lead_id) where lead_id is not null;
