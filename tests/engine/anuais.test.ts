import { describe, it, expect } from "vitest";
import { resolveMesesAnual, type Anual } from "@/lib/calculation-engine";

const dataMai26 = new Date(2026, 4, 1); // mai/2026 (mês 0-based 4)
const dataJan26 = new Date(2026, 0, 1); // jan/2026

describe("resolveMesesAnual — modo mes_calendario", () => {
  it("dezembro a partir de mai/2026, 35 meses → [8, 20, 32]", () => {
    const a: Anual = {
      id: "a",
      tipo: "mes_calendario",
      mes: 12,
      valor: 7000,
      corrige_incc: true,
    };
    expect(resolveMesesAnual(a, dataMai26, 35)).toEqual([8, 20, 32]);
  });

  it("dezembro a partir de jan/2026, 35 meses → [12, 24]", () => {
    const a: Anual = {
      id: "a",
      tipo: "mes_calendario",
      mes: 12,
      valor: 7000,
      corrige_incc: true,
    };
    expect(resolveMesesAnual(a, dataJan26, 35)).toEqual([12, 24]);
  });

  it("janeiro a partir de mai/2026, 12 meses → [9]", () => {
    const a: Anual = {
      id: "a",
      tipo: "mes_calendario",
      mes: 1,
      valor: 0,
      corrige_incc: false,
    };
    expect(resolveMesesAnual(a, dataMai26, 12)).toEqual([9]);
  });
});

describe("resolveMesesAnual — modo intervalo", () => {
  it("a cada 12 meses começando no 12, 35 meses → [12, 24]", () => {
    const a: Anual = {
      id: "a",
      tipo: "intervalo",
      primeiro_mes: 12,
      cada_n: 12,
      valor: 8000,
      corrige_incc: true,
    };
    expect(resolveMesesAnual(a, dataJan26, 35)).toEqual([12, 24]);
  });

  it("a cada 6 meses começando no 6, 24 meses → [6, 12, 18, 24]", () => {
    const a: Anual = {
      id: "a",
      tipo: "intervalo",
      primeiro_mes: 6,
      cada_n: 6,
      valor: 0,
      corrige_incc: false,
    };
    expect(resolveMesesAnual(a, dataJan26, 24)).toEqual([6, 12, 18, 24]);
  });
});

describe("resolveMesesAnual — modo manual", () => {
  it("filtra meses fora do período e ordena", () => {
    const a: Anual = {
      id: "a",
      tipo: "manual",
      meses: [99, 5, 10, 5, -1],
      valor: 0,
      corrige_incc: false,
    };
    expect(resolveMesesAnual(a, dataJan26, 24)).toEqual([5, 10]);
  });
});
