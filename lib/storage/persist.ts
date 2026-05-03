"use client";

import * as React from "react";
import {
  LATEST_SCHEMA_VERSION,
  decodeScenarios,
  migrarPayload,
} from "@/lib/url-state";
import { useScenariosStore } from "./use-scenarios-store";
import { useCorretorStore } from "./use-corretor-store";

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
    let hydratedFromURL = false;
    if (s) {
      const dec = decodeScenarios(s);
      if (dec.ok && dec.scenarios) {
        useScenariosStore.getState().replaceAll(dec.scenarios);
        hydratedFromURL = true;
        // Se o link traz identidade de corretor, decide se ativa modo
        // cliente (banner + scroll) ou se é o próprio corretor abrindo:
        // - link próprio em outra aba pra testar
        // - resposta vinda do cliente (que carrega a mesma identidade)
        // Quando whatsapp do link == whatsapp do `own`, NÃO ativa modo
        // cliente. E limpa um "received" antigo se houver.
        if (dec.corretor) {
          const corretorStore = useCorretorStore.getState();
          const isSelf =
            corretorStore.own?.whatsapp === dec.corretor.whatsapp;
          if (isSelf) {
            if (corretorStore.received) {
              corretorStore.clearReceived();
            }
          } else {
            corretorStore.setReceived(dec.corretor);
            // Cliente recebendo cenário: leva direto pra renda/gastos.
            window.setTimeout(() => {
              const target = document.getElementById("secao-orcamento");
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 400);
          }
        }
        // Limpa o param para não sobrescrever futuras edições
        url.searchParams.delete("s");
        window.history.replaceState({}, "", url.toString());
      }
    }

    // 2. localStorage (com migração) — só se não veio do URL
    if (!hydratedFromURL) {
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
