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
  CustosCartoriaisSection,
  EntradaSection,
  EvolucaoSection,
  ImovelSection,
  NomeCenarioSection,
  OrcamentoSection,
} from "@/components/form/sections";
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
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
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
      </div>
    </FormProvider>
    </TooltipProvider>
  );
}

function ConfigPanel({ scenario }: { scenario: Scenario }) {
  const received = useCorretorStore((s) => s.received);
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

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <NomeCenarioSection />

        <SectionHead>Imóvel & Entrada</SectionHead>
        <ImovelSection />
        <EntradaSection />
        <CustosCartoriaisSection />

        <div id="secao-orcamento" className="scroll-mt-24 space-y-4">
          {received && <ClienteBanner nome={received.nome} />}
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

  return (
    <header className="bg-ink text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,151,58,.25) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent mb-2 flex items-center gap-3">
              <a href="/" className="hover:text-accent/80 transition-colors">
                Habitando
              </a>
              <span className="text-white/20">·</span>
              <a href="/faq" className="hover:text-white/90 transition-colors text-white/60">
                FAQ
              </a>
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
              <ShareControls />
              {!isClienteMode && <HeaderIdentitySlot />}
            </div>
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
