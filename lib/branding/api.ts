"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { PublicBranding } from "./use-branding-store";

export class BrandingError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "BrandingError";
  }
}

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;
const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_MAX_DIMENSION = 512;
const LOGO_ALLOWED_MIME = ["image/png", "image/webp"] as const;

/* ============================================================
 *  Fetch — públicos (anon ok)
 * ============================================================ */

export async function fetchBrandingById(
  profileId: string,
): Promise<PublicBranding | null> {
  if (!profileId) return null;
  const sb = getSupabase();
  const { data, error } = await sb.rpc("get_public_branding", {
    profile_id: profileId,
  });
  if (error) throw new BrandingError("Erro ao carregar branding.", error);
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  // RPC retorna setof, então vem array; pegamos primeiro
  const row = Array.isArray(data) ? data[0] : data;
  return row as PublicBranding;
}

export async function fetchBrandingBySlug(
  slug: string,
): Promise<PublicBranding | null> {
  if (!slug) return null;
  const sb = getSupabase();
  const { data, error } = await sb.rpc("get_public_branding_by_slug", {
    _slug: slug,
  });
  if (error) throw new BrandingError("Erro ao carregar branding.", error);
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as PublicBranding;
}

/* ============================================================
 *  Slug
 * ============================================================ */

/**
 * Normaliza um slug:
 * - Strip diacritics (NFD): "joão" → "joao"
 * - Lowercase
 * - Spaces e múltiplos chars não-alfanum → hyphen único
 * - Remove hyphens leading/trailing
 */
export function normalizeSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlugFormat(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export interface SlugCheckResult {
  ok: boolean;
  reason?:
    | "format"
    | "reserved"
    | "taken"
    | "self"
    | "network";
  message?: string;
}

/**
 * Valida formato + disponibilidade. Retorna `self` se já é o slug do próprio
 * usuário (não conta como ocupado).
 */
export async function checkSlugAvailability(
  slug: string,
  currentUserId: string | null,
): Promise<SlugCheckResult> {
  if (!isValidSlugFormat(slug)) {
    return {
      ok: false,
      reason: "format",
      message: "Use 3 a 30 letras minúsculas, números ou hífens.",
    };
  }

  try {
    const existing = await fetchBrandingBySlug(slug);
    if (!existing) return { ok: true };
    if (currentUserId && existing.id === currentUserId) {
      return { ok: true, reason: "self" };
    }
    return {
      ok: false,
      reason: "taken",
      message: "Esse slug já está em uso.",
    };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Não foi possível verificar agora. Tente de novo.",
    };
  }
}

/* ============================================================
 *  Upload de logo
 * ============================================================ */

/**
 * Resize via canvas pra max 512px no lado maior, retorna Blob PNG.
 */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    1,
    LOGO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new BrandingError("Canvas indisponível.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new BrandingError("Erro ao processar imagem.")),
      "image/png",
      0.92,
    );
  });
}

/**
 * Upload do logo pro bucket `branding`. Path: `logos/<user_id>/<timestamp>.png`.
 * Retorna URL pública (CDN do Supabase).
 */
export async function uploadLogo(
  file: File,
  userId: string,
): Promise<string> {
  if (!LOGO_ALLOWED_MIME.includes(file.type as (typeof LOGO_ALLOWED_MIME)[number])) {
    throw new BrandingError(
      "Formato não suportado. Envie PNG ou WebP.",
    );
  }
  if (file.size > LOGO_MAX_BYTES * 2) {
    // Cap de segurança: arquivo gigante não vale resize
    throw new BrandingError(
      `Arquivo muito grande (max ${Math.round((LOGO_MAX_BYTES * 2) / 1024)} KB antes do resize).`,
    );
  }

  const blob = await resizeImage(file);
  if (blob.size > LOGO_MAX_BYTES) {
    throw new BrandingError(
      "Mesmo após resize ficou maior que 512KB. Use uma imagem mais simples.",
    );
  }

  const sb = getSupabase();
  const ts = Date.now();
  const path = `logos/${userId}/${ts}.png`;
  const { error } = await sb.storage
    .from("branding")
    .upload(path, blob, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw new BrandingError("Falha no upload.", error);

  const { data } = sb.storage.from("branding").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Remove um logo antigo (best-effort). Falha silenciosamente — não bloqueia
 * fluxo se a deleção falhar.
 */
export async function deleteLogo(publicUrl: string): Promise<void> {
  try {
    // Path é tudo depois de '/branding/' na URL pública
    const match = publicUrl.match(/\/branding\/(.+?)(\?|$)/);
    if (!match) return;
    const path = match[1];
    const sb = getSupabase();
    await sb.storage.from("branding").remove([path]);
  } catch {
    /* best effort */
  }
}
