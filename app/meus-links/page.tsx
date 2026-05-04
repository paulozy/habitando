"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { listOwnedShares, signOut } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { migrarPayload, type CorretorIdentity } from "@/lib/url-state";
import type { Scenario } from "@/lib/storage/use-scenarios-store";

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
      .then((rows) => {
        if (cancelled) return;
        setShares(decodeRows(rows));
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
              <ShareCard key={s.id} share={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ShareCard({ share }: { share: ShareDecoded }) {
  const primary = share.scenarios[0];
  const updatedAt = new Date(share.updated_at);
  const updatedRel = relativeTime(updatedAt);
  const created = new Date(share.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-ink-soft transition-colors">
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
    </div>
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

function relativeTime(d: Date): string {
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "agora há pouco";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  return `há ${months} meses`;
}
