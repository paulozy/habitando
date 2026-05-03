import { z } from "zod";

/* ============================================================
 *  Compradores (até 4)
 * ============================================================ */
export const CompradorSchema = z.object({
  id: z.string(),
  rotulo: z.string().min(1).default("Comprador"),
  renda_liquida: z.number().min(0).default(0),
});
export type Comprador = z.infer<typeof CompradorSchema>;

/* ============================================================
 *  Renda agregada (compradores + outros rendimentos familiares)
 * ============================================================ */
export const RendaSchema = z.object({
  compradores: z.array(CompradorSchema).min(1).max(4),
  outros_rendimentos: z.number().min(0).default(0),
});
export type Renda = z.infer<typeof RendaSchema>;

/* ============================================================
 *  Gastos
 * ============================================================ */
export const GastosSchema = z.object({
  gastos_fixos_mensais: z.number().min(0),
});
export type Gastos = z.infer<typeof GastosSchema>;

/* ============================================================
 *  Imóvel
 * ============================================================ */
export const ImovelSchema = z.object({
  valor_total: z.number().positive(),
  valor_financiado_banco: z.number().min(0),
  periodos_construcao: z.number().int().min(1).max(120),
  data_inicio: z.string(), // ISO YYYY-MM-DD ou YYYY-MM
  fgts_disponivel: z.number().min(0).default(0),
  /** Se true, FGTS abate o saldo devedor inicial junto com o ato. */
  fgts_abate_saldo: z.boolean().default(true),
});
export type Imovel = z.infer<typeof ImovelSchema>;

/* ============================================================
 *  Anual (parcela-reforço) — discriminated union em 3 modos:
 *    - mes_calendario: "todo Dezembro" (mes = 1..12)
 *    - intervalo:      "a cada N meses começando no mês X"
 *    - manual:         meses específicos (lista 1..periodos_construcao)
 * ============================================================ */
export const AnualMesCalendarioSchema = z.object({
  id: z.string(),
  tipo: z.literal("mes_calendario"),
  mes: z.number().int().min(1).max(12), // 1=jan, 12=dez
  valor: z.number().min(0),
  corrige_incc: z.boolean().default(true),
});
export const AnualIntervaloSchema = z.object({
  id: z.string(),
  tipo: z.literal("intervalo"),
  primeiro_mes: z.number().int().min(1),
  cada_n: z.number().int().min(1).default(12),
  valor: z.number().min(0),
  corrige_incc: z.boolean().default(true),
});
export const AnualManualSchema = z.object({
  id: z.string(),
  tipo: z.literal("manual"),
  meses: z.array(z.number().int().min(1)).default([]),
  valor: z.number().min(0),
  corrige_incc: z.boolean().default(true),
});
export const AnualSchema = z.discriminatedUnion("tipo", [
  AnualMesCalendarioSchema,
  AnualIntervaloSchema,
  AnualManualSchema,
]);
export type Anual = z.infer<typeof AnualSchema>;
export type AnualMesCalendario = z.infer<typeof AnualMesCalendarioSchema>;
export type AnualIntervalo = z.infer<typeof AnualIntervaloSchema>;
export type AnualManual = z.infer<typeof AnualManualSchema>;

/* ============================================================
 *  Evolução de obra
 * ============================================================ */
export const EvolucaoSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("linear"),
  }),
  z.object({
    tipo: z.literal("progressivo"),
  }),
  z.object({
    tipo: z.literal("customizado"),
    percentuais: z.array(z.number().min(0).max(100)).min(1),
  }),
]);
export type Evolucao = z.infer<typeof EvolucaoSchema>;

/* ============================================================
 *  ITBI — discriminated union (regras_itbi.md)
 * ============================================================ */
