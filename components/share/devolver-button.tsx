"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { buildShareURL } from "@/lib/url-state";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { useShareMetaStore } from "@/lib/storage/use-share-meta-store";
import { cn } from "@/lib/utils";

interface DevolverButtonProps {
  className?: string;
  /** "compact" para o header desktop, "sticky" para a faixa fixa mobile */
  variant?: "compact" | "sticky";
}

/**
 * Renderiza apenas se o cliente abriu um link com identidade de corretor
 * (`useCorretorStore.received`). Ao clicar, abre o WhatsApp do corretor com:
 * - Link `/simulador/?c=<id>` quando o cenário veio do Supabase (estado já
 *   sincronizado pelo push debounced)
 * - Link `/simulador/?s=<blob>` quando é um cenário legacy sem remoteId
 *   (encoded local)
 */
export function DevolverButton({
  className,
  variant = "compact",
}: DevolverButtonProps) {
  const received = useCorretorStore((s) => s.received);
  const scenarios = useScenariosStore((s) => s.scenarios);
  const remoteId = useShareMetaStore((s) => s.remoteId);

  if (!received) return null;

  const handleClick = () => {
    if (typeof window === "undefined") return;
    const link = remoteId
      ? `${window.location.origin}/simulador/?c=${remoteId}`
      : buildShareURL(scenarios, received);
    const msg = `Olá ${received.nome}, ajustei aqui no Habitando o cenário: ${link}`;
    const url = `https://wa.me/${received.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  };

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 md:hidden",
          "bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.06)]",
          "px-4 py-3",
          className,
        )}
      >
        <Button
          type="button"
          onClick={handleClick}
          className="w-full bg-green text-white hover:bg-green/90"
        >
          <Send className="h-4 w-4" />
          Mandar este cenário pra {received.nome}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      className={cn("bg-green text-white hover:bg-green/90", className)}
    >
      <Send className="h-3.5 w-3.5" />
      Mandar pra {received.nome}
    </Button>
  );
}
