"use client";

import { create } from "zustand";
import { CorretorIdentitySchema, type CorretorIdentity } from "@/lib/url-state";

export const CORRETOR_OWN_KEY = "habitando:corretor-own";
export const CORRETOR_RECEIVED_KEY = "habitando:corretor-received";

interface CorretorState {
  /** Identidade configurada pelo próprio usuário (corretor). Persistida no
   *  localStorage do dispositivo do corretor. Embutida nos links que ele
   *  compartilha com clientes. */
  own: CorretorIdentity | null;

  /** Identidade extraída do link recebido (cliente abriu link do corretor).
   *  Persistida no localStorage do dispositivo do cliente para sobreviver a
   *  reload. Sobrescrita quando cliente abre link de outro corretor. */
  received: CorretorIdentity | null;

  setOwn: (identity: CorretorIdentity) => void;
  clearOwn: () => void;
  setReceived: (identity: CorretorIdentity) => void;
  clearReceived: () => void;
}

function loadFromStorage(key: string): CorretorIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Schema com preprocess: dados antigos com WhatsApp sem DDI (ex:
    // "11993235002") são normalizados automaticamente para "5511993235002".
    const result = CorretorIdentitySchema.safeParse(parsed);
    if (!result.success) return null;
    // Re-salva versão normalizada se mudou (migração silenciosa).
    if (
      result.data.whatsapp !== parsed.whatsapp ||
      result.data.nome !== parsed.nome
    ) {
      try {
        window.localStorage.setItem(key, JSON.stringify(result.data));
      } catch {
        /* ignore */
      }
    }
    return result.data;
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(key: string, identity: CorretorIdentity | null) {
  if (typeof window === "undefined") return;
  try {
    if (identity === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(identity));
    }
  } catch {
    /* quota / disabled — ignore */
  }
}

export const useCorretorStore = create<CorretorState>((set) => ({
  own: loadFromStorage(CORRETOR_OWN_KEY),
  received: loadFromStorage(CORRETOR_RECEIVED_KEY),

  setOwn: (identity) => {
    saveToStorage(CORRETOR_OWN_KEY, identity);
    set({ own: identity });
  },
  clearOwn: () => {
    saveToStorage(CORRETOR_OWN_KEY, null);
    set({ own: null });
  },
  setReceived: (identity) => {
    saveToStorage(CORRETOR_RECEIVED_KEY, identity);
    set({ received: identity });
  },
  clearReceived: () => {
    saveToStorage(CORRETOR_RECEIVED_KEY, null);
    set({ received: null });
  },
}));
