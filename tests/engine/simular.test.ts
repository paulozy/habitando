import { describe, it, expect } from "vitest";
import { calcSimulacao } from "@/lib/calculation-engine";
import { PRESETS } from "@/tests/_fixtures";

describe("calcSimulacao — Cenário 1 (ato 1× à vista, modo cliente_paga_mensal)", () => {
  const result = calcSimulacao(PRESETS["exemplo-1"]);

  it("produz 35 linhas mensais", () => {
    expect(result.rows).toHaveLength(35);
  });

  it("ato à vista abate o saldo: saldoInicial = 445.060 − 20.000 − 12.000 = 413.060", () => {
    expect(result.stats.saldoInicial).toBe(413060);
  });

  it("mesesAto = 0 (ato à vista não ocupa mês)", () => {
    expect(result.stats.mesesAto).toBe(0);
  });

  it("m1 tem parcela mensal normal (não suspende com ato 1×)", () => {
    expect(result.rows[0].atoPagoMes).toBe(0);
    expect(result.rows[0].parcelaBase).toBe(1644);
    expect(result.rows[0].isMesAto).toBe(false);
  });

  it("INCC m1 ≈ saldo × 0,45% = 413.060 × 0.0045 ≈ R$ 1.859", () => {
    expect(result.rows[0].inccDoMes).toBeCloseTo(1858.77, 1);
  });

  it("Documentação NÃO sofre shift (ato à vista não bloqueia m1)", () => {
    expect(result.rows[0].documentacao).toBeGreaterThan(0);
  });

  it("totalAto = R$ 20.000 (à vista, separado do fluxo mensal)", () => {
    expect(result.stats.totalAto).toBe(20000);
  });

  it("totalGeral = mensal somado + ato à vista", () => {
    expect(result.stats.totalGeral).toBeCloseTo(
      result.stats.totalMensalSomado + result.stats.totalAto,
      -1,
    );
  });

  it("saldoFinal ≈ saldoFinalNominal (cliente paga INCC mensalmente)", () => {
    expect(Math.abs(result.stats.diferencaFinanciamento)).toBeLessThan(100);
  });

  it("custosCartoriaisResult ITBI 5% + cartórios = R$ 35.605", () => {
    expect(result.custosCartoriaisResult.total).toBe(35605);
  });

  it("gera parecer com pelo menos 1 item", () => {
    expect(result.parecer.length).toBeGreaterThan(0);
  });
});

describe("calcSimulacao — ato parcelado em 3× (regra: suspende mensal)", () => {
  const cfg = structuredClone(PRESETS["exemplo-1"]);
  cfg.entrada.ato.parcelas = 3;
  const result = calcSimulacao(cfg);

  it("saldoInicial NÃO abate ato parcelado: = valor_imovel − fgts = 433.060", () => {
    expect(result.stats.saldoInicial).toBe(433060);
  });

  it("m1, m2, m3 têm ato pago e mensal=0", () => {
    for (let i = 0; i < 3; i++) {
      expect(result.rows[i].isMesAto).toBe(true);
      expect(result.rows[i].atoPagoMes).toBeCloseTo(20000 / 3, 0);
      expect(result.rows[i].parcelaBase).toBe(0);
      expect(result.rows[i].inccPagoCliente).toBe(0);
    }
  });

  it("m4 retoma a parcela mensal", () => {
    expect(result.rows[3].isMesAto).toBe(false);
    expect(result.rows[3].parcelaBase).toBe(1644);
    expect(result.rows[3].atoPagoMes).toBe(0);
  });

  it("totalAto = R$ 20.000 (somatório das 3 parcelas)", () => {
    expect(result.stats.totalAto).toBeCloseTo(20000, 0);
    expect(result.stats.mesesAto).toBe(3);
  });

  it("Documentação shifted para m4+ quando ato vai até m3", () => {
    expect(result.rows[2].documentacao).toBe(0);
    expect(result.rows[3].documentacao).toBeGreaterThan(0);
  });
});

describe("calcSimulacao — modo saldo_acumula", () => {
  const cfg = structuredClone(PRESETS["exemplo-1"]);
  cfg.entrada.modo_incc = "saldo_acumula";
  const result = calcSimulacao(cfg);

  it("cliente paga só a parcela base nos meses normais (sem INCC)", () => {
    expect(result.rows[1].parcelaCliente).toBeCloseTo(1644, 0);
    expect(result.rows[1].inccPagoCliente).toBe(0);
  });

  it("saldo cresce — diferença de financiamento positiva", () => {
    expect(result.stats.diferencaFinanciamento).toBeGreaterThan(0);
    expect(result.stats.totalINCCAbsorvidoSaldo).toBeGreaterThan(0);
  });
});

describe("calcSimulacao — Cenário 2 (entrada leve, ato 1× à vista)", () => {
  const result = calcSimulacao(PRESETS["exemplo-2"]);

  it("saldoInicial = 408.197 − 15.000 ato − 12.000 fgts = 381.197", () => {
    expect(result.stats.saldoInicial).toBe(381197);
  });

  it("ato 15k à vista, mensal m1 normal", () => {
    expect(result.stats.totalAto).toBe(15000);
    expect(result.rows[0].atoPagoMes).toBe(0);
    expect(result.rows[0].parcelaBase).toBe(879);
  });
});

describe("calcSimulacao — Cenário 3 (48 meses, ato 1× à vista)", () => {
  const result = calcSimulacao(PRESETS["exemplo-3"]);

  it("48 linhas", () => {
    expect(result.rows).toHaveLength(48);
  });

  it("saldoInicial = 500k − 25k ato − 15k fgts = 460k", () => {
    expect(result.stats.saldoInicial).toBe(460000);
  });

  it("anuais incidem nos meses 12, 24, 36 (intervalo cada 12)", () => {
    expect(result.rows[11].anual).toBeGreaterThan(0);
    expect(result.rows[23].anual).toBeGreaterThan(0);
    expect(result.rows[35].anual).toBeGreaterThan(0);
    expect(result.rows[12].anual).toBe(0);
  });

  it("documentação dilui em 10 meses (ato 1× à vista não causa shift, m1..m10)", () => {
    expect(result.rows[0].documentacao).toBeGreaterThan(0);
    expect(result.rows[9].documentacao).toBeGreaterThan(0);
    expect(result.rows[10].documentacao).toBe(0);
  });
});

describe("calcSimulacao — fgts_abate_saldo=false não desconta FGTS do saldo", () => {
  const cfg = structuredClone(PRESETS["exemplo-1"]);
  cfg.imovel.fgts_abate_saldo = false;
  const result = calcSimulacao(cfg);

  it("saldoInicial = 445.060 − 20.000 ato (à vista) = 425.060", () => {
    expect(result.stats.saldoInicial).toBe(425060);
  });
});
