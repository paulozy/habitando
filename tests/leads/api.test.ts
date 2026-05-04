import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Filas de mock ───────────────────────────────────────────────
const insertResults: Array<{
  data: { id: string } | null;
  error: { code?: string; message?: string } | null;
}> = [];
const selectMaybeResults: Array<{
  data: { id: string } | null;
  error: { message?: string } | null;
}> = [];
const updateResults: Array<{ error: { message?: string } | null }> = [];
const listResults: Array<{
  data: unknown[] | null;
  error: { message?: string } | null;
}> = [];

const insertCalls: unknown[] = [];

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    from: (_table: string) => ({
      insert: (row: unknown) => {
        insertCalls.push(row);
        return {
          select: () => ({
            single: () =>
              Promise.resolve(
                insertResults.shift() ?? { data: { id: "new" }, error: null },
              ),
          }),
        };
      },
      select: (_cols: string) => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve(
                selectMaybeResults.shift() ?? { data: null, error: null },
              ),
          }),
          order: () =>
            Promise.resolve(
              listResults.shift() ?? { data: [], error: null },
            ),
        }),
        in: () =>
          Promise.resolve(
            listResults.shift() ?? { data: [], error: null },
          ),
      }),
      update: (_patch: unknown) => ({
        eq: () =>
          Promise.resolve(updateResults.shift() ?? { error: null }),
      }),
    }),
  }),
}));

const { submitLead, listLeadsForShare, countLeadsByShare, LeadError } =
  await import("@/lib/leads/api");

beforeEach(() => {
  insertResults.length = 0;
  selectMaybeResults.length = 0;
  updateResults.length = 0;
  listResults.length = 0;
  insertCalls.length = 0;
});

describe("submitLead", () => {
  it("rejeita quando consent não é true", async () => {
    await expect(
      submitLead({
        shareId: "abc",
        ownerId: "u-1",
        whatsapp: "5511999998888",
        consentLgpd: false,
      }),
    ).rejects.toThrow(/concordar/);
  });

  it("rejeita quando nem email nem whatsapp informado", async () => {
    await expect(
      submitLead({
        shareId: "abc",
        ownerId: "u-1",
        consentLgpd: true,
      }),
    ).rejects.toThrow(/e-mail ou WhatsApp/i);
  });

  it("normaliza email (lowercase) e whatsapp (só dígitos)", async () => {
    insertResults.push({ data: { id: "lead-1" }, error: null });
    await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      email: "  Foo@BAR.com  ",
      consentLgpd: true,
    });
    const inserted = insertCalls[0] as { email: string; whatsapp: string | null };
    expect(inserted.email).toBe("foo@bar.com");
    expect(inserted.whatsapp).toBeNull();
  });

  it("envia whatsapp limpo (só dígitos) quando passado", async () => {
    insertResults.push({ data: { id: "lead-1" }, error: null });
    await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      whatsapp: "(11) 99999-8888",
      consentLgpd: true,
    });
    const inserted = insertCalls[0] as { email: string | null; whatsapp: string };
    expect(inserted.whatsapp).toBe("11999998888");
    expect(inserted.email).toBeNull();
  });

  it("retorna id do lead em happy path", async () => {
    insertResults.push({ data: { id: "lead-xyz" }, error: null });
    const result = await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      email: "a@b.com",
      consentLgpd: true,
    });
    expect(result.id).toBe("lead-xyz");
  });

  it("trata duplicate (23505) atualizando lead existente", async () => {
    // Insert falha com 23505
    insertResults.push({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });
    // Lookup do existente
    selectMaybeResults.push({ data: { id: "lead-existing" }, error: null });
    // Update silencioso
    updateResults.push({ error: null });
    const result = await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      email: "a@b.com",
      consentLgpd: true,
    });
    expect(result.id).toBe("lead-existing");
  });

  it("propaga erro genérico do Supabase", async () => {
    insertResults.push({
      data: null,
      error: { code: "42501", message: "RLS denied" },
    });
    await expect(
      submitLead({
        shareId: "abc",
        ownerId: "u-1",
        email: "a@b.com",
        consentLgpd: true,
      }),
    ).rejects.toThrow(LeadError);
  });
});

describe("listLeadsForShare", () => {
  it("retorna vazio quando shareId vazio", async () => {
    const result = await listLeadsForShare("");
    expect(result).toEqual([]);
  });

  it("retorna leads ordenados", async () => {
    listResults.push({
      data: [
        { id: "l1", share_id: "abc", nome: "Maria", email: "m@b.com" },
      ],
      error: null,
    });
    const result = await listLeadsForShare("abc");
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("Maria");
  });
});

describe("countLeadsByShare", () => {
  it("retorna {} quando lista vazia", async () => {
    const result = await countLeadsByShare([]);
    expect(result).toEqual({});
  });

  it("agrupa contagens por share_id", async () => {
    listResults.push({
      data: [
        { share_id: "a" },
        { share_id: "a" },
        { share_id: "b" },
      ],
      error: null,
    });
    const result = await countLeadsByShare(["a", "b"]);
    expect(result.a).toBe(2);
    expect(result.b).toBe(1);
  });
});
