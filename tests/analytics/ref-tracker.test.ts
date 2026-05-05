import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────
const insertCalls: unknown[] = [];
vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    from: (_table: string) => ({
      insert: (row: unknown) => {
        insertCalls.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

const trackCalls: Array<{ event: string; props: unknown }> = [];
vi.mock("@vercel/analytics", () => ({
  track: (event: string, props: unknown) => {
    trackCalls.push({ event, props });
  },
}));

const { extractRef, trackRefVisit } = await import(
  "@/lib/analytics/ref-tracker"
);

beforeEach(() => {
  insertCalls.length = 0;
  trackCalls.length = 0;
});

describe("extractRef", () => {
  it("retorna null quando não tem ?ref=", () => {
    expect(extractRef("")).toBeNull();
    expect(extractRef("?foo=bar")).toBeNull();
  });

  it("extrai ref válido", () => {
    expect(extractRef("?ref=marvin")).toBe("marvin");
  });

  it("ignora ref maior que 64 chars (sanity contra lixo)", () => {
    expect(extractRef(`?ref=${"a".repeat(65)}`)).toBeNull();
    expect(extractRef(`?ref=${"a".repeat(64)}`)).toBe("a".repeat(64));
  });
});

describe("trackRefVisit", () => {
  it("não dispara nada quando sem ref", async () => {
    await trackRefVisit("");
    expect(insertCalls).toHaveLength(0);
    expect(trackCalls).toHaveLength(0);
  });

  it("dispara Vercel track + insert no Supabase quando tem ref", async () => {
    await trackRefVisit("?ref=marvin");
    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0].event).toBe("ref_visit");
    expect((trackCalls[0].props as { ref: string }).ref).toBe("marvin");
    expect(insertCalls).toHaveLength(1);
    expect((insertCalls[0] as { ref: string }).ref).toBe("marvin");
  });

  it("ignora ref oversized", async () => {
    await trackRefVisit(`?ref=${"x".repeat(200)}`);
    expect(insertCalls).toHaveLength(0);
    expect(trackCalls).toHaveLength(0);
  });
});
