# Simulador Financeiro Imobiliário (Next.js)

App estático que simula o fluxo de caixa da compra de um imóvel na planta:
entrada parcelada com correção INCC, TEO bancário, parcelas anuais, documentação
diluída e ITBI nos 3 modos (alíquota / valor total / itemizado).

Suporta **até 4 cenários comparáveis** lado a lado, com até 4 compradores cada,
e compartilhamento por link (URL com payload comprimido) ou export/import JSON.

## Stack

- Next.js 16 App Router (`output: 'export'` — SPA estática, deployável em qualquer CDN)
- TypeScript strict
- Tailwind CSS 4 (tokens via `@theme` em `app/globals.css`)
- React Hook Form + Zod (validação e tipos)
- Zustand (cenários + persistência)
- Recharts (stacked bar e gráfico comparativo)
- lz-string (compressão do payload de URL share)
- Vitest (engine puro com fixtures)

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # roda Vitest (engine + store + url-state)
pnpm test:watch   # modo watch
pnpm build        # gera /out estático
```

Para servir localmente o build estático:

```bash
pnpm build
npx serve out
```

## Estrutura

```
app/
  layout.tsx              fonts DM Sans/Serif/Mono, NuqsAdapter, html lang=pt-BR
  page.tsx                client component principal (form + tabs + comparativo)
  globals.css             tokens de paleta + Tailwind
components/
  ui/primitives.tsx       Button, Input, Card, Tabs, Badge, NumberInputBR, MesesChips
  form/sections.tsx       seções do form (compradores, imóvel, entrada, ato,
                          anuais, evolução, ITBI, documentação)
  results/index.tsx       StatCards, ParcelasTable (14 cols), FluxoChart, Parecer
  scenarios/              ScenarioBar (tabs) e ScenarioComparar (lado a lado)
  share/share-controls.tsx
lib/
  calculation-engine/     engine puro (zero React) — schemas, cálculos, validações
  storage/                Zustand store + persist (URL > localStorage > default)
  url-state/              encode/decode com lz-string e versionamento
  presets.ts              3 exemplos genéricos (35m, 35m leve, 48m)
tests/                    Vitest specs
```

## Cenários e share

- O estado do app é uma lista `Scenario[]` no store Zustand
  (`lib/storage/use-scenarios-store.ts`), limitada a 4 cenários.
- O cenário ativo é espelhado no React Hook Form. Mudanças no form persistem
  no store com debounce 200 ms.
- **Compartilhar por link** serializa todos os cenários, comprime com lz-string e
  injeta em `?s=...`. Ao abrir um link com `?s=`, o app hidrata o store e remove
  o param do URL.
- **Importar/Exportar JSON** disponibiliza o mesmo payload em arquivo
  (`simulacao-AAAA-MM-DD.json`).
- **Persistência local** via `localStorage["can-i-buy:scenarios"]`, com sincronização
  cross-tab via `storage` event.

## Versionamento de payload

O payload tem envelope `{ v: 1, scenarios: [...] }`. Para evoluir o schema sem
quebrar URLs antigas, bumpe `LATEST_SCHEMA_VERSION` em
`lib/url-state/index.ts` e adicione um migrator puro em `migrators[<from>]`.

## Deploy

A app é 100% estática; o output em `out/` pode ser servido por qualquer CDN.

- **Vercel**: build automático com `next build`. Funciona out-of-box.
- **GitHub Pages**: publique o conteúdo de `out/` no branch `gh-pages`.
- **Cloudflare Pages / Netlify / Nginx / S3**: idem.

## Sem dados pessoais

O app é genérico. Não há referências a nomes próprios, cidades específicas ou
casos pessoais — somente "Comprador 1..N", "Cenário N" e exemplos derivados de
`../regras.md`.
