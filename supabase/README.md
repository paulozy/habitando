# Supabase setup — Habitando

Backend mínimo pra short links de compartilhamento (sem login, sem realtime).

## Setup novo projeto (uma vez)

1. **Criar projeto** em https://supabase.com (free tier OK pra MVP):
   - Region: South America (São Paulo) — menor latência pra usuários BR
   - Database password: anote, vai precisar pro `db push`

2. **Aplicar migrações** (em ordem):
   - **Opção A — Studio (mais rápido)**:
     - Project → SQL Editor → New query
     - Copia conteúdo de `migrations/0001_create_shares.sql` → Run
     - Repete pra `migrations/0002_profiles_and_owner.sql`
     - Repete pra `migrations/0003_branding.sql` (cria bucket Storage automaticamente)
     - Repete pra `migrations/0004_leads.sql`
     - Repete pra `migrations/0005_leads_status_and_share_link.sql`
   - **Opção B — CLI** (recomendado pra repositório versionado):
     ```bash
     # De dentro de web/ (onde está este supabase/ folder)
     npx supabase login
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```

3. **Copiar credenciais**:
   - Project Settings → API
   - Pegar `Project URL` e `anon public` key

4. **Configurar env vars locais** (`.env.local` em `web/`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

5. **Vercel — adicionar env vars**:
   - Project Settings → Environment Variables
   - Adicionar as 2 acima em **Production** e **Preview**

6. **Configurar Auth no Dashboard** (Authentication →):
   - **Providers → Email**:
     - "Confirm email" **OFF** (validação rápida; re-habilita ao mandar email transacional)
     - "Email & Password" **ON**
   - **Sign Ups**: **Enabled** (default)
   - **URL Configuration**:
     - Site URL: `https://habitando.app` (ou seu domínio prod)
     - Redirect URLs (adicionar): `http://localhost:3000`, `http://localhost:3000/auth/callback`, e a URL prod com `/auth/callback`
   - **Sessions**: defaults estão OK (JWT expiry 1h, refresh token reutilizável)

## Validar

Após setup:
```bash
cd web
pnpm dev
```

No simulador, configurar identidade e clicar Compartilhar. Link deve sair como `localhost:3000/simulador/?c=10chars`. Abrir em aba anônima → cenário hidratado.

No Studio (Project → Table Editor → shares), você deve ver a row criada.

## Schema

### `shares`
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | nanoid(10), URL-safe |
| `payload` | `jsonb` | SharePayload v6 (scenarios + corretor opcional) |
| `owner_id` | `uuid` (FK auth.users) | nullable — null = anônimo legacy |
| `lead_id` | `uuid` (FK leads) | nullable — vincula cenário criado pra um lead específico |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | trigger bumpa em todo `update` |

**RLS dual world**:
- Anon: read por id ✓, insert sem owner ✓, update preservando owner ✓ (cliente edita link do corretor sem trocar dono)
- Authenticated: read tudo, insert/update próprios e órfãos

### `profiles` (1:1 com `auth.users`)
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK (FK auth.users) | cascade delete |
| `nome` | `text` | preenchido via trigger no signup |
| `whatsapp` | `text?` | 12-13 dígitos com DDI, opcional |
| `slug` | `text?` UNIQUE | white-label vanity URL (`/c/<slug>/<id>`) |
| `plano` | `text` | default `'free'` |
| `logo_url` | `text?` | URL pública do Supabase Storage |
| `cor_primaria` | `text?` | hex `#rrggbb` |
| `tagline` | `text?` | até 80 chars |
| `created_at`, `updated_at` | `timestamptz` | |

**RLS**: usuário só lê/edita o próprio profile diretamente. Branding (campos públicos) acessível via RPC pública.

**Constraints de slug**:
- Formato: `^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$` (3-30 chars, lowercase, sem hyphen no início/fim)
- Não pode estar na lista de palavras reservadas (rotas + marcas BR)

**RPC públicas** (acessíveis por anon):
- `get_public_branding(profile_id uuid)` — retorna nome/logo/cor/tagline/slug, sem PII (whatsapp/email)
- `get_public_branding_by_slug(_slug text)` — mesma coisa, lookup por slug

**Trigger**: `on_auth_user_created` cria a row em `profiles` lendo `nome`/`whatsapp` de `raw_user_meta_data` (passado em `signUp options.data`).

### `leads`
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | gen_random_uuid |
| `share_id` | `text` (FK shares) | cascade delete |
| `owner_id` | `uuid` (FK auth.users) | denormalized pra RLS perf |
| `nome` | `text?` | opcional |
| `email` / `whatsapp` | `text?` | check: pelo menos um obrigatório |
| `consent_lgpd` | `boolean` | obrigatório true pra insert |
| `consent_at` | `timestamptz` | quando deu consentimento |
| `user_agent` | `text?` | informativo |
| `payload_snapshot` | `jsonb?` | scenarios que cliente viu no momento |
| `status` | `text` | `novo` (default) \| `respondido` \| `ignorado` |
| `created_at`, `updated_at` | `timestamptz` | |

**Unique index** `(share_id, coalesce(email, whatsapp))` — dedupe via upsert.

**RLS**:
- `anon insert/update`: só com `consent_lgpd=true` E share existe + owner_id bate
- `authenticated select/update/delete`: só `owner_id = auth.uid()` (corretor lê seus leads)

### Storage: bucket `branding`

- Public read (cliente vê logo sem login)
- Path: `branding/logos/<user_id>/<filename>`
- RLS: corretor só faz insert/update/delete em pasta com seu próprio `user_id`
- Limite recomendado: 512 KB (resize client-side a 512px no maior lado antes de upload)
- Formatos aceitos: PNG, WebP. SVG fora do MVP (precisa sanitização DOMPurify).

## Limites do free tier

- 500 MB DB → ~100k shares (cada ~5 KB)
- 5 GB egress/mês
- 50k MAU
- Pause após 7 dias sem atividade (acorda no primeiro request)

Suficiente pra fase de validação. Quando virar problema, é hora de cobrar. 🙂

## v2 (não implementar agora)

- `edit_token` separando read/write — quando começar a aparecer vandal
- Auto-delete via `pg_cron` (shares > 90 dias)
- Tabela `share_events` pra analytics (cliente abriu, mexeu)
- Hash do WhatsApp em vez de cleartext (pra LGPD)
- Página `/privacidade` com aviso obrigatório antes de divulgação pública
