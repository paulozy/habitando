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
        // Insert é thenable diretamente — submitLead não chama .select()
        const result = insertResults.shift() ?? { error: null };
        return Promise.resolve(result);
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
        // Pra listAllLeads: select().order().limit()
        order: () => ({
          limit: () =>
            Promise.resolve(
              listResults.shift() ?? { data: [], error: null },
            ),
        }),
      }),
      update: (_patch: unknown) => {
        // Pode ser .update().eq() OR .update().eq().eq() (chained equals)
        const eqChain = {
          eq: () =>
            Object.assign(
              Promise.resolve(updateResults.shift() ?? { error: null }),
              {
                eq: () =>
                  Promise.resolve(
                    updateResults.shift() ?? { error: null },
                  ),
              },
            ),
        };
        return eqChain;
      },
    }),
  }),
}));

const {
  submitLead,
  listLeadsForShare,
  listAllLeads,
  updateLeadStatus,
  countLeadsByShare,
  LeadError,
} = await import("@/lib/leads/api");

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
    insertResults.push({ error: null });
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
    insertResults.push({ error: null });
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

  it("retorna id placeholder em happy path", async () => {
    insertResults.push({ error: null });
    const result = await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      email: "a@b.com",
      consentLgpd: true,
    });
    // Insert sem .select() — anon não tem SELECT em leads (RLS)
    expect(result.id).toBe("ok");
  });

  it("trata duplicate (23505) silenciosamente", async () => {
    insertResults.push({
      error: { code: "23505", message: "duplicate" },
    });
    // Update silencioso (anon pode update via RLS)
    updateResults.push({ error: null });
    const result = await submitLead({
      shareId: "abc",
      ownerId: "u-1",
      email: "a@b.com",
      consentLgpd: true,
    });
    expect(result.id).toBe("existing");
  });

  it("propaga erro genérico do Supabase", async () => {
    insertResults.push({
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

describe("listAllLeads", () => {
  it("retorna lista vazia quando sem leads", async () => {
    listResults.push({ data: [], error: null });
    const result = await listAllLeads();
    expect(result).toEqual([]);
  });

  it("retorna leads ordenados por created_at desc", async () => {
    listResults.push({
      data: [
        { id: "l1", nome: "Ana", status: "novo" },
        { id: "l2", nome: "Bruno", status: "respondido" },
      ],
      error: null,
    });
    const result = await listAllLeads();
    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe("Ana");
  });

  it("propaga erro de rede", async () => {
    listResults.push({
      data: null,
      error: { message: "network" },
    });
    await expect(listAllLeads()).rejects.toThrow(LeadError);
  });
});

describe("updateLeadStatus", () => {
  it("não chama Supabase com leadId vazio", async () => {
    await updateLeadStatus("", "respondido");
    expect(updateResults).toHaveLength(0);
  });

  it("happy path retorna void", async () => {
    updateResults.push({ error: null });
    await expect(
      updateLeadStatus("lead-1", "respondido"),
    ).resolves.toBeUndefined();
  });

  it("propaga erro como LeadError", async () => {
    updateResults.push({ error: { message: "denied" } });
    await expect(
      updateLeadStatus("lead-1", "ignorado"),
    ).rejects.toThrow(LeadError);
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
