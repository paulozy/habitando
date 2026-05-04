"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { signOut } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { cn } from "@/lib/utils";

/**
 * Header padrão das páginas authed (/meus-links, /leads, /perfil).
 * Mostra navegação consistente entre as áreas internas + identidade
 * do corretor + sair.
 *
 * NÃO usado em /simulador, que tem header próprio com share controls,
 * scenario bar, etc.
 */
export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const items = [
    { label: "Simulador", href: "/simulador/" },
    { label: "Meus links", href: "/meus-links/" },
    { label: "Leads", href: "/leads/" },
    { label: "Perfil", href: "/perfil/" },
  ];

  return (
    <header className="bg-ink text-white">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <Link
            href="/"
            className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80 shrink-0"
          >
            Habitando
          </Link>
          <nav className="flex items-center gap-3 md:gap-5 flex-wrap">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href.endsWith("/") && pathname === item.href.slice(0, -1));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "text-white font-medium border-b-2 border-accent pb-0.5"
                      : "text-white/70 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {profile && (
            <span className="text-sm text-white/70 truncate max-w-[140px]">
              {profile.nome}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
