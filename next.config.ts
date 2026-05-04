import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Rewrites pra vanity URL do white-label: `/c/<slug>/<id>` → `/c/?u=&id=`.
 *
 * Em produção, `vercel.json` é autoritativo (CDN-layer rewrite). Aqui são
 * só os rewrites de dev — `output: 'export'` ignora rewrites do
 * next.config no build, então adicionamos só na phase de development.
 *
 * Por que `:id/` separado: `trailingSlash: true` normaliza pra `/c/joao/abc/`
 * antes do rewrite. Path-to-regexp v6 captura segmentos sem barra; ter as
 * duas variantes evita 404 em ambos os formatos.
 */
const DEV_REWRITES = [
  { source: "/c/:slug/:id", destination: "/c/?u=:slug&id=:id" },
  { source: "/c/:slug/:id/", destination: "/c/?u=:slug&id=:id" },
];

const nextConfig = (phase: string): NextConfig => {
  const base: NextConfig = {
    images: { unoptimized: true },
    trailingSlash: true,
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...base,
      async rewrites() {
        return DEV_REWRITES;
      },
    };
  }

  return { ...base, output: "export" };
};

export default nextConfig;
