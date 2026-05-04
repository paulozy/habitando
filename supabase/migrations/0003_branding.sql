-- Habitando · White-label MVP
-- Adiciona colunas de branding em profiles + função de slug reservado +
-- funções públicas pra fetch de branding sem expor PII.
-- Bucket de Storage `branding` precisa ser criado separadamente (Studio
-- ou via SQL no fim deste arquivo).

-- ── Colunas de branding ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists logo_url text,
  add column if not exists cor_primaria text
    check (cor_primaria is null or cor_primaria ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists tagline text
    check (tagline is null or char_length(tagline) <= 80);

-- ── Função de slug reservado ────────────────────────────────────────
create or replace function public.is_reserved_slug(s text)
returns boolean
language sql
immutable
as $$
  select s in (
    -- Rotas/áreas funcionais
    'auth','login','entrar','signin','signup','cadastrar','logout','sair',
    'simulador','simulator','c','api','app','admin','root',
    'suporte','support','ajuda','help','faq','sobre','about','contato',
    'privacidade','privacy','termos','terms','lgpd',
    'relatorio','relatorios','meus-links','dashboard','painel',
    'conta','account','perfil','profile','settings','configuracoes',
    'billing','pagamento','pricing','planos','home','www','mail','blog',
    'status','docs','recuperar-senha','recuperar',
    -- Marcas (defesa proativa contra squatting)
    'habitando','housi','vivareal','zap','quintoandar','loft','magalu',
    'google','facebook','meta','instagram','whatsapp'
  );
$$;

-- ── Constraints de slug (formato + reservado) ──────────────────────
-- Drop antes de recriar pra ser idempotente
alter table public.profiles drop constraint if exists slug_format;
alter table public.profiles drop constraint if exists slug_not_reserved;

alter table public.profiles
  add constraint slug_format
  check (slug is null or slug ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$');

alter table public.profiles
  add constraint slug_not_reserved
  check (slug is null or not public.is_reserved_slug(slug));

-- ── Funções públicas pra fetch de branding (sem expor PII) ─────────
-- Cliente abre o link e precisa renderizar logo + cor do corretor.
-- Não pode ler `whatsapp` ou outros campos sensíveis. Estas funções
-- retornam só os campos brandeáveis.
create or replace function public.get_public_branding(profile_id uuid)
returns table(
  id uuid,
  slug text,
  nome text,
  logo_url text,
  cor_primaria text,
  tagline text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, slug, nome, logo_url, cor_primaria, tagline
  from public.profiles
  where id = profile_id;
$$;

create or replace function public.get_public_branding_by_slug(_slug text)
returns table(
  id uuid,
  slug text,
  nome text,
  logo_url text,
  cor_primaria text,
  tagline text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, slug, nome, logo_url, cor_primaria, tagline
  from public.profiles
  where slug = _slug;
$$;

grant execute on function public.get_public_branding(uuid) to anon, authenticated;
grant execute on function public.get_public_branding_by_slug(text) to anon, authenticated;

-- ── Storage bucket pra logos ───────────────────────────────────────
-- Idempotente: cria se não existir
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Drop policies se existirem (idempotência)
drop policy if exists "branding read" on storage.objects;
drop policy if exists "branding upload own" on storage.objects;
drop policy if exists "branding update own" on storage.objects;
drop policy if exists "branding delete own" on storage.objects;

-- Read público (logo precisa ser visível pro cliente sem auth)
create policy "branding read" on storage.objects
  for select
  using (bucket_id = 'branding');

-- Upload: corretor logado, em pasta com seu user_id (logos/<uid>/...)
create policy "branding upload own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'logos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "branding update own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "branding delete own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
