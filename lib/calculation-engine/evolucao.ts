import type { Evolucao } from "./schema";

/**
 * Teto da evolução acumulada de obra (%).
 * Corresponde ao máximo % da parcela pós-entrega que o cliente pode estar
 * pagando como TEO durante a obra. Convenção da aplicação: 95%
 * (em casos extremos os contratos passam disso, mas mantemos o teto pra
 * não permitir valores irrealistas como 100%+ acumulado).
 */
export const EVOLUCAO_TOTAL_MAX = 95;

/**
 * Curva progressiva de referência para 35 meses (regras.md ll. 248-251).
 * Originalmente soma ≈ 90,0%. Reescalada via fator EVOLUCAO_TOTAL_MAX/90
 * em `gerarEvolucao` para somar EVOLUCAO_TOTAL_MAX.
 */
export const EVOLUCAO_PADRAO_35_MESES: readonly number[] = [
  1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.0, 5.0, 4.5, 4.0, 3.5, 3.0,
  3.0, 3.0, 2.5, 2.5, 2.5, 2.0, 2.0, 2.0, 2.0, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  1.5, 1.5, 1.5, 1.5, 1.5,
];

/** EVOLUCAO_TOTAL_MAX% distribuído de forma senoidal — começa lento, acelera, desacelera. */
function gerarCurvaProgressiva(numMeses: number): number[] {
  const minBase = (EVOLUCAO_TOTAL_MAX / numMeses) * 0.5;
  const maxBase = (EVOLUCAO_TOTAL_MAX / numMeses) * 2.0;
  const valores: number[] = [];
  for (let i = 0; i < numMeses; i++) {
    const progress = i / numMeses;
    const curva = Math.sin(progress * Math.PI);
    valores.push(minBase + (maxBase - minBase) * curva);
  }
  const soma = valores.reduce((a, b) => a + b, 0);
  const fator = EVOLUCAO_TOTAL_MAX / soma;
  return valores.map((v) => v * fator);
}

/**
 * Gera o array de % de evolução por mês.
 * Soma ≈ EVOLUCAO_TOTAL_MAX (95) para tipos linear/progressivo.
 */
export function gerarEvolucao(numMeses: number, evolucao: Evolucao): number[] {
  if (evolucao.tipo === "customizado") {
    return [...evolucao.percentuais].slice(0, numMeses);
  }
  if (evolucao.tipo === "linear") {
    return Array(numMeses).fill(EVOLUCAO_TOTAL_MAX / numMeses);
  }
  if (numMeses === 35) {
    // Reescala a constante de referência (que originalmente soma 90%) para 95%.
    const factor = EVOLUCAO_TOTAL_MAX / 90;
    return EVOLUCAO_PADRAO_35_MESES.map((v) => v * factor);
  }
  return gerarCurvaProgressiva(numMeses);
}
