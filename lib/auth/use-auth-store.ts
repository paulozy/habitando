"use client";

import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

export interface Profile {
  id: string;
  nome: string;
  whatsapp: string | null;
  slug: string | null;
  plano: "free" | "corretor" | "imobiliaria";
  created_at: string;
  updated_at: string;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  status: AuthStatus;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  status: "loading",

  setSession: (session) =>
    set({
      session,
      status: session ? "authenticated" : "anonymous",
      // Quando muda sessão, profile precisa ser refetched
      ...(session ? {} : { profile: null }),
    }),
  setProfile: (profile) => set({ profile }),
  setStatus: (status) => set({ status }),
  reset: () => set({ session: null, profile: null, status: "anonymous" }),
}));
