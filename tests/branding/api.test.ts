import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks de filas ──────────────────────────────────────────────
const rpcResults: Array<{
  data: unknown;
  error: { message: string } | null;
}> = [];
const rpcCalls: Array<{ name: string; args: unknown }> = [];

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    rpc: (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      return Promise.resolve(
        rpcResults.shift() ?? { data: null, error: null },
      );
    },
  }),
}));

const {
  fetchBrandingById,
  fetchBrandingBySlug,
  normalizeSlug,
  isValidSlugFormat,
  checkSlugAvailability,
} = await import("@/lib/branding/api");

beforeEach(() => {
  rpcResults.length = 0;
  rpcCalls.length = 0;
});

describe("normalizeSlug", () => {
  it("strip diacritics + lowercase", () => {
    expect(normalizeSlug("João Silva")).toBe("joao-silva");
    expect(normalizeSlug("Imobiliária Ação")).toBe("imobiliaria-acao");
  });

  it("collapses multi non-alpha em hífen único", () => {
    expect(normalizeSlug("João  &  Cia")).toBe("joao-cia");
  });

  it("trim leading/trailing hyphens", () => {
    expect(normalizeSlug("--joao--")).toBe("joao");
    expect(normalizeSlug("___joao___")).toBe("joao");
  });

  it("vazio quando entrada é só não-alfanum", () => {
    expect(normalizeSlug("!@#$")).toBe("");
  });
});

describe("isValidSlugFormat", () => {
  it("aceita slugs válidos", () => {
    expect(isValidSlugFormat("joao")).toBe(true);
    expect(isValidSlugFormat("joao-silva")).toBe(true);
    expect(isValidSlugFormat("imobiliaria-do-joao")).toBe(true);
    expect(isValidSlugFormat("a1b2c3")).toBe(true);
  });

  it("rejeita curtos demais ou longos demais", () => {
    expect(isValidSlugFormat("ab")).toBe(false);
    expect(isValidSlugFormat("a".repeat(31))).toBe(false);
  });

  it("rejeita hífen no início ou fim", () => {
    expect(isValidSlugFormat("-joao")).toBe(false);
    expect(isValidSlugFormat("joao-")).toBe(false);
  });

  it("rejeita maiúsculas e caracteres especiais", () => {
    expect(isValidSlugFormat("Joao")).toBe(false);
    expect(isValidSlugFormat("joão")).toBe(false);
    expect(isValidSlugFormat("joao!")).toBe(false);
  });
});

describe("fetchBrandingById", () => {
  it("retorna branding quando user existe", async () => {
    rpcResults.push({
      data: [
        {
          id: "user-1",
          slug: "joao",
          nome: "João",
          logo_url: "https://x/y.png",
          cor_primaria: "#1a56db",
          tagline: "Imóveis SP",
        },
      ],
      error: null,
    });
    const result = await fetchBrandingById("user-1");
    expect(result?.nome).toBe("João");
    expect(result?.slug).toBe("joao");
    expect(rpcCalls[0].name).toBe("get_public_branding");
  });

  it("retorna null quando user não existe (data vazio)", async () => {
    rpcResults.push({ data: [], error: null });
    const result = await fetchBrandingById("user-x");
    expect(result).toBeNull();
  });

  it("propaga erro de rede", async () => {
    rpcResults.push({ data: null, error: { message: "network" } });
    await expect(fetchBrandingById("user-1")).rejects.toThrow(/branding/i);
  });
});

describe("fetchBrandingBySlug", () => {
  it("retorna branding quando slug existe", async () => {
    rpcResults.push({
      data: [
        {
          id: "user-1",
          slug: "joao",
          nome: "João",
          logo_url: null,
          cor_primaria: "#000000",
          tagline: null,
        },
      ],
      error: null,
    });
    const result = await fetchBrandingBySlug("joao");
    expect(result?.nome).toBe("João");
    expect(rpcCalls[0].name).toBe("get_public_branding_by_slug");
    expect((rpcCalls[0].args as { _slug: string })._slug).toBe("joao");
  });

  it("retorna null quando slug não existe", async () => {
    rpcResults.push({ data: [], error: null });
    expect(await fetchBrandingBySlug("nope")).toBeNull();
  });
});

describe("checkSlugAvailability", () => {
  it("ok=false quando formato inválido", async () => {
    const result = await checkSlugAvailability("ab", "user-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("format");
  });

  it("ok=true quando slug livre", async () => {
    rpcResults.push({ data: [], error: null });
    const result = await checkSlugAvailability("joao-silva", "user-1");
    expect(result.ok).toBe(true);
  });

  it("ok=false 'taken' quando outro user já tem o slug", async () => {
    rpcResults.push({
      data: [{ id: "outro-user", slug: "joao", nome: "Outro João" }],
      error: null,
    });
    const result = await checkSlugAvailability("joao", "user-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("taken");
  });

  it("ok=true 'self' quando é o slug do próprio user", async () => {
    rpcResults.push({
      data: [{ id: "user-1", slug: "joao", nome: "João" }],
      error: null,
    });
    const result = await checkSlugAvailability("joao", "user-1");
    expect(result.ok).toBe(true);
    expect(result.reason).toBe("self");
  });

  it("retorna 'network' quando RPC falha", async () => {
    rpcResults.push({ data: null, error: { message: "network" } });
    const result = await checkSlugAvailability("joao", "user-1");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("network");
  });
});
