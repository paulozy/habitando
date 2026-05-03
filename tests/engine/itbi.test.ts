import { describe, it, expect } from "vitest";
import { calcularITBI } from "@/lib/calculation-engine/itbi";

describe("calcularITBI — modo alíquota", () => {
  it("alíquota 5% com cartórios ≈ R$ 35.605 sobre R$ 445.060", () => {
    const r = calcularITBI({
      tipo: "aliquota",
      aliquota_percent: 0.05,
      valor_imovel: 445060,
      include_cartorios: true,
    });
    expect(r.itbi).toBe(22253);
    expect(r.cartorios).toBe(13352);
    expect(r.total).toBe(35605);
  });

  it("sem cartórios, total = ITBI puro", () => {
    const r = calcularITBI({
      tipo: "aliquota",
      aliquota_percent: 0.05,
      valor_imovel: 100000,
      include_cartorios: false,
    });
    expect(r.itbi).toBe(5000);
    expect(r.cartorios).toBe(0);
    expect(r.total).toBe(5000);
  });
});

describe("calcularITBI — modo valor_total", () => {
  it("usa o valor informado direto", () => {
    const r = calcularITBI({ tipo: "valor_total", valor_itbi_total: 42000 });
    expect(r.total).toBe(42000);
    expect(r.itbi).toBe(42000);
    expect(r.cartorios).toBe(0);
  });

  it("isenção (valor 0)", () => {
    const r = calcularITBI({ tipo: "valor_total", valor_itbi_total: 0 });
    expect(r.total).toBe(0);
  });
});

describe("calcularITBI — modo itemizado", () => {
  it("soma os 4 itens", () => {
    const r = calcularITBI({
      tipo: "itemizado",
      itbi: 22253,
      cartorio: 4451,
      taxas_diversas: 8901,
      outras_despesas: 500,
    });
    expect(r.itbi).toBe(22253);
    expect(r.cartorios).toBe(4451 + 8901);
    expect(r.outras).toBe(500);
    expect(r.total).toBe(22253 + 4451 + 8901 + 500);
  });
});
