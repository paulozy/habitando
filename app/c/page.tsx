"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchBrandingBySlug } from "@/lib/branding/api";
import { useBrandingStore } from "@/lib/branding/use-branding-store";

/**
 * Catch-all do white-label vanity URL.
 *
 * Em produção, Vercel rewrite traduz `/c/joao/abc123` → `/c/?u=joao&id=abc123`.
 * Em dev, o link tem que vir como `/c/?u=joao&id=abc123` direto (rewrite não
 * roda em `pnpm dev`).
 *
 * Fluxo:
 *  1. Lê `u` (slug) e `id` (share id)
 *  2. Pré-busca branding por slug → seta no store
 *  3. Redireciona pra `/simulador/?c=<id>` — persist.ts cuida do resto
 *
 * Se slug não existe, segue assim mesmo pra /simulador (graceful degradation).
 */
export default function CatchAllPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Resolver />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-full flex items-center justify-center text-ink-soft">
      Carregando…
    </div>
  );
}

function Resolver() {
  const router = useRouter();
  const params = useSearchParams();
  const setBranding = useBrandingStore((s) => s.setBranding);
  const setLoading = useBrandingStore((s) => s.setLoading);

  React.useEffect(() => {
    // Tenta primeiro searchParams (formato direto: /c/?u=&id=).
    // Se vazio, lê do pathname (rewrite Vercel/dev: /c/<slug>/<id>/ → URL
    // do browser permanece com path-based, useSearchParams retorna vazio).
    let slug = params.get("u");
    let id = params.get("id");

    if (!id && typeof window !== "undefined") {
      const segments = window.location.pathname
        .split("/")
        .filter((s) => s.length > 0);
      // Espera ["c", "<slug>", "<id>"]
      if (segments[0] === "c" && segments.length >= 3) {
        slug = segments[1];
        id = segments[2];
      }
    }

    if (!id) {
      router.replace("/simulador/");
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      if (slug) {
        try {
          const branding = await fetchBrandingBySlug(slug);
          if (!cancelled) setBranding(branding);
        } catch {
          if (!cancelled) setBranding(null);
        }
      } else {
        setLoading(false);
      }
      if (!cancelled) {
        router.replace(`/simulador/?c=${id}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router, setBranding, setLoading]);

  return <Loading />;
}
