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

  const { data, error } = await sb
    .from(TABLE)
    .upsert(row, {
      onConflict: "share_id,coalesce(email, whatsapp)",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (error) {
    // Fallback: alguns Postgrest setups não suportam expressões em onConflict.
    // Tenta insert direto; em duplicate, busca o existente.
    if (
      error.message?.includes("on conflict") ||
      error.code === "PGRST116" ||
      error.code === "42601"
    ) {
      return await fallbackUpsert(row);
    }
    throw new LeadError("Não foi possível salvar seu contato.", error);
  }
  return { id: data.id };
}

/**
 * Fallback se PostgREST não aceita expressão em onConflict:
 * insere → se 23505 (duplicate), busca existente e atualiza.
 */
async function fallbackUpsert(row: {
  share_id: string;
  email: string | null;
  whatsapp: string | null;
  [k: string]: unknown;
}): Promise<{ id: string }> {
  const sb = getSupabase();
  const { data: inserted, error: insertErr } = await sb
    .from(TABLE)
    .insert(row)
    .select("id")
    .single();
  if (!insertErr && inserted) return { id: inserted.id };

  if (insertErr?.code === "23505") {
    // Duplicate: busca por (share_id, email|whatsapp) e atualiza
    let q = sb.from(TABLE).select("id").eq("share_id", row.share_id);
    if (row.email) {
      q = q.eq("email", row.email);
    } else if (row.whatsapp) {
      q = q.eq("whatsapp", row.whatsapp);
    }
    const { data: existing, error: findErr } = await q.maybeSingle();
    if (findErr || !existing) {
      throw new LeadError("Contato já registrado mas não recuperável.");
    }
    const { error: updateErr } = await sb
      .from(TABLE)
      .update({
        nome: row.nome,
        consent_lgpd: row.consent_lgpd,
        user_agent: row.user_agent,
        payload_snapshot: row.payload_snapshot,
      })
      .eq("id", existing.id);
    if (updateErr) {
      throw new LeadError("Não foi possível atualizar o contato.", updateErr);
    }
    return { id: existing.id };
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
