import { describe, it, expect } from "vitest";
import {
  decodeScenarios,
  encodeScenarios,
} from "@/lib/url-state";
import { PRESETS } from "@/tests/_fixtures";
import { SCENARIO_COLORS } from "@/lib/storage/use-scenarios-store";
import type { Scenario } from "@/lib/storage/use-scenarios-store";

const scenarios: Scenario[] = [
  { id: "a", label: PRESETS["exemplo-1"].rotulo, color: SCENARIO_COLORS[0], config: PRESETS["exemplo-1"] },
  { id: "b", label: PRESETS["exemplo-2"].rotulo, color: SCENARIO_COLORS[1], config: PRESETS["exemplo-2"] },
];

describe("url-state encode/decode", () => {
  it("round-trip preserva os cenários", () => {
    const encoded = encodeScenarios(scenarios);
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.scenarios).toHaveLength(2);
    expect(dec.scenarios?.[0].config.entrada.parcela_mensal_base).toBe(
      PRESETS["exemplo-1"].entrada.parcela_mensal_base,
    );
  });

  it("string encoded é URI-safe e razoavelmente compacta", () => {
    const encoded = encodeScenarios(scenarios);
    expect(encoded).toMatch(/^[A-Za-z0-9+\-$_*]+$/);
    expect(encoded.length).toBeLessThan(2000);
  });

  it("decode falha graciosamente com lixo", () => {
    const dec = decodeScenarios("nao-eh-um-payload-valido!!!");
    expect(dec.ok).toBe(false);
    expect(dec.error).toBeTruthy();
  });

  it("decode falha quando schema é inválido", () => {
    // Cria payload mockado com 'v' mas sem scenarios válidos
    const fake = encodeScenarios([
      // biome-ignore — manipulação proposital
      { id: "x", label: "x", color: "#000", config: {} as Scenario["config"] },
    ]);
    const dec = decodeScenarios(fake);
    expect(dec.ok).toBe(false);
  });

  it("encode/decode preserva identidade do corretor quando passada", () => {
    const corretor = { nome: "João Silva", whatsapp: "5511999998888" };
    const encoded = encodeScenarios(scenarios, corretor);
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.corretor).toEqual(corretor);
  });

  it("decode sem corretor retorna corretor undefined", () => {
    const encoded = encodeScenarios(scenarios);
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.corretor).toBeUndefined();
  });

  it("decode normaliza WhatsApp com formatação (parênteses, traços, espaços)", async () => {
    const { compressToEncodedURIComponent } = await import("lz-string");
    const payload = {
      v: 6,
      scenarios: [
        {
          id: "a",
          label: scenarios[0].label,
          color: scenarios[0].color,
          config: scenarios[0].config,
        },
      ],
      corretor: { nome: "João", whatsapp: "(11) 99999-8888" },
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.corretor?.whatsapp).toBe("5511999998888");
  });

  it("decode adiciona DDI 55 quando corretor envia só DDD + número", async () => {
    const { compressToEncodedURIComponent } = await import("lz-string");
    const payload = {
      v: 6,
      scenarios: [
        {
          id: "a",
          label: scenarios[0].label,
          color: scenarios[0].color,
          config: scenarios[0].config,
        },
      ],
      // 11 dígitos: DDD 11 + número 9 dígitos. Sem 55.
      corretor: { nome: "João", whatsapp: "11993235002" },
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.corretor?.whatsapp).toBe("5511993235002");
  });

  it("decode descarta corretor inválido mas mantém os cenários válidos", async () => {
    // Validação lenient: corretor com WhatsApp inválido (5 dígitos) é
    // descartado, mas o cenário válido é preservado.
    const { compressToEncodedURIComponent } = await import("lz-string");
    const payload = {
      v: 6,
      scenarios: [
        {
          id: "a",
          label: scenarios[0].label,
          color: scenarios[0].color,
          config: scenarios[0].config,
        },
      ],
      corretor: { nome: "João", whatsapp: "12345" }, // muito curto
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.corretor).toBeUndefined();
    expect(dec.scenarios).toHaveLength(1);
  });

  it("decode mantém só cenários válidos quando outros falham (proteção contra rascunho)", async () => {
    // Caso real: corretor adiciona 2º cenário com defaults (valor_total=0)
    // que falha schema.positive(). Sem lenient, o 1º (válido) seria
    // perdido junto. Com lenient, só o inválido é descartado.
    const { compressToEncodedURIComponent } = await import("lz-string");
    const validConfig = scenarios[0].config;
    const draftConfig = {
      ...validConfig,
      imovel: { ...validConfig.imovel, valor_total: 0 }, // falha .positive()
    };
    const payload = {
      v: 6,
      scenarios: [
        { id: "a", label: "Válido", color: "#000", config: validConfig },
        { id: "b", label: "Rascunho", color: "#111", config: draftConfig },
      ],
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.scenarios).toHaveLength(1);
    expect(dec.scenarios?.[0].label).toBe("Válido");
  });

  it("decode falha quando todos os cenários são inválidos", async () => {
    const { compressToEncodedURIComponent } = await import("lz-string");
    const validConfig = scenarios[0].config;
    const draftConfig = {
      ...validConfig,
      imovel: { ...validConfig.imovel, valor_total: 0 },
    };
    const payload = {
      v: 6,
      scenarios: [
        { id: "a", label: "Rascunho A", color: "#000", config: draftConfig },
        { id: "b", label: "Rascunho B", color: "#111", config: draftConfig },
      ],
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(false);
  });
});

