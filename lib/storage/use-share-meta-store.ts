"use client";

import { create } from "zustand";

const STORAGE_KEY = "habitando:share-meta";

export type SyncStatus = "idle" | "syncing" | "err";

interface ShareMetaState {
  /** ID atual no Supabase. null quando o cenário só vive em localStorage. */
  remoteId: string | null;
  syncStatus: SyncStatus;
  lastSyncError: string | null;

  setRemoteId: (id: string | null) => void;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
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

export const useShareMetaStore = create<ShareMetaState>((set) => ({
  ...loadFromStorage(),
  syncStatus: "idle",
  lastSyncError: null,

  setRemoteId: (id) => {
    saveToStorage({ remoteId: id });
    set({ remoteId: id });
  },
  setSyncStatus: (status, error = null) => {
    set({ syncStatus: status, lastSyncError: error });
  },
  clear: () => {
    saveToStorage({ remoteId: null });
    set({ remoteId: null, syncStatus: "idle", lastSyncError: null });
  },
}));

export const SHARE_META_STORAGE_KEY = STORAGE_KEY;
