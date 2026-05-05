"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, StatCard } from "@/components/ui/primitives";
import {
  fmt,
  type ParecerItem,
  type ResultadoSimulacao,
  type RowSimulacao,
  type ValidacaoResultado,
} from "@/lib/calculation-engine";
import { cn } from "@/lib/utils";

/* ============================================================
 *  Stat Cards (8)
 * ============================================================ */
export function StatCards({
  result,
}: {
  result: ResultadoSimulacao;
}) {
  const s = result.stats;
  const periodo = result.rows.length;
  const ccDiluido = s.totalDocumentacao > 0;
  const inccAbsorvido = s.totalINCCAbsorvidoSaldo > 0;

  return (
    <div className="space-y-4">
      {/* Desembolso */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-2">
          💰 Desembolso
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            tone="blue"
            label="Total geral"
            value={fmt.formatBRL(s.totalGeral)}
            sub={`${periodo}m + ato + cartoriais`}
          />
          <StatCard
            tone="ink"
            label="Média mensal"
            value={fmt.formatBRL(s.mediaGeral)}
            sub={`${periodo} meses`}
          />
          <StatCard
            tone="green"
            label="Menor mês"
            value={fmt.formatBRL(s.minimo)}
            sub="Mês mais barato"
          />
          <StatCard
            tone="red"
            label="Maior mês"
            value={fmt.formatBRL(s.maximo)}
            sub="Mês mais caro"
          />
          <StatCard
            tone="amber"
            label="Pico anual"
            value={fmt.formatBRL(s.picoDezembros)}
            sub={
              s.picoDezembros > 0
                ? "Maior valor em mês com parcela anual"
                : "Sem parcela anual configurada"
            }
          />
          <StatCard
            tone="green"
            label="Mês normal (máx)"
            value={fmt.formatBRL(s.maxNormal)}
            sub="Pior mês fora dos anuais"
          />
          <StatCard
            tone="red"
            label="Custos cartoriais"
            value={fmt.formatBRL(s.totalCustosCartoriais)}
            sub={ccDiluido ? "Diluído nas parcelas" : "Pago na entrega"}
          />
          <StatCard
            tone="amber"
            label="Ato (à vista)"
            value={fmt.formatBRL(s.totalAto)}
            sub={
              s.totalAto > 0
                ? s.mesesAto > 0
                  ? `Parcelado em ${s.mesesAto}×`
                  : "Pago na assinatura"
                : "Sem ato configurado"
            }
          />
        </div>
      </div>

      {/* Saldo & INCC */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-2">
          💸 Saldo devedor & INCC
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            tone="amber"
            label="Saldo inicial"
            value={fmt.formatBRL(s.saldoInicial)}
            sub="Imóvel − ato − FGTS"
          />
          <StatCard
            tone={inccAbsorvido ? "red" : "green"}
            label="Saldo final"
            value={fmt.formatBRL(s.saldoFinal)}
            sub={
              inccAbsorvido
                ? `+${fmt.formatBRL(s.diferencaFinanciamento)} vs nominal`
                : "Vira financiamento bancário"
            }
          />
          <StatCard
            tone="violet"
            label="INCC total"
            value={fmt.formatBRL(s.totalINCC)}
            sub={
              inccAbsorvido
                ? `${fmt.formatBRL(s.totalINCCAbsorvidoSaldo)} no saldo`
                : `${fmt.formatBRL(s.totalINCCPagoCliente)} pago no fluxo`
            }
          />
          <StatCard
            tone="ink"
            label="INCC máx. → mín."
            value={`${fmt.formatBRL(s.maxINCC)} → ${fmt.formatBRL(s.minINCC)}`}
            sub="Variação do INCC mensal (cai com o tempo)"
          />
        </div>
      </div>

      {/* Taxa de evolução de obra (TEO) */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-2">
          🏗️ Taxa de evolução de obra (TEO · pago ao banco · = parcela × % acumulado, teto 95%)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            tone="blue"
            label="TEO total"
            value={fmt.formatBRL(s.totalTEO)}
            sub={`Soma de ${periodo} meses`}
          />
          <StatCard
            tone="green"
            label="TEO mín. mensal"
            value={fmt.formatBRL(s.minTEO)}
            sub="Primeiro mês (obra inicial)"
          />
          <StatCard
            tone="red"
            label="TEO máx. mensal"
            value={fmt.formatBRL(s.maxTEO)}
            sub="Último mês (obra perto do fim)"
          />
          <StatCard
            tone="ink"
            label="Evolução total"
            value={`${s.evolucaoTotal.toFixed(1)}%`}
            sub="Soma do % concluído por mês"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  Tabela detalhada
 * ============================================================ */
export function ParcelasTable({
  result,
}: {
  result: ResultadoSimulacao;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-card overflow-hidden"
      role="region"
      aria-label="Tabela de parcelas mensais"
    >
      <div className="overflow-x-auto table-scroll">
        <table className="w-full text-[11.5px] tabular-nums">
          <caption className="sr-only">
            Detalhamento mensal: parcelas de construtora, INCC, TEO bancário, documentação, total e disponibilidade.
          </caption>
          <thead className="bg-ink text-[8.5px] tracking-[0.08em] uppercase">
            <tr className="text-ink-muted">
              <th rowSpan={2} className="px-2 py-2 align-middle text-center text-white">
                Mês
              </th>
              <th rowSpan={2} className="px-2 py-2 align-middle text-left text-[#8fa3b8]">
                Data
              </th>
              <th colSpan={2} className="px-2 py-1 text-center text-accent border-b border-white/5 bg-white/[0.04]">
                Evolução
              </th>
              <th colSpan={4} className="px-2 py-1 text-center text-accent border-b border-white/5 bg-white/[0.04]">
                💰 Saldo Devedor & INCC
              </th>
              <th colSpan={4} className="px-2 py-1 text-center text-accent border-b border-white/5 bg-white/[0.04]">
                📋 Pagamentos do Cliente
              </th>
              <th colSpan={2} className="px-2 py-1 text-center text-accent border-b border-white/5 bg-white/[0.04]">
                🏦 Banco / 📄 Cart.
              </th>
              <th colSpan={3} className="px-2 py-1 text-center text-accent border-b border-white/5 bg-white/[0.04]">
                Resumo Mês
              </th>
            </tr>
            <tr className="text-[#8fa3b8]">
              <th scope="col" className="px-2 py-2 text-right">Mês %</th>
              <th scope="col" className="px-2 py-2 text-right">Acum %</th>
              <th scope="col" className="px-2 py-2 text-right">Saldo</th>
              <th scope="col" className="px-2 py-2 text-right">INCC mês</th>
              <th scope="col" className="px-2 py-2 text-right">INCC acum</th>
              <th scope="col" className="px-2 py-2 text-right">Parcela base</th>
              <th scope="col" className="px-2 py-2 text-right">+ INCC</th>
              <th scope="col" className="px-2 py-2 text-right">Ato</th>
              <th scope="col" className="px-2 py-2 text-right">Anual</th>
              <th scope="col" className="px-2 py-2 text-right">TEO</th>
              <th scope="col" className="px-2 py-2 text-right">Cart.</th>
              <th scope="col" className="px-2 py-2 text-right">TOTAL</th>
              <th scope="col" className="px-2 py-2 text-right">% Renda</th>
              <th scope="col" className="px-2 py-2 text-right">Disp.</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <Row key={r.mes} r={r} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-paper-alt border-t border-border text-[11.5px] text-ink-soft">
        <LegendItem color="bg-amber-soft border border-amber-soft/60">Mês com parcela anual</LegendItem>
        <LegendItem color="bg-blue-soft border border-blue-soft/60">Mês de Ato</LegendItem>
        <LegendItem color="bg-green">{"<"}40% renda</LegendItem>
        <LegendItem color="bg-amber">40–70% renda</LegendItem>
        <LegendItem color="bg-red">{">"}70% renda</LegendItem>
      </div>
    </div>
  );
}

function Row({ r }: { r: RowSimulacao }) {
  const isAnual = r.anual > 0;
  const isAto = r.isMesAto;
  const rowCls = isAto
    ? "bg-blue-soft/40 hover:bg-blue-soft"
    : isAnual
      ? "bg-amber-soft/40 hover:bg-amber-soft"
      : "hover:bg-blue-soft/40";
  const pcCls =
    r.pctRenda > 70 ? "bg-red" : r.pctRenda > 40 ? "bg-amber" : "bg-green";
  const dispBadge =
    r.disponivel < 0 ? "danger" : r.disponivel < 1500 ? "warn" : "ok";

  return (
    <tr className={cn("border-b border-paper-alt transition-colors", rowCls)}>
      <td className="px-2 py-2 text-center font-semibold text-ink">{r.mes}</td>
      <td className="px-2 py-2 text-left text-ink-muted text-[11px]">
        {fmt.formatMesAno(r.data)}
        {isAnual && (
          <span className="ml-1 text-[9px] text-amber font-semibold">+13º</span>
        )}
      </td>
      <td className="px-2 py-2 text-right">{r.evolucao.toFixed(1)}%</td>
      <td className="px-2 py-2 text-right text-ink-soft text-[11px] font-semibold">
        {r.evolucaoAcum.toFixed(1)}%
      </td>
      <td className="px-2 py-2 text-right text-ink-muted text-[11px]">
        {fmt.formatBRL(r.saldoDepois)}
      </td>
      <td className="px-2 py-2 text-right text-violet italic">
        {r.inccDoMes >= 1 ? "+" + fmt.formatBRL(r.inccDoMes) : "–"}
      </td>
      <td className="px-2 py-2 text-right text-violet/70 text-[11px]">
        {fmt.formatBRL(r.inccAcumulado)}
      </td>
      <td className="px-2 py-2 text-right">
        {r.parcelaBase > 0 ? fmt.formatBRL(r.parcelaBase) : "–"}
      </td>
      <td className="px-2 py-2 text-right text-violet">
        {r.inccPagoCliente > 0 ? "+" + fmt.formatBRL(r.inccPagoCliente) : "–"}
      </td>
      <td className="px-2 py-2 text-right text-blue">
        {r.atoPagoMes > 0 ? fmt.formatBRL(r.atoPagoMes) : "–"}
      </td>
      <td className="px-2 py-2 text-right">{r.anual > 0 ? fmt.formatBRL(r.anual) : "–"}</td>
      <td className="px-2 py-2 text-right text-cyan">{fmt.formatBRL(r.teo)}</td>
      <td className="px-2 py-2 text-right text-amber">
        {r.documentacao > 0 ? fmt.formatBRL(r.documentacao) : "–"}
      </td>
      <td className="px-2 py-2 text-right font-semibold text-ink">
        {fmt.formatBRL(r.total)}
      </td>
      <td className="px-2 py-2 text-right">
        <span className="inline-flex items-center gap-1.5 justify-end">
          {r.pctRenda.toFixed(1)}%
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block", pcCls)} />
        </span>
      </td>
      <td className="px-2 py-2 text-right">
        <Badge tone={dispBadge}>{fmt.formatBRLSinal(r.disponivel)}</Badge>
      </td>
    </tr>
  );
}

function LegendItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block w-2.5 h-2.5 rounded-sm", color)} />
      {children}
    </div>
  );
}

/* ============================================================
 *  Stacked Bar Chart (Recharts)
 * ============================================================ */
export function FluxoChart({
  result,
  baseColor = "#1a56db",
}: {
  result: ResultadoSimulacao;
  baseColor?: string;
}) {
  const data = result.rows.map((r) => ({
    mes: r.mes,
    label: fmt.formatMesAno(r.data),
    construtora: r.parcelaBase + r.atoPagoMes + r.anual,
    incc: r.inccPagoCliente,
    teo: r.teo,
    documentacao: r.documentacao,
    total: r.total,
    isAnual: r.anual > 0,
  }));
  const disponivel = result.stats.disponivelTotal;
  const lastMes = result.rows.length;

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      role="img"
      aria-label={`Gráfico de desembolso mensal empilhado ao longo de ${result.rows.length} meses`}
    >
      <h3 className="font-serif text-[17px] mb-1">
        Desembolso mensal empilhado
      </h3>
      <p className="text-[11.5px] text-ink-muted mb-4">
        Composição do desembolso de cada mês: parcela construtora (base), correção INCC, TEO bancário e documentação. Tracejado = disponível mensal.
      </p>
      <ChartMount className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 16, bottom: 18, left: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
              interval="preserveStartEnd"
              angle={-40}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
              }
              width={48}
            />
            <Tooltip content={<TooltipContent />} cursor={{ fill: "rgba(15,25,35,0.05)" }} />
            <ReferenceLine
              y={disponivel}
              stroke="#b45309"
              strokeDasharray="6 4"
              label={{
                value: `Disp. R$ ${Math.round(disponivel).toLocaleString("pt-BR")}`,
                position: "right",
                fill: "#b45309",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Bar dataKey="construtora" stackId="a" fill={baseColor} name="Construtora">
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={baseColor}
                  stroke={d.isAnual ? "#f59e0b" : undefined}
                  strokeWidth={d.isAnual ? 1.5 : 0}
                />
              ))}
            </Bar>
            <Bar dataKey="incc" stackId="a" fill="#7c3aed" name="INCC" />
            <Bar dataKey="teo" stackId="a" fill="#06b6d4" name="TEO" />
            <Bar dataKey="documentacao" stackId="a" fill="#b45309" name="Documentação" radius={[3, 3, 0, 0]} />
            <ReferenceLine
              x={data[lastMes - 1]?.label}
              stroke="#c9973a"
              strokeDasharray="4 4"
              label={{
                value: "▶ Entrega",
                position: "top",
                fill: "#c9973a",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartMount>
      <div className="flex flex-wrap gap-3 mt-4 text-[11.5px] text-ink-soft">
        <LegendChip color={baseColor}>Construtora (base)</LegendChip>
        <LegendChip color="#7c3aed">Correção INCC</LegendChip>
        <LegendChip color="#06b6d4">TEO Banco</LegendChip>
        <LegendChip color="#b45309">ITBI / Documentação</LegendChip>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-2.5 rounded-sm border-[1.5px] border-amber inline-block" />
          Pico do mês anual (+13º)
        </span>
      </div>
    </div>
  );
}

function LegendChip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-sm inline-block"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

interface TooltipPayload {
  payload: {
    label: string;
    construtora: number;
    incc: number;
    teo: number;
    documentacao: number;
    total: number;
    mes: number;
  };
}
function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md bg-ink text-white text-[11px] px-3 py-2 shadow-lg font-mono">
      <div className="text-accent font-semibold mb-1">
        Mês {d.mes} · {d.label}
      </div>
      <div>Construtora: {fmt.formatBRL(d.construtora)}</div>
      <div className="text-violet-soft">+ INCC: {fmt.formatBRL(d.incc)}</div>
      <div className="text-cyan-soft">+ TEO: {fmt.formatBRL(d.teo)}</div>
      <div className="text-amber-soft">
        + Doc: {d.documentacao > 0 ? fmt.formatBRL(d.documentacao) : "–"}
      </div>
      <div className="border-t border-white/15 mt-1 pt-1 font-semibold">
        TOTAL: {fmt.formatBRL(d.total)}
      </div>
    </div>
  );
}

