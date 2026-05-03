import type { SimulacaoConfig } from "@/lib/calculation-engine";

/**
 * Fixtures de teste — derivadas dos exemplos genéricos do regras.md.
 * Usadas só por tests; não são mais expostas na UI.
 *
 * Schema v5 (sem `comprador.outros`, sem `entrada.valor_entrada_total`).
 */
export const FIX_EXEMPLO_1: SimulacaoConfig = {
  rotulo: "Cenário 1 · 35 meses",
  renda: {
    compradores: [
      { id: "c1", rotulo: "Comprador 1", renda_liquida: 12280 },
      { id: "c2", rotulo: "Comprador 2", renda_liquida: 2300 },
    ],
    outros_rendimentos: 0,
  },
  gastos: { gastos_fixos_mensais: 6000 },
  imovel: {
    valor_total: 445060,
    valor_financiado_banco: 334500,
    periodos_construcao: 35,
    data_inicio: "2026-05-01",
    fgts_disponivel: 12000,
    fgts_abate_saldo: true,
  },
  entrada: {
    ato: { valor_total: 20000, parcelas: 1, primeiro_mes: 1, corrige_incc: false },
    parcela_mensal_base: 1644,
    anuais: [
      { id: "a1", tipo: "mes_calendario", mes: 12, valor: 7000, corrige_incc: true },
    ],
    incc_mensal_percent: 0.0045,
    modo_incc: "cliente_paga_mensal",
    parcela_pos_entrega: 2966.08,
  },
  evolucao: { tipo: "progressivo" },
  custosCartoriais: {
    calculo: {
      tipo: "aliquota",
      aliquota_percent: 0.05,
      valor_imovel: 445060,
      include_cartorios: true,
    },
    diluir: true,
    parcelas: 20,
    mes_inicio: 1,
    corrige_incc: false,
  },
};

export const FIX_EXEMPLO_2: SimulacaoConfig = {
  rotulo: "Cenário 2 · entrada leve",
  renda: {
    compradores: [
      { id: "c1", rotulo: "Comprador 1", renda_liquida: 12280 },
      { id: "c2", rotulo: "Comprador 2", renda_liquida: 2300 },
    ],
    outros_rendimentos: 0,
  },
  gastos: { gastos_fixos_mensais: 6000 },
  imovel: {
    valor_total: 408197,
    valor_financiado_banco: 335400,
    periodos_construcao: 35,
    data_inicio: "2026-05-01",
    fgts_disponivel: 12000,
    fgts_abate_saldo: true,
  },
  entrada: {
    ato: { valor_total: 15000, parcelas: 1, primeiro_mes: 1, corrige_incc: false },
    parcela_mensal_base: 879,
    anuais: [
      { id: "a1", tipo: "mes_calendario", mes: 12, valor: 5000, corrige_incc: true },
    ],
    incc_mensal_percent: 0.0045,
    modo_incc: "cliente_paga_mensal",
    parcela_pos_entrega: 2969.7,
  },
  evolucao: { tipo: "progressivo" },
  custosCartoriais: {
    calculo: {
      tipo: "aliquota",
      aliquota_percent: 0.05,
      valor_imovel: 408197,
      include_cartorios: true,
    },
    diluir: true,
    parcelas: 20,
    mes_inicio: 1,
    corrige_incc: false,
  },
};

export const FIX_EXEMPLO_3: SimulacaoConfig = {
  rotulo: "Cenário 3 · 48 meses",
  renda: {
    compradores: [
      { id: "c1", rotulo: "Comprador 1", renda_liquida: 8000 },
      { id: "c2", rotulo: "Comprador 2", renda_liquida: 4000 },
    ],
    outros_rendimentos: 0,
  },
  gastos: { gastos_fixos_mensais: 6500 },
  imovel: {
    valor_total: 500000,
    valor_financiado_banco: 400000,
    periodos_construcao: 48,
    data_inicio: "2026-06-01",
    fgts_disponivel: 15000,
    fgts_abate_saldo: true,
  },
  entrada: {
    ato: { valor_total: 25000, parcelas: 1, primeiro_mes: 1, corrige_incc: false },
    parcela_mensal_base: 1500,
    anuais: [
      { id: "a1", tipo: "intervalo", primeiro_mes: 12, cada_n: 12, valor: 8000, corrige_incc: true },
    ],
    incc_mensal_percent: 0.005,
    modo_incc: "cliente_paga_mensal",
    parcela_pos_entrega: 3200,
  },
  evolucao: { tipo: "progressivo" },
  custosCartoriais: {
    calculo: {
      tipo: "aliquota",
      aliquota_percent: 0.04,
      valor_imovel: 500000,
      include_cartorios: true,
    },
    diluir: true,
    parcelas: 10,
    mes_inicio: 1,
    corrige_incc: false,
  },
};

export const PRESETS = {
  "exemplo-1": FIX_EXEMPLO_1,
  "exemplo-2": FIX_EXEMPLO_2,
  "exemplo-3": FIX_EXEMPLO_3,
};
