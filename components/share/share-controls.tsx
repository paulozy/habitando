"use client";

import { Button } from "@/components/ui/primitives";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { updateLeadStatus } from "@/lib/leads/api";
import { createShare, ShareError } from "@/lib/share/api";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { useShareMetaStore } from "@/lib/storage/use-share-meta-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  CorretorIdentitySchema,
  encodeScenarios,
  type CorretorIdentity,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { Check, FileText, Link2 } from "lucide-react";
import * as React from "react";
import { CorretorIdentityForm } from "./corretor-identity-form";

export function ShareControls() {
  const scenarios = useScenariosStore((s) => s.scenarios);
  const ownLocal = useCorretorStore((s) => s.own);
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const setRemoteId = useShareMetaStore((s) => s.setRemoteId);
  const pendingLeadId = useShareMetaStore((s) => s.pendingLeadId);
  const setPendingLeadId = useShareMetaStore((s) => s.setPendingLeadId);

  // Quando autenticado, profile vira a fonte da identidade do corretor.
  // Senão, cai no localStorage (own anônimo).
  const own = React.useMemo<CorretorIdentity | null>(() => {
    if (profile && profile.whatsapp) {
      const candidate = { nome: profile.nome, whatsapp: profile.whatsapp };
      const parsed = CorretorIdentitySchema.safeParse(candidate);
      return parsed.success ? parsed.data : ownLocal;
    }
    return ownLocal;
  }, [profile, ownLocal]);

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
        return;
      }
      setBusy(true);
      try {
        const { id } = await createShare({
          scenarios,
          corretor: identityForLink ?? undefined,
          ownerId: session?.user.id,
          leadId: pendingLeadId ?? undefined,
        });
        setRemoteId(id);
        // Após share criado, limpa pendingLeadId e auto-marca lead
        // como respondido (corretor de fato concluiu o fluxo).
        if (pendingLeadId) {
          const leadId = pendingLeadId;
          setPendingLeadId(null);
          void updateLeadStatus(leadId, "respondido").catch(() => {
            /* falha em update silencioso — não trava UX */
          });
        }
        // Quando o corretor tem slug configurado, gera URL vanity branded:
        // /c/<slug>/<id>. Senão, fallback pro short link tradicional.
        const url = profile?.slug
          ? `${window.location.origin}/c/${profile.slug}/${id}`
          : `${window.location.origin}/simulador/?c=${id}`;
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
    [
      scenarios,
      setRemoteId,
      session?.user.id,
      profile?.slug,
      pendingLeadId,
      setPendingLeadId,
    ],
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
    // self-contained, não muda mais depois de aberto. Se o corretor tem
    // slug, anexa ?u=<slug> pra branding aplicar.
    const encoded = encodeScenarios(scenarios, own ?? undefined);
    const slugParam = profile?.slug ? `&u=${profile.slug}` : "";
    const url = `${window.location.origin}/relatorio/?s=${encoded}${slugParam}`;
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
