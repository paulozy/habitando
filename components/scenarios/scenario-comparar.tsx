"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calcSimulacao,
  fmt,
  resolveMesesAnual,
  type ResultadoSimulacao,
  type SimulacaoConfig,
} from "@/lib/calculation-engine";
import type { Scenario } from "@/lib/storage/use-scenarios-store";
import { Card, CardBody, CardHeader, SectionHead } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface ScenarioWithResult {
  scenario: Scenario;
  result: ResultadoSimulacao;
}

export function ScenarioComparar({ scenarios }: { scenarios: Scenario[] }) {
  const enriched: ScenarioWithResult[] = React.useMemo(
    () =>
      scenarios.map((s) => ({
        scenario: s,
        result: calcSimulacao(s.config),
      })),
    [scenarios],
  );

  if (enriched.length < 2) {
    return (
      <div className="rounded-lg bg-blue-soft border-l-4 border-blue text-blue px-5 py-4 text-sm">
        Adicione pelo menos 2 cenários para começar a comparação.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ResumoLado lados={enriched} />
      <DiferencasChave lados={enriched} />
      <ChartCompare lados={enriched} />
      <ParecerCompare lados={enriched} />
    </div>
  );
}

/* ============================================================
 *  Cards laterais: resumo de cada cenário
 * ============================================================ */
function ResumoLado({ lados }: { lados: ScenarioWithResult[] }) {
  const cols = lados.length;
  return (
    <div>
      <SectionHead>Comparativo lado a lado</SectionHead>
      <div
        className={cn(
          "grid gap-4",
          cols === 2 && "grid-cols-1 md:grid-cols-2",
          cols === 3 && "grid-cols-1 md:grid-cols-3",
          cols === 4 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {lados.map(({ scenario, result }) => {
          const cfg = scenario.config;
          const dataInicio = parseDateLocal(cfg.imovel.data_inicio);
          const totalAnuais = cfg.entrada.anuais.reduce((a, an) => {
            const meses = resolveMesesAnual(
              an,
              dataInicio,
              cfg.imovel.periodos_construcao,
            );
            return a + an.valor * meses.length;
          }, 0);
          const mesesMensais = Math.max(
            0,
            cfg.imovel.periodos_construcao - (cfg.entrada.ato.parcelas ?? 1),
          );
          const entradaContrato =
            cfg.entrada.ato.valor_total +
            cfg.entrada.parcela_mensal_base * mesesMensais +
            totalAnuais;
          return (
            <Card key={scenario.id} className="overflow-hidden">
              <div
                className="px-4 py-3 text-white font-semibold text-[13px] flex items-center gap-2"
                style={{ background: scenario.color }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                {scenario.label}
              </div>
              <CardBody className="space-y-1.5">
                <Row label="Valor do imóvel" value={fmt.formatBRL(cfg.imovel.valor_total)} />
                <Row
                  label="Entrada contrato"
                  value={fmt.formatBRL(entradaContrato)}
                />
                <Row
                  label="Ato (à vista)"
                  value={fmt.formatBRL(cfg.entrada.ato.valor_total)}
                />
                <Row
                  label={
                    cfg.custosCartoriais.diluir
                      ? "Cartoriais (diluído)"
                      : "Cartoriais (à vista)"
                  }
                  value={fmt.formatBRL(result.custosCartoriaisResult.total)}
                />
                <Row
                  label="Parcela mensal"
                  value={fmt.formatBRL(cfg.entrada.parcela_mensal_base)}
                />
                <Row
                  label="Pós-entrega"
                  value={fmt.formatBRL(cfg.entrada.parcela_pos_entrega)}
                />
                <Row
                  label="Períodos"
                  value={`${cfg.imovel.periodos_construcao}m`}
                />
                <hr className="border-border my-2" />
                <Row
                  label={`Total ${cfg.imovel.periodos_construcao}m`}
                  value={fmt.formatBRL(result.stats.totalGeral)}
                  emphasize
                />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          emphasize ? "text-ink font-semibold text-[14px]" : "text-ink-soft",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
 *  Diferenças Chave (barras horizontais por critério)
 * ============================================================ */
function DiferencasChave({ lados }: { lados: ScenarioWithResult[] }) {
  const criterios: Array<{
    label: string;
    pickValue: (r: ResultadoSimulacao) => number;
    direction: "low" | "high"; // qual é o melhor
    sub?: (r: ResultadoSimulacao) => string;
  }> = [
    {
      label: "Total geral",
      pickValue: (r) => r.stats.totalGeral,
      direction: "low",
      sub: (r) => `${r.rows.length} meses · construtora + INCC + TEO + doc`,
    },
    {
      label: "Pico mensal (anual)",
      pickValue: (r) => r.stats.picoDezembros || r.stats.maximo,
      direction: "low",
      sub: (r) =>
        r.stats.picoDezembros > 0 ? "Cobrado pelo 13º" : "Sem parcela anual",
    },
    {
      label: "Mês normal máx.",
      pickValue: (r) => r.stats.maxNormal,
      direction: "low",
      sub: () => "Pior mês fora dos anuais",
    },
    {
      label: "Documentação total",
      pickValue: (r) => r.stats.totalDocumentacao,
      direction: "low",
      sub: () => "Provisão diluída",
    },
    {
      label: "Custos cartoriais",
      pickValue: (r) => r.custosCartoriaisResult.total,
      direction: "low",
      sub: () => "ITBI + cartórios + taxas",
    },
    {
      label: "Ato (à vista)",
      pickValue: (r) => r.stats.totalAto,
      direction: "low",
      sub: () => "Pago na assinatura",
    },
  ];

  return (
    <div>
      <SectionHead>Diferenças chave</SectionHead>
      <Card>
        <CardBody className="space-y-5">
          {criterios.map((c) => {
            const valores = lados.map(({ result, scenario }) => ({
              v: c.pickValue(result),
              color: scenario.color,
              label: scenario.label,
              sub: c.sub?.(result) ?? "",
            }));
            const max = Math.max(1, ...valores.map((x) => x.v));
            const winnerV =
              c.direction === "low"
                ? Math.min(...valores.map((x) => x.v))
                : Math.max(...valores.map((x) => x.v));

            return (
              <div key={c.label}>
                <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-2 font-mono">
                  {c.label}
                </div>
                <div className="space-y-2">
                  {valores.map((x, i) => {
                    const isWinner = x.v === winnerV && valores.filter((y) => y.v === winnerV).length === 1;
                    return (
                      <div key={i} className="grid grid-cols-12 items-center gap-3">
                        <div className="col-span-3 text-[12.5px] text-ink-soft truncate flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: x.color }}
                          />
                          {x.label}
                        </div>
                        <div className="col-span-7 h-6 bg-paper-alt rounded relative overflow-hidden">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${(x.v / max) * 100}%`,
                              background: x.color,
                              opacity: isWinner ? 1 : 0.55,
                            }}
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <div
                            className={cn(
                              "font-mono text-[13px] tabular-nums",
                              isWinner ? "text-green font-semibold" : "text-ink-soft",
                            )}
                          >
                            {fmt.formatBRL(x.v)}
                            {isWinner && " ✓"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}

/* ============================================================
 *  Chart comparativo — agrupado por mês
 * ============================================================ */
function ChartCompare({ lados }: { lados: ScenarioWithResult[] }) {
  const maxMeses = Math.max(...lados.map(({ result }) => result.rows.length));
  const data = Array.from({ length: maxMeses }, (_, i) => {
    const row: Record<string, number | string> = { mes: `m${i + 1}` };
    lados.forEach(({ scenario, result }) => {
      row[scenario.label] = Math.round(result.rows[i]?.total ?? 0);
    });
    return row;
  });

  return (
    <div>
      <SectionHead>Desembolso mensal por cenário</SectionHead>
      <Card>
        <CardBody>
          <CompareChartMount className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                <CartesianGrid stroke="#ede9e2" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
                  interval={Math.max(0, Math.floor(maxMeses / 12) - 1)}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                  }
                  width={48}
                />
                <Tooltip
                  formatter={(v) => fmt.formatBRL(typeof v === "number" ? v : Number(v) || 0)}
                  contentStyle={{
                    background: "#0f1923",
                    border: "1px solid #3a4a58",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#c9973a", fontWeight: 700 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-sans)" }}
                />
                {lados.map(({ scenario }) => (
                  <Bar
                    key={scenario.id}
                    dataKey={scenario.label}
                    fill={scenario.color}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CompareChartMount>
        </CardBody>
      </Card>
    </div>
  );
}

function parseDateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  return new Date(y || 2026, (m ?? 1) - 1, d ?? 1);
}

function CompareChartMount({
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
 *  Parecer comparativo — gera texto de "quem vence em cada quesito"
 * ============================================================ */
function ParecerCompare({ lados }: { lados: ScenarioWithResult[] }) {
  const winnerOf = (
    pick: (r: ResultadoSimulacao) => number,
    direction: "low" | "high" = "low",
  ) => {
    const sorted = [...lados].sort((a, b) =>
      direction === "low"
        ? pick(a.result) - pick(b.result)
        : pick(b.result) - pick(a.result),
    );
    return sorted[0];
  };
  const menorTotal = winnerOf((r) => r.stats.totalGeral);
  const menorPico = winnerOf((r) => r.stats.picoDezembros || r.stats.maximo);
  const menorMesNormal = winnerOf((r) => r.stats.maxNormal);

  const items: Array<{ icon: string; titulo: string; texto: string }> = [
    {
      icon: "💰",
      titulo: "Menor desembolso total",
      texto: `${menorTotal.scenario.label} — ${fmt.formatBRL(menorTotal.result.stats.totalGeral)} ao longo de ${menorTotal.result.rows.length} meses.`,
    },
    {
      icon: "📉",
      titulo: "Menor pico em mês anual",
      texto: `${menorPico.scenario.label} — pico de ${fmt.formatBRL(menorPico.result.stats.picoDezembros || menorPico.result.stats.maximo)}.`,
    },
    {
      icon: "🟢",
      titulo: "Mês normal mais leve",
      texto: `${menorMesNormal.scenario.label} — ${fmt.formatBRL(menorMesNormal.result.stats.maxNormal)} no pior mês fora dos anuais.`,
    },
  ];

  return (
    <Card>
      <CardHeader title="Parecer comparativo" subtitle="Quem ganha em cada quesito (quanto menor, melhor)" />
      <CardBody>
        <ul className="space-y-2.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-[13.5px]">
              <span className="shrink-0">{it.icon}</span>
              <span>
                <strong className="text-ink">{it.titulo}:</strong>{" "}
                <span className="text-ink-soft">{it.texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
