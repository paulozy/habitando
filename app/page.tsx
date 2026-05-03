import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Para corretores · feche mais vendas com transparência",
  description:
    "Ferramenta de simulação imobiliária para corretores e imobiliárias — white-label, PDF profissional, captura de leads e cadastro de empreendimentos. Cliente entende o que vai pagar, você fecha mais.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full bg-paper">
      <Hero />
      <ProblemaSection />
      <BeneficiosSection />
      <PricingSection />
      <ComoFuncionaSection />
      <FAQSection />
      <CTAFinal />
      <Footer />
    </div>
  );
}

/* ============================================================
 *  Hero
 * ============================================================ */
function Hero() {
  return (
    <header className="bg-ink text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(13,122,78,.30) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,151,58,.20) 0%, transparent 70%)",
        }}
      />

      <nav className="relative max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
        >
          Habitando
        </Link>
        <div className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/simulador" className="hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link
            href="#waitlist"
            className="hover:text-white transition-colors"
          >
            Entrar na lista →
          </Link>
        </div>
      </nav>

      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase text-accent border border-accent/40 rounded-full px-3 py-1 mb-6">
            🤝 Para corretores e imobiliárias
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6">
            Cliente que entende,{" "}
            <span className="text-accent italic">fecha</span>.
          </h1>
          <p className="text-lg md:text-xl text-[#bcc6d0] leading-relaxed mb-8 max-w-2xl">
            Habitando é o simulador que mostra o número real ao seu cliente —
            com a sua marca, captura de leads e PDF profissional. Cliente que
            entende o contrato, fecha mais rápido.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="#waitlist"
              className="inline-flex items-center justify-center gap-2 bg-accent text-ink font-semibold px-6 py-3.5 rounded-md hover:bg-accent/90 transition-colors"
            >
              Quero o preço de fundador
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center gap-2 text-white border border-white/20 px-6 py-3.5 rounded-md hover:bg-white/10 transition-colors"
            >
              Ver demo da ferramenta
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-[#bcc6d0]">
            <Stat label="White-label" sub="Sua marca, sua URL" />
            <Stat label="PDF profissional" sub="Mande pelo WhatsApp" />
            <Stat label="Leads automáticos" sub="Direto no seu WhatsApp" />
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      <span>
        <strong className="text-white">{label}</strong>
        <span className="text-[#8fa3b8]"> · {sub}</span>
      </span>
    </div>
  );
}

/* ============================================================
 *  Problema
 * ============================================================ */
