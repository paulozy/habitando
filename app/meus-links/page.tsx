"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, LogOut, Mail, MessageCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { listOwnedShares, signOut } from "@/lib/auth/api";
import { countLeadsByShare, listLeadsForShare, type LeadRow } from "@/lib/leads/api";
import {
  extractClienteSummary,
  extractSnapshotScenarios,
  relativeTime,
} from "@/lib/leads/utils";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { encodeScenarios, migrarPayload, type CorretorIdentity } from "@/lib/url-state";
import type { Scenario } from "@/lib/storage/use-scenarios-store";
import { fmt } from "@/lib/calculation-engine";

interface ShareRow {
  id: string;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

interface ShareDecoded {
  id: string;
  scenarios: Scenario[];
  corretor?: CorretorIdentity;
  created_at: string;
  updated_at: string;
}

export default function MeusLinksPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  const [shares, setShares] = React.useState<ShareDecoded[] | null>(null);
  const [leadCounts, setLeadCounts] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Redireciona pra /entrar se não autenticado
  React.useEffect(() => {
    if (status === "anonymous") router.replace("/entrar/");
  }, [status, router]);

  // Busca shares do usuário (RLS já filtra: select all retorna só os que
  // dá pra ver. Aqui filtramos por owner_id pra ser explícito.)
  React.useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listOwnedShares()
      .then(async (rows) => {
        if (cancelled) return;
        const decoded = decodeRows(rows);
        setShares(decoded);
        // Conta leads em paralelo
        try {
          const counts = await countLeadsByShare(decoded.map((s) => s.id));
          if (!cancelled) setLeadCounts(counts);
        } catch {
          /* leads são opcionais; mostra a página sem badge se falhar */
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Erro ao carregar.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (status === "loading" || status === "anonymous") {
    return (
      <div className="min-h-full flex items-center justify-center text-ink-soft">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper">
      <header className="bg-ink text-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80"
            >
              Habitando
            </Link>
            <Link
              href="/simulador/"
              className="text-sm text-white/80 hover:text-white"
            >
              Novo cenário →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <span className="text-sm text-white/80">
                {profile.nome}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 md:px-10 py-10">
        <h1 className="font-serif text-3xl md:text-4xl text-ink mb-2">
          Meus links
        </h1>
        <p className="text-ink-soft text-sm mb-8">
          Cenários que você compartilhou. Quando o cliente edita, o estado é
          atualizado aqui automaticamente.
        </p>

        {error && (
          <div className="bg-red-soft text-red text-[13px] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {shares === null ? (
          <div className="text-ink-soft text-sm">Carregando seus links…</div>
        ) : shares.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {shares.map((s) => (
              <ShareCard
                key={s.id}
                share={s}
                leadCount={leadCounts[s.id] ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ShareCard({
  share,
  leadCount,
}: {
  share: ShareDecoded;
  leadCount: number;
}) {
  const primary = share.scenarios[0];
  const updatedAt = new Date(share.updated_at);
  const updatedRel = relativeTime(updatedAt);
  const created = new Date(share.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-ink-soft transition-colors space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink text-[15px] mb-1 truncate">
            {primary?.config.rotulo ?? "(sem nome)"}
          </div>
          <div className="text-[12.5px] text-ink-muted flex items-center gap-2 flex-wrap font-mono">
            <span>{share.scenarios.length} cenário(s)</span>
            <span aria-hidden>·</span>
            <span>criado em {created}</span>
            <span aria-hidden>·</span>
            <span>atualizado {updatedRel}</span>
          </div>
        </div>
        <Link
          href={`/simulador/?c=${share.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80"
        >
          Abrir
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {leadCount > 0 && <LeadsDrawer shareId={share.id} count={leadCount} />}
    </div>
  );
}

function LeadsDrawer({ shareId, count }: { shareId: string; count: number }) {
  const [open, setOpen] = React.useState(false);
  const [leads, setLeads] = React.useState<LeadRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || leads !== null) return;
    let cancelled = false;
    listLeadsForShare(shareId)
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Erro");
      });
    return () => {
      cancelled = true;
    };
  }, [open, leads, shareId]);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-md border border-accent/30 bg-accent/5 overflow-hidden"
    >
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-accent/10 transition-colors">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
          <Target className="h-3.5 w-3.5 text-accent" />
          {count} {count === 1 ? "lead capturado" : "leads capturados"}
        </span>
        <span
          aria-hidden
          className="text-ink-muted text-xs transition-transform"
        >
          {open ? "▲" : "▼"}
        </span>
      </summary>
      <div className="border-t border-accent/20 px-4 py-3 space-y-2">
        {error && (
          <div className="text-[12.5px] text-red">{error}</div>
        )}
        {leads === null && !error && (
          <div className="text-[12.5px] text-ink-soft">Carregando…</div>
        )}
        {leads && leads.length === 0 && (
          <div className="text-[12.5px] text-ink-soft">
            Sem leads (estranho — recarregue a página).
          </div>
        )}
        {leads?.map((lead) => (
          <LeadItem key={lead.id} lead={lead} />
        ))}
      </div>
    </details>
  );
}

function LeadItem({ lead }: { lead: LeadRow }) {
  const created = relativeTime(new Date(lead.created_at));
  const summary = extractClienteSummary(lead.payload_snapshot);
  const snapshotScenarios = extractSnapshotScenarios(lead.payload_snapshot);

  const handleOpenSimulacao = () => {
    if (!snapshotScenarios) return;
    const encoded = encodeScenarios(snapshotScenarios);
    window.open(
      `${window.location.origin}/simulador/?s=${encoded}`,
      "_blank",
      "noopener",
    );
  };

  return (
    <div className="py-2.5 border-b border-accent/10 last:border-b-0 space-y-1.5">
      {/* Linha 1: nome + contato */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink text-[13.5px]">
            {lead.nome ?? "Sem nome"}
          </div>
          <div className="text-[11.5px] text-ink-muted">{created}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12.5px] text-green hover:text-green/80 font-mono"
              title="Abrir WhatsApp"
            >
              <MessageCircle className="h-3 w-3" />
              +{lead.whatsapp}
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1 text-[12.5px] text-blue hover:text-blue/80"
              title="Enviar e-mail"
            >
              <Mail className="h-3 w-3" />
              {lead.email}
            </a>
          )}
        </div>
      </div>

      {/* Linha 2: resumo do que cliente preencheu */}
      {summary && (
        <div className="flex items-center gap-3 flex-wrap text-[12px] text-ink-soft pl-0.5">
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
        </div>
      )}

      {/* Linha 3: cenário + botão "Ver simulação" */}
      <div className="flex items-center justify-between gap-3 flex-wrap pl-0.5">
        {summary?.nomeCenario && (
          <div className="text-[11.5px] text-ink-muted truncate max-w-[60%]">
            <span className="font-mono uppercase tracking-wide mr-1.5">
              cenário:
            </span>
            {summary.nomeCenario}
          </div>
        )}
        <button
          type="button"
          onClick={handleOpenSimulacao}
          disabled={!snapshotScenarios}
          className="inline-flex items-center gap-1 text-[12px] text-accent hover:text-accent/80 disabled:text-ink-muted disabled:cursor-not-allowed"
          title={
            snapshotScenarios
              ? "Abre o cenário no simulador (nova aba)"
              : "Snapshot indisponível"
          }
        >
          <Eye className="h-3 w-3" />
          Ver simulação
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
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
        🔗
      </div>
      <h2 className="font-serif text-xl text-ink mb-2">
        Você ainda não compartilhou nenhum cenário
      </h2>
      <p className="text-ink-soft text-sm mb-5 max-w-sm mx-auto">
        Crie um cenário no simulador, configure os números e clique em
        Compartilhar pra gerar um link pro seu cliente.
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

function decodeRows(rows: ShareRow[]): ShareDecoded[] {
  const out: ShareDecoded[] = [];
  for (const row of rows) {
    const result = migrarPayload(row.payload);
    if (!result.ok || !result.scenarios) continue;
    out.push({
      id: row.id,
      scenarios: result.scenarios,
      corretor: result.corretor,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
  return out;
}
