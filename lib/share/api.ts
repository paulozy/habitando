"use client";

import { customAlphabet } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";
import {
  CorretorIdentitySchema,
  LATEST_SCHEMA_VERSION,
  migrarPayload,
  type CorretorIdentity,
  type SharePayload,
} from "@/lib/url-state";
import type { Scenario } from "@/lib/storage/use-scenarios-store";

const TABLE = "shares";

/**
 * URL-safe alphabet (A-Z, a-z, 0-9, sem caracteres ambíguos).
 * 10 chars = ~60 bits de entropia. Colisão a 1k/dia ≈ 1 em 30 anos.
 * Ref: https://github.com/ai/nanoid#api
 */
const generateId = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  10,
);

const MAX_COLLISION_RETRY = 3;

interface ShareRow {
  id: string;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

/**
 * Cria um novo share no Supabase. Tenta até 3 IDs em caso de colisão (PK).
 *
 * @returns o ID gerado
 * @throws com mensagem amigável em falha de rede ou config faltando
 */
export async function createShare(args: {
  scenarios: Scenario[];
  corretor?: CorretorIdentity;
  /** Se passado, vincula o share ao usuário autenticado. */
  ownerId?: string;
}): Promise<{ id: string }> {
  const sb = getSupabase();
  const payload: SharePayload = {
    v: LATEST_SCHEMA_VERSION,
    scenarios: args.scenarios,
    ...(args.corretor ? { corretor: args.corretor } : {}),
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_COLLISION_RETRY; attempt++) {
    const id = generateId();
    const insertRow: { id: string; payload: SharePayload; owner_id?: string } = {
      id,
      payload,
      ...(args.ownerId ? { owner_id: args.ownerId } : {}),
    };
    const { error } = await sb
      .from(TABLE)
      .insert(insertRow)
      .select("id")
      .single();

    if (!error) return { id };

    // 23505 = unique_violation (Postgres). Vamos retentar com novo ID.
    if (error.code === "23505") {
      lastError = error;
      continue;
    }

    // Outro erro — não vale retry.
    throw new ShareError(
      "Não foi possível criar o link de compartilhamento.",
      error,
    );
  }
  throw new ShareError(
    "Tentei 3 vezes e bateu colisão de ID. Tente de novo.",
    lastError,
  );
}

/**
 * Busca um share pelo ID. Retorna null se não existir (404).
 *
 * Roda o payload pelo pipeline de migração (`migrarPayload`) — links criados
 * em versões antigas continuam compatíveis automaticamente.
 */
export async function fetchShare(id: string): Promise<SharePayload | null> {
  if (!id || typeof id !== "string") return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("payload, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ShareError("Erro ao carregar o cenário.", error);
  }
  if (!data) return null;

  const result = migrarPayload(data.payload);
  if (!result.ok || !result.scenarios) return null;

  return {
    v: LATEST_SCHEMA_VERSION,
    scenarios: result.scenarios,
    ...(result.corretor ? { corretor: result.corretor } : {}),
  };
}

/**
 * Atualiza o payload de um share existente. Last-write-wins (sem optimistic
 * locking no MVP — improvável que corretor + cliente estejam editando ao
 * mesmo tempo).
 */
export async function updateSharePayload(
  id: string,
  args: { scenarios: Scenario[]; corretor?: CorretorIdentity },
): Promise<void> {
  if (!id) return;
  const sb = getSupabase();

  // Valida corretor antes de gravar (preprocess do schema normaliza WhatsApp).
  let corretorClean: CorretorIdentity | undefined;
  if (args.corretor) {
    const parsed = CorretorIdentitySchema.safeParse(args.corretor);
    if (parsed.success) corretorClean = parsed.data;
  }

  const payload: SharePayload = {
    v: LATEST_SCHEMA_VERSION,
    scenarios: args.scenarios,
    ...(corretorClean ? { corretor: corretorClean } : {}),
  };

  const { error } = await sb
    .from(TABLE)
    .update({ payload })
    .eq("id", id);

  if (error) {
    throw new ShareError("Não foi possível salvar as edições.", error);
  }
}

/** Retorna o `updated_at` do share — útil pra polling on focus do corretor. */
export async function getShareUpdatedAt(id: string): Promise<Date | null> {
  if (!id) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select("updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return new Date(data.updated_at);
}

export class ShareError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "ShareError";
  }
}

/** Re-export pra testes. */
export const _internal = { generateId, TABLE };
export type { ShareRow };
