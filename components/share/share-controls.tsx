"use client";

import * as React from "react";
import { Check, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { buildShareURL, encodeScenarios } from "@/lib/url-state";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { cn } from "@/lib/utils";

export function ShareControls() {
  const scenarios = useScenariosStore((s) => s.scenarios);

  const [feedback, setFeedback] = React.useState<{
    tone: "ok" | "err";
    msg: string;
  } | null>(null);

  const flash = (tone: "ok" | "err", msg: string) => {
    setFeedback({ tone, msg });
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const handleShare = async () => {
    const url = buildShareURL(scenarios);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      flash("ok", "Link copiado ✓");
    } catch {
      // Fallback: abre prompt
      window.prompt("Copie o link abaixo:", url);
    }
  };

  const handleExportPDF = () => {
    if (typeof window === "undefined") return;
    const encoded = encodeScenarios(scenarios);
    const url = `${window.location.origin}/relatorio/?s=${encoded}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="bg-transparent border-white/20 text-white hover:bg-white/10"
      >
        <Link2 className="h-3.5 w-3.5" />
        Compartilhar
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        className="bg-transparent border-white/20 text-white hover:bg-white/10"
        title="Abre uma página de relatório otimizada para impressão / salvar como PDF"
      >
        <FileText className="h-3.5 w-3.5" />
        Exportar PDF
      </Button>
      {feedback && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full",
            feedback.tone === "ok"
              ? "bg-green-soft text-green"
              : "bg-red-soft text-red",
          )}
        >
          {feedback.tone === "ok" && <Check className="h-3 w-3" />}
          {feedback.msg}
        </span>
      )}
    </div>
  );
}