function ProblemaSection() {
  return (
    <section className="bg-paper-alt/40 py-20 md:py-28 border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4">
              O problema do dia a dia
            </div>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-6">
              Cliente desconfia, perde tempo, e some.
            </h2>
            <p className="text-ink-soft text-lg leading-relaxed mb-4">
              O comprador entra na sua imobiliária, ouve o pitch e pede a
              simulação. Você manda um print do Excel, da Caixa ou um WhatsApp
              com 12 fotos. Ele recebe, não entende, mostra pra família, e
              decide &quot;vou pensar&quot;.
            </p>
            <p className="text-ink-soft text-lg leading-relaxed">
              Quando volta, três semanas depois, perdeu o entusiasmo. Ou pior:
              já está falando com outra imobiliária que mostrou os números de
              forma mais clara.
            </p>
          </div>

          <div className="space-y-3">
            <CardProblema
              emoji="📸"
              titulo="Print do Excel ou da Caixa"
              desc="Layout caótico, sem sua marca, sem explicação. Cliente acha que está sendo enrolado."
            />
            <CardProblema
              emoji="📱"
              titulo="WhatsApp com 12 fotos"
              desc="Cliente abre numa quinta à noite, esquece, e na sexta esqueceu o que era."
            />
            <CardProblema
              emoji="❓"
              titulo="Cliente não entende INCC"
              desc="Quando descobre o INCC sobre saldo devedor lá na frente, sente que foi enganado e cancela."
            />
            <CardProblema
              emoji="🌬️"
              titulo="Cliente some sem rastro"
              desc="Você não sabe se ele simulou de novo, com quem está conversando, ou se descartou."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CardProblema({
  emoji,
  titulo,
  desc,
}: {
  emoji: string;
  titulo: string;
  desc: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <div className="text-3xl shrink-0">{emoji}</div>
      <div>
        <div className="font-semibold text-ink text-[15px] mb-1">{titulo}</div>
        <p className="text-ink-soft text-[13.5px] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ============================================================
 *  Benefícios
 * ============================================================ */
function BeneficiosSection() {
  const beneficios = [
    {
      icon: "🎨",
      title: "White-label completo",
      desc: "Logo da imobiliária, cores próprias, URL personalizada. O cliente nem percebe que é uma ferramenta externa — vira parte da sua marca.",
    },
    {
      icon: "📑",
      title: "PDF profissional para WhatsApp",
      desc: "Gere um relatório com layout limpo: tabela de meses, gráfico, parecer e rodapé com seus dados de contato. Mande direto pro cliente.",
    },
    {
      icon: "🎯",
      title: "Captura de leads embutida",
      desc: "Cliente preenche WhatsApp/email no fim da simulação. Você recebe notificação na hora, com os dados que ele simulou — e exporta em planilha quando quiser.",
    },
    {
      icon: "🏢",
      title: "Cadastro de empreendimentos",
      desc: "Pré-cadastre os seus apartamentos (60m², 54m², 48m²) com valores e parcelas. Cliente entra, escolhe o cenário e ajusta só renda/FGTS — fricção zero.",
    },
    {
      icon: "📊",
      title: "Histórico por cliente",
      desc: "Veja tudo que o lead simulou: quais empreendimentos comparou, qual cenário escolheu, quanto tempo passou na ferramenta. Vendedor com superpoder.",
    },
    {
      icon: "👥",
      title: "Equipe inteira",
      desc: "Múltiplos corretores, permissões granulares. Cada corretor vê só os próprios leads. Gerente tem visão consolidada.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-paper">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4">
          A solução
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-3 max-w-2xl">
          Vire a ferramenta favorita do seu cliente — antes de virar a do
          concorrente.
        </h2>
        <p className="text-ink-soft text-lg max-w-2xl mb-12">
          Tudo que você precisa para fechar venda com transparência, sem
          depender de print do Excel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beneficios.map((b) => (
            <div
              key={b.title}
              className="rounded-xl bg-card border border-border p-6 hover:border-ink-soft transition-colors"
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-serif text-xl text-ink mb-2">{b.title}</h3>
              <p className="text-ink-soft text-[14px] leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 *  Pricing
 * ============================================================ */
function PricingSection() {
  return (
    <section className="py-20 md:py-28 bg-paper-alt/40 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4 text-center">
          Planos
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-3 text-center">
          Preço de fundador para os primeiros corretores.
        </h2>
        <p className="text-ink-soft text-lg max-w-2xl mx-auto mb-12 text-center">
          Quem entrar agora trava o preço — mesmo quando subir, você mantém o
          valor original.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PriceCard
            tier="Corretor"
            preco="R$ 49"
            ciclo="por mês · sobe pra R$ 79"
            target="Autônomo, 1 usuário"
            features={[
              "White-label básico (logo + cor)",
              "PDF profissional",
              "Até 50 simulações/mês",
              "Captura de leads (export CSV)",
            ]}
            highlight={false}
          />
          <PriceCard
            tier="Imobiliária"
            preco="R$ 199"
            ciclo="por mês · sobe pra R$ 299"
            target="Até 5 corretores"
            features={[
              "Tudo do plano Corretor",
              "5 usuários inclusos",
              "Cadastro de empreendimentos",
              "Histórico por cliente",
              "Domínio próprio",
            ]}
            highlight={true}
          />
          <PriceCard
            tier="Equipe grande"
            preco="R$ 49"
            ciclo="por usuário/mês"
            target="10+ corretores"
            features={[
              "Tudo do plano Imobiliária",
              "Usuários ilimitados",
              "Permissões por equipe",
              "Branding avançado (domínio + tema completo)",
              "Suporte prioritário",
            ]}
            highlight={false}
          />
        </div>

        <p className="text-center text-[12.5px] text-ink-muted mt-8">
          Sem fidelidade. Cancele quando quiser. Trial de 14 dias sem cartão.
        </p>
      </div>
    </section>
  );
}

function PriceCard({
  tier,
  preco,
  ciclo,
  target,
  features,
  highlight,
}: {
  tier: string;
  preco: string;
  ciclo: string;
  target: string;
  features: string[];
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 flex flex-col ${
        highlight
          ? "bg-ink text-white border-2 border-accent shadow-xl scale-[1.02]"
          : "bg-card border border-border"
      }`}
    >
      {highlight && (
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-accent mb-2">
          ⭐ Mais popular
        </div>
      )}
      <div
        className={`font-serif text-2xl mb-1 ${
          highlight ? "text-white" : "text-ink"
        }`}
      >
        {tier}
      </div>
      <div
        className={`text-[12px] mb-5 ${
          highlight ? "text-[#8fa3b8]" : "text-ink-muted"
        }`}
      >
        {target}
      </div>
      <div className="mb-1">
        <span
          className={`font-serif text-3xl ${
            highlight ? "text-accent" : "text-ink"
          }`}
        >
          {preco}
        </span>
      </div>
      <div
        className={`text-[12.5px] mb-6 ${
          highlight ? "text-[#bcc6d0]" : "text-ink-muted"
        }`}
      >
        {ciclo}
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li
            key={f}
            className={`text-[13.5px] leading-relaxed flex items-start gap-2 ${
              highlight ? "text-[#dcdfe3]" : "text-ink-soft"
            }`}
          >
            <span aria-hidden className="text-accent mt-0.5 shrink-0">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="#waitlist"
        className={`text-center px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
          highlight
            ? "bg-accent text-ink hover:bg-accent/90"
            : "bg-ink text-white hover:bg-ink-soft"
        }`}
      >
        Entrar na lista
      </Link>
    </div>
  );
}

/* ============================================================
 *  Como funciona
 * ============================================================ */
function ComoFuncionaSection() {
  return (
    <section className="py-20 md:py-28 bg-ink text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(13,122,78,.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          O que muda no seu dia
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12 max-w-2xl">
          Antes vs. depois do Habitando.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ColumnCompare
            titulo="Antes"
            tone="muted"
            items={[
              "Cliente pede simulação → você abre Excel ou Caixa",
              "Manda print por WhatsApp",
              "Cliente entende metade, fica na dúvida",
              "Você manda áudio explicando INCC, cliente bloqueia",
              "Lead some por 3 semanas",
              "Quando volta, já está negociando com outro",
            ]}
          />
          <ColumnCompare
            titulo="Depois"
            tone="accent"
            items={[
              "Cliente pede simulação → você manda link da sua marca",
              "Cliente preenche em 5 min, vê tudo claro",
              "Compara 2-4 cenários sozinho",
              "Recebe PDF profissional pra mostrar pra família",
              "Você é notificado quando ele entra com WhatsApp/email",
              "Você liga sabendo exatamente o que ele simulou",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function ColumnCompare({
  titulo,
  tone,
  items,
}: {
  titulo: string;
  tone: "muted" | "accent";
  items: string[];
}) {
  return (
    <div>
      <div
        className={`font-mono text-[10px] tracking-[0.2em] uppercase mb-4 ${
          tone === "accent" ? "text-accent" : "text-white/40"
        }`}
      >
        {titulo}
      </div>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li
            key={i}
            className={`flex gap-3 text-[14.5px] leading-relaxed ${
              tone === "accent" ? "text-white" : "text-white/50 line-through decoration-white/30"
            }`}
          >
            <span aria-hidden className="shrink-0 mt-0.5">
              {tone === "accent" ? "✓" : "✗"}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
 *  FAQ B2B
 * ============================================================ */
function FAQSection() {
  return (
    <section className="py-20 md:py-28 bg-paper">
      <div className="max-w-[900px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4">
          Perguntas comuns
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-8">
          Sabemos o que você está pensando.
        </h2>

        <div className="space-y-2">
          <FaqItem
            q="O cliente entender tudo não atrapalha minha venda?"
            defaultOpen
          >
            <p>
              Pelo contrário. Cliente confuso desconfia, vai embora e procura
              concorrente. Cliente que entende sabe o que está pagando, sente
              confiança e fecha mais rápido.
            </p>
            <p>
              A ferramenta não <em>vende por você</em> — ela tira a fricção da
              etapa de explicação técnica para você focar no que importa:
              relacionamento, negociação e fechamento.
            </p>
          </FaqItem>

          <FaqItem q="Cliente sai do meu funil ao entrar na ferramenta?">
            <p>
              Não. A ferramenta é <strong>sua</strong> (white-label). O cliente
              vê a sua marca, sua cor, seu nome. Quando ele preenche WhatsApp/
              email pra ver o resultado completo, vira lead seu.
            </p>
          </FaqItem>

          <FaqItem q="Como recebo os leads?">
            <p>
              Você recebe uma notificação por WhatsApp/email assim que o cliente
              termina a simulação e deixa contato. Os dados ficam num painel
              simples dentro da sua área — você pode exportar em planilha (CSV)
              quando quiser.
            </p>
            <p>
              Sem integração obrigatória com nenhuma ferramenta externa. Você
              continua usando o que já tem para gerenciar contatos.
            </p>
          </FaqItem>

          <FaqItem q="Quanto tempo leva para colocar a minha marca?">
            <p>
              Plano Corretor: 5 minutos (logo + cor). Plano Imobiliária: até 24h
              (domínio próprio + tema personalizado). Sem precisar de
              desenvolvedor.
            </p>
          </FaqItem>

          <FaqItem q="Posso ver como funciona antes?">
            <p>
              Sim — a{" "}
              <Link
                href="/simulador"
                className="text-accent underline hover:text-accent/80"
              >
                versão demo
              </Link>{" "}
              está aberta para você testar a calculadora. A versão paga adiciona
              white-label, captura de leads, PDF, cadastro de empreendimentos e
              painel.
            </p>
          </FaqItem>

          <FaqItem q="Posso cancelar quando quiser?">
            <p>
              Sim. Mensalidade sem fidelidade. Trial de 14 dias sem cartão. Se
              cancelar, mantém os dados por 30 dias para exportar. Sem letra
              miúda.
            </p>
          </FaqItem>

          <FaqItem q="Como funciona o preço de fundador?">
            <p>
              Os primeiros corretores/imobiliárias travam o preço atual{" "}
              (<strong>R$ 49 / R$ 199 / R$ 49 por usuário</strong>). Quando os
              valores subirem (R$ 79 / R$ 299), você mantém o de fundador para
              sempre — mesmo se permanecer na assinatura por anos.
            </p>
          </FaqItem>
        </div>
      </div>
    </section>
  );
}

function FaqItem({
  q,
  defaultOpen = false,
  children,
}: {
  q: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-md border border-border bg-card overflow-hidden"
    >
      <summary className="cursor-pointer list-none flex items-start justify-between gap-3 px-5 py-4 hover:bg-paper-alt/40 transition-colors">
        <span className="font-medium text-ink text-[15px] leading-relaxed">
          {q}
        </span>
        <span
          aria-hidden
          className="shrink-0 mt-1 text-ink-muted transition-transform group-open:rotate-45 text-xl leading-none"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 pt-0 text-[14.5px] text-ink-soft leading-relaxed space-y-3 border-t border-border">
        <div className="pt-4">{children}</div>
      </div>
    </details>
  );
}

/* ============================================================
 *  Waitlist (CTA Final)
 * ============================================================ */
function CTAFinal() {
  return (
    <section
      id="waitlist"
      className="py-24 md:py-32 bg-paper-alt/40"
    >
      <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
        <div className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase text-accent border border-accent/40 rounded-full px-3 py-1 mb-6">
          🔥 Vagas limitadas para fundadores
        </div>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight text-ink mb-6">
          Quer travar o preço de fundador?
        </h2>
        <p className="text-ink-soft text-lg md:text-xl mb-10 max-w-xl mx-auto">
          Entre na lista de espera. Vamos conversar antes de cobrar nada — você
          ajuda a moldar o produto e ganha a tarifa de fundador.
        </p>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 text-left max-w-xl mx-auto">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-4">
            Como entrar
          </div>
          <p className="text-ink-soft text-[15px] mb-5 leading-relaxed">
            Por enquanto fazemos isso na mão — manda mensagem ou e-mail
            descrevendo brevemente sua imobiliária/atuação e a gente marca um
            papo de 15 min:
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/?text=Tenho%20interesse%20no%20Habitando%20%E2%80%94%20simulador%20para%20corretores"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green text-white font-semibold px-5 py-3 rounded-md hover:opacity-90 transition-opacity"
            >
              <span aria-hidden>💬</span>
              Mandar mensagem por WhatsApp
            </a>
            <a
              href="mailto:contato@habitando.app?subject=Lista%20de%20espera%20%E2%80%94%20Habitando&body=Ol%C3%A1!%20Sou%20corretor%2Fimobili%C3%A1ria%20%E2%80%94%20conta%20um%20pouco%20do%20produto%3F"
              className="inline-flex items-center justify-center gap-2 bg-card text-ink border border-border font-semibold px-5 py-3 rounded-md hover:bg-paper-alt transition-colors"
            >
              <span aria-hidden>✉️</span>
              Enviar e-mail
            </a>
          </div>
          <p className="text-[12px] text-ink-muted mt-4">
            Resposta em até 1 dia útil. Sem spam, sem cadastro automatizado —
            ainda.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 *  Footer
 * ============================================================ */
function Footer() {
  return (
    <footer className="bg-ink text-white/60 py-10 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[13px]">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent/80">
          Habitando
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/" className="hover:text-white transition-colors">
            Início
          </Link>
          <Link href="/simulador" className="hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
