import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRESETS } from "@/tests/_fixtures";
import { SCENARIO_COLORS, type Scenario } from "@/lib/storage/use-scenarios-store";

// ── Mock do client Supabase antes de importar a API ─────────────────────
// Filas de respostas pra simular comportamentos diferentes em sequência
// (ex: collision retry).
const insertResultsQueue: Array<{ error: { code: string; message: string } | null }> = [];
const maybeSingleResultsQueue: Array<{
  data: { payload: unknown; updated_at: string } | null;
  error: { message: string } | null;
}> = [];
const updateResultsQueue: Array<{ error: { message: string } | null }> = [];

const insertCalls: unknown[] = [];
const updateCalls: unknown[] = [];

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    from: (_table: string) => ({
      insert: (row: unknown) => {
        insertCalls.push(row);
        return {
          select: () => ({
            single: () =>
              Promise.resolve(
                insertResultsQueue.shift() ?? { error: null },
              ),
          }),
        };
      },
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve(
              maybeSingleResultsQueue.shift() ?? { data: null, error: null },
            ),
        }),
      }),
      update: (patch: unknown) => {
        updateCalls.push(patch);
        return {
          eq: () =>
            Promise.resolve(updateResultsQueue.shift() ?? { error: null }),
        };
      },
    }),
  }),
}));

const { createShare, fetchShare, updateSharePayload } = await import(
  "@/lib/share/api"
);

const fixtureScenarios: Scenario[] = [
  {
    id: "a",
    label: PRESETS["exemplo-1"].rotulo,
    color: SCENARIO_COLORS[0],
    config: PRESETS["exemplo-1"],
  },
];

beforeEach(() => {
  insertResultsQueue.length = 0;
  maybeSingleResultsQueue.length = 0;
  updateResultsQueue.length = 0;
  insertCalls.length = 0;
  updateCalls.length = 0;
});

describe("createShare", () => {
  it("insere com payload v6 e retorna o id gerado", async () => {
    insertResultsQueue.push({ error: null });

    const result = await createShare({
      scenarios: fixtureScenarios,
      corretor: { nome: "João", whatsapp: "5511999998888" },
    });

    expect(result.id).toMatch(/^[2-9A-Za-z]{10}$/);
    expect(insertCalls).toHaveLength(1);
    const inserted = insertCalls[0] as { payload: { v: number; corretor: unknown } };
    expect(inserted.payload.v).toBe(6);
    expect(inserted.payload.corretor).toEqual({
      nome: "João",
      whatsapp: "5511999998888",
    });
  });

  it("omite corretor do payload quando não fornecido", async () => {
    insertResultsQueue.push({ error: null });
    await createShare({ scenarios: fixtureScenarios });
    const inserted = insertCalls[0] as { payload: Record<string, unknown> };
    expect("corretor" in inserted.payload).toBe(false);
  });

  it("retenta em caso de unique_violation (collision)", async () => {
    insertResultsQueue.push({ error: { code: "23505", message: "dup" } });
    insertResultsQueue.push({ error: null });

    const result = await createShare({ scenarios: fixtureScenarios });
    expect(result.id).toBeTruthy();
    expect(insertCalls).toHaveLength(2);
  });

  it("desiste após 3 colisões e lança erro", async () => {
    for (let i = 0; i < 3; i++) {
      insertResultsQueue.push({ error: { code: "23505", message: "dup" } });
    }
    await expect(createShare({ scenarios: fixtureScenarios })).rejects.toThrow(
      /colisão/,
    );
    expect(insertCalls).toHaveLength(3);
  });

  it("propaga erro inesperado sem retry", async () => {
    insertResultsQueue.push({
      error: { code: "42501", message: "permission denied" },
    });
    await expect(createShare({ scenarios: fixtureScenarios })).rejects.toThrow(
      /Não foi possível criar/,
    );
    expect(insertCalls).toHaveLength(1);
  });
});

describe("fetchShare", () => {
  it("retorna null quando ID não existe", async () => {
    maybeSingleResultsQueue.push({ data: null, error: null });
    const result = await fetchShare("inexistente");
    expect(result).toBeNull();
  });

  it("retorna payload válido", async () => {
    maybeSingleResultsQueue.push({
      data: {
        payload: {
          v: 6,
          scenarios: fixtureScenarios,
          corretor: { nome: "João", whatsapp: "5511999998888" },
        },
        updated_at: "2026-05-03T12:00:00Z",
      },
      error: null,
    });
    const result = await fetchShare("abc1234567");
    expect(result?.scenarios).toHaveLength(1);
    expect(result?.corretor?.nome).toBe("João");
  });

  it("migra payload de versão antiga", async () => {
    maybeSingleResultsQueue.push({
      data: {
        payload: { v: 5, scenarios: fixtureScenarios },
        updated_at: "2026-05-03T12:00:00Z",
      },
      error: null,
    });
    const result = await fetchShare("abc1234567");
    expect(result?.v).toBe(6);
  });

  it("retorna null pra payload corrompido", async () => {
    maybeSingleResultsQueue.push({
      data: {
        payload: { lixo: true },
        updated_at: "2026-05-03T12:00:00Z",
      },
      error: null,
    });
    const result = await fetchShare("abc1234567");
    expect(result).toBeNull();
  });

  it("propaga erro de rede", async () => {
    maybeSingleResultsQueue.push({
      data: null,
      error: { message: "network" },
    });
    await expect(fetchShare("abc1234567")).rejects.toThrow(/Erro ao carregar/);
  });
});

describe("updateSharePayload", () => {
  it("envia payload v6 com corretor normalizado", async () => {
    updateResultsQueue.push({ error: null });
    await updateSharePayload("abc1234567", {
      scenarios: fixtureScenarios,
      // WhatsApp sem DDI — preprocess do schema deve adicionar 55
      corretor: { nome: "João", whatsapp: "11999998888" },
    });
    expect(updateCalls).toHaveLength(1);
    const patch = updateCalls[0] as { payload: { corretor: { whatsapp: string } } };
    expect(patch.payload.corretor.whatsapp).toBe("5511999998888");
  });
});
