"use client";

import * as React from "react";
import { Mail, MessageCircle, Send, Sparkles } from "lucide-react";
import {
  Button,
  Field,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives";
import {
  findLatestShareForLead,
  ShareError,
} from "@/lib/share/api";
import { updateLeadStatus, type LeadRow } from "@/lib/leads/api";
import { buildLeadMessage } from "@/lib/leads/utils";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { useBrandingStore } from "@/lib/branding/use-branding-store";
import { cn } from "@/lib/utils";

interface RespostaRapidaPopoverProps {
  lead: LeadRow;
  onStatusChange?: (status: "respondido") => void;
  /** Callback pra "criar cenário" — chamado se ainda não há share vinculado */
  onCriarCenario: () => void;
}

/**
 * Popover de resposta rápida pro lead. Pré-fill da mensagem com template,
 * editável. Detecta automaticamente se já existe share vinculado (via
 * lead_id) e usa o link mais recente. Se não houver, mostra aviso pra
 * criar cenário primeiro.
 */
export function RespostaRapidaPopover({
  lead,
  onStatusChange,
  onCriarCenario,
}: RespostaRapidaPopoverProps) {
  const profile = useAuthStore((s) => s.profile);
  const branding = useBrandingStore((s) => s.branding);

  const [open, setOpen] = React.useState(false);
  const [shareId, setShareId] = React.useState<string | null>(null);
  const [shareLoading, setShareLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Quando abrir, busca share vinculado E preenche template
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setShareLoading(true);
    setError(null);
    findLatestShareForLead(lead.id)
      .then((share) => {
        if (cancelled) return;
        setShareId(share?.id ?? null);
        // Constrói mensagem
        if (share?.id && profile && typeof window !== "undefined") {
          // Usa slug do branding/profile pra URL bonita; fallback ?c=
          const slug = branding?.slug ?? profile.slug;
          const link = slug
            ? `${window.location.origin}/c/${slug}/${share.id}`
            : `${window.location.origin}/simulador/?c=${share.id}`;
          setMessage(buildLeadMessage(lead, link, profile.nome));
        } else {
          setMessage("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ShareError ? err.message : "Erro ao buscar cenário.",
        );
      })
      .finally(() => {
        if (!cancelled) setShareLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, lead, profile, branding]);

  const handleSendWhatsApp = () => {
    if (!lead.whatsapp) return;
    const url = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
    void markRespondido();
    setOpen(false);
  };

  const handleSendEmail = () => {
    if (!lead.email) return;
    const subject = encodeURIComponent("Sua simulação no Habitando");
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    void markRespondido();
    setOpen(false);
  };

  const markRespondido = async () => {
    try {
      await updateLeadStatus(lead.id, "respondido");
      onStatusChange?.("respondido");
    } catch {
      /* falha em update silencioso — UX não trava */
    }
  };

  const hasShare = shareId !== null;
  const canSendWhatsApp = hasShare && !!lead.whatsapp;
  const canSendEmail = hasShare && !!lead.email;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium",
            "bg-card border border-border text-ink hover:bg-paper-alt transition-colors",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Resposta rápida
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-3 space-y-3">
        <div className="text-[12.5px] text-ink-soft">
          Pra:{" "}
          <strong className="text-ink">
            {lead.nome ?? "Lead sem nome"}
          </strong>{" "}
          {lead.whatsapp && (
            <span className="font-mono">+{lead.whatsapp}</span>
          )}
          {lead.email && !lead.whatsapp && (
            <span className="font-mono">{lead.email}</span>
          )}
        </div>

        {shareLoading ? (
          <div className="text-[12.5px] text-ink-soft py-4 text-center">
            Buscando cenário…
          </div>
        ) : !hasShare ? (
          <div className="rounded-md bg-amber-soft text-amber px-3 py-2.5 text-[12.5px] space-y-2">
            <p>
              Você ainda não criou um cenário pra esse lead. Sem cenário,
              não tem link pra mandar.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setOpen(false);
                onCriarCenario();
              }}
              className="w-full"
            >
              Criar cenário pra responder
            </Button>
          </div>
        ) : (
          <>
            <Field label="Mensagem">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </Field>
            {error && (
              <div className="text-[12.5px] text-red">{error}</div>
            )}
            <div className="flex flex-col gap-2">
              {canSendWhatsApp && (
                <Button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full bg-green text-white hover:bg-green/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mandar via WhatsApp
                </Button>
              )}
              {canSendEmail && (
                <Button
                  type="button"
                  onClick={handleSendEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="h-4 w-4" />
                  Enviar e-mail
                </Button>
              )}
              {!canSendWhatsApp && !canSendEmail && (
                <div className="text-[12.5px] text-ink-muted text-center">
                  Lead sem contato disponível.
                </div>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
