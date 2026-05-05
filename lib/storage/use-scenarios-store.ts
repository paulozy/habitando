"use client";

import { create } from "zustand";
import type { SimulacaoConfig } from "@/lib/calculation-engine";
import { defaultConfig } from "@/lib/calculation-engine";

export interface Scenario {
  id: string;
  label: string;
  color: string;
  config: SimulacaoConfig;
}

export const SCENARIO_LIMIT = 4;
export const SCENARIO_COLORS = ["#1a56db", "#0d7a4e", "#b45309", "#7c3aed"] as const;

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

function nextColor(scenarios: Scenario[]): string {
  const used = new Set(scenarios.map((s) => s.color));
  return SCENARIO_COLORS.find((c) => !used.has(c)) ?? SCENARIO_COLORS[0];
}

interface ScenariosState {
  scenarios: Scenario[];
  activeId: string;
  add: (config?: SimulacaoConfig, label?: string) => string;
  duplicate: (id: string) => string;
  remove: (id: string) => void;
  rename: (id: string, label: string) => void;
  update: (id: string, config: SimulacaoConfig) => void;
  setActive: (id: string) => void;
  replaceAll: (scenarios: Scenario[]) => void;
  /**
   * Reseta o cenário ativo trocando seu id (força remount do form
   * key-ado por scenario.id). Usado pelo botão "Resetar cenário".
   */
  resetActive: () => string;
}

function initial(): { scenarios: Scenario[]; activeId: string } {
  const cfg = defaultConfig();
  const seed: Scenario = {
    id: newId(),
    label: cfg.rotulo,
    color: SCENARIO_COLORS[0],
    config: cfg,
  };
  return { scenarios: [seed], activeId: seed.id };
}

export const useScenariosStore = create<ScenariosState>((set, get) => ({
  ...initial(),

  add: (config, label) => {
    const state = get();
    if (state.scenarios.length >= SCENARIO_LIMIT) return state.activeId;
    const id = newId();
    const cfg = config ?? defaultConfig();
    const next: Scenario = {
      id,
      label: label ?? cfg.rotulo ?? `Cenário ${state.scenarios.length + 1}`,
      color: nextColor(state.scenarios),
      config: cfg,
    };
    set({ scenarios: [...state.scenarios, next], activeId: id });
    return id;
  },

  duplicate: (id) => {
    const state = get();
    if (state.scenarios.length >= SCENARIO_LIMIT) return state.activeId;
    const src = state.scenarios.find((s) => s.id === id);
    if (!src) return state.activeId;
    const newScenarioId = newId();
    const next: Scenario = {
      id: newScenarioId,
      label: `${src.label} (cópia)`,
      color: nextColor(state.scenarios),
      config: structuredClone(src.config),
    };
    set({ scenarios: [...state.scenarios, next], activeId: newScenarioId });
    return newScenarioId;
  },

  remove: (id) => {
    const state = get();
    if (state.scenarios.length <= 1) return;
    const idx = state.scenarios.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const next = state.scenarios.filter((s) => s.id !== id);
    const newActive =
      state.activeId === id
        ? (next[Math.max(0, idx - 1)]?.id ?? next[0].id)
        : state.activeId;
    set({ scenarios: next, activeId: newActive });
  },

  rename: (id, label) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, label, config: { ...s.config, rotulo: label } } : s,
      ),
    })),

  update: (id, config) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, config, label: config.rotulo ?? s.label } : s,
      ),
    })),

  setActive: (id) =>
    set((state) =>
      state.scenarios.some((s) => s.id === id) ? { activeId: id } : state,
    ),

  replaceAll: (scenarios) => {
    if (!scenarios.length) return;
    set({ scenarios, activeId: scenarios[0].id });
  },

  resetActive: () => {
    const state = get();
    const cfg = defaultConfig();
    const newScenarioId = newId();
    const next = state.scenarios.map((s) =>
      s.id === state.activeId
        ? { ...s, id: newScenarioId, config: cfg, label: cfg.rotulo }
        : s,
    );
    set({ scenarios: next, activeId: newScenarioId });
    return newScenarioId;
  },
}));

export const useActiveScenario = () =>
  useScenariosStore((s) => s.scenarios.find((sc) => sc.id === s.activeId));
