import { migrarPayload } from "@/lib/url-state";
import type { Scenario } from "@/lib/storage/use-scenarios-store";
import type { LeadRow } from "./api";

export interface ClienteSummary {
  rendaTotal: number;
  gastosFixos: number;
  atoValor: number;
  atoParcelas: number;
  nomeCenario: string | null;
}

/**
 * Extrai os campos editáveis pelo cliente (renda, gastos, ato) do
 * `payload_snapshot` do lead, pra renderizar resumo inline.
 *
 * Lê o primeiro cenário do snapshot — se houver múltiplos, o resumo
 * representa o "principal" que o cliente viu.
 */
export function extractClienteSummary(
  snapshot: unknown,
): ClienteSummary | null {
  try {
    const sn = snapshot as { scenarios?: Array<{ config?: unknown }> };
    if (!sn?.scenarios || sn.scenarios.length === 0) return null;
    const config = sn.scenarios[0].config as {
      rotulo?: string;
      renda?: {
        compradores?: Array<{ renda_liquida?: number }>;
        outros_rendimentos?: number;
      };
      gastos?: { gastos_fixos_mensais?: number };
      entrada?: { ato?: { valor_total?: number; parcelas?: number } };
    };
    if (!config) return null;

    const compradores = config.renda?.compradores ?? [];
    const rendaSoma = compradores.reduce(
      (a, c) => a + (c.renda_liquida ?? 0),
      0,
    );
    const rendaTotal = rendaSoma + (config.renda?.outros_rendimentos ?? 0);
    const gastosFixos = config.gastos?.gastos_fixos_mensais ?? 0;
    const atoValor = config.entrada?.ato?.valor_total ?? 0;
    const atoParcelas = config.entrada?.ato?.parcelas ?? 1;

    return {
      rendaTotal,
      gastosFixos,
      atoValor,
      atoParcelas,
      nomeCenario: config.rotulo ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai a array de scenarios do snapshot, validando via `migrarPayload`.
 * Retorna null se snapshot for inválido ou ausente.
 */
export function extractSnapshotScenarios(
  snapshot: unknown,
): Scenario[] | null {
  if (!snapshot) return null;
  // Snapshot foi gravado como { scenarios }. migrarPayload aceita
  // payload sem `v` — validação lenient tenta cada cenário.
  const wrapped = (snapshot as { scenarios?: unknown }).scenarios
    ? snapshot
    : { scenarios: [] };
  const result = migrarPayload(wrapped);
  if (!result.ok || !result.scenarios || result.scenarios.length === 0) {
    return null;
  }
  return result.scenarios;
}

/**
 * Tempo relativo em pt-BR.
 */
export function relativeTime(d: Date): string {
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

/**
 * Template padrão da mensagem de resposta rápida ao lead. Interpola:
 * - `{nome}` → primeiro nome do lead (ou "tudo bem" se sem nome)
 * - `{link}` → URL do cenário
 * - `{corretor}` → nome do corretor logado
 */
export const LEAD_REPLY_TEMPLATE = `Olá {nome}! Preparei uma simulação ajustada pro seu perfil. Confere aqui:
{link}

Qualquer dúvida, é só me chamar.
— {corretor}`;

export function buildLeadMessage(
  lead: Pick<LeadRow, "nome">,
  link: string,
  corretorNome: string,
): string {
  const primeiroNome =
    lead.nome?.trim().split(/\s+/)[0] ?? "tudo bem";
  return LEAD_REPLY_TEMPLATE.replace("{nome}", primeiroNome)
    .replace("{link}", link)
    .replace("{corretor}", corretorNome);
}
