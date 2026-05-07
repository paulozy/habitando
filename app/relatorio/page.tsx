"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  calcSimulacao,
  fmt,
  resolveMesesAnual,
  type ResultadoSimulacao,
} from "@/lib/calculation-engine";
import { decodeScenarios } from "@/lib/url-state";
import type { Scenario } from "@/lib/storage/use-scenarios-store";
import "./print.css";

export default function RelatorioPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RelatorioContent />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-ink-soft">
      Carregando relatório…
    </div>
  );
}

function RelatorioContent() {
  const params = useSearchParams();
  const [scenarios, setScenarios] = React.useState<Scenario[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const s = params.get("s");
    if (!s) {
      setError(
        "Nenhum cenário foi compartilhado. Abra o relatório pelo botão 'Exportar PDF' no simulador.",
      );
      return;
    }
    const dec = decodeScenarios(s);
    if (!dec.ok || !dec.scenarios) {
      setError(dec.error ?? "Link inválido.");
      return;
    }
    setScenarios(dec.scenarios);
  }, [params]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-2xl mb-2 text-ink">Relatório indisponível</h1>
        <p className="text-ink-soft max-w-md mb-4">{error}</p>
        <a
          href="/simulador"
          className="text-accent underline hover:text-accent/80"
        >
          Voltar ao simulador
        </a>
      </div>
    );
  }

  if (!scenarios) return <Loading />;

  return (
    <div className="bg-white text-ink min-h-screen">
      <ToolBar />
      <Capa scenarios={scenarios} />
      {scenarios.map((s) => (
        <CenarioPagina key={s.id} scenario={s} />
      ))}
      {scenarios.length > 1 && <ComparativoPagina scenarios={scenarios} />}
      <Rodape />
    </div>
  );
}

function ToolBar() {
  return (
    <div className="no-print sticky top-0 z-50 bg-ink text-white border-b border-white/10">
      <div className="max-w-[210mm] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent">
          Habitando · Relatório
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-accent text-ink font-semibold px-4 py-2 rounded-md hover:bg-accent/90 transition-colors text-sm"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
          <a
            href="/simulador"
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            Voltar
          </a>
        </div>
      </div>
      <div className="bg-amber-soft text-amber px-6 py-2 text-[12px] text-center border-t border-amber/30">
        💡 Use <strong>Ctrl/Cmd + P</strong> ou o botão acima e escolha &quot;Salvar como
        PDF&quot; no diálogo do navegador. As cores do relatório são preservadas
        se você marcar &quot;Imprimir gráficos de fundo&quot; nas opções avançadas.
      </div>
    </div>
  );
}

