"use client";

import * as React from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  FieldHelp,
  Input,
  Label,
  MesesChips,
  NumberInputBR,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import {
  NOMES_MESES_PT_BR,
  calcularITBI,
  gerarEvolucao,
  resolveMesesAnual,
  type ITBIConfig,
  type SimulacaoConfig,
} from "@/lib/calculation-engine";
import { cn } from "@/lib/utils";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

/* ============================================================
 *  Nome do cenário
 * ============================================================ */
export function NomeCenarioSection() {
  const { register } = useFormContext<SimulacaoConfig>();
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <Label className="shrink-0">Nome desta simulação</Label>
        <Input
          {...register("rotulo")}
          placeholder="Ex.: Apartamento 60m² · 35 meses"
          className="max-w-md"
        />
      </CardBody>
    </Card>
  );
}

/* ============================================================
 *  Orçamento (Renda + Gastos fixos no mesmo card)
 * ============================================================ */
export function OrcamentoSection() {
  const { control } = useFormContext<SimulacaoConfig>();
  const renda = useWatch({ control, name: "renda" });
  const gastos = useWatch({ control, name: "gastos.gastos_fixos_mensais" }) ?? 0;
  const totalRenda =
    (renda?.compradores?.reduce(
      (a, c) => a + (c?.renda_liquida || 0),
      0,
    ) ?? 0) + (renda?.outros_rendimentos ?? 0);
  const disponivel = totalRenda - gastos;

  return (
    <Card>
      <CardHeader
        title="Orçamento mensal"
        subtitle="Renda dos compradores e gastos fixos da família."
        right={
          <div className="flex flex-wrap gap-2 justify-end">
            <Badge tone="info">
              Renda: R$ {Math.round(totalRenda).toLocaleString("pt-BR")}
            </Badge>
            <Badge tone={disponivel >= 0 ? "ok" : "danger"}>
              Disponível: R$ {Math.round(disponivel).toLocaleString("pt-BR")}
            </Badge>
          </div>
        }
      />
      <CardBody className="space-y-6">
        {/* Renda */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted flex items-center gap-1.5">
            👥 Renda
            <FieldHelp text="Renda líquida (após IR/INSS) de cada comprador. Se a família tem renda passiva (aluguéis, juros, dividendos), some no campo Outros rendimentos." />
          </div>
          <CompradoresInner />
          <Field
            label="Outros rendimentos familiares"
            help="Aluguéis, juros, dividendos, pensão alimentícia — recorrentes mensais. Deixe 0 se não houver."
            className="max-w-md"
          >
            <Controller
              control={control}
              name="renda.outros_rendimentos"
              render={({ field }) => (
                <NumberInputBR
                  prefix="R$"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>

        <hr className="border-border" />

        {/* Gastos */}
        <div className="space-y-3">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted flex items-center gap-1.5">
            💰 Despesas fixas
            <FieldHelp text="Custos recorrentes do orçamento familiar: moradia, alimentação, transporte, escola, saúde, internet. Use a média dos últimos 3 meses." />
          </div>
          <Field
            label="Gastos fixos mensais"
            className="max-w-md"
          >
            <Controller
              control={control}
              name="gastos.gastos_fixos_mensais"
              render={({ field }) => (
                <NumberInputBR
                  prefix="R$"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  );
}

function CompradoresInner() {
  const { control, register } = useFormContext<SimulacaoConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "renda.compradores",
  });

  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <div
          key={f.id}
          className="rounded-md border border-border p-3 grid grid-cols-1 md:grid-cols-12 gap-3 bg-card"
        >
          <Field
            label={`Comprador ${i + 1}`}
            className="md:col-span-4"
          >
            <Input
              {...register(`renda.compradores.${i}.rotulo` as const)}
              placeholder={`Comprador ${i + 1}`}
            />
          </Field>
          <Field
            label="Renda líquida"
            help="Salário/honorários após IR, INSS e benefícios. Não inclui 13º."
            className="md:col-span-7"
          >
            <Controller
              control={control}
              name={`renda.compradores.${i}.renda_liquida` as const}
              render={({ field }) => (
                <NumberInputBR
                  prefix="R$"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          <div className="md:col-span-1 flex items-end">
            {fields.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => remove(i)}
                className="text-red"
              >
                ×
              </Button>
            )}
          </div>
        </div>
      ))}
      {fields.length < 4 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            append({
              id: newId(),
              rotulo: `Comprador ${fields.length + 1}`,
              renda_liquida: 0,
            })
          }
        >
          + Adicionar comprador
        </Button>
      )}
    </div>
  );
}

/* ============================================================
 *  Imóvel
 * ============================================================ */
