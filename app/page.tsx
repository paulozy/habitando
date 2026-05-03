import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulação Financeira Imobiliária · Compre na planta sem surpresas",
  description:
    "Simulador completo com INCC sobre saldo devedor, ato parcelado, ITBI, FGTS e múltiplos cenários comparáveis. Veja exatamente quanto você vai pagar mês a mês.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full bg-paper">
      <Hero />
      <ProblemaSection />
      <FeaturesSection />
      <ComoFuncionaSection />
      <CTAFinal />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <header className="bg-ink text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,151,58,.30) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(26,86,219,.20) 0%, transparent 70%)",
        }}
      />

      <nav className="relative max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent">
          Simulação Financeira
        </div>
        <div className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link
            href="/simulador"
            className="hover:text-white transition-colors"
          >
            Abrir simulador →
          </Link>
        </div>
      </nav>

      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase text-accent border border-accent/40 rounded-full px-3 py-1 mb-6">
            🏗️ Imóvel na planta · sem letras miúdas
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6">
            Compre seu imóvel{" "}
            <span className="text-accent italic">sem surpresas</span> com o
            financiamento.
          </h1>
          <p className="text-lg md:text-xl text-[#bcc6d0] leading-relaxed mb-8 max-w-2xl">
            Simulador honesto que mostra exatamente quanto você vai pagar mês a
            mês — com INCC sobre saldo devedor, ato parcelado, ITBI diluído e
            cenários comparáveis lado a lado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center gap-2 bg-accent text-ink font-semibold px-6 py-3.5 rounded-md hover:bg-accent/90 transition-colors"
            >
              Começar a simular
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 text-white border border-white/20 px-6 py-3.5 rounded-md hover:bg-white/10 transition-colors"
            >
              Como funciona
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-[#bcc6d0]">
            <Stat label="100% privado" sub="Roda no seu navegador" />
            <Stat label="Sem cadastro" sub="Sem e-mail, sem login" />
            <Stat label="Compartilhe por link" sub="URL com a simulação" />
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

function ProblemaSection() {
  return (
    <section className="bg-paper-alt/40 py-20 md:py-28 border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4">
              O problema
            </div>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-6">
              Os simuladores que você encontrou{" "}
              <em className="text-accent">mentem</em> sobre o INCC.
            </h2>
            <p className="text-ink-soft text-lg leading-relaxed mb-4">
              A maioria multiplica sua parcela base por uma porcentagem fixa. O
              corretor te mostra a parcela &quot;de hoje&quot; e a entrega é uma
              surpresa.
            </p>
            <p className="text-ink-soft text-lg leading-relaxed">
              Aqui o INCC é aplicado sobre o{" "}
              <strong className="text-ink">saldo devedor</strong> a cada mês —
              do jeito que o contrato realmente funciona. Você vê o INCC chegar
              a R$ 1.600+ nas primeiras parcelas e diminuir conforme o saldo
              amortiza.
            </p>
          </div>

          <div className="rounded-xl bg-ink text-white p-6 font-mono text-[12.5px] leading-relaxed shadow-xl border border-border/40">
            <div className="text-accent mb-3 text-[10px] tracking-[0.18em] uppercase">
              Exemplo · Imóvel R$ 460k · INCC 0,7%
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8fa3b8]">Saldo devedor m1</span>
                <span>R$ 428.151</span>
              </div>
              <div className="flex justify-between text-violet-soft">
                <span className="text-[#8fa3b8]">INCC mês 1 (saldo × 0,7%)</span>
                <span className="font-bold">R$ 2.997</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa3b8]">Parcela base + INCC</span>
                <span>R$ 1.976 + R$ 2.997</span>
              </div>
              <div className="border-t border-white/15 my-2" />
              <div className="flex justify-between">
                <span className="text-[#8fa3b8]">TEO m35 (parcela × 95%)</span>
                <span>R$ 2.846</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8fa3b8]">Saldo final</span>
                <span className="text-accent font-bold">R$ 338.000</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/15 text-[#8fa3b8] text-[11px]">
              Nenhum simulador comum mostra essa quebra. A maioria esconde
              R$ 50-100k em correção monetária.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: "💰",
      title: "INCC sobre saldo devedor",
      desc: "Cálculo correto do contrato: o INCC mensal incide sobre o saldo, não sobre a parcela. Você decide se paga junto ou se vira financiamento maior.",
    },
    {
      icon: "✍️",
      title: "Ato à vista ou parcelado",
      desc: "Pague o sinal em 1×, 3× ou N×. O sistema sugere automaticamente quanto sua parcela mensal precisa ser para fechar a entrada — porque parcelar o ato suspende mensais.",
    },
    {
      icon: "📅",
      title: "Anuais inteligentes",
      desc: "Configure o reforço como 'todo Dezembro' (auto-detectado pela data do contrato), 'a cada N meses' ou meses específicos. Sem precisar contar manualmente.",
    },
    {
      icon: "📄",
      title: "ITBI + cartórios",
      desc: "Calcule por alíquota (5%, 3%, 4%), valor total ou itemizado. Decida se dilui nas parcelas mensais ou paga à vista na entrega.",
    },
    {
      icon: "⚖️",
      title: "Compare até 4 cenários",
      desc: "Teste imóvel A vs B, ato 1× vs 3×, INCC 0,5% vs 0,7%. Veja lado a lado em barras qual sai melhor em cada quesito.",
    },
    {
      icon: "🔗",
      title: "Compartilhe por link",
      desc: "Toda a simulação cabe num único URL. Mande pro corretor, pra família, pro contador. Ninguém precisa instalar nada nem criar conta.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-paper">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-4">
          O que você consegue
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-3 max-w-2xl">
          Tudo que o seu corretor não te mostrou.
        </h2>
        <p className="text-ink-soft text-lg max-w-2xl mb-12">
          Configurações que cobrem o cenário real de um contrato com construtora
          e financiamento bancário pós-entrega.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl bg-card border border-border p-6 hover:border-ink-soft transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-serif text-xl text-ink mb-2">{f.title}</h3>
              <p className="text-ink-soft text-[14px] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFuncionaSection() {
  const steps = [
    {
      n: "01",
      title: "Preencha os dados do contrato",
      desc: "Valor do imóvel, financiamento bancário, FGTS, parcela mensal, ato, anuais, INCC e ITBI. Tudo configurável — começa do zero.",
    },
    {
      n: "02",
      title: "Veja o fluxo mês a mês",
      desc: "Tabela com 15 colunas mostra saldo, INCC, parcela base + INCC, TEO, ato, anual, documentação e total de cada mês. Indicadores em tempo real.",
    },
    {
      n: "03",
      title: "Compare cenários e compartilhe",
      desc: "Crie até 4 cenários paralelos. Veja o gráfico de barras lado a lado. Copie o link e mande para quem precisar opinar.",
    },
  ];

  return (
    <section
      id="como-funciona"
      className="py-20 md:py-28 bg-ink text-white relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(201,151,58,.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          Como funciona
        </div>
        <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-12 max-w-2xl">
          Três passos. Sem cadastro, sem e-mail, sem download.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="font-serif text-6xl text-accent/30 leading-none mb-4">
                {s.n}
              </div>
              <h3 className="font-serif text-xl mb-2">{s.title}</h3>
              <p className="text-[#bcc6d0] text-[14.5px] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="py-24 md:py-32 bg-paper">
      <div className="max-w-[1000px] mx-auto px-6 md:px-10 text-center">
        <h2 className="font-serif text-4xl md:text-5xl leading-tight text-ink mb-6">
          Pronto para descobrir{" "}
          <span className="italic text-accent">o número real</span>?
        </h2>
        <p className="text-ink-soft text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Cinco minutos preenchendo, e você sai com a confiança de quem leu o
          contrato antes de assinar.
        </p>
        <Link
          href="/simulador"
          className="inline-flex items-center justify-center gap-2 bg-ink text-white font-semibold px-8 py-4 rounded-md hover:bg-ink-soft transition-colors text-lg"
        >
          Abrir o simulador
          <span aria-hidden>→</span>
        </Link>
        <div className="mt-6 text-[12.5px] text-ink-muted">
          Roda no navegador · Sem cadastro · Compartilhe por link
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-white/60 py-10 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[13px]">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent/80">
          Simulação Financeira
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/simulador" className="hover:text-white transition-colors">
            Simulador
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <span className="text-white/30">
            App estático · 100% no seu navegador
          </span>
        </div>
      </div>
    </footer>
  );
}
