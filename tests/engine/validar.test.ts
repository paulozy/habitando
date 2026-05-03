import { describe, it, expect } from "vitest";
import { validarInput } from "@/lib/calculation-engine/validar";
import { defaultConfig } from "@/lib/calculation-engine";
import { PRESETS } from "@/tests/_fixtures";

describe("validarInput", () => {
  it("preset 1 válido", () => {
    const r = validarInput(PRESETS["exemplo-1"]);
    expect(r.valido).toBe(true);
    expect(r.erros).toEqual([]);
  });

  it("config zerada gera erros (renda 0, gastos 0 OK, valor imóvel 0)", () => {
    const cfg = defaultConfig();
    const r = validarInput(cfg);
    expect(r.valido).toBe(false);
    expect(r.erros.some((e) => e.campo === "renda")).toBe(true);
    expect(r.erros.some((e) => e.campo === "imovel")).toBe(true);
  });

  it("financiamento maior que valor total", () => {
    const cfg = PRESETS["exemplo-1"];
    const bad = { ...cfg, imovel: { ...cfg.imovel, valor_financiado_banco: 999999999 } };
    const r = validarInput(bad);
    expect(r.erros.some((e) => /financiamento/i.test(e.texto))).toBe(true);
  });

  it("INCC fora do intervalo gera aviso", () => {
    const cfg = PRESETS["exemplo-1"];
    const bad = {
      ...cfg,
      entrada: { ...cfg.entrada, incc_mensal_percent: 0.05 },
    };
    const r = validarInput(bad);
    expect(r.avisos.some((a) => /INCC/i.test(a.texto))).toBe(true);
  });

  it("anual manual em mês fora do período gera erro", () => {
    const cfg = PRESETS["exemplo-1"];
    const bad = {
      ...cfg,
      entrada: {
        ...cfg.entrada,
        anuais: [
          {
            id: "x",
            tipo: "manual" as const,
            meses: [99],
            valor: 7000,
            corrige_incc: true,
          },
        ],
      },
    };
    const r = validarInput(bad);
    expect(r.erros.some((e) => /Anual/i.test(e.texto))).toBe(true);
  });

  it("anual intervalo com primeiro_mes fora do período gera erro", () => {
    const cfg = PRESETS["exemplo-1"];
    const bad = {
      ...cfg,
      entrada: {
        ...cfg.entrada,
        anuais: [
          {
            id: "x",
            tipo: "intervalo" as const,
            primeiro_mes: 99,
            cada_n: 12,
            valor: 7000,
            corrige_incc: true,
          },
        ],
      },
    };
    const r = validarInput(bad);
    expect(r.erros.some((e) => /intervalo/i.test(e.texto))).toBe(true);
  });

  it("custos cartoriais diluídos além do período gera aviso", () => {
    const cfg = PRESETS["exemplo-1"];
    const bad = {
      ...cfg,
      custosCartoriais: {
        ...cfg.custosCartoriais,
        diluir: true,
        parcelas: 50,
        mes_inicio: 1,
      },
    };
    const r = validarInput(bad);
    expect(r.avisos.some((a) => /custos cartoriais/i.test(a.texto))).toBe(true);
  });
});