export const ITBIAliquotaSchema = z.object({
  tipo: z.literal("aliquota"),
  aliquota_percent: z.number().min(0).max(0.2),
  valor_imovel: z.number().positive(),
  include_cartorios: z.boolean().default(false),
});
export const ITBIValorTotalSchema = z.object({
  tipo: z.literal("valor_total"),
  valor_itbi_total: z.number().min(0),
});
export const ITBIItemizadoSchema = z.object({
  tipo: z.literal("itemizado"),
  itbi: z.number().min(0),
  cartorio: z.number().min(0),
  taxas_diversas: z.number().min(0),
  outras_despesas: z.number().min(0).default(0),
});
export const ITBIConfigSchema = z.discriminatedUnion("tipo", [
  ITBIAliquotaSchema,
  ITBIValorTotalSchema,
  ITBIItemizadoSchema,
]);
export type ITBIConfig = z.infer<typeof ITBIConfigSchema>;

/* ============================================================
 *  Custos cartoriais (ITBI + cartórios + taxas) — unificado
 *  Pode ser pago à vista (na entrega) ou diluído nas parcelas mensais.
 * ============================================================ */
export const CustosCartoriaisSchema = z.object({
  calculo: ITBIConfigSchema,
  diluir: z.boolean().default(false),
  parcelas: z.number().int().min(1).default(1),
  mes_inicio: z.number().int().min(1).default(1),
  corrige_incc: z.boolean().default(false),
});
export type CustosCartoriais = z.infer<typeof CustosCartoriaisSchema>;

/* ============================================================
 *  Ato (sinal) — pode ser parcelado em N vezes a partir de primeiro_mes.
 *  Durante os meses do ato, NÃO há parcela mensal junto (suspende mensais).
 * ============================================================ */
export const AtoSchema = z.object({
  valor_total: z.number().min(0).default(0),
  parcelas: z.number().int().min(1).max(120).default(1),
  primeiro_mes: z.number().int().min(1).default(1),
  corrige_incc: z.boolean().default(false),
});
export type AtoConfig = z.infer<typeof AtoSchema>;

/* ============================================================
 *  Entrada (período de obras)
 * ============================================================ */
/**
 * Modo de pagamento do INCC durante a obra.
 *
 * - "cliente_paga_mensal" (default): cliente paga parcela_base + INCC do mês.
 *   Saldo amortiza como nominal (sem inflar). Custo aparece na parcela mensal.
 *
 * - "saldo_acumula": cliente paga só a parcela_base. INCC infla o saldo
 *   silenciosamente. Saldo final na entrega vira financiamento bancário maior.
 */
export const ModoIncc = z.enum(["cliente_paga_mensal", "saldo_acumula"]);
export type ModoInccType = z.infer<typeof ModoIncc>;

export const EntradaSchema = z.object({
  // Ato (pago à parte na assinatura)
  ato: AtoSchema,

  // Mensal
  parcela_mensal_base: z.number().min(0),

  // Anuais (parcelas-reforço) — máximo 1
  anuais: z.array(AnualSchema).max(1).default([]),

  // INCC
  incc_mensal_percent: z.number().min(0).max(0.05).default(0.007),
  modo_incc: ModoIncc.default("cliente_paga_mensal"),

  // Pós-entrega (para TEO)
  parcela_pos_entrega: z.number().min(0),
});
export type Entrada = z.infer<typeof EntradaSchema>;

/* ============================================================
 *  Config completa de simulação
 * ============================================================ */
export const SimulacaoConfigSchema = z.object({
  rotulo: z.string().min(1).default("Cenário"),
  renda: RendaSchema,
  gastos: GastosSchema,
  imovel: ImovelSchema,
  entrada: EntradaSchema,
  evolucao: EvolucaoSchema,
  custosCartoriais: CustosCartoriaisSchema,
});
export type SimulacaoConfig = z.infer<typeof SimulacaoConfigSchema>;

/* ============================================================
 *  Resultado por mês (linha da tabela)
 * ============================================================ */
