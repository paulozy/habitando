"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, Input } from "@/components/ui/primitives";
import { updatePassword, AuthError } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Página de callback usada por:
 * - Reset de senha (link do email vem com `type=recovery`)
 * - OAuth futuro (Google etc.)
 *
 * Em static export, é um page client. O Supabase JS detecta token no hash
 * automaticamente (detectSessionInUrl: true) — só precisamos esperar a
 * sessão ser estabelecida antes de oferecer ações.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CallbackContent />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-full flex items-center justify-center text-ink-soft">
      Carregando…
    </div>
  );
}

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);

  // Detecta se é fluxo de recovery: hash contém `type=recovery` ou query.
  const [isRecovery, setIsRecovery] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const isRec =
      hash.includes("type=recovery") || params.get("type") === "recovery";
    setIsRecovery(isRec);

    // Quando autenticado E não é recovery → manda pra home logada
    if (status === "authenticated" && !isRec) {
      router.replace("/meus-links/");
    }
  }, [status, params, router]);

  if (isRecovery) return <ResetPasswordForm />;
  if (status === "loading") return <Loading />;
  if (!session) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md text-center space-y-3">
          <p className="text-ink font-medium">Link inválido ou expirado</p>
          <p className="text-ink-soft text-sm">
            Tenta novamente pelo formulário abaixo.
          </p>
          <a
            href="/entrar/"
            className="text-accent underline hover:text-accent/80"
          >
            Voltar pro login
          </a>
        </div>
      </div>
    );
  }
  return <Loading />;
}

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Aguarda o Supabase processar o token recovery do hash
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);

  React.useEffect(() => {
    // Força o cliente a processar o hash
    if (typeof window !== "undefined" && window.location.hash) {
      void getSupabase().auth.getSession();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password);
      // Senha atualizada — manda pra home logada
      router.push("/meus-links/");
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : "Erro ao atualizar senha.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <Loading />;

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-paper">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-ink text-center mb-6">
          Nova senha
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          <Field
            label="Nova senha"
            hint="Mínimo 6 caracteres"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              minLength={6}
            />
          </Field>

          {!session && (
            <div className="bg-amber-soft text-amber text-[13px] px-3 py-2 rounded">
              Validando link… Se não funcionar, peça um novo email.
            </div>
          )}

          {error && (
            <div className="bg-red-soft text-red text-[13px] px-3 py-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" disabled={busy || !session} className="w-full">
            {busy ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
