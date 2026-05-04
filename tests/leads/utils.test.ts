import { describe, expect, it } from "vitest";
import {
  buildLeadMessage,
  extractClienteSummary,
  extractSnapshotScenarios,
  relativeTime,
} from "@/lib/leads/utils";
import { PRESETS } from "@/tests/_fixtures";
import { SCENARIO_COLORS } from "@/lib/storage/use-scenarios-store";

describe("extractClienteSummary", () => {
  it("retorna null quando snapshot é null", () => {
    expect(extractClienteSummary(null)).toBeNull();
  });

  it("retorna null quando scenarios vazio", () => {
    expect(extractClienteSummary({ scenarios: [] })).toBeNull();
  });

  it("extrai renda total = soma compradores + outros_rendimentos", () => {
    const snapshot = {
      scenarios: [
        {
          config: {
            rotulo: "Test",
            renda: {
              compradores: [
                { renda_liquida: 5000 },
                { renda_liquida: 3000 },
              ],
              outros_rendimentos: 500,
            },
            gastos: { gastos_fixos_mensais: 2000 },
            entrada: { ato: { valor_total: 20000, parcelas: 1 } },
          },
        },
      ],
    };
    const result = extractClienteSummary(snapshot);
    expect(result?.rendaTotal).toBe(8500);
    expect(result?.gastosFixos).toBe(2000);
    expect(result?.atoValor).toBe(20000);
    expect(result?.atoParcelas).toBe(1);
    expect(result?.nomeCenario).toBe("Test");
  });

  it("trata defaults graciosamente", () => {
    const snapshot = {
      scenarios: [{ config: {} }],
    };
    const result = extractClienteSummary(snapshot);
    expect(result?.rendaTotal).toBe(0);
    expect(result?.gastosFixos).toBe(0);
    expect(result?.atoParcelas).toBe(1);
    expect(result?.nomeCenario).toBeNull();
  });
});

describe("extractSnapshotScenarios", () => {
  it("retorna null quando snapshot null", () => {
    expect(extractSnapshotScenarios(null)).toBeNull();
  });

  it("extrai scenarios válidos via migrarPayload", () => {
    const snapshot = {
      scenarios: [
        {
          id: "a",
          label: PRESETS["exemplo-1"].rotulo,
          color: SCENARIO_COLORS[0],
          config: PRESETS["exemplo-1"],
        },
      ],
    };
    const result = extractSnapshotScenarios(snapshot);
    expect(result).toHaveLength(1);
  });

  it("retorna null quando todos cenários inválidos", () => {
    const snapshot = {
      scenarios: [{ id: "x", label: "x", color: "#000", config: {} }],
    };
    expect(extractSnapshotScenarios(snapshot)).toBeNull();
  });
});

describe("buildLeadMessage", () => {
  it("interpola nome (primeiro nome), link e corretor", () => {
    const msg = buildLeadMessage(
      { nome: "Maria Silva" },
      "https://habitando.app/c/joao/abc",
      "João Pedro",
    );
    expect(msg).toContain("Olá Maria!");
    expect(msg).toContain("https://habitando.app/c/joao/abc");
    expect(msg).toContain("— João Pedro");
  });

  it("usa fallback 'tudo bem' quando lead sem nome", () => {
    const msg = buildLeadMessage(
      { nome: null },
      "https://x/y",
      "Corretor",
    );
    expect(msg).toContain("Olá tudo bem!");
  });

  it("pega só primeiro nome quando nome composto", () => {
    const msg = buildLeadMessage(
      { nome: "Ana Carolina Mendes" },
      "url",
      "C",
    );
    expect(msg).toContain("Olá Ana!");
    expect(msg).not.toContain("Carolina");
  });
});

describe("relativeTime", () => {
  it("agora há pouco para <1min", () => {
    const d = new Date(Date.now() - 30 * 1000);
    expect(relativeTime(d)).toBe("agora há pouco");
  });

  it("minutos para <1h", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTime(d)).toBe("há 5 min");
  });

  it("horas para <24h", () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(relativeTime(d)).toBe("há 3h");
  });

  it("ontem para 1 dia", () => {
    const d = new Date(Date.now() - 30 * 60 * 60 * 1000);
    expect(relativeTime(d)).toBe("ontem");
  });

  it("dias para >=2 dias", () => {
    const d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(relativeTime(d)).toBe("há 5 dias");
  });
});