export interface RowSimulacao {
  mes: number;
  data: Date;
  evolucao: number;
  evolucaoAcum: number;
  // Saldo devedor com a construtora
  saldoAntes: number;        // saldo no início do mês
  inccDoMes: number;         // = saldoAntes × incc_mensal
  saldoCorrigido: number;    // = saldoAntes + inccDoMes
  saldoDepois: number;       // = saldoCorrigido − pagamentos
  inccAcumulado: number;     // soma de inccDoMes até o mês m
  // Pagamentos do cliente neste mês
  parcelaBase: number;       // valor contratual fixo (= 0 nos meses de ato)
  inccPagoCliente: number;   // = inccDoMes se modo cliente_paga_mensal e NÃO é mês de ato
  parcelaCliente: number;    // = parcelaBase + inccPagoCliente
  atoPagoMes: number;        // = parcela do ato (valor_total/parcelas) ou 0
  isMesAto: boolean;         // m está dentro do período do ato
  anual: number;             // pago à construtora se m está em anuais.meses
  documentacao: number;      // custos cartoriais diluídos (se aplicável)
  teo: number;               // taxa de evolução de obra (banco)
  // Totais cobrados do cliente
  total: number;
  acumulado: number;
  disponivel: number;
  pctRenda: number;
}

export interface StatsSimulacao {
  totalGeral: number;            // total de TODOS os custos (mensal + ato + cartoriais à vista)
  totalMensalSomado: number;     // soma das linhas mensais
  mediaGeral: number;
  maximo: number;
  minimo: number;
  maxNormal: number;
  picoDezembros: number;
  // INCC
  totalINCC: number;             // soma dos INCCs do mês (juros)
  maxINCC: number;               // maior INCC mensal (geralmente m1)
  minINCC: number;               // menor INCC mensal (geralmente último mês)
  totalINCCPagoCliente: number;  // INCC efetivamente pago pelo cliente (modo cliente_paga_mensal)
  totalINCCAbsorvidoSaldo: number; // INCC que ficou no saldo (modo saldo_acumula)
  // Evolução de obra (TEO em R$ pago ao banco)
  evolucaoTotal: number;         // soma % de todos os meses (≈ 90)
  maxEvolucao: number;           // maior % mensal
  minEvolucao: number;           // menor % mensal
  maxTEO: number;                // maior TEO mensal em R$
  minTEO: number;                // menor TEO mensal em R$ (excluindo zeros)
  // Outros
  totalTEO: number;
  totalAto: number;
  mesesAto: number;          // quantos meses ocupados pelo ato
  totalCustosCartoriais: number;
  totalDocumentacao: number;
  // Saldo
  saldoInicial: number;          // saldo no m0 (= valor_imovel − ato − fgts_se_aplicavel)
  saldoFinal: number;            // saldo no fim da obra (= financiamento bancário real)
  saldoFinalNominal: number;     // saldo final SEM correção INCC (referência teórica)
  diferencaFinanciamento: number; // saldoFinal − saldoFinalNominal
  // Saúde do orçamento
  mesesCriticos: number;
  rendaTotal: number;
  disponivelTotal: number;
}

export interface ParecerItem {
  tom: "ok" | "alerta" | "info";
  icone: string;
  titulo: string;
  texto: string;
}

export interface AtoResult {
  valor_pago: number;       // valor do ato (corrigido por INCC se aplicável)
  valor_nominal: number;    // valor original do contrato
  corrige_incc: boolean;
}

export interface ResultadoSimulacao {
  rows: RowSimulacao[];
  stats: StatsSimulacao;
  parecer: ParecerItem[];
  ato: AtoResult;
  custosCartoriaisResult: ITBIResult;
}

/* ============================================================
 *  ITBI Result
 * ============================================================ */
export interface ITBIResult {
  tipo: ITBIConfig["tipo"];
  itbi: number;
  cartorios: number;
  outras: number;
  total: number;
  detalhes: Record<string, number | string | boolean | undefined>;
}

/* ============================================================
 *  Validação
 * ============================================================ */
export interface MensagemValidacao {
  campo?: string;
  texto: string;
}
export interface ValidacaoResultado {
  valido: boolean;
  erros: MensagemValidacao[];
  avisos: MensagemValidacao[];
  info: MensagemValidacao[];
}
