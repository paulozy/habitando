/** Aplica fator de INCC já acumulado a um valor base. */
export function aplicarINCC(valorBase: number, inccAcum: number): number {
  return valorBase * inccAcum;
}

/**
 * Compõe a sequência de fatores acumulados [m1..mN] dado o INCC mensal.
 * fatores[0] = (1+i)^1, fatores[1] = (1+i)^2, etc.
 */
export function gerarFatoresINCC(numMeses: number, inccMensal: number): number[] {
  const fatores: number[] = [];
  let acum = 1;
  for (let m = 1; m <= numMeses; m++) {
    acum *= 1 + inccMensal;
    fatores.push(acum);
  }
  return fatores;
}
