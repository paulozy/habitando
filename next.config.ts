import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  const base: NextConfig = {
    images: { unoptimized: true },
    trailingSlash: true,
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return base;
  }

  return { ...base, output: "export" };
};

export default nextConfig;
