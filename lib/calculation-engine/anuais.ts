import type { Anual } from "./schema";

/**
 * Resolve em quais meses (1-based no contrato, 1..numMeses) uma parcela anual
 * incide, dado o modo configurado e a data de início do contrato.
 *
 * - mes_calendario: lista todos os meses do contrato cujo `Date.getMonth()+1`
 *   bate com `anual.mes` (1=jan...12=dez).
 * - intervalo: começa em `primeiro_mes` e adiciona `cada_n` enquanto ≤ numMeses.
 * - manual: usa a lista informada, filtrando os fora do período.
 */
export function resolveMesesAnual(
  anual: Anual,
  dataInicio: Date,
  numMeses: number,
): number[] {
  if (anual.tipo === "manual") {
    return [...new Set(anual.meses)]
      .filter((m) => m >= 1 && m <= numMeses)
      .sort((a, b) => a - b);
  }
  if (anual.tipo === "intervalo") {
    const meses: number[] = [];
    for (
      let m = anual.primeiro_mes;
      m <= numMeses;
      m += Math.max(1, anual.cada_n)
    ) {
      meses.push(m);
    }
    return meses;
  }
  // mes_calendario
  const meses: number[] = [];
  for (let m = 1; m <= numMeses; m++) {
    const d = new Date(
      dataInicio.getFullYear(),
      dataInicio.getMonth() + (m - 1),
      1,
    );
    if (d.getMonth() + 1 === anual.mes) {
      meses.push(m);
    }
  }
  return meses;
}

/** Nomes dos meses em PT-BR (1=jan ... 12=dez). */
export const NOMES_MESES_PT_BR: readonly string[] = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
