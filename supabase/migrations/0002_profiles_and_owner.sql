-- Habitando · Auth foundation
-- Adiciona profiles (1:1 com auth.users) e owner_id em shares.
-- RLS reescrita pra "dual world": anon legacy continua funcionando,
-- authenticated users são donos dos seus shares.

-- ── profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  whatsapp    text,                                 -- 12-13 dígitos com DDI, opcional
  slug        text unique,                          -- pra white-label futuro (joao.habitando.app)
  plano       text not null default 'free',         -- 'free' | 'corretor' | 'imobiliaria'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_slug_idx on public.profiles (slug) where slug is not null;

-- ── trigger: cria profile ao registrar usuário ─────────────────────────
-- Lê nome + whatsapp do raw_user_meta_data (passado em signUp options.data).
-- Fallback de nome: parte antes do @ do email.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, whatsapp)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data->>'whatsapp'), '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── trigger: bumpa updated_at em update ─────────────────────────────────
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_shares_updated_at();

-- ── RLS: profiles ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "self select" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "self update" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- delete fica fechado — usuário não deleta o próprio profile (cascade do auth.users cuida)

-- ── shares: ganha owner_id (nullable, mantém anon legacy) ──────────────
alter table public.shares
  add column owner_id uuid references auth.users(id) on delete set null;

create index shares_owner_idx on public.shares (owner_id) where owner_id is not null;

-- ── RLS: shares — reescrita dual world ─────────────────────────────────
drop policy if exists "anon select" on public.shares;
drop policy if exists "anon insert" on public.shares;
drop policy if exists "anon update" on public.shares;

-- Read: qualquer um com o ID lê. ID é a capability — mantém o pitch atual
-- de "compartilhar via WhatsApp" funcionando sem login.
create policy "public read by id" on public.shares
  for select to anon, authenticated
  using (true);

-- Anon insert: só sem owner (cliente anônimo OU corretor anônimo legacy).
create policy "anon insert unowned" on public.shares
  for insert to anon
  with check (owner_id is null);

-- Anon update: cliente que recebeu o link pode editar. NÃO pode mudar o
-- owner_id — preserva o que estava na linha.
create policy "anon update preserve owner" on public.shares
  for update to anon
  using (true)
  with check (
    owner_id is not distinct from
      (select s.owner_id from public.shares s where s.id = shares.id)
  );

-- Authenticated: faz tudo nos próprios + cria/atualiza shares sem dono
-- (pra cobrir o fluxo "corretor logado gera link novo").
create policy "auth select all" on public.shares
  for select to authenticated
  using (true);

create policy "auth insert own or unowned" on public.shares
  for insert to authenticated
  with check (owner_id = auth.uid() or owner_id is null);

create policy "auth update own or unowned" on public.shares
  for update to authenticated
  using (owner_id = auth.uid() or owner_id is null)
  with check (owner_id = auth.uid() or owner_id is null);
