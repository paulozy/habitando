# Como gravar o vídeo da hero

Guia passo a passo pra produzir o screencast que vai entrar em
`web/public/demo.mp4` e rodar automaticamente na LP — também serve pra
mandar pros corretores via WhatsApp.

**Tempo estimado:** 30-45 min (gravação + edição básica).

---

## Antes de começar

### 1. Prepare o ambiente

```bash
cd web
pnpm dev
# abre http://localhost:3000
```

- Browser em **modo limpo**: aba nova, sem extensões aparecendo, sem
  bookmark bar (Ctrl+Shift+B esconde no Chrome).
- **Resolução do navegador:** 1920×1080 (16:9). No Mac use a opção
  "Mais Espaço" do display.
- **Zoom da página:** 100% (Cmd+0). Sem zoom no resto do macOS/Windows.
- **Sistema:** silencie notificações (Mac: Foco; Windows: Concentração).
- **Cursor:** opcionalmente esconda o cursor do sistema e use um plugin
  como [Mouseposé](https://boinx.com/mousepose/) ou similar — destaca o
  cursor durante a gravação.

### 2. Limpe o estado do app

No `/simulador`, clique em **"Limpar tudo"** (header), confirme. A app
vai para o estado inicial zerado — assim o vídeo mostra um fluxo
honesto de "começou do zero".

---

## Roteiro (60-90 segundos)

Use o **cenário de auditoria** que tem números bonitos e bate com o
exemplo da LP:

| Campo | Valor |
|---|---|
| Imóvel | R$ 460.151 |
| Financiamento | R$ 338.000 |
| FGTS | R$ 12.000 |
| Períodos | 35 meses |
| Data início | (mês atual) |
| Parcela mensal | R$ 1.975,74 |
| INCC | 0,007 |
| Pós-entrega | R$ 2.996 |
| Ato | R$ 20.000 (1×) |
| Anual | R$ 7.000, todo Dezembro, corrige INCC |
| Custos cartoriais | R$ 18.000, diluído em 12×, mês inicial 3 |
| Renda | R$ 14.580 |
| Gastos fixos | R$ 5.000 |

### Sequência cronometrada

```
0:00–0:03   ABERTURA (estática)
            Logo "HABITANDO" centralizado em fundo escuro.
            Pode ser fade-in.

0:03–0:10   FORM — IMÓVEL
            Nome do cenário: "Apartamento exemplo · 60m²"
            Preenche valor 460.151, financiamento 338.000,
            FGTS 12.000, períodos 35
            (use fast-forward 1.5–2× se editar depois)

0:10–0:15   FORM — ENTRADA
            Parcela mensal 1975,74 · INCC 0,007 · Pós 2996
            Ato 20.000 em 1×
            Para 1s no aviso âmbar de "Parcela sugerida"

0:15–0:20   FORM — ANUAL & CARTORIAIS
            Adiciona anual R$ 7k Dezembro
            Custos cartoriais: 18.000, 12 parcelas, mês 3
            Mostra "Custo total calculado: R$ 18.000"

0:20–0:30   RESULTADOS — FOCO NO INCC
            Scroll até a tabela
            Pausa 2-3s na coluna "INCC mês"
            Mostra a primeira parcela: parcela base + INCC ≈ 4.973
            Indicadores aparecem: Saldo Final R$ 338.000

0:30–0:40   GRÁFICO E COMPARATIVO
            Scroll para o gráfico stacked bar
            Mostra a curva de TEO crescendo até o último mês
            Adiciona um 2º cenário (botão + Cenário) com ato 3×
            Mostra a sugestão "Parcela sobe pra R$ 2.455"

0:40–0:50   COMPARATIVO
            Aba "Comparar"
            Mostra cards lado a lado, gráfico de barras agrupadas
            "Quem vence em Total geral" highlighted

0:50–0:58   EXPORT PDF (WOW MOMENT)
            Volta pra Configuração
            Clica "Exportar PDF" no header
            Nova aba abre /relatorio com a capa
            Scroll rápido mostrando: capa → cenário 1 → cenário 2
              → comparativo
            (esse é o ponto que faz o corretor sair do automático
            mental "outro simulador" pra "uma ferramenta de venda")

0:58–0:60   FECHAMENTO
            Logo Habitando + URL "habitando.app"
            Tagline: "Cliente que entende, fecha."
```

### Dicas de edição

- **Fast-forward** nos trechos de digitação (1.5× a 3×). Câmera lenta
  só nos momentos de impacto: INCC alto, comparativo, PDF abrindo.
- **Sem narração** — música instrumental discreta resolve. Sugestões
  de banco de áudio royalty-free: [Mixkit](https://mixkit.co/free-stock-music/),
  [Pixabay Music](https://pixabay.com/music/), [Uppbeat](https://uppbeat.io/).
- **Cursor visível** mas sem distrair. Spotlight cursor + zoom suave em
  campos importantes faz milagre.
- **Sem áudio de teclado**. Mantém só a música.

---

## Ferramentas recomendadas

### Mac (qualidade premium)

- **[Screen Studio](https://www.screen.studio/)** ⭐ (R$ 600 vitalício)
  - Cursor cinematográfico automático
  - Zoom suave em cliques
  - Resultado idêntico aos vídeos da Vercel/Linear
  - **Recomendação se for investir.**

- **[CleanShot X](https://cleanshot.com/)** (R$ 150 vitalício)
  - Mais barato, edição básica boa
  - Cursor estilizado + GIF/MP4

### Cross-platform (grátis)

- **[OBS Studio](https://obsproject.com/)** — grátis, completo, mais
  curva de aprendizado. Sem cursor estilizado nativo.

- **[Loom](https://www.loom.com/)** — grátis até 25 vídeos. Hospeda
  online (você pode embed via iframe em vez de mp4 local).

### Edição leve

- **[DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve)**
  — grátis, profissional. Curva alta mas faz tudo.
- **iMovie** (Mac) — corte simples, fast-forward, música.
- **[CapCut](https://www.capcut.com/)** (web/desktop) — grátis,
  super amigável, exporta MP4.

---

## Configurações de exportação

Para o `<video>` da LP rodar em loop sem peso excessivo:

| Parâmetro | Valor recomendado |
|---|---|
| Resolução | **1920×1080** (16:9) |
| Codec | **H.264** (compatibilidade universal) |
| Bitrate | 4-6 Mbps (suficiente pra screencast) |
| FPS | **30** (padrão) — 60 só se tiver muito movimento |
| Áudio | **Remova** (a tag do site usa `muted`) |
| Container | **MP4** |
| Tamanho final | Idealmente **< 8 MB** pra LP carregar rápido |

**Comando ffmpeg pra otimizar** (depois de exportar do editor):

```bash
ffmpeg -i original.mp4 \
  -vcodec libx264 -crf 26 -preset slow \
  -vf "scale=1920:1080" \
  -an \
  -movflags +faststart \
  demo.mp4
```

- `-crf 26` = boa compressão sem perda visível pra screencast
- `-preset slow` = melhor compressão (leva mais tempo, vale a pena)
- `-an` = remove áudio
- `-movflags +faststart` = vídeo começa antes de baixar tudo (essencial
  pra autoplay rápido na LP)

---

## Deploy do vídeo

### Opção 1 — Hospedar localmente (recomendado pra MVP)

1. Salve o arquivo como `web/public/demo.mp4`.
2. Build:
   ```bash
   pnpm build
   ```
3. Deploy o diretório `out/` no host (Vercel, Cloudflare Pages,
   Netlify, GitHub Pages).
4. A LP automaticamente reflete o vídeo no autoplay loop.

**Vantagens:** zero dependência externa, sem CDN no caminho crítico,
funciona offline durante demos.

**Limites:** se o arquivo passar de 10 MB, considere a Opção 2.

### Opção 2 — Hospedar no Loom/YouTube/Vimeo

Se quiser tracking de visualizações ou um arquivo grande:

```tsx
// Substituir <video> por <iframe>
<iframe
  src="https://www.loom.com/embed/SEU_ID"
  className="w-full h-full"
  allowFullScreen
/>
```

Cuidado: iframes externos podem perder o efeito "auto-loop silencioso"
da hero — Loom mostra controles, marca d'água, etc.

---

## Versão pro WhatsApp

Para mandar direto via WhatsApp aos corretores:

1. Use o **mesmo arquivo** `demo.mp4` (já dimensionado pra 1920×1080
   funciona bem em smartphone).
2. Limite **WhatsApp aceita até 100 MB** por arquivo. Com a config
   acima fica bem abaixo.
3. **Mensagem sugerida** pra acompanhar:

   > Olá [nome do corretor]! Tô validando uma ferramenta de simulação
   > pra corretores: você manda o link com a sua marca pro cliente, ele
   > preenche, e você recebe o contato direto no seu WhatsApp.
   >
   > Demonstração no site. O diferencial é mostrar o INCC sobre saldo
   > devedor — aquele detalhe que ninguém explica direito.
   >
   > Tá em fase de pré-lançamento, com preço zero. Caso o produto seja
   > validado, o plano é cobrar R$ 49/mês para os corretores que ajudaram
   > a validar. Topa um papo de 15 min pra eu mostrar?
   >
   > Site: habitando.app

---

## Checklist final

Antes de mandar/publicar o vídeo:

- [ ] Rodou `pnpm build` sem erros
- [ ] Vídeo dura entre **60-90 segundos**
- [ ] Resolução **1920×1080** (não 1280×720)
- [ ] Áudio removido (`-an` no ffmpeg) ou música de fundo livre
- [ ] Tamanho do arquivo < 8 MB (testar `ls -lh demo.mp4`)
- [ ] Cursor visível, sem cliques perdidos
- [ ] Mostrou o "wow moment" do PDF nos últimos 8-10s
- [ ] Termina com brand "Habitando · habitando.app"
- [ ] Salvou em `web/public/demo.mp4`
- [ ] Verificou que `<video>` da LP carrega o arquivo após build

---

## Bonus: sequência alternativa (90s focado em PDF)

Se quiser que o foco seja o PDF (feature paga principal), inverta a
ordem:

```
0:00–0:05   Logo HABITANDO + tagline
0:05–0:20   Form preenchido em fast-forward (15s só)
0:20–0:35   Tabela + indicadores (foco no INCC)
0:35–0:45   Comparativo
0:45–1:25   PDF EXPORT — câmera lenta, scroll completo,
            zoom em cada seção do relatório
            (40 segundos só na ferramenta de PDF —
            corretor sente que vale o investimento)
1:25–1:30   Logo + CTA
```

PDF é o que justifica o R$ 49/mês. Vale dedicar 40-50% do vídeo a ele.