export function ImovelSection() {
  const { control, register } = useFormContext<SimulacaoConfig>();
  return (
    <Card>
      <CardHeader title="Imóvel" subtitle="Valor, financiamento bancário e período de obras." />
      <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field
          label="Valor total"
          help="Preço de venda do imóvel no contrato (com vaga, depósito etc., quando aplicável)."
        >
          <Controller
            control={control}
            name="imovel.valor_total"
            render={({ field }) => (
              <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field
          label="Financiado pelo banco"
          help="Quanto o banco vai emprestar (CEF, Itaú, etc.) — vem da simulação Caixa/SBPE. É liberado na entrega."
        >
          <Controller
            control={control}
            name="imovel.valor_financiado_banco"
            render={({ field }) => (
              <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field
          label="FGTS disponível"
          help="Saldo do FGTS que pode ser usado: na entrada (abate saldo da construtora) ou na entrega (abate financiamento)."
        >
          <Controller
            control={control}
            name="imovel.fgts_disponivel"
            render={({ field }) => (
              <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field
          label="FGTS abate o saldo?"
          help="Sim = aplicado junto com o ato no mês 0, reduzindo o saldo devedor desde já. Não = guardado para a entrega (reduz o financiamento bancário)."
        >
          <Controller
            control={control}
            name="imovel.fgts_abate_saldo"
            render={({ field }) => (
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                value={field.value ? "yes" : "no"}
                onChange={(e) => field.onChange(e.target.value === "yes")}
              >
                <option value="yes">Sim (recomendado)</option>
                <option value="no">Não</option>
              </select>
            )}
          />
        </Field>
        <Field
          label="Períodos de construção (meses)"
          help="Tempo até a entrega das chaves. Construtoras grandes geralmente trabalham com 30–48 meses."
        >
          <Controller
            control={control}
            name="imovel.periodos_construcao"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                max={120}
                value={field.value ?? 0}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            )}
          />
        </Field>
        <Field
          label="Data de início"
          help="Mês/ano da assinatura do contrato. Usado para calcular em qual mês cai cada Dezembro/aniversário do contrato."
        >
          <Input type="date" {...register("imovel.data_inicio")} />
        </Field>
      </CardBody>
    </Card>
  );
}

/* ============================================================
 *  Entrada — apenas mensal + INCC + pós-entrega
 *  (Ato e anuais e custos cartoriais ficam em seções próprias)
 * ============================================================ */
export function EntradaSection() {
  const { control } = useFormContext<SimulacaoConfig>();

  return (
    <Card>
      <CardHeader title="Entrada (parcelas mensais)" subtitle="Parcela base, INCC e pós-entrega." />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Parcela mensal base"
            help="Valor contratual da parcela mensal à construtora — sem correção INCC. O INCC é calculado automaticamente todo mês sobre o saldo devedor."
          >
            <Controller
              control={control}
              name="entrada.parcela_mensal_base"
              render={({ field }) => (
                <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field
            label="INCC mensal (decimal)"
            help="Índice Nacional de Custos da Construção (FGV). Use 0,007 para 0,7%/mês (previsão meio-termo). Mediana 5y ≈ 0,0045 (0,45%). Cuidado: 0,7 = 70%, não 0,7%."
          >
            <Controller
              control={control}
              name="entrada.incc_mensal_percent"
              render={({ field }) => (
                <NumberInputBR
                  value={field.value}
                  onChange={field.onChange}
                  maxDecimals={5}
                />
              )}
            />
          </Field>
          <Field
            label="Parcela pós-entrega"
            help="Valor da prestação ao banco após o habite-se (vem da simulação CEF/SBPE). Durante a obra, o cliente paga TEO = parcela × (% acumulado de obra). Ex.: parcela R$ 2.966 × 15% acumulado = R$ 444,90 naquele mês. Teto: 95% acumulado."
          >
            <Controller
              control={control}
              name="entrada.parcela_pos_entrega"
              render={({ field }) => (
                <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
        </div>

        <div className="rounded-md border border-border p-4 bg-paper-alt/40">
          <Field
            label="Como o cliente paga o INCC?"
            help="A correção INCC incide sobre o saldo devedor todo mês. O cliente pode (1) pagar o INCC junto com a parcela base, mantendo o saldo amortizado conforme contrato; OU (2) pagar só a parcela base, deixando o INCC inflar o saldo — financiamento bancário ao final fica maior."
          >
            <Controller
              control={control}
              name="entrada.modo_incc"
              render={({ field }) => (
                <select
                  className="h-10 rounded-md border border-border bg-card px-3 text-sm max-w-md"
                  value={field.value ?? "cliente_paga_mensal"}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="cliente_paga_mensal">
                    Cliente paga parcela + INCC do mês (saldo amortiza certo)
                  </option>
                  <option value="saldo_acumula">
                    Cliente paga só a parcela base (INCC infla saldo → financiamento maior)
                  </option>
                </select>
              )}
            />
          </Field>
        </div>

        <AtoBlock />

        <AnualBlock />

        <ParcelaSugeridaBlock />

        <EntradaTotalDerivada />
      </CardBody>
    </Card>
  );
}

function AnualBlock() {
  const { control } = useFormContext<SimulacaoConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "entrada.anuais",
  });

  return (
    <div className="rounded-md border border-border p-4 bg-paper-alt/40 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted flex items-center gap-1.5">
          📅 Parcela anual (reforço)
          <FieldHelp text="Parcela-reforço opcional, geralmente coberta pelo 13º. Você define em qual mês incide (default: Dezembro). Limite: 1 parcela anual por cenário." />
        </div>
        {fields.length === 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id: newId(),
                tipo: "mes_calendario",
                mes: 12,
                valor: 0,
                corrige_incc: true,
              })
            }
          >
            + Adicionar anual
          </Button>
        )}
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-ink-muted">
          Sem parcela anual configurada. (Opcional.)
        </p>
      )}
      {fields.map((_, i) => (
        <AnualRow key={fields[i].id} index={i} onRemove={() => remove(i)} />
      ))}
    </div>
  );
}

