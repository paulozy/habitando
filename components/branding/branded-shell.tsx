"use client";

import * as React from "react";
import type { PublicBranding } from "@/lib/branding/use-branding-store";

interface BrandedShellProps {
  branding: PublicBranding | null | undefined;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper que injeta CSS vars de branding no subtree quando há branding.
 * Sem branding: passa-through sem nenhum DOM extra (preserva layout default
 * com a cor accent dourada padrão do Habitando).
 *
 * Como funciona: define `--color-accent` (e variações) inline no style do div,
 * que sobrescreve o valor declarado em `@theme` no globals.css. Filhos que
 * usam `text-accent`, `bg-accent`, `border-accent`, ou `var(--color-accent)`
 * direto (incluindo o `print.css`) herdam automaticamente.
 */
export function BrandedShell({
  branding,
  children,
  className,
}: BrandedShellProps) {
  if (!branding?.cor_primaria) {
    return <>{children}</>;
  }

  const style = {
    "--color-accent": branding.cor_primaria,
    "--color-ring": branding.cor_primaria,
  } as React.CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
