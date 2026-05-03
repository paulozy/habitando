import { describe, it, expect } from "vitest";
import {
  EVOLUCAO_PADRAO_35_MESES,
  gerarEvolucao,
} from "@/lib/calculation-engine/evolucao";

describe("gerarEvolucao", () => {
  it("linear: distribui 95% igualmente", () => {
    const arr = gerarEvolucao(36, { tipo: "linear" });
    expect(arr).toHaveLength(36);
    const soma = arr.reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(95, 5);
  });

  it("progressivo 35 meses reescala constante de referência (90→95)", () => {
    const arr = gerarEvolucao(35, { tipo: "progressivo" });
    const soma = arr.reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(95, 1);
    // primeiro valor reescalado: 1.0 × 95/90 ≈ 1.056
    expect(arr[0]).toBeCloseTo((EVOLUCAO_PADRAO_35_MESES[0] * 95) / 90, 5);
  });

  it("progressivo 48 meses soma ≈ 95", () => {
    const arr = gerarEvolucao(48, { tipo: "progressivo" });
    expect(arr).toHaveLength(48);
    const soma = arr.reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(95, 1);
  });

  it("customizado respeita os percentuais informados", () => {
    const arr = gerarEvolucao(3, {
      tipo: "customizado",
      percentuais: [10, 20, 30],
    });
    expect(arr).toEqual([10, 20, 30]);
  });

  it("customizado com mais valores que numMeses corta no fim", () => {
    const arr = gerarEvolucao(2, {
      tipo: "customizado",
      percentuais: [10, 20, 30, 40],
    });
    expect(arr).toEqual([10, 20]);
  });
});
