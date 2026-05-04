"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { Profile } from "./use-auth-store";

export class AuthError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

interface SignUpInput {
  email: string;
  password: string;
  nome: string;
  whatsapp?: string;
}

/**
 * Cria conta. O trigger `on_auth_user_created` no Postgres lê
 * `raw_user_meta_data` e cria a row em `profiles`.
 *
 * Throw em caso de erro (email já existe, senha fraca, etc.) — UI
 * traduz pra mensagem amigável.
 */
export async function signUp(input: SignUpInput): Promise<{ userId: string }> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        nome: input.nome.trim(),
        ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
      },
    },
  });
  if (error) throw new AuthError(translateAuthError(error.message), error);
  if (!data.user) throw new AuthError("Falha ao criar conta.");
  return { userId: data.user.id };
}

interface SignInInput {
  email: string;
  password: string;
}

export async function signIn(input: SignInInput): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  if (error) throw new AuthError(translateAuthError(error.message), error);
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw new AuthError("Falha ao sair.", error);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const sb = getSupabase();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback/`
      : undefined;
  const { error } = await sb.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) throw new AuthError("Não foi possível enviar o e-mail.", error);
}

/** Atualiza a senha do usuário logado (usado após reset password). */
export async function updatePassword(newPassword: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError(translateAuthError(error.message), error);
}

/**
 * Busca o profile do usuário. Tenta com retry pequeno porque o trigger
 * `handle_new_user` é assíncrono — pode dar 404 logo após signup.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new AuthError("Erro ao carregar perfil.", error);
    if (data) return data as Profile;
    if (attempt < MAX_ATTEMPTS) {
      // Trigger ainda processando — espera 300ms × attempt
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "nome" | "whatsapp" | "slug">>,
): Promise<Profile> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new AuthError("Erro ao atualizar perfil.", error);
  return data as Profile;
}

/**
 * Vincula um share existente sem dono ao usuário logado.
 * Falha silenciosamente se o share já tiver dono ou não existir
 * (RLS bloqueia o update — retorna 0 rows afetadas).
 */
export async function claimShare(shareId: string): Promise<boolean> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("shares")
    .update({ owner_id: (await sb.auth.getUser()).data.user?.id })
    .eq("id", shareId)
    .is("owner_id", null)
    .select("id")
    .maybeSingle();
  if (error) throw new AuthError("Erro ao vincular link.", error);
  return data !== null;
}

/**
 * Lista shares do usuário logado, mais recentes primeiro.
 */
export async function listOwnedShares(): Promise<
  Array<{
    id: string;
    payload: unknown;
    created_at: string;
    updated_at: string;
  }>
> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("shares")
    .select("id, payload, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new AuthError("Erro ao carregar links.", error);
  return data ?? [];
}

/**
 * Traduz mensagens conhecidas do Supabase Auth pra português.
 * Mensagens não-mapeadas passam pelo original.
 */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("user already registered")) return "Este e-mail já tem uma conta.";
  if (m.includes("password should be at least"))
    return "Senha muito curta — use pelo menos 6 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas. Espere 1 min e tente de novo.";
  if (m.includes("email") && m.includes("invalid")) return "E-mail inválido.";
  return msg;
}
