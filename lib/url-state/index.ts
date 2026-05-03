import { SimulacaoConfigSchema } from "@/lib/calculation-engine";
import type { Scenario } from "@/lib/storage/use-scenarios-store";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";

/**
 * Versão do schema de share. Bumpe ao introduzir breaking change e adicione
 * um migrator em `migrators` abaixo. NUNCA quebre URLs antigas.
 *
 * v1 → v2 (refinements F1):
 *   - compradores: clt_liquido + pj_liquido + outros → renda_liquida + outros
 *   - entrada: ato_* (4 campos) → ato: { valor_total, corrige_incc }
 *   - itbi (root) + entrada.documentacao → custosCartoriais (root) com toggle diluir
 *
 * v2 → v3 (refinements F2 — saldo devedor):
 *   - imovel: + fgts_abate_saldo: true (default)
 *   - entrada: + modo_incc: "cliente_paga_mensal" (default)
 *
 * v3 → v4 (refinements F3 — anuais inteligentes):
 *   - entrada.anuais[]: { valor, meses, corrige_incc } → discriminated union
 *     com tipo "manual" preservando os meses originais.
 *
 * v4 → v5 (refinements pós-F4 — UX e ato parcelado):
 *   - renda: comprador.outros (por comprador) → renda.outros_rendimentos (root)
 *   - entrada: drop valor_entrada_total (vira derivado)
 *   - entrada.anuais: garante max 1 (mantém o primeiro)
 *   - entrada.ato: adiciona parcelas: 1, primeiro_mes: 1 (preserva comportamento "ato 1x m1")
 *
 * v5 → v6 (compartilhamento corretor↔cliente):
 *   - payload ganha campo opcional `corretor: { nome, whatsapp }`
 *   - migrator é noop: campo opcional, payloads antigos continuam válidos
 */
export const LATEST_SCHEMA_VERSION = 6;

const ScenarioSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
  config: SimulacaoConfigSchema,
});

/**
 * Normaliza um WhatsApp brasileiro:
 * - Remove tudo que não é dígito
 * - Se já tem 12-13 dígitos começando com 55, mantém
 * - Se tem 10-11 dígitos (DDD + número, sem DDI), prepende 55
 * - Caso contrário, retorna os dígitos como estão (vai falhar na regex)
 */
function normalizeBrazilianWhatsApp(input: unknown): unknown {
  if (typeof input !== "string") return input;
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith("55")) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  return digits;
}

export const CorretorIdentitySchema = z.object({
  nome: z.string().min(1).max(60),
  whatsapp: z.preprocess(
    normalizeBrazilianWhatsApp,
    z
      .string()
      .regex(
        /^55\d{10,11}$/,
        "WhatsApp inválido. Use DDD + número (ex: 11999998888)",
      ),
  ),
});

export type CorretorIdentity = z.infer<typeof CorretorIdentitySchema>;

const PayloadSchema = z.object({
  v: z.number().int().positive(),
  scenarios: z.array(ScenarioSchema).min(1),
  corretor: CorretorIdentitySchema.optional(),
});

export type SharePayload = z.infer<typeof PayloadSchema>;

/* eslint-disable @typescript-eslint/no-explicit-any */
const migrators: Record<number, (data: any) => any> = {
  1: (data: any) => {
    const next = structuredClone(data);
    next.scenarios = (data.scenarios ?? []).map((s: any) => migrarCenarioV1(s));
    return next;
  },
  2: (data: any) => {
    const next = structuredClone(data);
    next.scenarios = (data.scenarios ?? []).map((s: any) => migrarCenarioV2(s));
    return next;
  },
  3: (data: any) => {
    const next = structuredClone(data);
    next.scenarios = (data.scenarios ?? []).map((s: any) => migrarCenarioV3(s));
    return next;
  },
  4: (data: any) => {
    const next = structuredClone(data);
    next.scenarios = (data.scenarios ?? []).map((s: any) => migrarCenarioV4(s));
    return next;
  },
  5: (data: any) => {
    // v5 → v6: nada a transformar, campo `corretor` é opcional.
    return structuredClone(data);
  },
};

function migrarCenarioV4(s: any): any {
  const cfg = s.config ?? {};
  // 1. Renda: somar comprador.outros num único renda.outros_rendimentos
  const compradores = (cfg.renda?.compradores ?? []).map((c: any) => ({
    id: c.id,
    rotulo: c.rotulo ?? "Comprador",
    renda_liquida: c.renda_liquida ?? 0,
  }));
  const outrosTotal = (cfg.renda?.compradores ?? []).reduce(
    (a: number, c: any) => a + (c?.outros ?? 0),
    cfg.renda?.outros_rendimentos ?? 0,
  );

  // 2. Anuais: máximo 1 (mantém o primeiro)
  const anuais = (cfg.entrada?.anuais ?? []).slice(0, 1);

  // 3. Ato: adiciona parcelas/primeiro_mes (defaults 1x no m1 = comportamento antigo)
  const ato = {
    valor_total: cfg.entrada?.ato?.valor_total ?? 0,
    parcelas: cfg.entrada?.ato?.parcelas ?? 1,
    primeiro_mes: cfg.entrada?.ato?.primeiro_mes ?? 1,
    corrige_incc: cfg.entrada?.ato?.corrige_incc ?? false,
  };

  // 4. Entrada sem valor_entrada_total
  const { valor_entrada_total: _drop, ...entradaSemTotal } = cfg.entrada ?? {};
  void _drop;

  return {
    ...s,
    config: {
      ...cfg,
      renda: { compradores, outros_rendimentos: outrosTotal },
      entrada: {
        ...entradaSemTotal,
        ato,
        anuais,
      },
    },
  };
}

