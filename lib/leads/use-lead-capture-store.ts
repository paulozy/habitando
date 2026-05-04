"use client";

import { create } from "zustand";

const STORAGE_KEY = "habitando:leads-submitted";

interface LeadCaptureState {
  submittedShareIds: Set<string>;
  markSubmitted: (shareId: string) => void;
  hasSubmitted: (shareId: string) => boolean;
}

function loadFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveToStorage(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / disabled */
  }
}

/**
 * Tracking client-side de quais shares o cliente já submeteu lead nesta
 * sessão. Usado pra esconder o CTA depois do envio.
 *
 * Não é fonte de verdade — apenas UX. RLS unique index protege contra
 * duplicação real no DB.
 */
export const useLeadCaptureStore = create<LeadCaptureState>((set, get) => ({
  submittedShareIds: loadFromStorage(),

  markSubmitted: (shareId) => {
    const next = new Set(get().submittedShareIds);
    next.add(shareId);
    saveToStorage(next);
    set({ submittedShareIds: next });
  },

  hasSubmitted: (shareId) => get().submittedShareIds.has(shareId),
}));
