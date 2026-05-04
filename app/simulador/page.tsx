"use client";

import * as React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import {
  calcSimulacao,
  validarInput,
  validarOutput,
  type SimulacaoConfig,
} from "@/lib/calculation-engine";
import { defaultConfig } from "@/lib/calculation-engine";
import {
  SCENARIO_COLORS,
  useScenariosStore,
  type Scenario,
} from "@/lib/storage/use-scenarios-store";
import {
  Button,
  SectionHead,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TooltipProvider,
} from "@/components/ui/primitives";
import {
  AnualBlock,
  AtoBlock,
  CustosCartoriaisSection,
  EntradaSection,
  EntradaTotalDerivada,
  EvolucaoSection,
  ImovelSection,
  NomeCenarioSection,
  OrcamentoSection,
  ParcelaSugeridaBlock,
} from "@/components/form/sections";
import { CenarioSummary } from "@/components/form/cenario-summary";
import { LeadCtaCard } from "@/components/leads/lead-cta-card";
import {
  Alertas,
  FluxoChart,
  ParcelasTable,
  Parecer,
  StatCards,
} from "@/components/results";
import { ScenarioBar } from "@/components/scenarios/scenario-bar";
import { ScenarioComparar } from "@/components/scenarios/scenario-comparar";
import { ShareControls } from "@/components/share/share-controls";
import { DevolverButton } from "@/components/share/devolver-button";
import { HeaderIdentitySlot } from "@/components/auth/header-identity-slot";
import { BrandedShell } from "@/components/branding/branded-shell";
import { useBrandingStore } from "@/lib/branding/use-branding-store";
import { ScenarioPersist } from "@/lib/storage/persist";
import { useCorretorStore } from "@/lib/storage/use-corretor-store";
import { cn } from "@/lib/utils";

export default function Home() {
  const scenarios = useScenariosStore((s) => s.scenarios);
  const activeId = useScenariosStore((s) => s.activeId);
  const setActive = useScenariosStore((s) => s.setActive);
  const update = useScenariosStore((s) => s.update);
  const add = useScenariosStore((s) => s.add);
  const replaceAll = useScenariosStore((s) => s.replaceAll);

  const active = scenarios.find((s) => s.id === activeId)!;

  const form = useForm<SimulacaoConfig>({
    defaultValues: active.config,
    mode: "onChange",
  });

  const [view, setView] = React.useState<"config" | "comparar">("config");

  // Quando o cenário ativo muda, hidrata o form com sua config
  const lastSyncedId = React.useRef(activeId);
  React.useEffect(() => {
    if (lastSyncedId.current !== activeId) {
      form.reset(active.config);
      lastSyncedId.current = activeId;
    }
  }, [activeId, active.config, form]);

  // Persiste alterações do form no cenário ativo (debounce simples)
  const watched = useWatch<SimulacaoConfig>({ control: form.control });
  React.useEffect(() => {
    if (!watched) return;
    const t = setTimeout(() => {
      update(activeId, watched as SimulacaoConfig);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched), activeId]);

  return (
    <TooltipProvider>
    <FormProvider {...form}>
      <ScenarioPersist />
      <DevolverButton variant="sticky" />
      <BrandingShellOuter className="flex flex-col min-h-full pb-20 md:pb-0">
        <Header
          onResetAtivo={() => {
            const cfg = defaultConfig();
            update(activeId, cfg);
            form.reset(cfg);
          }}
          onLimparTudo={() => {
            const cfg = defaultConfig();
            const seed: Scenario = {
              id:
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Math.random().toString(36).slice(2, 10),
              label: cfg.rotulo,
              color: SCENARIO_COLORS[0],
              config: cfg,
            };
            replaceAll([seed]);
            form.reset(cfg);
            // Limpa localStorage explicitamente para garantir
            try {
              window.localStorage.removeItem("can-i-buy:scenarios");
            } catch {
              /* ignore */
            }
          }}
        />

        <ScenarioBar
          onAdd={() => add(defaultConfig())}
          onSwitch={setActive}
        />

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 md:py-10">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "config" | "comparar")}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="config">📝 Configuração & resultados</TabsTrigger>
              <TabsTrigger value="comparar">
                ⚖️ Comparar ({scenarios.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <ConfigPanel scenario={active} />
            </TabsContent>

            <TabsContent value="comparar">
              <ScenarioComparar scenarios={scenarios} />
            </TabsContent>
          </Tabs>
        </main>
        <PoweredByFooter />
      </BrandingShellOuter>
    </FormProvider>
    </TooltipProvider>
  );
}

/**
 * Wrapper que aplica branding (cor primária via CSS var) quando o cliente
 * recebeu link de um corretor com marca configurada.
 */
function BrandingShellOuter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const branding = useBrandingStore((s) => s.branding);
  return (
    <BrandedShell branding={branding} className={className}>
      {children}
    </BrandedShell>
  );
}

/** Wordmark com logo (se houver) e nome do corretor. */
function BrandedWordmark({
  nome,
  logoUrl,
}: {
  nome: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`Logo ${nome}`}
          className="h-6 w-6 rounded-sm object-contain bg-white/5 p-0.5"
        />
      )}
      <span className="text-accent">{nome}</span>
    </div>
  );
}