function migrarCenarioV3(s: any): any {
  const cfg = s.config ?? {};
  const anuais = (cfg.entrada?.anuais ?? []).map((a: any) => {
    if (a?.tipo) return a; // já no novo formato
    return {
      id: a?.id ?? Math.random().toString(36).slice(2, 10),
      tipo: "manual",
      meses: a?.meses ?? [],
      valor: a?.valor ?? 0,
      corrige_incc: a?.corrige_incc ?? true,
    };
  });
  return {
    ...s,
    config: {
      ...cfg,
      entrada: {
        ...cfg.entrada,
        anuais,
      },
    },
  };
}

function migrarCenarioV2(s: any): any {
  const cfg = s.config ?? {};
  return {
    ...s,
    config: {
      ...cfg,
      imovel: {
        ...cfg.imovel,
        fgts_abate_saldo: cfg.imovel?.fgts_abate_saldo ?? true,
      },
      entrada: {
        ...cfg.entrada,
        modo_incc: cfg.entrada?.modo_incc ?? "cliente_paga_mensal",
      },
    },
  };
}

function migrarCenarioV1(s: any): any {
  const cfg = s.config ?? {};
  // 1. Compradores
  const compradores = (cfg.renda?.compradores ?? []).map((c: any) => ({
    id: c.id,
    rotulo: c.rotulo ?? "Comprador",
    renda_liquida: (c.clt_liquido ?? 0) + (c.pj_liquido ?? 0),
    outros: c.outros ?? 0,
  }));

  // 2. Ato (de 4 campos para objeto)
  const ato = {
    valor_total: cfg.entrada?.ato_valor_total ?? 0,
    corrige_incc: cfg.entrada?.ato_corrige_incc ?? false,
  };

  // 3. Custos cartoriais (ITBI + Documentação unificados)
  const oldDoc = cfg.entrada?.documentacao ?? {};
  const oldItbi = cfg.itbi ?? { tipo: "valor_total", valor_itbi_total: 0 };
  const diluir = (oldDoc.valor_total ?? 0) > 0;
  const custosCartoriais = {
    calculo: oldItbi,
    diluir,
    parcelas: oldDoc.dividido_meses ?? 1,
    mes_inicio: oldDoc.mes_inicio ?? 1,
    corrige_incc: oldDoc.corrige_incc ?? false,
  };

  // 4. Entrada (sem ato_*, sem documentacao)
  const entrada = {
    valor_entrada_total: cfg.entrada?.valor_entrada_total ?? 0,
    ato,
    parcela_mensal_base: cfg.entrada?.parcela_mensal_base ?? 0,
    anuais: cfg.entrada?.anuais ?? [],
    incc_mensal_percent: cfg.entrada?.incc_mensal_percent ?? 0.0045,
    parcela_pos_entrega: cfg.entrada?.parcela_pos_entrega ?? 0,
  };

  return {
    ...s,
    config: {
      rotulo: cfg.rotulo ?? "Cenário",
      renda: { compradores },
      gastos: cfg.gastos ?? { gastos_fixos_mensais: 0 },
      imovel: cfg.imovel ?? {},
      entrada,
      evolucao: cfg.evolucao ?? { tipo: "progressivo" },
      custosCartoriais,
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function encodeScenarios(
  scenarios: Scenario[],
  corretor?: CorretorIdentity,
): string {
  const payload: SharePayload = {
    v: LATEST_SCHEMA_VERSION,
    scenarios,
    ...(corretor ? { corretor } : {}),
  };
  const json = JSON.stringify(payload);
  return compressToEncodedURIComponent(json);
}

export interface DecodeResult {
  ok: boolean;
  scenarios?: Scenario[];
  corretor?: CorretorIdentity;
  error?: string;
}

export function decodeScenarios(s: string): DecodeResult {
  try {
    const json = decompressFromEncodedURIComponent(s);
    if (!json) return { ok: false, error: "Não foi possível descomprimir o link." };
    const raw = JSON.parse(json);
    let data = raw;
    let v = data?.v ?? 0;
    while (v < LATEST_SCHEMA_VERSION && migrators[v]) {
      data = migrators[v](data);
      v += 1;
      data.v = v;
    }
    const parsed = PayloadSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Formato inválido: ${parsed.error.issues[0]?.message ?? "erro de schema"}`,
      };
    }
    return {
      ok: true,
      scenarios: parsed.data.scenarios,
      corretor: parsed.data.corretor,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao decodificar.",
    };
  }
}

/**
 * Aplica os migrators a um payload já parseado (sem passar por lz-string).
 * Útil para hidratação de localStorage onde o JSON é cru.
 *
 * Retorna `{ ok, scenarios? , error? }`.
 */
export function migrarPayload(raw: unknown): DecodeResult {
  try {
    let data = raw as { v?: number; scenarios?: unknown[] };
    let v = data?.v ?? 0;
    while (v < LATEST_SCHEMA_VERSION && migrators[v]) {
      data = migrators[v](data);
      v += 1;
      data.v = v;
    }
    const parsed = PayloadSchema.safeParse(data);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Formato inválido: ${parsed.error.issues[0]?.message ?? "erro de schema"}`,
      };
    }
    return {
      ok: true,
      scenarios: parsed.data.scenarios,
      corretor: parsed.data.corretor,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao migrar payload.",
    };
  }
}

export function buildShareURL(
  scenarios: Scenario[],
  corretor?: CorretorIdentity,
): string {
  if (typeof window === "undefined") return "";
  const encoded = encodeScenarios(scenarios, corretor);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("s", encoded);
  return url.toString();
}
