"use client";

import * as React from "react";
import { useWatch } from "react-hook-form";
import { Lock } from "lucide-react";
import { fmt, type SimulacaoConfig } from "@/lib/calculation-engine";
import { Card, CardBody, CardHeader, FieldHelp } from "@/components/ui/primitives";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { cn } from "@/lib/utils";

/**
 * Card resumo read-only mostrado em modo cliente — substitui os forms
 * editáveis de Imóvel, Entrada (parcela/INCC/pós), Custos cartoriais e
 * Evolução. Cliente vê os valores que o corretor propôs sem poder mudar.
 */
export function CenarioSummary() {
  const config = useWatch<SimulacaoConfig>() as SimulacaoConfig;
  const received = useCorretorStore((s) => s.received);

  if (!config) return null;

  const corretorNome = received?.nome ?? "o corretor";

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
            <span>O que {corretorNome} propôs</span>
          </div>
        }
        subtitle="Valores definidos pelo corretor — pra ajustar, fale com ele."
      />
      <CardBody className="space-y-5">
        <SubSection label="Imóvel">
          <Item
            label="Valor total"
            value={fmt.formatBRL(config.imovel.valor_total)}
            help="Preço de venda do imóvel no contrato."
          />
          <Item
            label="Financiado pelo banco"
            value={fmt.formatBRL(config.imovel.valor_financiado_banco)}
            help="Quanto o banco vai emprestar — liberado na entrega."
          />
          <Item
            label="FGTS disponível"
            value={fmt.formatBRL(config.imovel.fgts_disponivel)}
            help="Saldo do FGTS usado na entrada ou na entrega."
          />
          <Item
            label="Períodos de obra"
            value={`${config.imovel.periodos_construcao} meses`}
          />
          <Item
            label="Início"
            value={formatDataInicio(config.imovel.data_inicio)}
          />
        </SubSection>

        <Divider />

        <SubSection label="Entrada (mensal)">
          <Item
            label="Parcela mensal base"
            value={fmt.formatBRL(config.entrada.parcela_mensal_base)}
            help="Valor contratual da parcela à construtora, sem INCC."
          />
          <Item
            label="INCC mensal"
            value={fmt.formatPercent(config.entrada.incc_mensal_percent)}
            help="Índice mensal aplicado sobre o saldo devedor."
          />
          <Item
            label="Parcela pós-entrega"
            value={fmt.formatBRL(config.entrada.parcela_pos_entrega)}
            help="Prestação ao banco após o habite-se (TEO durante a obra)."
          />
          <Item
            label="Modo INCC"
            value={
              config.entrada.modo_incc === "saldo_acumula"
                ? "Saldo acumula (financiamento maior)"
                : "Cliente paga junto (saldo amortiza certo)"
            }
          />
        </SubSection>

        <Divider />

        <CustosCartoriaisResumo config={config} />

        <Divider />

        <SubSection label="Evolução de obra">
          <Item
            label="Tipo"
            value={evolucaoLabel(config.evolucao)}
          />
        </SubSection>
      </CardBody>
    </Card>
  );
}

/* ============================================================
 *  Sub-componentes
 * ============================================================ */
function SubSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-2">
        {label}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {children}
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  help,
}: {
  label: string;
  value: React.ReactNode;
  help?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-paper-alt pb-1.5">
      <span className="text-[12.5px] text-ink-soft inline-flex items-center gap-1.5">
        {label}
        {help && <FieldHelp text={help} />}
      </span>
      <span
        className={cn(
          "font-mono text-[13px] tabular-nums text-ink text-right",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <hr className="border-paper-alt" />;
}

function CustosCartoriaisResumo({ config }: { config: SimulacaoConfig }) {
  const cc = config.custosCartoriais;
  const calculo = cc.calculo;

  const linhas: { label: string; value: string }[] = [];
  if (calculo.tipo === "valor_total") {
    linhas.push({
      label: "Valor total",
      value: fmt.formatBRL(calculo.valor_itbi_total),
    });
  } else if (calculo.tipo === "aliquota") {
    linhas.push({
      label: "Alíquota ITBI",
      value: fmt.formatPercent(calculo.aliquota_percent),
    });
    if (calculo.valor_imovel) {
      linhas.push({
        label: "Sobre valor de",
        value: fmt.formatBRL(calculo.valor_imovel),
      });
    }
  } else if (calculo.tipo === "itemizado") {
    const total =
      (calculo.itbi ?? 0) +
      (calculo.cartorio ?? 0) +
      (calculo.taxas_diversas ?? 0) +
      (calculo.outras_despesas ?? 0);
    linhas.push({ label: "Total estimado", value: fmt.formatBRL(total) });
  }

  if (cc.diluir) {
    linhas.push({
      label: "Diluído em",
      value: `${cc.parcelas}× a partir do mês ${cc.mes_inicio}`,
    });
  } else {
    linhas.push({
      label: "Pagamento",
      value: `À vista no mês ${cc.mes_inicio}`,
    });
  }

  return (
    <SubSection label="Custos cartoriais">
      {linhas.map((l, i) => (
        <Item key={i} label={l.label} value={l.value} />
      ))}
    </SubSection>
  );
}

function formatDataInicio(iso: string): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m) return iso;
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${meses[m - 1]}/${y}`;
}

function evolucaoLabel(evolucao: SimulacaoConfig["evolucao"]): string {
  if (evolucao.tipo === "progressivo") return "Progressivo (curva padrão)";
  if (evolucao.tipo === "linear") return "Linear (igual em cada mês)";
  if (evolucao.tipo === "customizado") return "Customizado (definido mês a mês)";
  return "—";
}
