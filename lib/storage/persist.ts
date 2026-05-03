"use client";

import * as React from "react";
import {
  LATEST_SCHEMA_VERSION,
  decodeScenarios,
  migrarPayload,
} from "@/lib/url-state";
import { useScenariosStore } from "./use-scenarios-store";

const KEY = "can-i-buy:scenarios";

/**
 * Hidrata o store na ordem de prioridade:
 *   1. ?s=... no URL (link compartilhado)
 *   2. localStorage["can-i-buy:scenarios"]  (com migração automática se necessário)
 *   3. Default (estado inicial do store)
 *
 * Persiste alterações no localStorage com debounce e ouve mudanças cross-tab.
 */
export function ScenarioPersist() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Tenta hidratar do URL
    const url = new URL(window.location.href);
    const s = url.searchParams.get("s");
    if (s) {
      const dec = decodeScenarios(s);
      if (dec.ok && dec.scenarios) {
        useScenariosStore.getState().replaceAll(dec.scenarios);
        // Limpa o param para não sobrescrever futuras edições
        url.searchParams.delete("s");
        window.history.replaceState({}, "", url.toString());
        return;
      }
    }

    // 2. localStorage (com migração)
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const result = migrarPayload(parsed);
        if (result.ok && result.scenarios && result.scenarios.length > 0) {
          useScenariosStore.getState().replaceAll(result.scenarios);
        } else if (!result.ok) {
          // Schema inválido — descarta e segue com default. Limpa para evitar loop.
          console.warn("Cenários no localStorage inválidos, descartando:", result.error);
          window.localStorage.removeItem(KEY);
        }
      }
    } catch {
      // JSON inválido — descarta
      window.localStorage.removeItem(KEY);
    }

    // Subscribe + debounce write (sempre na versão atual)
    let timer: number | undefined;
    const unsub = useScenariosStore.subscribe((state) => {
      if (typeof window === "undefined") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        try {
          window.localStorage.setItem(
            KEY,
            JSON.stringify({
              v: LATEST_SCHEMA_VERSION,
              scenarios: state.scenarios,
            }),
          );
        } catch {
          /* quota / disabled — ignore */
        }
      }, 500);
    });

    // Cross-tab sync (também migra)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        const result = migrarPayload(parsed);
        if (result.ok && result.scenarios && result.scenarios.length > 0) {
          useScenariosStore.getState().replaceAll(result.scenarios);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearTimeout(timer);
      unsub();
    };
  }, []);

  return null;
}
