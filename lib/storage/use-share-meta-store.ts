"use client";

import { create } from "zustand";

const STORAGE_KEY = "habitando:share-meta";
const PENDING_LEAD_KEY = "habitando:pending-lead";

export type SyncStatus = "idle" | "syncing" | "err";

interface ShareMetaState {
  /** ID atual no Supabase. null quando o cenário só vive em localStorage. */
  remoteId: string | null;
  syncStatus: SyncStatus;
  lastSyncError: string | null;

  /**
   * Lead que o corretor está respondendo no momento. Setado quando ele clica
   * "Criar cenário pra esse lead" em /leads. Quando o share é criado, o
   * createShare passa esse leadId pro DB e o store é limpo.
   *
   * Persistido em sessionStorage — não vale carregar entre sessions.
   */
  pendingLeadId: string | null;

  setRemoteId: (id: string | null) => void;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  setPendingLeadId: (id: string | null) => void;
  clear: () => void;
}

interface PersistedShape {
  remoteId: string | null;
}

function loadFromStorage(): PersistedShape {
  if (typeof window === "undefined") return { remoteId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { remoteId: null };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.remoteId === "string") {
      return { remoteId: parsed.remoteId };
    }
  } catch {
    /* ignore */
  }
  return { remoteId: null };
}

function saveToStorage(shape: PersistedShape) {
  if (typeof window === "undefined") return;
  try {
    if (shape.remoteId === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shape));
    }
  } catch {
    /* quota / disabled */
  }
}

function loadPendingLead(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PENDING_LEAD_KEY);
  } catch {
    return null;
  }
}

function savePendingLead(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id === null) {
      window.sessionStorage.removeItem(PENDING_LEAD_KEY);
    } else {
      window.sessionStorage.setItem(PENDING_LEAD_KEY, id);
    }
  } catch {
    /* quota / disabled */
  }
}

export const useShareMetaStore = create<ShareMetaState>((set) => ({
  ...loadFromStorage(),
  syncStatus: "idle",
  lastSyncError: null,
  pendingLeadId: loadPendingLead(),

  setRemoteId: (id) => {
    saveToStorage({ remoteId: id });
    set({ remoteId: id });
  },
  setSyncStatus: (status, error = null) => {
    set({ syncStatus: status, lastSyncError: error });
  },
  setPendingLeadId: (id) => {
    savePendingLead(id);
    set({ pendingLeadId: id });
  },
  clear: () => {
    saveToStorage({ remoteId: null });
    savePendingLead(null);
    set({
      remoteId: null,
      syncStatus: "idle",
      lastSyncError: null,
      pendingLeadId: null,
    });
  },
}));

export const SHARE_META_STORAGE_KEY = STORAGE_KEY;