describe("url-state migrator v5→v6", () => {
  it("payload v5 (sem corretor) é aceito como v6 após migração", async () => {
    const { compressToEncodedURIComponent } = await import("lz-string");
    const v5Payload = {
      v: 5,
      scenarios: [
        {
          id: "a",
          label: scenarios[0].label,
          color: scenarios[0].color,
          config: scenarios[0].config,
        },
      ],
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(v5Payload));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    expect(dec.scenarios).toHaveLength(1);
    expect(dec.corretor).toBeUndefined();
  });
});

describe("url-state migrator v1→v2", () => {
  it("migra config v1 (clt+pj+itbi+documentacao+ato_*) para v2", async () => {
    const { compressToEncodedURIComponent } = await import("lz-string");
    const v1 = {
      v: 1,
      scenarios: [
        {
          id: "a",
          label: "Old",
          color: "#000",
          config: {
            rotulo: "Old",
            renda: {
              compradores: [
                {
                  id: "c1",
                  rotulo: "P1",
                  clt_liquido: 5000,
                  pj_liquido: 2000,
                  outros: 100,
                },
              ],
            },
            gastos: { gastos_fixos_mensais: 3000 },
            imovel: {
              valor_total: 400000,
              valor_financiado_banco: 320000,
              periodos_construcao: 35,
              data_inicio: "2026-05-01",
              fgts_disponivel: 10000,
            },
            entrada: {
              valor_entrada_total: 80000,
              ato_valor_total: 18000,
              ato_dividido_meses: 3,
              ato_meses_quando: [1, 2, 3],
              ato_corrige_incc: false,
              parcela_mensal_base: 1500,
              anuais: [{ id: "a1", valor: 6000, meses: [12, 24], corrige_incc: true }],
              incc_mensal_percent: 0.0045,
              documentacao: {
                valor_total: 14000,
                dividido_meses: 14,
                mes_inicio: 1,
                corrige_incc: false,
              },
              parcela_pos_entrega: 2800,
            },
            evolucao: { tipo: "progressivo" },
            itbi: {
              tipo: "valor_total",
              valor_itbi_total: 14000,
            },
          },
        },
      ],
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(v1));
    const dec = decodeScenarios(encoded);
    expect(dec.ok).toBe(true);
    const cfg = dec.scenarios?.[0].config;
    expect(cfg).toBeTruthy();
    if (!cfg) return;

    // v5: comprador.outros foi promovido para renda.outros_rendimentos
    expect(cfg.renda.compradores[0].renda_liquida).toBe(7000);
    expect(cfg.renda.outros_rendimentos).toBe(100);

    // Ato consolidado (v5: parcelas/primeiro_mes default 1)
    expect(cfg.entrada.ato.valor_total).toBe(18000);
    expect(cfg.entrada.ato.corrige_incc).toBe(false);
    expect(cfg.entrada.ato.parcelas).toBe(1);
    expect(cfg.entrada.ato.primeiro_mes).toBe(1);

    // Custos cartoriais unificados
    expect(cfg.custosCartoriais.calculo.tipo).toBe("valor_total");
    expect(cfg.custosCartoriais.diluir).toBe(true);
    expect(cfg.custosCartoriais.parcelas).toBe(14);

    // F2 defaults aplicados (modo_incc, fgts_abate_saldo)
    expect(cfg.entrada.modo_incc).toBe("cliente_paga_mensal");
    expect(cfg.imovel.fgts_abate_saldo).toBe(true);

    // F3: anuais migrados para tipo:manual preservando os meses
    expect(cfg.entrada.anuais[0].tipo).toBe("manual");
    if (cfg.entrada.anuais[0].tipo === "manual") {
      expect(cfg.entrada.anuais[0].meses).toEqual([12, 24]);
    }

    // v5: valor_entrada_total foi removido
    expect("valor_entrada_total" in cfg.entrada).toBe(false);
  });
});
