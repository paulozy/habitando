"use client";

import { create } from "zustand";

export interface PublicBranding {
  id: string;
  slug: string | null;
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
  tagline: string | null;
}

interface BrandingState {
  /** Branding ativo do dono do cenário aberto. null = sem branding (default Habitando). */
  branding: PublicBranding | null;
  /** Se true, ainda está fazendo o fetch — UI mostra skeleton em vez de default. */
  loading: boolean;
  setBranding: (b: PublicBranding | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

/**
 * Live state — sem persistência. Reseta a cada navegação. A hidratação
 * acontece quando persist.ts ou /c/page.tsx detectam owner_id ou slug.
 */
export const useBrandingStore = create<BrandingState>((set) => ({
  branding: null,
  loading: false,
  setBranding: (branding) => set({ branding, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ branding: null, loading: false }),
}));
