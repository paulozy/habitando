"use client";

import * as React from "react";
import { fetchProfile } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Hidrata `useAuthStore` na inicialização da app:
 * 1. Lê sessão persistida (localStorage do Supabase)
 * 2. Subscribe a auth state changes (login/logout/refresh em outras abas)
 * 3. Quando session existe, busca profile (com retry pra cobrir race do trigger)
 *
 * Não renderiza nada — utility component. Mount no layout root.
 */
export function AuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setStatus = useAuthStore((s) => s.setStatus);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("anonymous");
      return;
    }
    const sb = getSupabase();
    let cancelled = false;

    // Hidratação inicial
    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id);
      }
    });

    // Subscribe a mudanças (login/logout/refresh)
    const { data: subscription } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      setSession(session);
      if (session) {
        // INITIAL_SESSION e TOKEN_REFRESHED não precisam refetchar profile
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          loadProfile(session.user.id);
        }
      } else {
        setProfile(null);
      }
    });

    async function loadProfile(userId: string) {
      try {
        const profile = await fetchProfile(userId);
        if (!cancelled) setProfile(profile);
      } catch (err) {
        if (!cancelled) {
          console.warn("[auth-bootstrap] fetchProfile falhou:", err);
          setProfile(null);
        }
      }
    }

    return () => {
      cancelled = true;
      subscription?.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setStatus]);

  return null;
}
