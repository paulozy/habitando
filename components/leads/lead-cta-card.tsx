"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, FileText, Mail, MessageCircle } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { LeadError, submitLead } from "@/lib/leads/api";
import { useLeadCaptureStore } from "@/lib/leads/use-lead-capture-store";
import { useScenariosStore } from "@/lib/storage/use-scenarios-store";
import { useShareMetaStore } from "@/lib/storage/use-share-meta-store";
import { useBrandingStore } from "@/lib/branding/use-branding-store";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { encodeScenarios } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const MIN_TIME_TO_SUBMIT_MS = 1500;

type ContactMode = "whatsapp" | "email";

/**
 * Card CTA mostrado em modo cliente após o ResultsPanel.
 * "Quer receber o resumo em PDF? Deixe seu WhatsApp/email" — submete o
 * contato pra owner do share, depois abre o PDF em nova aba.
 *
 * Anti-spam: honeypot field invisível + min-time-to-submit 1.5s.
 * LGPD: checkbox obrigatório + link pra /privacidade.
 */
export function LeadCtaCard() {
  const received = useCorretorStore((s) => s.received);
  const branding = useBrandingStore((s) => s.branding);
  const remoteId = useShareMetaStore((s) => s.remoteId);
  const scenarios = useScenariosStore((s) => s.scenarios);
  const hasSubmitted = useLeadCaptureStore((s) =>
    remoteId ? s.hasSubmitted(remoteId) : false,
  );
  const markSubmitted = useLeadCaptureStore((s) => s.markSubmitted);

  const mountedAtRef = React.useRef<number>(Date.now());
  const [mode, setMode] = React.useState<ContactMode>("whatsapp");
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

  // Não renderiza fora de modo cliente, sem share remoto, ou se já submeteu
  if (!received || !remoteId) return null;
  if (hasSubmitted || done) {
    return <DoneCard pdfUrl={pdfUrl} corretorNome={received.nome} />;
  }
  // Sem owner_id (do branding) não dá pra submeter — share legacy anon
  if (!branding?.id) return null;

  const corretorNome = received.nome;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot: se preenchido, é bot — finge sucesso silencioso
    if (honeypot.trim().length > 0) {
      setDone(true);
      return;
    }

    // Min-time-to-submit
    if (Date.now() - mountedAtRef.current < MIN_TIME_TO_SUBMIT_MS) {
      setError("Aguarde um instante antes de enviar.");
      return;
    }

    if (!consent) {
      setError("Você precisa concordar com o tratamento dos dados.");
      return;
    }

    if (mode === "email" && !email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    if (mode === "whatsapp" && !whatsapp.trim()) {
      setError("Informe seu WhatsApp.");
      return;
    }

    setBusy(true);
    try {
      // Normaliza WhatsApp BR: prepende 55 se for 10-11 dígitos
      let normalizedWhats: string | undefined;
      if (mode === "whatsapp" && whatsapp.trim()) {
        const digits = whatsapp.replace(/\D/g, "");
        normalizedWhats =
          digits.length >= 10 && digits.length <= 11
            ? "55" + digits
            : digits;
      }

      await submitLead({
        shareId: remoteId,
        ownerId: branding.id,
        nome: nome.trim() || undefined,
        email: mode === "email" ? email.trim() : undefined,
        whatsapp: mode === "whatsapp" ? normalizedWhats : undefined,
        consentLgpd: consent,
        payloadSnapshot: { scenarios },
      });

      // Marca como submetido (sessão)
      markSubmitted(remoteId);

      // Abre PDF em nova aba
      const encoded = encodeScenarios(scenarios, received);
      const slug = branding.slug ?? "";
      const url = `${window.location.origin}/relatorio/?s=${encoded}${
        slug ? `&u=${slug}` : ""
      }`;
      const popup = window.open(url, "_blank", "noopener");
      setPdfUrl(url);
      setDone(true);
      // Se popup bloqueado, DoneCard mostra botão pra abrir manualmente
      if (!popup) {
        console.warn("[lead-cta] popup bloqueado — usuário precisa clicar pra abrir PDF");
      }
    } catch (err) {
      const msg =
        err instanceof LeadError ? err.message : "Erro ao enviar. Tente de novo.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0" aria-hidden>
          📄
        </div>
        <div className="flex-1">
          <div className="font-medium text-ink text-[15.5px] mb-0.5">
            Quer receber o resumo em PDF?
          </div>
          <p className="text-ink-soft text-[13.5px] leading-relaxed">
            Deixa seu WhatsApp ou e-mail e {corretorNome} envia o material
            completo. Você também recebe o PDF agora pra olhar com calma.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Honeypot — escondido por sr-only mas presente no DOM pra bots */}
        <div className="sr-only" aria-hidden>
          <label>
            Não preencha este campo
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <Field label="Como podemos te chamar? (opcional)">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Maria"
            maxLength={60}
          />
        </Field>

        <div className="space-y-2">
          <div className="text-xs font-medium text-ink-soft uppercase tracking-wide">
            Como prefere ser contatada(o)?
          </div>
          <div className="flex gap-2">
            <ToggleButton
              active={mode === "whatsapp"}
              onClick={() => setMode("whatsapp")}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </ToggleButton>
            <ToggleButton
              active={mode === "email"}
              onClick={() => setMode("email")}
            >
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </ToggleButton>
          </div>
        </div>

        {mode === "whatsapp" ? (
          <Field label="Seu WhatsApp">
            <div className="flex">
              <span
                className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-md bg-paper-alt text-ink-soft text-sm font-mono shrink-0"
                aria-hidden
              >
                🇧🇷 +55
              </span>
              <Input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11999998888"
                className="rounded-l-none"
                required
              />
            </div>
          </Field>
        ) : (
          <Field label="Seu e-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              autoComplete="email"
            />
          </Field>
        )}

        <label className="flex items-start gap-2 text-[12.5px] text-ink-soft leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            Concordo que <strong>{corretorNome}</strong> use meus dados pra
            enviar o resumo e tirar dúvidas sobre este imóvel.{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="text-accent underline hover:text-accent/80"
            >
              Política de privacidade
            </Link>
          </span>
        </label>

        {error && (
          <div className="bg-red-soft text-red text-[12.5px] px-3 py-2 rounded">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-accent text-ink hover:bg-accent/90"
        >
          <FileText className="h-4 w-4" />
          {busy ? "Enviando…" : "Receber resumo em PDF"}
        </Button>
      </form>
    </div>
  );
}

function DoneCard({
  pdfUrl,
  corretorNome,
}: {
  pdfUrl: string | null;
  corretorNome: string;
}) {
  return (
    <div className="rounded-xl border border-green/30 bg-green-soft px-5 py-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0" aria-hidden>
          ✅
        </div>
        <div className="flex-1">
          <div className="font-medium text-ink text-[15px] mb-0.5">
            Contato enviado pra {corretorNome}
          </div>
          <p className="text-ink-soft text-[13.5px] leading-relaxed">
            O PDF abriu em uma nova aba. Se não viu, clique abaixo pra abrir
            de novo.
          </p>
        </div>
      </div>
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-medium",
            "text-green hover:text-green/80",
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir PDF de novo
        </a>
      )}
      {!pdfUrl && (
        <div className="inline-flex items-center gap-1.5 text-[13px] text-green">
          <Check className="h-3.5 w-3.5" />
          Tudo certo
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium border transition-colors",
        active
          ? "bg-accent/15 border-accent/40 text-ink"
          : "bg-card border-border text-ink-soft hover:bg-paper-alt",
      )}
    >
      {children}
    </button>
  );
}
