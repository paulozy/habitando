"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, LogIn, LogOut, Palette, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives";
import { signOut } from "@/lib/auth/api";
import { useAuthStore, type Profile } from "@/lib/auth/use-auth-store";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import type { CorretorIdentity } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { CorretorIdentityForm } from "@/components/share/corretor-identity-form";

/**
 * Identity Slot — único controle no canto superior direito do header.
 * Muda de forma conforme o estado do usuário:
 *
 * 1. Anônimo sem identidade → botão "Entrar" outline → popover com
 *    Cadastrar / Entrar / Continuar sem conta
 * 2. Anônimo + identidade local → pill com inicial → popover com
 *    "Criar conta para salvar" (CTA conversão) + Editar/Limpar
 * 3. Autenticado → chip filled → dropdown com nome+email, Meus links, Sair
 */
export function HeaderIdentitySlot() {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const own = useCorretorStore((s) => s.own);
  const clearOwn = useCorretorStore((s) => s.clearOwn);

  const [identityFormOpen, setIdentityFormOpen] = React.useState(false);

  if (status === "loading") {
    return <SkeletonChip />;
  }

  if (status === "authenticated" && profile) {
    return (
      <AuthedSlot
        profile={profile}
        email={session?.user.email ?? null}
      />
    );
  }

  if (own) {
    return (
      <>
        <PartialSlot
          own={own}
          onEdit={() => setIdentityFormOpen(true)}
          onClear={clearOwn}
        />
        <CorretorIdentityForm
          open={identityFormOpen}
          onClose={() => setIdentityFormOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <AnonymousSlot onContinueAnon={() => setIdentityFormOpen(true)} />
      <CorretorIdentityForm
        open={identityFormOpen}
        onClose={() => setIdentityFormOpen(false)}
      />
    </>
  );
}

/* ============================================================
 *  Estado 1 — Anônimo sem identidade
 * ============================================================ */
function AnonymousSlot({ onContinueAnon }: { onContinueAnon: () => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium",
            "border border-white/20 text-white hover:bg-white/10 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px]">
        <Link
          href="/cadastrar/"
          className={cn(
            "flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-semibold",
            "bg-accent text-ink hover:bg-accent/90 transition-colors",
          )}
          onClick={() => setOpen(false)}
        >
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5" />
            Cadastrar grátis
          </span>
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/entrar/"
          className="flex items-center gap-2 rounded-md px-3 py-2 mt-1 text-sm text-ink hover:bg-paper-alt transition-colors"
          onClick={() => setOpen(false)}
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar
        </Link>
        <div className="my-1.5 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onContinueAnon();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-ink-soft hover:bg-paper-alt transition-colors"
        >
          Continuar sem conta
        </button>
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================
 *  Estado 2 — Anônimo com identidade local
 * ============================================================ */
function PartialSlot({
  own,
  onEdit,
  onClear,
}: {
  own: CorretorIdentity;
  onEdit: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Identidade anônima: ${own.nome}`}
          className={cn(
            "inline-flex items-center gap-2 pl-1.5 pr-2.5 h-8 rounded-md text-sm font-medium",
            "border border-white/20 text-white hover:bg-white/10 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          <InitialDot nome={own.nome} />
          <span className="max-w-[120px] truncate">{firstName(own.nome)}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px]">
        <Link
          href="/cadastrar/"
          className={cn(
            "flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-semibold",
            "bg-accent text-ink hover:bg-accent/90 transition-colors",
          )}
          onClick={() => setOpen(false)}
        >
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-3.5 w-3.5" />
            Criar conta para salvar
          </span>
          <span aria-hidden>→</span>
        </Link>
        <p className="px-3 pb-1 pt-1 text-[11.5px] text-ink-muted leading-relaxed">
          Sem conta, seus links somem se você limpar o navegador.
        </p>
        <Link
          href="/entrar/"
          className="flex items-center gap-2 rounded-md px-3 py-2 mt-1 text-sm text-ink hover:bg-paper-alt transition-colors"
          onClick={() => setOpen(false)}
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar
        </Link>
        <div className="my-1.5 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onEdit();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-paper-alt transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar identidade
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClear();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-red-soft hover:text-red transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar identidade
        </button>
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================
 *  Estado 3 — Autenticado
 * ============================================================ */
function AuthedSlot({
  profile,
  email,
}: {
  profile: Profile;
  email: string | null;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`${profile.nome} — abrir menu`}
          className={cn(
            "inline-flex items-center gap-2 pl-1.5 pr-2.5 h-8 rounded-md text-sm font-medium",
            "bg-white/10 border border-transparent text-white hover:bg-white/15 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          <InitialDot nome={profile.nome} variant="filled" />
          <span className="max-w-[120px] truncate">{firstName(profile.nome)}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]">
        <DropdownMenuLabel className="px-3 pt-2 pb-1">
          <div className="text-sm font-medium text-ink truncate">
            {profile.nome}
          </div>
          {email && (
            <div className="text-[11.5px] text-ink-muted truncate font-mono">
              {email}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/meus-links/")}>
          <ExternalLink className="h-3.5 w-3.5" />
          Meus links
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/perfil/")}>
          <Palette className="h-3.5 w-3.5" />
          Perfil & Marca
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-ink-soft hover:bg-red-soft hover:text-red focus:bg-red-soft focus:text-red"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================================================
 *  Pieces
 * ============================================================ */
function SkeletonChip() {
  return (
    <div
      aria-hidden
      className="h-8 w-20 rounded-md bg-white/10 animate-pulse"
    />
  );
}

function InitialDot({
  nome,
  variant = "outline",
}: {
  nome: string;
  variant?: "outline" | "filled";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold leading-none",
        variant === "filled"
          ? "bg-accent text-ink"
          : "bg-accent/20 text-accent border border-accent/40",
      )}
    >
      {firstInitial(nome)}
    </span>
  );
}

function firstInitial(nome: string): string {
  const match = nome.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : "?";
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
