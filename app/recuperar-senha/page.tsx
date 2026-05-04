"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Field, Input } from "@/components/ui/primitives";
import { requestPasswordReset, AuthError } from "@/lib/auth/api";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Erro ao enviar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12 bg-paper">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80"
          >
            Habitando
          </Link>
          <h1 className="font-serif text-3xl text-ink mt-3">Recuperar senha</h1>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3 shadow-sm">
            <div className="text-3xl" aria-hidden>📧</div>
            <p className="text-ink font-medium">E-mail enviado</p>
            <p className="text-ink-soft text-sm">
              Se o e-mail existe na nossa base, você vai receber um link pra
              criar uma nova senha. Confere a caixa de entrada (e o spam).
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
          >
            <Field label="E-mail da conta">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoFocus
              />
            </Field>

            {error && (
              <div className="bg-red-soft text-red text-[13px] px-3 py-2 rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-ink-soft mt-6">
          <Link
            href="/entrar/"
            className="text-accent hover:text-accent/80 underline"
          >
            Voltar pro login
          </Link>
        </p>
      </div>
    </div>
  );
}