/* ============================================================
 *  ChartMount — adia render do Recharts até hidratação para
 *  evitar warning de "width(-1)/height(-1)" no SSR.
 * ============================================================ */
function ChartMount({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return <div className={className}>{mounted ? children : null}</div>;
}

/* ============================================================
 *  Parecer (cards dinâmicos)
 * ============================================================ */
const tomToColor: Record<ParecerItem["tom"], string> = {
  ok: "bg-green-soft border-green",
  alerta: "bg-amber-soft border-amber",
  info: "bg-blue-soft border-blue",
};
export function Parecer({ items }: { items: ParecerItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg bg-gradient-to-br from-ink to-ink-soft text-white p-6">
      <h3 className="font-serif text-[20px] mb-4 flex items-center gap-2">
        ✨ Parecer
      </h3>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed">
            <span className="mt-0.5 shrink-0">{it.icone}</span>
            <span>
              <strong className="text-accent">{it.titulo}:</strong> {it.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
 *  Alertas (validações)
 * ============================================================ */
export function Alertas({
  input,
  output,
}: {
  input: ValidacaoResultado;
  output: ValidacaoResultado;
}) {
  const erros = [...input.erros, ...output.erros];
  const avisos = [...input.avisos, ...output.avisos];
  const info = [...input.info, ...output.info];

  if (!erros.length && !avisos.length && !info.length) return null;

  return (
    <div className="space-y-2">
      {erros.map((e, i) => (
        <AlertaItem key={`e-${i}`} tone="danger" icone="🚨">
          {e.texto}
        </AlertaItem>
      ))}
      {avisos.map((a, i) => (
        <AlertaItem key={`a-${i}`} tone="amber" icone="⚠️">
          {a.texto}
        </AlertaItem>
      ))}
      {info.map((it, i) => (
        <AlertaItem key={`i-${i}`} tone="info" icone="ℹ️">
          {it.texto}
        </AlertaItem>
      ))}
    </div>
  );
}

function AlertaItem({
  tone,
  icone,
  children,
}: {
  tone: "danger" | "amber" | "info";
  icone: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger"
      ? "bg-red-soft border-l-4 border-red text-red"
      : tone === "amber"
        ? "bg-amber-soft border-l-4 border-amber text-amber"
        : "bg-blue-soft border-l-4 border-blue text-blue";
  return (
    <div className={cn("rounded-md px-4 py-2.5 text-[13px] flex gap-2", cls)}>
      <span>{icone}</span>
      <span>{children}</span>
    </div>
  );
}
