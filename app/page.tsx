import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Habitando · simule sua primeira casa sem chute",
  description:
    "Calculadora honesta pra quem tá comprando o primeiro imóvel: ato, anuais, INCC, juros de obra, FGTS. 100% local, sem cadastro, grátis pra sempre.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full bg-paper">
      <Hero />
      <ProblemaSection />
      <BeneficiosSection />
      <ComoFuncionaSection />
      <PrecoSection />
      <FAQTeaser />
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
            Simulador
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </div>
      </nav>

      <div className="relative max-w-[1200px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase text-accent border border-accent/40 rounded-full px-3 py-1">
              🏠 Pra quem tá comprando a 1ª casa
            </span>
            <span className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase text-green border border-green/40 rounded-full px-3 py-1">
              🆓 100% grátis · sem cadastro
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6">
            Compre seu primeiro imóvel{" "}
            <span className="text-accent italic">sem chute</span>.
          </h1>
          <p className="text-lg md:text-xl text-[#bcc6d0] leading-relaxed mb-8 max-w-2xl">
            Os corretores te jogam um Excel ou uma tabela. O Habitando mostra o
            cenário inteiro — ato, anuais, INCC, juros de obra, FGTS — mês a
            mês, no número real. Pra você decidir com a cabeça, não com a
            empolgação do plantão.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/simulador"
              className="inline-flex items-center justify-center gap-2 bg-accent text-ink font-semibold px-6 py-3.5 rounded-md hover:bg-accent/90 transition-colors"
            >
              Simular agora
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-[#bcc6d0]">
            <Stat label="INCC + obra" sub="Os números que ninguém te mostra" />
            <Stat label="FGTS no saldo" sub="Veja o impacto de verdade" />
            <Stat label="Compare cenários" sub="Decida com calma" />
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <div className="text-white font-medium">{label}</div>
      <div className="text-[#8fa3b8] text-[12px]">{sub}</div>
    </div>
  );
}

function ProblemaSection() {
  return (
    <section className="bg-paper-alt border-y border-border py-16 md:py-20">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10">
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3 text-center">
          A tabela do plantão esconde mais do que mostra
        </h2>
        <p className="text-center text-ink-soft max-w-2xl mx-auto mb-12">
          A maioria das pessoas assina contrato de imóvel sem entender o que
          vai pagar de fato. O Habitando existe pra mudar isso.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Problema
            icone="❓"
            titulo="Quanto vou pagar de INCC?"
            desc="Aquele percentual que reajusta saldo e parcela todo mês — vira milhares ao longo da obra. Mostramos o impacto cumulativo e por mês."
          />
          <Problema
            icone="📅"
            titulo="E os anuais? E o ato parcelado?"
            desc="O plantão fala 'tem um anual no 12º' mas não soma com o resto. Aqui você vê o pico de cada mês — e se cabe no orçamento."
          />
          <Problema
            icone="🏦"
            titulo="O FGTS abate mesmo o saldo?"
            desc="Depende do que tá no contrato. Simule com e sem, compare, e leve a pergunta certa pro corretor."
          />
        </div>
      </div>
    </section>
  );
}

function Problema({
  icone,
  titulo,
  desc,
}: {
  icone: string;
  titulo: string;
  desc: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="text-3xl mb-3" aria-hidden>
        {icone}
      </div>
      <h3 className="font-serif text-lg text-ink mb-2">{titulo}</h3>
      <p className="text-ink-soft text-[13.5px] leading-relaxed">{desc}</p>
    </div>
  );
}

function BeneficiosSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10">
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3 text-center">
          Tudo num lugar, no número real
        </h2>
        <p className="text-center text-ink-soft max-w-2xl mx-auto mb-12">
          Nada de tabela em PDF que você não consegue editar. Você muda os
          valores, vê o impacto na hora.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Beneficio
            titulo="Cenários reais"
            desc="Ato, parcelas mensais, anuais, custos de cartório, INCC, FGTS, juros de obra (TEO). Tudo entra na conta."
          />
          <Beneficio
            titulo="Compare lado a lado"
            desc="Crie até 4 cenários (imóvel A vs B, ato cheio vs parcelado, com FGTS vs sem) e veja qual sai mais barato no fim."
          />
          <Beneficio
            titulo="Veja o pico mensal"
            desc="Mês com ato, anual e parcela junto pode ser o dobro do mês 'normal'. A gente destaca o pico pra você não ser pego de surpresa."
          />
          <Beneficio
            titulo="100% local"
            desc="Seus cenários ficam no localStorage do seu navegador. Sem servidor, sem conta, sem nada saindo do seu dispositivo."
          />
          <Beneficio
            titulo="Compartilhe por link"
            desc="Clique em Compartilhar e a gente gera um link com o cenário inteiro embutido. Mande pro parceiro, pra família, pra quem comprar junto."
          />
          <Beneficio
            titulo="Relatório em PDF"
            desc="Exporta um relatório completo do cenário pra levar pra família, pro banco ou só pra ler com calma depois."
          />
        </div>
      </div>
    </section>
  );
}

