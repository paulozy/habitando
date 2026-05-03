"use client";

import * as React from "react";
import { Check, FileText, Link2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { encodeScenarios } from "@/lib/url-state";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { useShareMetaStore } from "@/lib/storage/use-share-meta-store";
import { createShare, ShareError } from "@/lib/share/api";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { CorretorIdentityForm } from "./corretor-identity-form";
import { cn } from "@/lib/utils";

export function ShareControls() {
  const scenarios = useScenariosStore((s) => s.scenarios);
  const own = useCorretorStore((s) => s.own);
  const setRemoteId = useShareMetaStore((s) => s.setRemoteId);

  const [feedback, setFeedback] = React.useState<{
    tone: "ok" | "err";
    msg: string;
  } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [identityOpen, setIdentityOpen] = React.useState(false);
  const pendingShareRef = React.useRef(false);

  const flash = (tone: "ok" | "err", msg: string) => {
    setFeedback({ tone, msg });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const doShare = React.useCallback(
    async (identityForLink: typeof own) => {
      if (!isSupabaseConfigured()) {
        flash(
          "err",
          "Compartilhamento indisponível — configure o Supabase (veja supabase/README.md).",
        );
        return;
      }
      setBusy(true);
      try {
        const { id } = await createShare({
          scenarios,
          corretor: identityForLink ?? undefined,
        });
        setRemoteId(id);
        const url = `${window.location.origin}/simulador/?c=${id}`;
        try {
          await navigator.clipboard.writeText(url);
          flash("ok", "Link copiado ✓");
        } catch {
          window.prompt("Copie o link abaixo:", url);
        }
      } catch (err) {
        const msg =
          err instanceof ShareError
            ? err.message
            : "Erro ao criar o link. Tente de novo.";
        flash("err", msg);
      } finally {
        setBusy(false);
      }
    },
    [scenarios, setRemoteId],
  );

  const handleShare = async () => {
    if (!own) {
      pendingShareRef.current = true;
      setIdentityOpen(true);
      return;
    }
    await doShare(own);
  };

  const handleExportPDF = () => {
    if (typeof window === "undefined") return;
    // PDF continua via ?s= (one-shot, sem Supabase) — relatório é
    // self-contained, não muda mais depois de aberto.
    const encoded = encodeScenarios(scenarios, own ?? undefined);
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
        disabled={busy}
        className="bg-transparent border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
      >
        <Link2 className="h-3.5 w-3.5" />
        {busy ? "Gerando…" : "Compartilhar"}
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIdentityOpen(true)}
        className="bg-transparent border-white/20 text-white hover:bg-white/10"
        title={
          own
            ? `Identidade configurada: ${own.nome}`
            : "Configure seu nome e WhatsApp pra aparecer no link"
        }
      >
        <UserCog className="h-3.5 w-3.5" />
        {own ? own.nome : "Minha identidade"}
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
      <CorretorIdentityForm
        open={identityOpen}
        onClose={() => {
          setIdentityOpen(false);
          pendingShareRef.current = false;
        }}
        onSaved={(identity) => {
          if (pendingShareRef.current) {
            pendingShareRef.current = false;
            void doShare(identity);
          }
        }}
      />
    </div>
  );
}