function Capa({ scenarios }: { scenarios: Scenario[] }) {
  const data = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="page capa">
      <div className="capa-inner">
        <div className="capa-brand">
          <div className="capa-marca">HABITANDO</div>
          <div className="capa-tagline">Simulação financeira imobiliária</div>
        </div>

        <div className="capa-titulo">
          <h1>Relatório de Simulação</h1>
          <p className="capa-subtitulo">
            {scenarios.length === 1
              ? "1 cenário"
              : `${scenarios.length} cenários comparados`}
          </p>
        </div>

        <div className="capa-cenarios">
          <div className="capa-list-label">Cenários incluídos:</div>
          <ul>
            {scenarios.map((s) => (
              <li key={s.id}>
                <span
                  className="capa-dot"
                  style={{ background: s.color }}
                  aria-hidden
                />
                <span className="capa-cenario-nome">{s.label}</span>
                <span className="capa-cenario-meta">
                  {fmt.formatBRL(s.config.imovel.valor_total || 0)} ·{" "}
                  {s.config.imovel.periodos_construcao}m
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="capa-rodape">
          <div className="capa-data">Gerado em {data}</div>
          <div className="capa-url">habitando.app</div>
        </div>
      </div>
    </section>
  );
}

function CenarioPagina({ scenario }: { scenario: Scenario }) {
  const result = React.useMemo(
    () => calcSimulacao(scenario.config),
    [scenario.config],
  );

  return (
    <section className="page page-cenario">
      <header
        className="cenario-header"
        style={{ borderTopColor: scenario.color }}
      >
        <div className="cenario-titulo">
          <span
            className="cenario-dot"
            style={{ background: scenario.color }}
            aria-hidden
          />
          <h2>{scenario.label}</h2>
        </div>
        <div className="cenario-meta">
          {fmt.formatBRL(scenario.config.imovel.valor_total || 0)} ·{" "}
          {scenario.config.imovel.periodos_construcao} meses · INCC{" "}
          {((scenario.config.entrada.incc_mensal_percent ?? 0) * 100).toFixed(2)}
          %/mês
        </div>
      </header>

      <Indicadores result={result} />
      <ResumoEntrada scenario={scenario} result={result} />
      <TabelaResumida result={result} />
      <ParecerBlock result={result} />
    </section>
  );
}

function Indicadores({ result }: { result: ResultadoSimulacao }) {
  const s = result.stats;
  const cards = [
    { label: "Total geral", value: fmt.formatBRL(s.totalGeral), tone: "blue" },
    {
      label: "Saldo na entrega",
      value: fmt.formatBRL(s.saldoFinal),
      tone: "green",
    },
    {
      label: "Total INCC",
      value: fmt.formatBRL(s.totalINCC),
      tone: "violet",
    },
    {
      label: "Total TEO",
      value: fmt.formatBRL(s.totalTEO),
      tone: "blue",
    },
    {
      label: "Custos cartoriais",
      value: fmt.formatBRL(s.totalCustosCartoriais),
      tone: "red",
    },
    {
      label: "Pico mensal",
      value: fmt.formatBRL(s.maximo),
      tone: "amber",
    },
  ];
  return (
    <div className="indicadores">
      {cards.map((c) => (
        <div key={c.label} className={`indicador indicador-${c.tone}`}>
          <div className="indicador-label">{c.label}</div>
          <div className="indicador-valor">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function ResumoEntrada({
  scenario,
  result,
}: {
  scenario: Scenario;
  result: ResultadoSimulacao;
}) {
  const cfg = scenario.config;
  const dataInicio = parseLocal(cfg.imovel.data_inicio);
  const totalAnuais = (cfg.entrada.anuais ?? []).reduce((a, an) => {
    const meses = resolveMesesAnual(an, dataInicio, cfg.imovel.periodos_construcao);
    return a + (an.valor ?? 0) * meses.length;
  }, 0);
  const fgts = cfg.imovel.fgts_abate_saldo ? cfg.imovel.fgts_disponivel : 0;
  const ato = cfg.entrada.ato.valor_total;
  const mesesMensais =
    (cfg.entrada.ato.parcelas ?? 1) <= 1
      ? cfg.imovel.periodos_construcao
      : Math.max(0, cfg.imovel.periodos_construcao - cfg.entrada.ato.parcelas);
  const totalMensais = cfg.entrada.parcela_mensal_base * mesesMensais;
  const entradaTotal = ato + fgts + totalMensais + totalAnuais;

  return (
    <div className="resumo">
      <div className="resumo-titulo">Composição da entrada</div>
      <table className="resumo-tabela">
        <tbody>
          <tr>
            <td>Valor do imóvel</td>
            <td>{fmt.formatBRL(cfg.imovel.valor_total)}</td>
          </tr>
          <tr>
            <td>Financiamento bancário</td>
            <td>{fmt.formatBRL(cfg.imovel.valor_financiado_banco)}</td>
          </tr>
          <tr>
            <td>FGTS</td>
            <td>{fmt.formatBRL(cfg.imovel.fgts_disponivel)}</td>
          </tr>
          <tr>
            <td>
              Ato {cfg.entrada.ato.parcelas > 1 && `(${cfg.entrada.ato.parcelas}×)`}
            </td>
            <td>{fmt.formatBRL(ato)}</td>
          </tr>
          <tr>
            <td>
              {mesesMensais}× parcela mensal de{" "}
              {fmt.formatBRL(cfg.entrada.parcela_mensal_base)}
            </td>
            <td>{fmt.formatBRL(totalMensais)}</td>
          </tr>
          {totalAnuais > 0 && (
            <tr>
              <td>Parcelas anuais</td>
              <td>{fmt.formatBRL(totalAnuais)}</td>
            </tr>
          )}
          <tr className="resumo-total">
            <td>Entrada total estimada</td>
            <td>{fmt.formatBRL(entradaTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div className="resumo-saldo-info">
        Saldo devedor inicial:{" "}
        <strong>{fmt.formatBRL(result.stats.saldoInicial)}</strong> · Saldo na
        entrega: <strong>{fmt.formatBRL(result.stats.saldoFinal)}</strong>
        {result.stats.diferencaFinanciamento > 100 && (
          <>
            {" "}· INCC absorvido pelo saldo:{" "}
            <strong>
              +{fmt.formatBRL(result.stats.diferencaFinanciamento)}
            </strong>
          </>
        )}
      </div>
    </div>
  );
}

function TabelaResumida({ result }: { result: ResultadoSimulacao }) {
  return (
    <div className="tabela-wrapper">
      <div className="resumo-titulo">Fluxo mensal completo</div>
      <table className="tabela-detalhada">
        <thead>
          <tr>
            <th>Mês</th>
            <th>Data</th>
            <th>Saldo</th>
            <th>INCC mês</th>
            <th>Parcela</th>
            <th>Ato</th>
            <th>Anual</th>
            <th>Doc</th>
            <th>TEO</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r) => {
            const isAnual = r.anual > 0;
            const isAto = r.isMesAto;
            return (
              <tr
                key={r.mes}
                className={isAto ? "row-ato" : isAnual ? "row-anual" : ""}
              >
                <td className="t-c">{r.mes}</td>
                <td className="t-l">{fmt.formatMesAno(r.data)}</td>
                <td>{fmt.formatBRL(r.saldoDepois)}</td>
                <td className="text-violet">
                  {r.inccDoMes >= 1 ? fmt.formatBRL(r.inccDoMes) : "–"}
                </td>
                <td>
                  {r.parcelaCliente > 0 ? fmt.formatBRL(r.parcelaCliente) : "–"}
                </td>
                <td>{r.atoPagoMes > 0 ? fmt.formatBRL(r.atoPagoMes) : "–"}</td>
                <td>{r.anual > 0 ? fmt.formatBRL(r.anual) : "–"}</td>
                <td>{r.documentacao > 0 ? fmt.formatBRL(r.documentacao) : "–"}</td>
                <td>{fmt.formatBRL(r.teo)}</td>
                <td className="t-bold">{fmt.formatBRL(r.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ParecerBlock({ result }: { result: ResultadoSimulacao }) {
  if (result.parecer.length === 0) return null;
  return (
    <div className="parecer-block">
      <div className="resumo-titulo">Parecer</div>
      <ul>
        {result.parecer.map((p, i) => (
          <li key={i}>
            <span className="parecer-icone">{p.icone}</span>
            <span>
              <strong>{p.titulo}.</strong> {p.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparativoPagina({ scenarios }: { scenarios: Scenario[] }) {
  const enriched = scenarios.map((s) => ({
    s,
    r: calcSimulacao(s.config),
  }));

  const criterios = [
    {
      label: "Total geral",
      pick: (r: ResultadoSimulacao) => r.stats.totalGeral,
      direction: "low" as const,
    },
    {
      label: "Saldo na entrega",
      pick: (r: ResultadoSimulacao) => r.stats.saldoFinal,
      direction: "low" as const,
    },
    {
      label: "Pico mensal",
      pick: (r: ResultadoSimulacao) => r.stats.maximo,
      direction: "low" as const,
    },
    {
      label: "Total INCC",
      pick: (r: ResultadoSimulacao) => r.stats.totalINCC,
      direction: "low" as const,
    },
    {
      label: "Custos cartoriais",
      pick: (r: ResultadoSimulacao) => r.stats.totalCustosCartoriais,
      direction: "low" as const,
    },
  ];

  return (
    <section className="page page-comparativo">
      <h2 className="comparativo-titulo">Comparativo entre cenários</h2>

      <table className="comparativo-tabela">
        <thead>
          <tr>
            <th>Critério</th>
            {enriched.map(({ s }) => (
              <th key={s.id} style={{ color: s.color }}>
                {s.label}
              </th>
            ))}
            <th>Vencedor</th>
          </tr>
        </thead>
        <tbody>
          {criterios.map((c) => {
            const valores = enriched.map(({ s, r }) => ({
              s,
              v: c.pick(r),
            }));
            const winner =
              [...valores].sort((a, b) =>
                c.direction === "low" ? a.v - b.v : b.v - a.v,
              )[0];
            return (
              <tr key={c.label}>
                <td className="t-l t-bold">{c.label}</td>
                {valores.map((v) => (
                  <td
                    key={v.s.id}
                    className={v.s.id === winner.s.id ? "winner-cell" : ""}
                  >
                    {fmt.formatBRL(v.v)}
                  </td>
                ))}
                <td className="t-bold" style={{ color: winner.s.color }}>
                  {winner.s.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="comparativo-resumo">
        <div className="resumo-titulo">Resumo</div>
        <ul>
          {criterios.slice(0, 3).map((c) => {
            const valores = enriched.map(({ s, r }) => ({ s, v: c.pick(r) }));
            const winner =
              [...valores].sort((a, b) =>
                c.direction === "low" ? a.v - b.v : b.v - a.v,
              )[0];
            return (
              <li key={c.label}>
                <strong>{c.label}:</strong>{" "}
                <span style={{ color: winner.s.color }}>{winner.s.label}</span>{" "}
                ganha com {fmt.formatBRL(winner.v)}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="no-print py-6 text-center text-[11px] text-ink-muted border-t border-border">
      Gerado pelo Habitando · habitando.app
    </footer>
  );
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  return new Date(y || 2026, (m ?? 1) - 1, d ?? 1);
}