/** Footer "Powered by Habitando" — só aparece em modo brandeado. */
function PoweredByFooter() {
  const branding = useBrandingStore((s) => s.branding);
  if (!branding) return null;
  return (
    <div className="border-t border-border bg-paper-alt/40 py-3 text-center">
      <a
        href="/"
        className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted hover:text-ink-soft transition-colors"
      >
        Powered by Habitando
      </a>
    </div>
  );
}

function ConfigPanel({ scenario }: { scenario: Scenario }) {
  const received = useCorretorStore((s) => s.received);
  const isClienteMode = received !== null;
  const [highlightOrcamento, setHighlightOrcamento] = React.useState(false);

  // Quando o cliente abre via link compartilhado, pulsa a seção Orçamento
  // logo após o scroll terminar pra reforçar onde ele deve focar.
  React.useEffect(() => {
    if (!received) return;
    const t1 = window.setTimeout(() => setHighlightOrcamento(true), 1000);
    const t2 = window.setTimeout(() => setHighlightOrcamento(false), 3000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [received]);

  if (isClienteMode) {
    return (
      <div className="space-y-8">
        <section className="space-y-6">
          {/* Imóvel/Entrada base/Custos/Evolução em card resumo read-only */}
          <CenarioSummary />

          {/* Cliente pode mexer só em Ato + Anuais */}
          <SectionHead>Ato e contribuições anuais</SectionHead>
          <div className="space-y-3">
            <AtoBlock />
            <AnualBlock />
            <ParcelaSugeridaBlock />
            <EntradaTotalDerivada />
          </div>

          <div id="secao-orcamento" className="scroll-mt-24 space-y-4">
            <ClienteBanner nome={received.nome} />
            <div
              className={cn(
                "space-y-6 rounded-lg p-2 -m-2 transition-shadow duration-700",
                highlightOrcamento &&
                  "ring-2 ring-accent ring-offset-4 ring-offset-paper",
              )}
            >
              <SectionHead>Orçamento</SectionHead>
              <OrcamentoSection />
            </div>
          </div>
        </section>

        <ResultsPanel color={scenario.color} />

        <LeadCtaCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <NomeCenarioSection />

        <SectionHead>Imóvel & Entrada</SectionHead>
        <ImovelSection />
        <EntradaSection />
        <CustosCartoriaisSection />

        <div id="secao-orcamento" className="scroll-mt-24 space-y-4">
          <SectionHead>Orçamento</SectionHead>
          <OrcamentoSection />
        </div>

        <SectionHead>Evolução de obra</SectionHead>
        <EvolucaoSection />
      </section>

      <ResultsPanel color={scenario.color} />
    </div>
  );
}

function ClienteBanner({ nome }: { nome: string }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0" aria-hidden>
          👋
        </div>
        <div className="flex-1">
          <div className="font-medium text-ink text-[15px] mb-0.5">
            {nome} compartilhou esse cenário com você
          </div>
          <p className="text-ink-soft text-[13.5px] leading-relaxed">
            Confira/ajuste sua <strong>renda e gastos</strong> abaixo. Quando
            terminar, clique em <strong>&quot;Mandar pra {nome}&quot;</strong>{" "}
            pra devolver o cenário pelo WhatsApp.
          </p>
        </div>
      </div>
      <div className="pl-9">
        <DevolverButton />
      </div>
    </div>
  );
}

function Header({
  onResetAtivo,
  onLimparTudo,
}: {
  onResetAtivo: () => void;
  onLimparTudo: () => void;
}) {
  const received = useCorretorStore((s) => s.received);
  const isClienteMode = received !== null;
  const branding = useBrandingStore((s) => s.branding);
  const isBranded = isClienteMode && branding !== null;

  return (
    <header className="bg-ink text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 25%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent mb-2 flex items-center gap-3">
              {isBranded && branding ? (
                <BrandedWordmark
                  nome={branding.nome}
                  logoUrl={branding.logo_url}
                />
              ) : (
                <>
                  <a href="/" className="hover:text-accent/80 transition-colors">
                    Habitando
                  </a>
                  <span className="text-white/20">·</span>
                  <a href="/faq" className="hover:text-white/90 transition-colors text-white/60">
                    FAQ
                  </a>
                </>
              )}
            </div>
            {isClienteMode ? (
              <>
                <h1 className="font-serif text-3xl md:text-5xl leading-tight">
                  Cenário de {received.nome}
                </h1>
                <p className="text-[#8fa3b8] text-sm mt-1.5">
                  Confira sua renda e gastos abaixo, ajuste se quiser, e
                  devolva o cenário pelo botão verde.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl md:text-5xl leading-tight flex items-center gap-3 flex-wrap">
                  Demo da ferramenta
                  <span className="font-sans text-[11px] font-mono tracking-[0.15em] uppercase border border-accent/40 text-accent px-2.5 py-1 rounded-full">
                    🎬 Demonstração
                  </span>
                </h1>
                <p className="text-[#8fa3b8] text-sm mt-1.5">
                  Esta é a calculadora — quer com sua marca, captura de leads e
                  PDF profissional?{" "}
                  <a
                    href="/#waitlist"
                    className="text-accent hover:text-accent/80 underline"
                  >
                    Entre na lista de espera →
                  </a>
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <DevolverButton />
              {!isClienteMode && (
                <>
                  <ShareControls />
                  <HeaderIdentitySlot />
                </>
              )}
            </div>
            {!isClienteMode && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={onResetAtivo}
                >
                  Resetar cenário
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    if (
                      confirm(
                        "Limpar TUDO: descarta todos os cenários e dados salvos. Continuar?",
                      )
                    ) {
                      onLimparTudo();
                    }
                  }}
                >
                  Limpar tudo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ResultsPanel({ color }: { color: string }) {
  const config = useWatch<SimulacaoConfig>() as SimulacaoConfig;

  const result = React.useMemo(() => {
    try {
      return calcSimulacao(config);
    } catch {
      return null;
    }
  }, [config]);

  const validInput = React.useMemo(() => {
    try {
      return validarInput(config);
    } catch {
      return { valido: true, erros: [], avisos: [], info: [] };
    }
  }, [config]);
  const validOutput = React.useMemo(
    () =>
      result
        ? validarOutput(result)
        : { valido: true, erros: [], avisos: [], info: [] },
    [result],
  );

  if (!result) {
    return (
      <div className="rounded-md bg-amber-soft text-amber px-4 py-3 text-sm">
        Não foi possível calcular com a configuração atual. Confira os campos.
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="false">
      <SectionHead>Indicadores</SectionHead>
      <Alertas input={validInput} output={validOutput} />
      <StatCards result={result} />

      <SectionHead>Fluxo visual</SectionHead>
      <FluxoChart result={result} baseColor={color} />

      <SectionHead>Tabela detalhada</SectionHead>
      <ParcelasTable result={result} />

      <SectionHead>Parecer</SectionHead>
      <Parecer items={result.parecer} />
    </div>
  );
}