function AtoBlock() {
  const { control } = useFormContext<SimulacaoConfig>();
  const ato = useWatch({ control, name: "entrada.ato" });
  const numMeses = useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;

  const valorTotal = ato?.valor_total ?? 0;
  const parcelas = ato?.parcelas ?? 1;
  const primeiroMes = ato?.primeiro_mes ?? 1;
  const valorParcela = parcelas > 0 ? valorTotal / parcelas : 0;
  const ultimoMes = primeiroMes + parcelas - 1;

  return (
    <div className="rounded-md border border-border p-4 bg-paper-alt/40 space-y-3">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted flex items-center gap-1.5">
        ✍️ Ato (sinal)
        <FieldHelp text="Sinal pago à construtora. Pode ser à vista (1×) ou parcelado em N vezes. Durante os meses de ato, NÃO há parcela mensal junto — para não sobrecarregar o cliente." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Field
          label="Valor total do ato"
          help="Geralmente 5–10% do valor do imóvel."
          className="md:col-span-4"
        >
          <Controller
            control={control}
            name="entrada.ato.valor_total"
            render={({ field }) => (
              <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field
          label="Parcelado em (×)"
          help="1 = à vista no mês 1. 3 = dividido em 3 meses. Durante esses meses, mensais ficam suspensas."
          className="md:col-span-3"
        >
          <Controller
            control={control}
            name="entrada.ato.parcelas"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                max={numMeses}
                value={field.value ?? 1}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
              />
            )}
          />
        </Field>
        <Field
          label="A partir do mês"
          help="Mês em que começa a cobrar o ato. Default = 1 (logo após assinatura)."
          className="md:col-span-2"
        >
          <Controller
            control={control}
            name="entrada.ato.primeiro_mes"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                max={numMeses}
                value={field.value ?? 1}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
              />
            )}
          />
        </Field>
        <Field
          label="Corrige INCC"
          help="Se o ato é parcelado após a assinatura, costuma corrigir mensalmente."
          className="md:col-span-3"
        >
          <Controller
            control={control}
            name="entrada.ato.corrige_incc"
            render={({ field }) => (
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                value={field.value ? "yes" : "no"}
                onChange={(e) => field.onChange(e.target.value === "yes")}
              >
                <option value="no">Não</option>
                <option value="yes">Sim</option>
              </select>
            )}
          />
        </Field>
      </div>
      {valorTotal > 0 && parcelas > 0 && (
        <div className="text-[12px] text-ink-soft">
          <span className="text-ink-muted">Cobrado em </span>
          <span className="font-mono tabular-nums">
            {parcelas}×{" "}
            R$ {Math.round(valorParcela).toLocaleString("pt-BR")}
          </span>
          <span className="text-ink-muted"> — meses {primeiroMes} a {ultimoMes}.</span>
          {parcelas > 1 && (
            <span className="text-ink-muted">
              {" "}Mensais começam no mês {ultimoMes + 1}.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sugestão de parcela mensal calculada a partir de imóvel/financiamento/FGTS,
 * descontando ato e anuais. Renderizado APÓS o AnualBlock para não interromper
 * o fluxo (cálculo depende das anuais já configuradas).
 */
function ParcelaSugeridaBlock() {
  const { control, setValue } = useFormContext<SimulacaoConfig>();
  const ato = useWatch({ control, name: "entrada.ato" });
  const numMeses = useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;
  const valorImovel = useWatch({ control, name: "imovel.valor_total" }) ?? 0;
  const valorFinanciado =
    useWatch({ control, name: "imovel.valor_financiado_banco" }) ?? 0;
  const fgts = useWatch({ control, name: "imovel.fgts_disponivel" }) ?? 0;
  const fgtsAbateSaldo =
    useWatch({ control, name: "imovel.fgts_abate_saldo" }) ?? true;
  const parcelaAtual =
    useWatch({ control, name: "entrada.parcela_mensal_base" }) ?? 0;
  const anuais = useWatch({ control, name: "entrada.anuais" }) ?? [];
  const dataInicioStr =
    useWatch({ control, name: "imovel.data_inicio" }) ?? "2026-01-01";
  const dataInicio = parseDataInicioLocal(dataInicioStr);

  const valorAto = ato?.valor_total ?? 0;
  const parcelas = ato?.parcelas ?? 1;

  const totalAnuais = anuais.reduce((acc, a) => {
    if (!a) return acc;
    const meses = resolveMesesAnual(a, dataInicio, numMeses);
    return acc + (a.valor ?? 0) * meses.length;
  }, 0);
  const fgtsContribuido = fgtsAbateSaldo ? fgts : 0;
  const totalEntrada = Math.max(0, valorImovel - valorFinanciado);
  const totalViaMensais = Math.max(
    0,
    totalEntrada - valorAto - fgtsContribuido - totalAnuais,
  );
  const atoEhAVista = parcelas <= 1;
  const mesesMensais = atoEhAVista
    ? numMeses
    : Math.max(0, numMeses - parcelas);
  const parcelaSugerida =
    mesesMensais > 0 && totalViaMensais > 0 ? totalViaMensais / mesesMensais : 0;

  const podeMostrarSugestao =
    valorImovel > 0 &&
    valorFinanciado > 0 &&
    parcelaSugerida > 0 &&
    Math.abs(parcelaSugerida - parcelaAtual) > 1;

  if (!podeMostrarSugestao) return null;

  return (
    <div className="rounded-md border border-amber/40 bg-amber-soft/50 p-3 space-y-2">
      <div className="flex items-start gap-2 text-[12px] text-amber">
        <span className="shrink-0">💡</span>
        <div className="leading-relaxed flex-1">
          <strong className="text-ink">Parcela mensal sugerida:</strong>{" "}
          <span className="font-mono tabular-nums">
            R$ {Math.round(parcelaSugerida).toLocaleString("pt-BR")}
          </span>{" "}
          <span className="text-ink-soft">
            (atual: R$ {Math.round(parcelaAtual).toLocaleString("pt-BR")})
          </span>
          <div className="text-[11px] text-ink-soft mt-1 font-mono">
            Total da entrada R$ {Math.round(totalEntrada).toLocaleString("pt-BR")}
            {" − "}ato R$ {Math.round(valorAto).toLocaleString("pt-BR")}
            {fgtsContribuido > 0 && (
              <> {" − "}FGTS R$ {Math.round(fgtsContribuido).toLocaleString("pt-BR")}</>
            )}
            {totalAnuais > 0 && (
              <> {" − "}anuais R$ {Math.round(totalAnuais).toLocaleString("pt-BR")}</>
            )}
            {" = "}R$ {Math.round(totalViaMensais).toLocaleString("pt-BR")} ÷ {mesesMensais} meses
          </div>
          {parcelas > 1 && (
            <div className="text-[11px] text-ink-soft mt-1">
              Como você parcelou o ato em {parcelas}×, mensais ocupam só {mesesMensais} meses (em vez de {numMeses}) — por isso a parcela sobe.
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-amber text-amber bg-card hover:bg-amber-soft"
          onClick={() =>
            setValue(
              "entrada.parcela_mensal_base",
              Math.round(parcelaSugerida * 100) / 100,
            )
          }
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}

function EntradaTotalDerivada() {
  const { control } = useFormContext<SimulacaoConfig>();
  const ato = useWatch({ control, name: "entrada.ato" });
  const parcelaBase = useWatch({ control, name: "entrada.parcela_mensal_base" }) ?? 0;
  const anuais = useWatch({ control, name: "entrada.anuais" }) ?? [];
  const numMeses = useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;
  const dataInicioStr = useWatch({ control, name: "imovel.data_inicio" }) ?? "2026-01-01";
  const dataInicio = parseDataInicioLocal(dataInicioStr);
  const fgts = useWatch({ control, name: "imovel.fgts_disponivel" }) ?? 0;
  const fgtsAbateSaldo =
    useWatch({ control, name: "imovel.fgts_abate_saldo" }) ?? true;

  const atoTotal = ato?.valor_total ?? 0;
  const atoParcelas = ato?.parcelas ?? 1;
  // Ato 1× (à vista) NÃO ocupa mês — mensais rolam em todos os meses.
  // Ato parcelado (≥2×) ocupa N meses e suspende mensais nesses meses.
  const atoEhAVista = atoParcelas <= 1;
  const mesesMensais = atoEhAVista
    ? numMeses
    : Math.max(0, numMeses - atoParcelas);

  let totalAnuais = 0;
  for (const a of anuais) {
    if (!a) continue;
    const meses = resolveMesesAnual(a, dataInicio, numMeses);
    totalAnuais += (a.valor ?? 0) * meses.length;
  }

  const fgtsContribuido = fgtsAbateSaldo ? fgts : 0;
  const total =
    atoTotal +
    fgtsContribuido +
    parcelaBase * mesesMensais +
    totalAnuais;

  return (
    <div className="rounded-md border border-border bg-paper-alt/40 px-4 py-3 max-w-md">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          Entrada total (calculada)
          <FieldHelp text="Soma automática: ato + FGTS (se abate o saldo) + (parcela mensal × meses) + parcelas anuais. NÃO inclui custos cartoriais." />
        </Label>
        <span className="font-mono tabular-nums text-[15px] font-semibold text-ink">
          R$ {Math.round(total).toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="text-[11px] text-ink-muted mt-1.5 font-mono">
        Ato R$ {Math.round(atoTotal).toLocaleString("pt-BR")}
        {fgtsContribuido > 0 && (
          <> {" + "} FGTS R$ {Math.round(fgtsContribuido).toLocaleString("pt-BR")}</>
        )}
        {" + "}
        {mesesMensais}× parcela R$ {Math.round(parcelaBase).toLocaleString("pt-BR")} = R$ {Math.round(parcelaBase * mesesMensais).toLocaleString("pt-BR")}
        {totalAnuais > 0 && (
          <> {" + "} anuais R$ {Math.round(totalAnuais).toLocaleString("pt-BR")}</>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 *  AnualRow — usado pelo <AnualBlock /> (sub-bloco da Entrada)
 * ============================================================ */
function AnualRow({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) {
  const { control, setValue } = useFormContext<SimulacaoConfig>();
  const anual = useWatch({ control, name: `entrada.anuais.${index}` });
  const numMeses =
    useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;
  const dataInicioStr =
    useWatch({ control, name: "imovel.data_inicio" }) ?? "2026-01-01";
  const dataInicio = parseDataInicioLocal(dataInicioStr);

  const tipo = anual?.tipo ?? "mes_calendario";
  const mesesPreview = anual ? resolveMesesAnual(anual, dataInicio, numMeses) : [];

  function setTipo(novoTipo: "mes_calendario" | "intervalo" | "manual") {
    if (novoTipo === tipo) return;
    const id = anual?.id ?? newId();
    const valor = anual?.valor ?? 0;
    const corrige_incc = anual?.corrige_incc ?? true;
    if (novoTipo === "mes_calendario") {
      setValue(`entrada.anuais.${index}`, {
        id,
        tipo: "mes_calendario",
        mes: 12,
        valor,
        corrige_incc,
      });
    } else if (novoTipo === "intervalo") {
      setValue(`entrada.anuais.${index}`, {
        id,
        tipo: "intervalo",
        primeiro_mes: 12,
        cada_n: 12,
        valor,
        corrige_incc,
      });
    } else {
      const mesesAtuais =
        anual?.tipo === "manual" ? anual.meses : mesesPreview;
      setValue(`entrada.anuais.${index}`, {
        id,
        tipo: "manual",
        meses: mesesAtuais,
        valor,
        corrige_incc,
      });
    }
  }

  return (
    <div className="rounded border border-border p-3 bg-card space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Field
          label="Valor"
          help="Valor da parcela-reforço (geralmente o 13º cobre)."
          className="md:col-span-3"
        >
          <Controller
            control={control}
            name={`entrada.anuais.${index}.valor` as const}
            render={({ field }) => (
              <NumberInputBR
                prefix="R$"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field
          label="Corrige INCC"
          help="Anuais geralmente são corrigidos pelo INCC do mês em que caem. Use 'Não' apenas se o contrato fixar o valor nominal."
          className="md:col-span-2"
        >
          <Controller
            control={control}
            name={`entrada.anuais.${index}.corrige_incc` as const}
            render={({ field }) => (
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                value={field.value ? "yes" : "no"}
                onChange={(e) => field.onChange(e.target.value === "yes")}
              >
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            )}
          />
        </Field>
        <div className="md:col-span-7 flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red"
          >
            Remover
          </Button>
        </div>
      </div>

      {/* Modo de incidência */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          Quando incide?
          <FieldHelp text="Reforço anual normalmente cai em Dezembro (junto com o 13º). Você pode escolher outro mês, definir intervalo livre, ou marcar meses específicos manualmente." />
        </Label>
        <div className="flex flex-wrap gap-2">
          <ModoTab active={tipo === "mes_calendario"} onClick={() => setTipo("mes_calendario")}>
            Todo mês X
          </ModoTab>
          <ModoTab active={tipo === "intervalo"} onClick={() => setTipo("intervalo")}>
            A cada N meses
          </ModoTab>
          <ModoTab active={tipo === "manual"} onClick={() => setTipo("manual")}>
            Meses específicos
          </ModoTab>
        </div>

        {tipo === "mes_calendario" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <Field
              label="Em todo mês de"
              className="md:col-span-4"
              hint="Default: Dezembro (cai junto com o 13º)"
            >
              <Controller
                control={control}
                name={`entrada.anuais.${index}.mes` as const}
                render={({ field }) => (
                  <select
                    className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                    value={field.value ?? 12}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  >
                    {Array.from({ length: 12 }, (_, k) => k + 1).map((m) => (
                      <option key={m} value={m}>
                        {NOMES_MESES_PT_BR[m]}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>
          </div>
        )}

        {tipo === "intervalo" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <Field label="A cada (meses)" className="md:col-span-3">
              <Controller
                control={control}
                name={`entrada.anuais.${index}.cada_n` as const}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.value ?? 12}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 1)
                    }
                  />
                )}
              />
            </Field>
            <Field label="Começando no mês" className="md:col-span-3">
              <Controller
                control={control}
                name={`entrada.anuais.${index}.primeiro_mes` as const}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    max={numMeses}
                    value={field.value ?? 1}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 1)
                    }
                  />
                )}
              />
            </Field>
          </div>
        )}

        {tipo === "manual" && (
          <div className="pt-2">
            <Field label="Marque os meses manualmente">
              <Controller
                control={control}
                name={`entrada.anuais.${index}.meses` as const}
                render={({ field }) => (
                  <MesesChips
                    total={numMeses}
                    selected={(field.value as number[]) ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>
        )}

        {/* Preview */}
        {mesesPreview.length > 0 && (
          <div className="text-[12px] text-ink-soft pt-1">
            <span className="text-ink-muted">Cairá em: </span>
            <span className="font-mono tabular-nums">
              {mesesPreview
                .map(
                  (m) =>
                    `m${m} (${formatMesAnoLocal(somarMesesLocal(dataInicio, m - 1))})`,
                )
                .join(" · ")}
              {" — "}
              {mesesPreview.length}{" "}
              {mesesPreview.length === 1 ? "ocorrência" : "ocorrências"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ModoTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors " +
        (active
          ? "bg-ink text-white border-ink"
          : "bg-card text-ink-soft border-border hover:border-ink-soft")
      }
    >
      {children}
    </button>
  );
}

function parseDataInicioLocal(s: string): Date {
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  return new Date(y || 2026, (m ?? 1) - 1, d ?? 1);
}
function somarMesesLocal(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
const _fmtMesAnoLocal = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});
function formatMesAnoLocal(d: Date): string {
  return _fmtMesAnoLocal.format(d).replace(".", "");
}

/* ============================================================
 *  Custos cartoriais (ITBI + cartórios + taxas) com toggle "diluir"
 * ============================================================ */
export function CustosCartoriaisSection() {
  const { control, setValue } = useFormContext<SimulacaoConfig>();
  const tipo = useWatch({ control, name: "custosCartoriais.calculo.tipo" });
  const diluir = useWatch({ control, name: "custosCartoriais.diluir" });
  const numMeses =
    useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;

  return (
    <Card>
      <CardHeader
        title="Custos cartoriais (ITBI + cartórios + taxas)"
        subtitle="Calcule o valor total e decida se quer diluir nas parcelas mensais ou pagar à vista na entrega."
      />
      <CardBody className="space-y-5">
        {/* Modo de cálculo */}
        <div>
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-2">
            Como calcular o valor total
          </div>
          <Tabs
            value={tipo ?? "valor_total"}
            onValueChange={(v) => {
              if (v === "aliquota") {
                setValue("custosCartoriais.calculo", {
                  tipo: "aliquota",
                  aliquota_percent: 0.05,
                  valor_imovel: 0,
                  include_cartorios: true,
                });
              } else if (v === "valor_total") {
                setValue("custosCartoriais.calculo", {
                  tipo: "valor_total",
                  valor_itbi_total: 0,
                });
              } else {
                setValue("custosCartoriais.calculo", {
                  tipo: "itemizado",
                  itbi: 0,
                  cartorio: 0,
                  taxas_diversas: 0,
                  outras_despesas: 0,
                });
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="aliquota">Por alíquota</TabsTrigger>
              <TabsTrigger value="valor_total">Valor total</TabsTrigger>
              <TabsTrigger value="itemizado">Itemizado</TabsTrigger>
            </TabsList>
            <TabsContent value="aliquota" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <Field
                label="Alíquota (decimal)"
                help="ITBI varia por município: 3% (São Paulo), 5% (Barueri), 4% (Osasco). Use o decimal: 0,05 = 5%."
              >
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.aliquota_percent"
                  render={({ field }) => (
                    <NumberInputBR
                      value={field.value}
                      onChange={field.onChange}
                      maxDecimals={4}
                    />
                  )}
                />
              </Field>
              <Field
                label="Valor do imóvel (base)"
                help="Base de cálculo do ITBI. Geralmente é o valor de venda; em alguns municípios usa o valor venal se for maior."
              >
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.valor_imovel"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field
                label="Incluir cartórios (~3%)?"
                help="Adiciona ~3% do valor para cobrir registro em cartório, escritura e taxas associadas. Bom para uma estimativa total."
              >
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.include_cartorios"
                  render={({ field }) => (
                    <select
                      className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                      value={field.value ? "yes" : "no"}
                      onChange={(e) => field.onChange(e.target.value === "yes")}
                    >
                      <option value="yes">Sim</option>
                      <option value="no">Não</option>
                    </select>
                  )}
                />
              </Field>
            </TabsContent>
            <TabsContent value="valor_total" className="pt-3 max-w-sm">
              <Field label="Valor total já calculado">
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.valor_itbi_total"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
            </TabsContent>
            <TabsContent value="itemizado" className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
              <Field label="ITBI">
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.itbi"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="Cartório">
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.cartorio"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="Taxas diversas">
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.taxas_diversas"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="Outras despesas">
                <Controller
                  control={control}
                  name="custosCartoriais.calculo.outras_despesas"
                  render={({ field }) => (
                    <NumberInputBR prefix="R$" value={field.value} onChange={field.onChange} />
                  )}
                />
              </Field>
            </TabsContent>
          </Tabs>
        </div>

        <CustosCalculados />

        {/* Toggle diluir + parâmetros */}
        <div className="rounded-md border border-border p-4 bg-paper-alt/40">
          <Field
            label="Como pagar?"
            help="ITBI + cartórios são pagos no registro do imóvel (na entrega). Diluir = você provisiona em parcelas mensais durante a obra (entram no fluxo). Não diluir = você guarda o dinheiro e paga de uma vez no fim."
          >
            <Controller
              control={control}
              name="custosCartoriais.diluir"
              render={({ field }) => (
                <select
                  className="h-10 rounded-md border border-border bg-card px-3 text-sm max-w-xs"
                  value={field.value ? "yes" : "no"}
                  onChange={(e) => field.onChange(e.target.value === "yes")}
                >
                  <option value="no">Pagar à vista (na entrega)</option>
                  <option value="yes">Diluir nas parcelas mensais</option>
                </select>
              )}
            />
          </Field>
          {diluir && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Field label="Em quantas parcelas?">
                <Controller
                  control={control}
                  name="custosCartoriais.parcelas"
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={1}
                      max={numMeses}
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                    />
                  )}
                />
              </Field>
              <Field label="Mês de início">
                <Controller
                  control={control}
                  name="custosCartoriais.mes_inicio"
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={1}
                      max={numMeses}
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                    />
                  )}
                />
              </Field>
              <Field label="Corrige INCC?">
                <Controller
                  control={control}
                  name="custosCartoriais.corrige_incc"
                  render={({ field }) => (
                    <select
                      className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                      value={field.value ? "yes" : "no"}
                      onChange={(e) => field.onChange(e.target.value === "yes")}
                    >
                      <option value="no">Não</option>
                      <option value="yes">Sim</option>
                    </select>
                  )}
                />
              </Field>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function CustosCalculados() {
  const { control } = useFormContext<SimulacaoConfig>();
  const calculo = useWatch({ control, name: "custosCartoriais.calculo" });
  const diluir = useWatch({ control, name: "custosCartoriais.diluir" }) ?? false;
  const parcelas =
    useWatch({ control, name: "custosCartoriais.parcelas" }) ?? 1;

  let result: ReturnType<typeof calcularITBI> | null = null;
  try {
    result = calculo ? calcularITBI(calculo as ITBIConfig) : null;
  } catch {
    result = null;
  }
  if (!result || result.total === 0) {
    return (
      <div className="rounded-md border border-border bg-paper-alt/40 px-4 py-3">
        <Label className="flex items-center gap-1.5">
          Custo total calculado
          <FieldHelp text="Soma de ITBI + cartórios + taxas conforme o modo de cálculo escolhido acima." />
        </Label>
        <p className="text-[12px] text-ink-muted mt-1.5">
          Preencha os campos acima para ver o valor total.
        </p>
      </div>
    );
  }

  const valorParcela =
    diluir && parcelas > 0 ? result.total / parcelas : 0;

  return (
    <div className="rounded-md border border-border bg-paper-alt/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="flex items-center gap-1.5">
          Custo total calculado
          <FieldHelp text="Soma de ITBI + cartórios + taxas conforme o modo de cálculo escolhido acima." />
        </Label>
        <span className="font-mono tabular-nums text-[16px] font-semibold text-ink">
          R$ {Math.round(result.total).toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="text-[11.5px] font-mono text-ink-soft space-y-0.5">
        {result.tipo === "aliquota" && (
          <>
            <div className="flex justify-between">
              <span className="text-ink-muted">
                ITBI ({((result.detalhes.aliquota_percent as number) * 100).toFixed(2)}%)
              </span>
              <span>R$ {Math.round(result.itbi).toLocaleString("pt-BR")}</span>
            </div>
            {result.cartorios > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Cartórios + taxas (~3%)</span>
                <span>R$ {Math.round(result.cartorios).toLocaleString("pt-BR")}</span>
              </div>
            )}
          </>
        )}
        {result.tipo === "itemizado" && (
          <>
            <div className="flex justify-between">
              <span className="text-ink-muted">ITBI</span>
              <span>R$ {Math.round(result.itbi).toLocaleString("pt-BR")}</span>
            </div>
            {result.cartorios > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Cartório + taxas</span>
                <span>R$ {Math.round(result.cartorios).toLocaleString("pt-BR")}</span>
              </div>
            )}
            {result.outras > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Outras despesas</span>
                <span>R$ {Math.round(result.outras).toLocaleString("pt-BR")}</span>
              </div>
            )}
          </>
        )}
        {result.tipo === "valor_total" && (
          <div className="text-ink-muted">Valor informado direto.</div>
        )}
        {diluir && parcelas > 0 && (
          <div className="flex justify-between pt-1.5 border-t border-border mt-1.5">
            <span className="text-ink-muted">
              Diluído em {parcelas}× de
            </span>
            <span className="text-ink font-semibold">
              R$ {Math.round(valorParcela).toLocaleString("pt-BR")}/mês
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 *  Evolução
 * ============================================================ */
export function EvolucaoSection() {
  const { control, setValue } = useFormContext<SimulacaoConfig>();
  const tipo = useWatch({ control, name: "evolucao.tipo" });
  const numMeses =
    useWatch({ control, name: "imovel.periodos_construcao" }) ?? 35;

  const opcoes = [
    {
      tipo: "progressivo" as const,
      titulo: "Progressivo",
      descricao:
        "Lenta no início (fundação), acelera no meio (alvenaria) e desacelera no acabamento. Padrão de obras reais.",
      sample: gerarEvolucao(numMeses, { tipo: "progressivo" }),
    },
    {
      tipo: "linear" as const,
      titulo: "Linear",
      descricao: `Mesmo % em todos os meses (90 ÷ ${numMeses} = ${(90 / numMeses).toFixed(2)}%). Modelo simplificado.`,
      sample: gerarEvolucao(numMeses, { tipo: "linear" }),
    },
    {
      tipo: "customizado" as const,
      titulo: "Customizado",
      descricao: "Você define o % concluído de cada mês manualmente.",
      sample: Array.from({ length: numMeses }, () => 90 / numMeses),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Evolução de obra"
        subtitle="Curva de % concluído por mês — usada para calcular o TEO bancário."
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {opcoes.map((o) => (
            <button
              key={o.tipo}
              type="button"
              onClick={() => {
                if (o.tipo === "customizado") {
                  setValue("evolucao", {
                    tipo: "customizado",
                    percentuais: Array.from(
                      { length: numMeses },
                      () => 90 / numMeses,
                    ),
                  });
                } else {
                  setValue("evolucao", { tipo: o.tipo });
                }
              }}
              className={cn(
                "rounded-md border p-4 text-left transition-all bg-card",
                tipo === o.tipo
                  ? "border-ink ring-2 ring-ink/20 shadow-sm"
                  : "border-border hover:border-ink-soft",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "w-3 h-3 rounded-full border-2 inline-block",
                    tipo === o.tipo ? "bg-ink border-ink" : "border-border",
                  )}
                />
                <span className="font-semibold text-ink text-sm">
                  {o.titulo}
                </span>
              </div>
              <Sparkline
                values={o.sample}
                color={tipo === o.tipo ? "var(--color-ink)" : "var(--color-ink-muted)"}
              />
              <p className="text-[11.5px] text-ink-soft leading-relaxed mt-2">
                {o.descricao}
              </p>
            </button>
          ))}
        </div>

        {tipo === "customizado" && (
          <Controller
            control={control}
            name="evolucao"
            render={({ field }) => {
              const v = field.value;
              if (v.tipo !== "customizado") return <span />;
              return (
                <div>
                  <div className="text-[11px] text-ink-muted mb-2 font-mono uppercase tracking-wider">
                    % de obra por mês (soma esperada ≈ 90%)
                  </div>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                    {v.percentuais.map((p, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <Label className="text-[9px]">m{i + 1}</Label>
                        <NumberInputBR
                          value={p}
                          onChange={(n) => {
                            const next = [...v.percentuais];
                            next[i] = n;
                            field.onChange({
                              tipo: "customizado",
                              percentuais: next,
                            });
                          }}
                          suffix="%"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
        )}
      </CardBody>
    </Card>
  );
}

function Sparkline({
  values,
  color = "var(--color-ink)",
  width = 220,
  height = 48,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 0.001);
  const padX = 2;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = padX + i * step;
      const y = padY + innerH - (v / max) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = padX + (values.length - 1) * step;
  const baseline = padY + innerH;
  const fillPath = `${padX},${baseline} ${points} ${lastX.toFixed(1)},${baseline}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label="Curva de evolução"
    >
      <polygon points={fillPath} fill={color} fillOpacity={0.12} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
