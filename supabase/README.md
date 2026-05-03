# Supabase setup — Habitando

Backend mínimo pra short links de compartilhamento (sem login, sem realtime).

## Setup novo projeto (uma vez)

1. **Criar projeto** em https://supabase.com (free tier OK pra MVP):
   - Region: South America (São Paulo) — menor latência pra usuários BR
   - Database password: anote, vai precisar pro `db push`

2. **Aplicar migração**:
   - **Opção A — Studio (mais rápido)**:
     - Project → SQL Editor → New query
     - Copia conteúdo de `migrations/0001_create_shares.sql` → Run
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

## Validar

Após setup:
```bash
cd web
pnpm dev
```

No simulador, configurar identidade e clicar Compartilhar. Link deve sair como `localhost:3000/simulador/?c=10chars`. Abrir em aba anônima → cenário hidratado.

No Studio (Project → Table Editor → shares), você deve ver a row criada.

## Schema

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | nanoid(10), URL-safe |
| `payload` | `jsonb` | SharePayload v6 (scenarios + corretor opcional) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | trigger bumpa em todo `update` |

**RLS**: policies abertas pra `anon` em select/insert/update. Delete fica fechado por default-deny.

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
