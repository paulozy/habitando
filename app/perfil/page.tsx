"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Upload, X } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { AppHeader } from "@/components/auth/app-header";
import {
  checkSlugAvailability,
  deleteLogo,
  normalizeSlug,
  uploadLogo,
  type SlugCheckResult,
} from "@/lib/branding/api";
import { updateProfile, AuthError } from "@/lib/auth/api";
import { useAuthStore } from "@/lib/auth/use-auth-store";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Habitando (gold)", hex: "#c9973a" },
  { name: "Azul", hex: "#1a56db" },
  { name: "Verde", hex: "#0d7a4e" },
  { name: "Vermelho", hex: "#b91c1c" },
  { name: "Roxo", hex: "#7c3aed" },
  { name: "Carvão", hex: "#0f1923" },
];

export default function PerfilPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [slug, setSlug] = React.useState("");
  const [slugCheck, setSlugCheck] = React.useState<SlugCheckResult | null>(null);
  const [color, setColor] = React.useState("#c9973a");
  const [tagline, setTagline] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Hidrata do profile
  React.useEffect(() => {
    if (profile) {
      setSlug(profile.slug ?? "");
      setColor(profile.cor_primaria ?? "#c9973a");
      setTagline(profile.tagline ?? "");
      setLogoUrl(profile.logo_url);
    }
  }, [profile]);

  // Auth guard
  React.useEffect(() => {
    if (status === "anonymous") router.replace("/entrar/");
  }, [status, router]);

  // Slug live-check (debounced)
  React.useEffect(() => {
    if (!profile) return;
    if (slug === (profile.slug ?? "")) {
      setSlugCheck(null);
      return;
    }
    if (slug.trim() === "") {
      setSlugCheck(null);
      return;
    }
    const handle = window.setTimeout(async () => {
      const result = await checkSlugAvailability(slug, profile.id);
      setSlugCheck(result);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [slug, profile]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLogoUploading(true);
    setError(null);
    try {
      const newUrl = await uploadLogo(file, profile.id);
      // Limpa o anterior (best-effort)
      if (logoUrl) {
        void deleteLogo(logoUrl);
      }
      setLogoUrl(newUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao fazer upload.",
      );
    } finally {
      setLogoUploading(false);
      // Reset input pra permitir re-upload do mesmo arquivo
      e.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    if (logoUrl) void deleteLogo(logoUrl);
    setLogoUrl(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Bloqueia salvar se slug está em estado inválido (mas permite null/empty)
    if (slug.trim() !== "" && slugCheck && !slugCheck.ok) {
      setError(slugCheck.message ?? "Slug inválido.");
      return;
    }

    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const updated = await updateProfile(profile.id, {
        slug: slug.trim() === "" ? null : slug.trim(),
        cor_primaria: color,
        tagline: tagline.trim() === "" ? null : tagline.trim(),
        logo_url: logoUrl,
      });
      setProfile(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || !profile) {
    return (
      <div className="min-h-full flex items-center justify-center text-ink-soft">
        Carregando…
      </div>
    );
  }

  const slugOk =
    slug.trim() === "" || slug === profile.slug || (slugCheck?.ok ?? false);

  return (
    <div className="min-h-full bg-paper">
      <AppHeader />

      <main className="max-w-[900px] mx-auto px-6 md:px-10 py-10">
        <h1 className="font-serif text-3xl md:text-4xl text-ink mb-2">
          Perfil & Marca
        </h1>
        <p className="text-ink-soft text-sm mb-8 max-w-xl">
          Configure como o cliente vê seu link compartilhado: URL personalizada,
          logo da imobiliária e cor da marca.
        </p>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Identidade básica (read-only por enquanto) */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl text-ink mb-4">Identidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome">
                <Input value={profile.nome} disabled />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={profile.whatsapp ?? "—"}
                  disabled
                  className="font-mono"
                />
              </Field>
            </div>
            <p className="text-[11.5px] text-ink-muted mt-3">
              Edição de nome/WhatsApp em breve. Por enquanto, define no
              cadastro.
            </p>
          </section>

          {/* URL personalizada */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl text-ink mb-1">URL personalizada</h2>
            <p className="text-ink-soft text-[13px] mb-4">
              Vira parte do link que você manda pro cliente. Use o nome da sua
              imobiliária ou seu nome.
            </p>

            <Field
              label="Slug"
              hint="3-30 caracteres, letras minúsculas, números e hífens"
            >
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-md bg-paper-alt text-ink-soft text-sm font-mono shrink-0">
                  habitando.app/c/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                  placeholder="joao-imoveis"
                  className={cn(
                    "rounded-l-none font-mono",
                    slug !== "" &&
                      !slugOk &&
                      "border-red focus-visible:ring-red",
                  )}
                  maxLength={30}
                />
              </div>
            </Field>

            {slugCheck && (
              <div
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1 rounded-full",
                  slugCheck.ok
                    ? "bg-green-soft text-green"
                    : "bg-red-soft text-red",
                )}
              >
                {slugCheck.ok ? (
                  <>
                    <Check className="h-3 w-3" /> Disponível
                  </>
                ) : (
                  slugCheck.message
                )}
              </div>
            )}

            <p className="text-[11.5px] text-amber mt-3">
              ⚠️ Mudar o slug quebra links já compartilhados. Escolha com cuidado.
            </p>
          </section>

          {/* Logo */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl text-ink mb-1">Logo</h2>
            <p className="text-ink-soft text-[13px] mb-4">
              PNG ou WebP, max 1 MB (resize automático pra 512px). Aparece no
              header do simulador e na capa do PDF.
            </p>

            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-[120px] h-[120px] rounded-lg border border-border bg-paper-alt flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Seu logo"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-ink-muted">Sem logo</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className={cn(
                    "inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium",
                    "bg-card border border-border text-ink hover:bg-paper-alt cursor-pointer",
                    logoUploading && "opacity-50 pointer-events-none",
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {logoUploading
                    ? "Enviando…"
                    : logoUrl
                      ? "Trocar logo"
                      : "Enviar logo"}
                  <input
                    type="file"
                    accept="image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft hover:text-red"
                  >
                    <X className="h-3 w-3" />
                    Remover
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Cor primária */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl text-ink mb-1">Cor primária</h2>
            <p className="text-ink-soft text-[13px] mb-4">
              Substitui o dourado do Habitando nos elementos accent (botões,
              destaques) quando o cliente abre seu link.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className="font-mono w-32"
              />
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              {COLOR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.hex}
                  onClick={() => setColor(p.hex)}
                  title={p.name}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    color === p.hex
                      ? "border-ink"
                      : "border-border",
                  )}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
          </section>

          {/* Tagline */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl text-ink mb-1">Tagline</h2>
            <p className="text-ink-soft text-[13px] mb-4">
              Frase curta que aparece abaixo do nome no header. Ex: "Imóveis no
              Centro de SP".
            </p>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Imóveis na zona oeste"
              maxLength={80}
            />
            <p className="text-[11px] text-ink-muted mt-1">
              {tagline.length}/80
            </p>
          </section>

          {/* Salvar */}
          <div className="flex items-center gap-3 sticky bottom-0 bg-paper py-4 border-t border-border">
            <Button type="submit" disabled={busy} className="px-6">
              {busy ? "Salvando…" : "Salvar"}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-green">
                <Check className="h-3.5 w-3.5" /> Salvo
              </span>
            )}
            {error && (
              <span className="text-[13px] text-red">{error}</span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
