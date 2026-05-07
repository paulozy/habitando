"use client";

import { Button } from "@/components/ui/primitives";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { buildShareURL, encodeScenarios } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, FileText, Link2 } from "lucide-react";
import * as React from "react";

const URL_WARN_THRESHOLD = 2200;

export function ShareControls() {
  const scenarios = useScenariosStore((s) => s.scenarios);

  const [feedback, setFeedback] = React.useState<{
    tone: "ok" | "warn" | "err";
    msg: string;
  } | null>(null);

  const flash = (tone: "ok" | "warn" | "err", msg: string) => {
    setFeedback({ tone, msg });
    window.setTimeout(() => setFeedback(null), 5000);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      const url = buildShareURL(scenarios);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt("Copie o link abaixo:", url);
      }
      if (url.length > URL_WARN_THRESHOLD) {
        flash(
          "warn",
          "Link copiado, mas longo — pode ser truncado no WhatsApp/SMS. Cole num e-mail pra garantir.",
        );
      } else {
        flash("ok", "Link copiado ✓");
      }
    } catch {
      flash("err", "Não consegui gerar o link. Tente de novo.");
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
            "inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full max-w-[420px]",
            feedback.tone === "ok" && "bg-green-soft text-green",
            feedback.tone === "warn" && "bg-amber-soft text-amber",
            feedback.tone === "err" && "bg-red-soft text-red",
          )}
        >
          {feedback.tone === "ok" && <Check className="h-3 w-3 shrink-0" />}
          {feedback.tone === "warn" && (
            <AlertTriangle className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{feedback.msg}</span>
        </span>
      )}
    </div>
  );
}
