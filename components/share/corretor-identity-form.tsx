"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import {
  CorretorIdentitySchema,
  type CorretorIdentity,
} from "@/lib/url-state";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";

interface CorretorIdentityFormProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (identity: CorretorIdentity) => void;
}

/**
 * Modal simples para o corretor configurar sua identidade (nome + WhatsApp).
 * Salva em `useCorretorStore.own` e dispara `onSaved` em sucesso.
 */
export function CorretorIdentityForm({
  open,
  onClose,
  onSaved,
}: CorretorIdentityFormProps) {
  const own = useCorretorStore((s) => s.own);
  const setOwn = useCorretorStore((s) => s.setOwn);

  const [nome, setNome] = React.useState(own?.nome ?? "");
  const [whatsapp, setWhatsapp] = React.useState(own?.whatsapp ?? "");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setNome(own?.nome ?? "");
      setWhatsapp(own?.whatsapp ?? "");
      setError(null);
    }
  }, [open, own]);

  if (!open) return null;

  const handleSave = () => {
    const cleanWhats = whatsapp.replace(/\D/g, "");
    const candidate = { nome: nome.trim(), whatsapp: cleanWhats };
    const parsed = CorretorIdentitySchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    setOwn(parsed.data);
    onSaved?.(parsed.data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl text-ink mb-1">
              Sua identidade no link
            </h2>
            <p className="text-[13px] text-ink-soft leading-relaxed">
              Quando o cliente abrir o link, ele vê seu nome e tem um botão pra
              te devolver o cenário ajustado direto no WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 -m-1 shrink-0"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="corretor-nome">Seu nome</Label>
            <Input
              id="corretor-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              maxLength={60}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="corretor-whatsapp">WhatsApp</Label>
            <Input
              id="corretor-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex: 5511999999999"
              inputMode="tel"
            />
            <p className="text-[11.5px] text-ink-muted mt-1.5">
              Formato com DDI (55) + DDD + número. Pode digitar com espaços ou
              traços — vamos limpar.
            </p>
          </div>

          {error && (
            <div className="bg-red-soft text-red text-[12.5px] px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSave} className="flex-1">
              Salvar identidade
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
