"use client";

import * as React from "react";
import {
  LATEST_SCHEMA_VERSION,
  decodeScenarios,
  migrarPayload,
} from "@/lib/url-state";
import { useScenariosStore } from "./use-scenarios-store";
import { useCorretorStore } from "./use-corretor-store";
import { useShareMetaStore } from "./use-share-meta-store";
import {
  fetchShare,
  updateSharePayload,
  getShareUpdatedAt,
  ShareError,
} from "@/lib/share/api";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const KEY = "can-i-buy:scenarios";
const REMOTE_PUSH_DEBOUNCE_MS = 3000;
const FOCUS_POLL_MIN_INTERVAL_MS = 5000;

/**
 * Hidrata o store na ordem de prioridade:
 *   1. ?c=<id>  → Supabase (short link)
 *   2. ?s=<blob> → URL state legacy (lz-string)
 *   3. localStorage["can-i-buy:scenarios"]
 *   4. Default (estado inicial do store)
 *
 * Persiste alterações no localStorage com debounce.
 * Se houver `remoteId` setado, também faz push debounced (3s) pro Supabase.
 * Polling on focus quando o usuário é o corretor (own.whatsapp == payload.corretor.whatsapp).
 */
export function ScenarioPersist() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const handleCorretorIdentity = (
      corretor:
        | { nome: string; whatsapp: string }
        | undefined,
    ) => {
      if (!corretor) return;
      const corretorStore = useCorretorStore.getState();
      const isSelf = corretorStore.own?.whatsapp === corretor.whatsapp;
      if (isSelf) {
        if (corretorStore.received) corretorStore.clearReceived();
      } else {
        corretorStore.setReceived(corretor);
        // Cliente recebendo cenário: leva direto pra renda/gastos.
        window.setTimeout(() => {
          const target = document.getElementById("secao-orcamento");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 400);
      }
    };

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

    /** Tenta ?c=<id> (Supabase). Retorna true se hidratou. */
    const tryHydrateFromRemote = async (): Promise<boolean> => {
      const url = new URL(window.location.href);
      const c = url.searchParams.get("c");
      if (!c) return false;
      if (!isSupabaseConfigured()) {
        console.warn(
          "Link com ?c= recebido, mas Supabase não está configurado.",
        );
        return false;
      }
      try {
        const payload = await fetchShare(c);
        if (cancelled) return true;
        if (!payload) {
          console.warn(`Share ${c} não encontrado.`);
          stripParams("c");
          return false;
        }
        useScenariosStore.getState().replaceAll(payload.scenarios);
        useShareMetaStore.getState().setRemoteId(c);
        handleCorretorIdentity(payload.corretor);
        stripParams("c", "s");
        return true;
      } catch (err) {
        if (cancelled) return true;
        const msg =
          err instanceof ShareError ? err.message : "Erro ao carregar.";
        console.error("[persist] fetchShare falhou:", msg, err);
        stripParams("c");
        return false;
      }
    };

    /** Tenta ?s=<blob> (legacy). Retorna true se hidratou. */
    const tryHydrateFromLegacyURL = (): boolean => {
      const url = new URL(window.location.href);
      const s = url.searchParams.get("s");
      if (!s) return false;
      const dec = decodeScenarios(s);
      if (!dec.ok || !dec.scenarios) return false;
      useScenariosStore.getState().replaceAll(dec.scenarios);
      // Link legacy: limpa qualquer remoteId antigo, cenário vive só local.
      useShareMetaStore.getState().setRemoteId(null);
      handleCorretorIdentity(dec.corretor);
      stripParams("s");
      return true;
    };

    /** Tenta localStorage. Retorna true se hidratou. */
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

    // ── Hidratação em cascata ────────────────────────────────────────────
    (async () => {
      const fromRemote = await tryHydrateFromRemote();
      if (cancelled || fromRemote) return;
      const fromLegacy = tryHydrateFromLegacyURL();
      if (cancelled || fromLegacy) return;
      tryHydrateFromLocalStorage();
    })();

    // ── Subscribe + writes ───────────────────────────────────────────────
    let localTimer: number | undefined;
    let remoteTimer: number | undefined;

    const unsub = useScenariosStore.subscribe((state) => {
      if (typeof window === "undefined") return;

      // 1. localStorage (sempre)
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

      // 2. Supabase (só se tem remoteId)
      const remoteId = useShareMetaStore.getState().remoteId;
      if (remoteId && isSupabaseConfigured()) {
        window.clearTimeout(remoteTimer);
        useShareMetaStore.getState().setSyncStatus("syncing");
        remoteTimer = window.setTimeout(() => {
          // Snapshot da identidade no momento do push (corretor.own ou received)
          const corretorState = useCorretorStore.getState();
          const corretor = corretorState.own ?? corretorState.received ?? undefined;
          updateSharePayload(remoteId, {
            scenarios: state.scenarios,
            corretor,
          })
            .then(() => {
              useShareMetaStore.getState().setSyncStatus("idle");
            })
            .catch((err: unknown) => {
              const msg =
                err instanceof ShareError
                  ? err.message
                  : "Falha ao sincronizar.";
              console.warn("[persist] updateSharePayload falhou:", msg);
              useShareMetaStore.getState().setSyncStatus("err", msg);
            });
        }, REMOTE_PUSH_DEBOUNCE_MS);
      }
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

    // ── Polling on focus (corretor reabrindo aba) ───────────────────────
    let lastPollAt = 0;
    let lastSeenUpdatedAt: number | null = null;
    const onFocus = async () => {
      const now = Date.now();
      if (now - lastPollAt < FOCUS_POLL_MIN_INTERVAL_MS) return;
      lastPollAt = now;

      const remoteId = useShareMetaStore.getState().remoteId;
      if (!remoteId || !isSupabaseConfigured()) return;

      // Só refetcha se este usuário é o corretor — pra não sobrescrever
      // edições em vôo do cliente.
      const own = useCorretorStore.getState().own;
      const received = useCorretorStore.getState().received;
      const isCorretor = own !== null && received === null;
      if (!isCorretor) return;

      try {
        const updatedAt = await getShareUpdatedAt(remoteId);
        if (!updatedAt) return;
        const ts = updatedAt.getTime();
        if (lastSeenUpdatedAt !== null && ts <= lastSeenUpdatedAt) return;
        lastSeenUpdatedAt = ts;
        const payload = await fetchShare(remoteId);
        if (!payload) return;
        useScenariosStore.getState().replaceAll(payload.scenarios);
      } catch (err) {
        console.warn("[persist] focus refresh falhou:", err);
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(localTimer);
      window.clearTimeout(remoteTimer);
      unsub();
    };
  }, []);

  return null;
}
