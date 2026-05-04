"use client";

import { getSupabase } from "@/lib/supabase/client";

const TABLE = "leads";

export class LeadError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "LeadError";
  }
}

export type LeadStatus = "novo" | "respondido" | "ignorado";

export interface LeadRow {
  id: string;
  share_id: string;
  owner_id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  consent_lgpd: boolean;
  consent_at: string;
  user_agent: string | null;
  payload_snapshot: unknown;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

interface SubmitLeadInput {
  shareId: string;
  ownerId: string;
  nome?: string;
  email?: string;
  whatsapp?: string;
  consentLgpd: boolean;
  payloadSnapshot?: unknown;
}

/**
 * Insere ou atualiza lead. RLS valida consent + share/owner match.
 * Dedupe via unique index (share_id, coalesce(email, whatsapp)).
 *
 * Throw com mensagem amigável em violações conhecidas.
 */
export async function submitLead(input: SubmitLeadInput): Promise<{ id: string }> {
  if (!input.consentLgpd) {
    throw new LeadError("Você precisa concordar com o tratamento dos dados.");
  }
  const cleanEmail = input.email?.trim().toLowerCase() || null;
  const cleanWhats = input.whatsapp?.replace(/\D/g, "") || null;
  if (!cleanEmail && !cleanWhats) {
    throw new LeadError("Informe e-mail ou WhatsApp.");
  }

  const sb = getSupabase();
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : null;

  const row = {
    share_id: input.shareId,
    owner_id: input.ownerId,
    nome: input.nome?.trim() || null,
    email: cleanEmail,
    whatsapp: cleanWhats,
    consent_lgpd: input.consentLgpd,
    user_agent: userAgent,
    payload_snapshot: input.payloadSnapshot ?? null,
  };

  // Insert "fire-and-forget" — sem .select() porque anon não tem SELECT
  // em leads (RLS). PostgREST com returning=minimal evita o SELECT
  // implícito que dispararia 401.
  //
  // Se duplicate (unique index em coalesce(email, whatsapp)), tenta
  // update; se update também falhar (RLS), aceita silenciosamente —
  // lead já existe, UX cliente segue.
  const { error: insertErr } = await sb.from(TABLE).insert(row);

  if (!insertErr) return { id: "ok" };

  if (insertErr.code === "23505") {
    // Duplicate: tenta update. Anon tem UPDATE policy se share/owner
    // bate. Não retorna id (anon não consegue ler), mas isso não importa
    // pra UX do cliente (DoneCard não usa id).
    const updateQ = sb
      .from(TABLE)
      .update({
        nome: row.nome,
        consent_lgpd: row.consent_lgpd,
        user_agent: row.user_agent,
        payload_snapshot: row.payload_snapshot,
      })
      .eq("share_id", row.share_id);

    const finalQ = row.email
      ? updateQ.eq("email", row.email)
      : updateQ.eq("whatsapp", row.whatsapp ?? "");

    await finalQ; // ignora erros de update — duplicate já confirma que existe
    return { id: "existing" };
  }
  throw new LeadError(
    "Não foi possível salvar seu contato.",
    insertErr,
  );
}

/**
 * Lista leads de um share. Só funciona pra owner (RLS).
 */
export async function listLeadsForShare(
  shareId: string,
): Promise<LeadRow[]> {
  if (!shareId) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .eq("share_id", shareId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new LeadError("Erro ao carregar leads.", error);
  }
  return (data ?? []) as LeadRow[];
}

/**
 * Lista todos leads do owner logado, mais recentes primeiro.
 * Pra página /leads (workflow ativo do corretor).
 */
export async function listAllLeads(): Promise<LeadRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    throw new LeadError("Erro ao carregar leads.", error);
  }
  return (data ?? []) as LeadRow[];
}

/**
 * Atualiza o status de um lead (RLS garante owner_id = auth.uid()).
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<void> {
  if (!leadId) return;
  const sb = getSupabase();
  const { error } = await sb
    .from(TABLE)
    .update({ status })
    .eq("id", leadId);
  if (error) {
    throw new LeadError("Erro ao atualizar status do lead.", error);
  }
}

/**
 * Conta leads agrupados por share_id. Útil pra mostrar badge sem
 * carregar a lista completa.
 */
export async function countLeadsByShare(
  shareIds: string[],
): Promise<Record<string, number>> {
  if (shareIds.length === 0) return {};
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("share_id")
    .in("share_id", shareIds);
  if (error) {
    throw new LeadError("Erro ao contar leads.", error);
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { share_id: string }).share_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
