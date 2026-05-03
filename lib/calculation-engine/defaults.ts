import type { SimulacaoConfig } from "./schema";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

function dataAtualISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-01`;
}

/**
 * Configuração base zerada — usada como ponto de partida quando o usuário
 * abre a app pela primeira vez ou clica em "Resetar". Nenhum valor monetário
 * pré-preenchido; só estrutura mínima e defaults técnicos sensatos.
 */
export function defaultConfig(): SimulacaoConfig {
  return {
    rotulo: "Novo cenário",
    renda: {
      compradores: [
        { id: newId(), rotulo: "Comprador 1", renda_liquida: 0 },
      ],
      outros_rendimentos: 0,
    },
    gastos: { gastos_fixos_mensais: 0 },
    imovel: {
      valor_total: 0,
      valor_financiado_banco: 0,
      periodos_construcao: 35,
      data_inicio: dataAtualISO(),
      fgts_disponivel: 0,
      fgts_abate_saldo: true,
    },
    entrada: {
      ato: { valor_total: 0, parcelas: 1, primeiro_mes: 1, corrige_incc: false },
      parcela_mensal_base: 0,
      anuais: [],
      incc_mensal_percent: 0.007, // 0,7% — previsão meio-termo
      modo_incc: "cliente_paga_mensal",
      parcela_pos_entrega: 0,
    },
    evolucao: { tipo: "progressivo" },
    custosCartoriais: {
      calculo: { tipo: "valor_total", valor_itbi_total: 0 },
      diluir: false,
      parcelas: 1,
      mes_inicio: 1,
      corrige_incc: false,
    },
  };
}
