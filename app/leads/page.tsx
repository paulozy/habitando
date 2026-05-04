"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  ExternalLink,
  Mail,
  MessageCircle,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import {
  listAllLeads,
  updateLeadStatus,
  type LeadRow,
  type LeadStatus,
} from "@/lib/leads/api";
import {
  extractClienteSummary,
  extractSnapshotScenarios,
  relativeTime,
} from "@/lib/leads/utils";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { useShareMetaStore } from "@/lib/storage/use-share-meta-store";
import { encodeScenarios } from "@/lib/url-state";
import { fmt } from "@/lib/calculation-engine";
import { AppHeader } from "@/components/auth/app-header";
import { RespostaRapidaPopover } from "@/components/leads/resposta-rapida-popover";
import { cn } from "@/lib/utils";

export default function LeadsPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  const [leads, setLeads] = React.useState<LeadRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "anonymous") router.replace("/entrar/");
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listAllLeads()
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Erro ao carregar.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev
        ? prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        : prev,
    );
  };

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="min-h-full flex items-center justify-center text-ink-soft">
        Carregando…
      </div>
    );
  }

  const novoCount =
    leads?.filter((l) => l.status === "novo").length ?? 0;

  return (
    <div className="min-h-full bg-paper">
      <AppHeader />

      <main className="max-w-[1200px] mx-auto px-6 md:px-10 py-10">
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <h1 className="font-serif text-3xl md:text-4xl text-ink">
            Leads recebidos
          </h1>
          {novoCount > 0 && (
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase bg-accent text-ink rounded-full px-2.5 py-1">
              {novoCount} novo{novoCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-ink-soft text-sm mb-8">
          Cada lead é alguém que abriu um link seu e deixou contato. Crie um
          cenário customizado e responda rápido pelo WhatsApp.
        </p>

        {error && (
          <div className="bg-red-soft text-red text-[13px] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {leads === null ? (
          <div className="text-ink-soft text-sm">Carregando seus leads…</div>
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={(newStatus) =>
                  handleStatusChange(lead.id, newStatus)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: LeadRow;
  onStatusChange: (status: LeadStatus) => void;
}) {
  const setPendingLeadId = useShareMetaStore((s) => s.setPendingLeadId);
  const summary = extractClienteSummary(lead.payload_snapshot);
  const snapshotScenarios = extractSnapshotScenarios(lead.payload_snapshot);
  const created = relativeTime(new Date(lead.created_at));

  const handleCriarCenario = () => {
    if (!snapshotScenarios) return;
    // Marca o lead como "pending" no contexto. Quando o corretor clicar
    // Compartilhar no simulador, esse leadId é passado pro createShare.
    setPendingLeadId(lead.id);
    const encoded = encodeScenarios(snapshotScenarios);
    window.open(
      `${window.location.origin}/simulador/?s=${encoded}&lead=${lead.id}`,
      "_blank",
      "noopener",
    );
    // Auto-marca como "respondido" — intenção declarada, mesmo se corretor
    // não clicar Compartilhar no fim
    if (lead.status === "novo") {
      void updateLeadStatus(lead.id, "respondido").then(() => {
        onStatusChange("respondido");
      });
    }
  };

  const handleVerSimulacao = () => {
    if (!snapshotScenarios) return;
    const encoded = encodeScenarios(snapshotScenarios);
    window.open(
      `${window.location.origin}/simulador/?s=${encoded}`,
      "_blank",
      "noopener",
    );
  };

  const handleManualStatus = async (newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(lead.id, newStatus);
      onStatusChange(newStatus);
    } catch {
      /* TODO: feedback de erro */
    }
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-5 hover:border-ink-soft transition-colors space-y-3",
        lead.status === "novo"
          ? "border-accent/40 ring-1 ring-accent/10"
          : "border-border",
      )}
    >
      {/* Header: nome + badge status + tempo + menu */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink text-[15px]">
              {lead.nome ?? "Lead sem nome"}
            </span>
            <StatusBadge status={lead.status} />
          </div>
          <div className="text-[12.5px] text-ink-muted mt-0.5">{created}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded p-1 text-ink-muted hover:text-ink hover:bg-paper-alt"
              title="Mais ações"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            {lead.status !== "novo" && (
              <DropdownMenuItem onSelect={() => handleManualStatus("novo")}>
                Marcar como novo
              </DropdownMenuItem>
            )}
            {lead.status !== "respondido" && (
              <DropdownMenuItem
                onSelect={() => handleManualStatus("respondido")}
              >
                Marcar como respondido
              </DropdownMenuItem>
            )}
            {lead.status !== "ignorado" && (
              <DropdownMenuItem
                onSelect={() => handleManualStatus("ignorado")}
                className="text-ink-soft"
              >
                Marcar como ignorado
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contato */}
      <div className="flex items-center gap-3 flex-wrap text-[13px]">
        {lead.whatsapp && (
          <a
            href={`https://wa.me/${lead.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-green hover:text-green/80 font-mono"
          >
            <MessageCircle className="h-3.5 w-3.5" />+{lead.whatsapp}
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-1.5 text-blue hover:text-blue/80"
          >
            <Mail className="h-3.5 w-3.5" />
            {lead.email}
          </a>
        )}
      </div>

      {/* Resumo do que cliente preencheu */}
      {summary && (
        <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-ink-soft">
          <SummaryItem label="Renda" value={fmt.formatBRL(summary.rendaTotal)} />
          <SummaryItem label="Gastos" value={fmt.formatBRL(summary.gastosFixos)} />
          {summary.atoValor > 0 && (
            <SummaryItem
              label="Ato"
              value={`${fmt.formatBRL(summary.atoValor)}${
                summary.atoParcelas > 1 ? ` em ${summary.atoParcelas}×` : ""
              }`}
            />
          )}
          {summary.nomeCenario && (
            <span className="text-[11.5px] text-ink-muted truncate max-w-[200px]">
              <span className="font-mono uppercase tracking-wide mr-1">
                origem:
              </span>
              {summary.nomeCenario}
            </span>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button
          type="button"
          onClick={handleCriarCenario}
          disabled={!snapshotScenarios}
          className="bg-accent text-ink hover:bg-accent/90"
          size="sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Criar cenário pra esse lead
        </Button>
        <RespostaRapidaPopover
          lead={lead}
          onStatusChange={(s) => onStatusChange(s)}
          onCriarCenario={handleCriarCenario}
        />
        <button
          type="button"
          onClick={handleVerSimulacao}
          disabled={!snapshotScenarios}
          className="inline-flex items-center gap-1 text-[12.5px] text-ink-soft hover:text-ink disabled:text-ink-muted disabled:cursor-not-allowed px-2 h-8"
          title={
            snapshotScenarios
              ? "Vê o que o cliente preencheu (nova aba)"
              : "Snapshot indisponível"
          }
        >
          <Eye className="h-3.5 w-3.5" />
          Ver simulação
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    novo: "bg-accent/15 text-accent border-accent/30",
    respondido: "bg-green-soft text-green border-green/30",
    ignorado: "bg-paper-alt text-ink-muted border-border",
  };
  const labels: Record<LeadStatus, string> = {
    novo: "novo",
    respondido: "respondido",
    ignorado: "ignorado",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-mono uppercase tracking-wide border",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-mono uppercase tracking-wide text-[10px] text-ink-muted">
        {label}:
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="bg-card border border-border rounded-xl p-10 text-center">
      <div className="text-4xl mb-3" aria-hidden>
        🎯
      </div>
      <h2 className="font-serif text-xl text-ink mb-2">
        Nenhum lead ainda
      </h2>
      <p className="text-ink-soft text-sm mb-5 max-w-sm mx-auto">
        Compartilhe um cenário com cliente e veja o lead aparecer aqui
        quando ele deixar contato pra receber o PDF.
      </p>
      <Link
        href="/simulador/"
        className="inline-flex items-center gap-2 bg-accent text-ink font-semibold px-5 py-2.5 rounded-md hover:bg-accent/90 transition-colors"
      >
        Criar cenário →
      </Link>
    </div>
  );
}
