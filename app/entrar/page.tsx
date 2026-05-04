"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui/primitives";
import { signIn, AuthError } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";

export default function EntrarPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/meus-links/");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn({ email, password });
      router.push("/meus-links/");
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : "Erro ao entrar.";
      setError(msg);
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
          <h1 className="font-serif text-3xl text-ink mt-3">Entrar</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              autoFocus
              autoComplete="email"
            />
          </Field>

          <Field label="Senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <div className="bg-red-soft text-red text-[13px] px-3 py-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Entrando…" : "Entrar"}
          </Button>

          <div className="text-right">
            <Link
              href="/recuperar-senha/"
              className="text-[13px] text-ink-soft hover:text-ink underline"
            >
              Esqueci a senha
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-ink-soft mt-6">
          Não tem conta?{" "}
          <Link
            href="/cadastrar/"
            className="text-accent hover:text-accent/80 underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
