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
 *   1. ?s=<blob> → URL state (lz-string)
 *   2. localStorage["can-i-buy:scenarios"]
 *   3. Default (estado inicial do store)
 *
 * Persiste alterações no localStorage com debounce.
 *
 * Limpa keys legadas de versões antigas que tinham Supabase auth/share
 * (`habitando:share-meta`, `sb-*-auth-token`, `?c=` na URL) — todas inertes
 * agora.
 */
export function ScenarioPersist() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // ── Cleanup oportunista de resíduos da era Supabase ─────────────────
    try {
      window.localStorage.removeItem("habitando:share-meta");
      for (const k of Object.keys(window.localStorage)) {
        if (k.startsWith("sb-")) window.localStorage.removeItem(k);
      }
    } catch {
      /* quota / disabled */
    }

    const stripParams = (...names: string[]) => {
      const url = new URL(window.location.href);
      let changed = false;
      for (const n of names) {
        if (url.searchParams.has(n)) {
          url.searchParams.delete(n);
          changed = true;
        }
      }
      if (changed) window.history.replaceState({}, "", url.toString());
    };

    // Strip silencioso de ?c= legado (link Supabase que não funciona mais).
    stripParams("c");

    /** Tenta ?s=<blob>. Retorna true se hidratou. */
    const tryHydrateFromURL = (): boolean => {
      const url = new URL(window.location.href);
      const s = url.searchParams.get("s");
      if (!s) return false;
      const dec = decodeScenarios(s);
      if (!dec.ok || !dec.scenarios) return false;
      useScenariosStore.getState().replaceAll(dec.scenarios);
      stripParams("s");
      return true;
    };

    /** Tenta localStorage. */
    const tryHydrateFromLocalStorage = (): boolean => {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        const result = migrarPayload(parsed);
        if (result.ok && result.scenarios && result.scenarios.length > 0) {
          useScenariosStore.getState().replaceAll(result.scenarios);
          return true;
        }
        if (!result.ok) {
          console.warn(
            "Cenários no localStorage inválidos, descartando:",
            result.error,
          );
          window.localStorage.removeItem(KEY);
        }
      } catch {
        window.localStorage.removeItem(KEY);
      }
      return false;
    };

    // Hidratação em cascata
    const fromURL = tryHydrateFromURL();
    if (!fromURL) tryHydrateFromLocalStorage();

    // ── Subscribe + writes ───────────────────────────────────────────────
    let localTimer: number | undefined;

    const unsub = useScenariosStore.subscribe((state) => {
      if (typeof window === "undefined") return;
      window.clearTimeout(localTimer);
      localTimer = window.setTimeout(() => {
        try {
          window.localStorage.setItem(
            KEY,
            JSON.stringify({
              v: LATEST_SCHEMA_VERSION,
              scenarios: state.scenarios,
            }),
          );
        } catch {
          /* quota / disabled */
        }
      }, 500);
    });

    // ── Cross-tab sync ──────────────────────────────────────────────────
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
      window.clearTimeout(localTimer);
      unsub();
    };
  }, []);

  return null;
}
