import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock do client Supabase antes de importar a API ─────────────────────
const signUpResults: Array<{
  data: { user: { id: string } | null };
  error: { message: string } | null;
}> = [];
const signInResults: Array<{ error: { message: string } | null }> = [];
const signOutResults: Array<{ error: { message: string } | null }> = [];
const profilesResults: Array<{
  data: Record<string, unknown> | null;
  error: { message: string } | null;
}> = [];
const updateResults: Array<{
  data: Record<string, unknown> | null;
  error: { message: string } | null;
}> = [];
const sharesUpdateResults: Array<{
  data: { id: string } | null;
  error: { message: string } | null;
}> = [];
const sharesListResults: Array<{
  data: unknown[] | null;
  error: { message: string } | null;
}> = [];
const getUserResult: { data: { user: { id: string } | null } } = {
  data: { user: { id: "user-123" } },
};

const signUpCalls: unknown[] = [];
const signInCalls: unknown[] = [];

vi.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  getSupabase: () => ({
    auth: {
      signUp: (args: unknown) => {
        signUpCalls.push(args);
        return Promise.resolve(
          signUpResults.shift() ?? {
            data: { user: { id: "user-123" } },
            error: null,
          },
        );
      },
      signInWithPassword: (args: unknown) => {
        signInCalls.push(args);
        return Promise.resolve(signInResults.shift() ?? { error: null });
      },
      signOut: () =>
        Promise.resolve(signOutResults.shift() ?? { error: null }),
      getUser: () => Promise.resolve(getUserResult),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve(
              profilesResults.shift() ?? { data: null, error: null },
            ),
        }),
        order: () => ({
          limit: () =>
            Promise.resolve(
              sharesListResults.shift() ?? { data: [], error: null },
            ),
        }),
      }),
      update: () => ({
        eq: (_col: string, _val: string) => {
          if (table === "shares") {
            return {
              is: () => ({
                select: () => ({
                  maybeSingle: () =>
                    Promise.resolve(
                      sharesUpdateResults.shift() ?? {
                        data: null,
                        error: null,
                      },
                    ),
                }),
              }),
            };
          }
          return {
            select: () => ({
              single: () =>
                Promise.resolve(
                  updateResults.shift() ?? { data: null, error: null },
                ),
            }),
          };
        },
      }),
    }),
  }),
}));

const {
  signUp,
  signIn,
  signOut,
  fetchProfile,
  claimShare,
  listOwnedShares,
} = await import("@/lib/auth/api");

beforeEach(() => {
  signUpResults.length = 0;
  signInResults.length = 0;
  signOutResults.length = 0;
  profilesResults.length = 0;
  updateResults.length = 0;
  sharesUpdateResults.length = 0;
  sharesListResults.length = 0;
  signUpCalls.length = 0;
  signInCalls.length = 0;
});

describe("signUp", () => {
  it("passa nome e whatsapp em options.data e normaliza email", async () => {
    signUpResults.push({
      data: { user: { id: "user-123" } },
      error: null,
    });
    await signUp({
      email: "  Joao@Example.COM  ",
      password: "senha123",
      nome: "  João Silva  ",
      whatsapp: "5511999998888",
    });
    expect(signUpCalls).toHaveLength(1);
    const call = signUpCalls[0] as {
      email: string;
      options: { data: { nome: string; whatsapp?: string } };
    };
    expect(call.email).toBe("joao@example.com");
    expect(call.options.data.nome).toBe("João Silva");
    expect(call.options.data.whatsapp).toBe("5511999998888");
  });

  it("omite whatsapp quando não fornecido", async () => {
    signUpResults.push({
      data: { user: { id: "user-123" } },
      error: null,
    });
    await signUp({ email: "a@b.com", password: "senha123", nome: "Maria" });
    const call = signUpCalls[0] as {
      options: { data: Record<string, unknown> };
    };
    expect("whatsapp" in call.options.data).toBe(false);
  });

  it("traduz erro 'user already registered' pra português", async () => {
    signUpResults.push({
      data: { user: null },
      error: { message: "User already registered" },
    });
    await expect(
      signUp({ email: "a@b.com", password: "senha123", nome: "X" }),
    ).rejects.toThrow(/já tem uma conta/);
  });

  it("traduz erro de senha fraca", async () => {
    signUpResults.push({
      data: { user: null },
      error: { message: "Password should be at least 6 characters" },
    });
    await expect(
      signUp({ email: "a@b.com", password: "abc", nome: "X" }),
    ).rejects.toThrow(/Senha muito curta/);
  });
});

describe("signIn", () => {
  it("normaliza email e propaga 'invalid login credentials'", async () => {
    signInResults.push({
      error: { message: "Invalid login credentials" },
    });
    await expect(
      signIn({ email: " A@B.COM ", password: "errada" }),
    ).rejects.toThrow(/incorretos/);
    const call = signInCalls[0] as { email: string };
    expect(call.email).toBe("a@b.com");
  });
});

describe("signOut", () => {
  it("happy path", async () => {
    await expect(signOut()).resolves.toBeUndefined();
  });
});

describe("fetchProfile", () => {
  it("retorna o profile quando existe", async () => {
    profilesResults.push({
      data: {
        id: "user-123",
        nome: "João",
        whatsapp: "5511999998888",
        slug: null,
        plano: "free",
        created_at: "2026-05-03T00:00:00Z",
        updated_at: "2026-05-03T00:00:00Z",
      },
      error: null,
    });
    const result = await fetchProfile("user-123");
    expect(result?.nome).toBe("João");
  });

  it("retenta quando profile não existe (race com trigger)", async () => {
    // 1ª e 2ª tentativas: vazio (trigger ainda processando)
    profilesResults.push({ data: null, error: null });
    profilesResults.push({ data: null, error: null });
    // 3ª: aparece
    profilesResults.push({
      data: {
        id: "user-123",
        nome: "João",
        whatsapp: null,
        slug: null,
        plano: "free",
        created_at: "x",
        updated_at: "x",
      },
      error: null,
    });
    const result = await fetchProfile("user-123");
    expect(result?.nome).toBe("João");
  });

  it("retorna null se trigger nunca completar", async () => {
    profilesResults.push({ data: null, error: null });
    profilesResults.push({ data: null, error: null });
    profilesResults.push({ data: null, error: null });
    const result = await fetchProfile("user-123");
    expect(result).toBeNull();
  });
});

describe("claimShare", () => {
  it("retorna true quando vinculação funciona", async () => {
    sharesUpdateResults.push({ data: { id: "abc1234567" }, error: null });
    const result = await claimShare("abc1234567");
    expect(result).toBe(true);
  });

  it("retorna false quando share já tem dono (RLS bloqueia)", async () => {
    sharesUpdateResults.push({ data: null, error: null });
    const result = await claimShare("abc1234567");
    expect(result).toBe(false);
  });
});

describe("listOwnedShares", () => {
  it("retorna lista vazia quando user ainda não compartilhou nada", async () => {
    sharesListResults.push({ data: [], error: null });
    const result = await listOwnedShares();
    expect(result).toEqual([]);
  });

  it("retorna shares ordenados", async () => {
    sharesListResults.push({
      data: [
        {
          id: "a",
          payload: {},
          created_at: "x",
          updated_at: "y",
        },
      ],
      error: null,
    });
    const result = await listOwnedShares();
    expect(result).toHaveLength(1);
  });
});
