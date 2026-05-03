import { describe, it, expect, beforeEach } from "vitest";
import {
  SCENARIO_LIMIT,
  useScenariosStore,
} from "@/lib/storage/use-scenarios-store";
import { PRESETS } from "@/tests/_fixtures";

beforeEach(() => {
  // Reset state
  useScenariosStore.setState((s) => {
    const first = s.scenarios[0];
    return { scenarios: [first], activeId: first.id };
  });
});

describe("useScenariosStore", () => {
  it("inicia com 1 cenário", () => {
    const s = useScenariosStore.getState();
    expect(s.scenarios).toHaveLength(1);
    expect(s.activeId).toBe(s.scenarios[0].id);
  });

  it("add respeita o limite", () => {
    const { add } = useScenariosStore.getState();
    for (let i = 0; i < SCENARIO_LIMIT + 2; i++) {
      add(PRESETS["exemplo-1"]);
    }
    expect(useScenariosStore.getState().scenarios.length).toBe(SCENARIO_LIMIT);
  });

  it("duplicate clona a config sem aliasing", () => {
    const { duplicate, scenarios } = useScenariosStore.getState();
    const newId = duplicate(scenarios[0].id);
    const state = useScenariosStore.getState();
    const novo = state.scenarios.find((s) => s.id === newId)!;
    expect(novo).toBeTruthy();
    novo.config.entrada.parcela_mensal_base = 9999;
    expect(state.scenarios[0].config.entrada.parcela_mensal_base).not.toBe(9999);
  });

  it("remove não permite ficar com 0", () => {
    const { remove, scenarios } = useScenariosStore.getState();
    remove(scenarios[0].id);
    expect(useScenariosStore.getState().scenarios.length).toBe(1);
  });

  it("remove ativo cai no anterior", () => {
    const { add, remove } = useScenariosStore.getState();
    const id1 = useScenariosStore.getState().scenarios[0].id;
    const id2 = add(PRESETS["exemplo-2"]);
    expect(useScenariosStore.getState().activeId).toBe(id2);
    remove(id2);
    expect(useScenariosStore.getState().activeId).toBe(id1);
  });

  it("rename atualiza label e config.rotulo", () => {
    const { rename, scenarios } = useScenariosStore.getState();
    rename(scenarios[0].id, "Novo nome");
    const s = useScenariosStore.getState().scenarios[0];
    expect(s.label).toBe("Novo nome");
    expect(s.config.rotulo).toBe("Novo nome");
  });
});