function Beneficio({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div className="bg-paper-alt border border-border rounded-xl p-6">
      <h3 className="font-serif text-lg text-ink mb-2">{titulo}</h3>
      <p className="text-ink-soft text-[13.5px] leading-relaxed">{desc}</p>
    </div>
  );
}

function ComoFuncionaSection() {
  return (
    <section className="bg-paper-alt border-y border-border py-16 md:py-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10">
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-12 text-center">
          Como funciona
        </h2>
        <ol className="space-y-6">
          <Passo
            n={1}
            titulo="Pega a tabela do plantão"
            desc="Anota: valor do imóvel, ato, parcela mensal, anuais, INCC, prazo de obra. Tudo isso vai pra calculadora."
          />
          <Passo
            n={2}
            titulo="Joga os números no simulador"
            desc="Abre /simulador, preenche os campos. Sem cadastro, sem pop-up, sem nada — testa quantos cenários quiser."
          />
          <Passo
            n={3}
            titulo="Compare e decida"
            desc="Cria 2-3 versões (com FGTS, com ato parcelado, etc.), bate o pico mensal contra sua renda real, exporta PDF se quiser."
          />
          <Passo
            n={4}
            titulo="Compartilhe ou volte depois"
            desc="Os cenários ficam salvos no seu navegador. Se quiser mostrar pra alguém, clica em Compartilhar — gera um link com o cenário inteiro embutido."
          />
        </ol>
      </div>
    </section>
  );
}

function Passo({
  n,
  titulo,
  desc,
}: {
  n: number;
  titulo: string;
  desc: string;
}) {
  return (
    <li className="flex gap-5 items-start">
      <span className="shrink-0 w-9 h-9 rounded-full bg-accent text-ink font-mono font-bold flex items-center justify-center">
        {n}
      </span>
      <div>
        <h3 className="font-serif text-lg text-ink mb-1">{titulo}</h3>
        <p className="text-ink-soft text-[14px] leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}

function PrecoSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[700px] mx-auto px-6 md:px-10 text-center">
        <div className="bg-ink text-white rounded-2xl p-10 md:p-14 shadow-lg relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,151,58,.25) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent mb-4">
              Preço
            </div>
            <div className="font-serif text-6xl md:text-7xl mb-3">
              <span className="text-accent">R$ 0</span>
            </div>
            <div className="text-white/80 text-lg mb-6">
              100% grátis. Sempre.
            </div>
            <p className="text-[#bcc6d0] text-[14px] leading-relaxed max-w-md mx-auto">
              Sem assinatura, sem créditos, sem cadastro, sem trial expirando.
              A ferramenta inteira roda no seu navegador. Use à vontade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQTeaser() {
  return (
    <section className="bg-paper-alt border-y border-border py-16">
      <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
          Perguntas comuns
        </h2>
        <p className="text-ink-soft mb-8">
          Aprende mais sobre INCC, ato, anuais, ITBI, FGTS, juros de obra — e
          como tudo isso entra na conta.
        </p>
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 bg-accent text-ink font-semibold px-5 py-3 rounded-md hover:bg-accent/90 transition-colors"
        >
          Ler FAQ completo →
        </Link>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="bg-ink text-white py-16 md:py-20">
      <div className="max-w-[800px] mx-auto px-6 md:px-10 text-center">
        <h2 className="font-serif text-3xl md:text-5xl mb-4">
          Decida com a cabeça,{" "}
          <span className="text-accent italic">não com o plantão</span>.
        </h2>
        <p className="text-[#bcc6d0] mb-8 max-w-xl mx-auto">
          5 minutos no simulador valem mais que 5 horas de tabela. Comece já.
        </p>
        <Link
          href="/simulador"
          className="inline-flex items-center justify-center gap-2 bg-accent text-ink font-semibold px-7 py-4 rounded-md hover:bg-accent/90 transition-colors text-[15px]"
        >
          Simular agora
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10 bg-paper">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-ink-muted">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent">
          Habitando
        </div>
        <div className="flex gap-5">
          <Link href="/simulador" className="hover:text-ink-soft transition-colors">
            Simulador
          </Link>
          <Link href="/faq" className="hover:text-ink-soft transition-colors">
            FAQ
          </Link>
          <Link
            href="/privacidade"
            className="hover:text-ink-soft transition-colors"
          >
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
