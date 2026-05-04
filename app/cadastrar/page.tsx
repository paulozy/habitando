"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui/primitives";
import { signUp, AuthError } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { CorretorIdentitySchema } from "@/lib/url-state";

export default function CadastrarPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const corretorOwn = useCorretorStore((s) => s.own);

  const [nome, setNome] = React.useState(corretorOwn?.nome ?? "");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // WhatsApp prefilled do anônimo, removendo o DDI 55 já que mostramos +55 visualmente
  const [whatsapp, setWhatsapp] = React.useState(() => {
    const w = corretorOwn?.whatsapp ?? "";
    return w.startsWith("55") ? w.slice(2) : w;
  });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Já logado → redireciona pro /meus-links
  React.useEffect(() => {
    if (status === "authenticated") router.replace("/meus-links/");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nome.trim().length === 0) {
      setError("Digite seu nome.");
      return;
    }
    if (password.length < 6) {
      setError("Senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    // Valida WhatsApp via mesmo schema do compartilhamento (preprocess
    // adiciona +55 automaticamente)
    let whatsappNormalizado: string | undefined;
    if (whatsapp.trim().length > 0) {
      const parsed = CorretorIdentitySchema.safeParse({
        nome: nome.trim(),
        whatsapp,
      });
      if (!parsed.success) {
        setError(
          parsed.error.issues[0]?.message ?? "WhatsApp inválido.",
        );
        return;
      }
      whatsappNormalizado = parsed.data.whatsapp;
    }

    setBusy(true);
    try {
      await signUp({
        email,
        password,
        nome: nome.trim(),
        whatsapp: whatsappNormalizado,
      });
      // O AuthBootstrap pega a sessão e fetcha o profile.
      router.push("/meus-links/");
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : "Erro ao criar conta.";
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
          <h1 className="font-serif text-3xl text-ink mt-3">Crie sua conta</h1>
          <p className="text-ink-soft text-sm mt-2">
            Pra ter histórico de cenários compartilhados, sua marca no link e
            captura de leads (em breve).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          <Field label="Seu nome">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              maxLength={60}
              autoFocus
              required
            />
          </Field>

          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              autoComplete="email"
            />
          </Field>

          <Field
            label="Senha"
            hint="Mínimo 6 caracteres"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </Field>

          <Field
            label="WhatsApp (opcional)"
            hint="Cliente devolve o cenário pra esse número"
          >
            <div className="flex">
              <span
                className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-md bg-paper-alt text-ink-soft text-sm font-mono shrink-0"
                aria-hidden
              >
                🇧🇷 +55
              </span>
              <Input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11999998888"
                className="rounded-l-none"
              />
            </div>
          </Field>

          {error && (
            <div className="bg-red-soft text-red text-[13px] px-3 py-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Criando conta…" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-6">
          Já tem conta?{" "}
          <Link
            href="/entrar/"
            className="text-accent hover:text-accent/80 underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
