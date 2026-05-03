import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ · Consigo comprar?: Imóvel",
  description:
    "Tudo sobre o simulador: INCC, ato parcelado, parcelas anuais, ITBI, TEO bancário, saldo devedor e cenários comparáveis.",
};

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-full bg-paper">
      <Header />
      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 md:px-10 py-10 md:py-16">
        <Hero />

        <Section
          id="incc"
          icon="💸"
          tag="Atenção especial"
          title="INCC — o índice que ninguém te explica direito"
        >
          <FaqItem
            question="O que é o INCC e por que ele importa?"
            defaultOpen
          >
            <p>
              <strong>INCC</strong> é o Índice Nacional de Custos da Construção,
              calculado pela FGV. Reflete a inflação dos materiais e mão-de-obra
              da construção civil no Brasil.
            </p>
            <p>
              Em contratos de imóveis na planta, o INCC corrige mensalmente o
              <strong> saldo devedor</strong> com a construtora. Como a obra
              dura 24-48 meses, mesmo um INCC pequeno (0,5%/mês) gera dezenas
              de milhares de reais em correção até a entrega.
            </p>
          </FaqItem>

          <FaqItem question="Como o INCC é calculado neste simulador?">
            <p>
              <strong>
                Aplicamos a fórmula correta de contrato: INCC mensal = saldo
                devedor × taxa do INCC.
              </strong>
            </p>
            <p>
              Exemplo: saldo de R$ 428.151 com INCC 0,7% = R$ 2.997 de juros
              sobre o saldo no mês. Esse valor pode ser pago pelo cliente junto
              da parcela mensal, ou ficar acumulado no saldo (virando
              financiamento maior na entrega).
            </p>
            <Code>
              {`saldo[m+1] = saldo[m] × (1 + INCC) − parcela_paga[m]
inccDoMes  = saldo[m] × INCC      ← juros do mês`}
            </Code>
            <p>
              Como o saldo amortiza ao longo do tempo, o INCC mensal{" "}
              <strong>diminui</strong> nos últimos meses da obra (se o cliente
              paga o INCC junto). Se o cliente <em>não</em> paga, o saldo cresce
              e o INCC mensal aumenta.
            </p>
          </FaqItem>

          <FaqItem question="Por que isso é diferente dos outros simuladores?">
            <p>
              A maioria dos simuladores faz o cálculo errado:
              <code className="font-mono text-[12px] bg-paper-alt px-1.5 py-0.5 rounded mx-1">
                parcela_base × (1 + INCC)^mês
              </code>
              . Eles aplicam o INCC sobre cada parcela individualmente como se
              fosse uma correção monetária simples.
            </p>
            <p>
              Resultado: a parcela exibida cresce devagar (R$ 1.644 → R$ 1.923
              em 35 meses), mas a realidade é que o INCC do mês 1 sozinho pode
              ser <strong>R$ 2.997</strong> sobre o saldo de R$ 428k. O cliente
              vê uma simulação otimista e descobre na hora da entrega que o
              financiamento bancário será R$ 50-100k maior que o esperado.
            </p>
          </FaqItem>

          <FaqItem question="Quem paga o INCC: o cliente ou o saldo?">
            <p>
              Você escolhe o modo no formulário. Os dois caminhos têm impacto
              financeiro diferente:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cliente paga mensalmente</strong> (default): cliente
                desembolsa <em>parcela base + INCC do mês</em>. Saldo amortiza
                conforme contrato. Financiamento na entrega ≈ valor original.
              </li>
              <li>
                <strong>Saldo absorve o INCC</strong>: cliente paga só a
                parcela base. INCC infla o saldo silenciosamente. Financiamento
                bancário na entrega sai <strong>maior</strong> que o esperado
                (ex.: +R$ 60-80k).
              </li>
            </ul>
            <p>
              O parecer da simulação destaca quanto vai "para o saldo" se você
              escolher o segundo modo.
            </p>
          </FaqItem>

          <FaqItem question="Que valor de INCC devo usar?">
            <p>
              Default da app: <strong>0,7%/mês</strong> (previsão meio-termo do
              mercado). Para referência:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Mediana FGV últimos 5 anos:</strong> ~0,45%/mês
              </li>
              <li>
                <strong>Pior período (2021-2022):</strong> picos de 1,5%/mês
              </li>
              <li>
                <strong>2024-2025:</strong> média de 0,5-0,7%/mês
              </li>
            </ul>
            <p>
              <strong>Cuidado com a unidade!</strong> Use sempre decimal:
              0,007 = 0,7%/mês. Digitar 0,7 (sem o zero) significa 70%/mês — o
              simulador valida e exibe aviso. Você pode digitar até 5 casas
              decimais para ser preciso (ex.: 0,00467).
            </p>
          </FaqItem>

          <FaqItem question="O INCC para após a entrega das chaves?">
            <p>
              Sim — após a entrega, o saldo restante vira financiamento
              bancário (CEF/SBPE). Esse financiamento é corrigido pela{" "}
              <strong>TR + juros</strong>, não mais pelo INCC. O INCC só atua
              durante a fase de obra.
            </p>
            <p>
              Por isso o simulador mostra o <strong>saldo final</strong> (quanto
              vira financiamento bancário) e a <strong>parcela pós-entrega</strong>{" "}
              (vinda da simulação Caixa).
            </p>
          </FaqItem>
        </Section>

        <Section id="ato" icon="✍️" title="Ato (sinal) e suas variações">
          <FaqItem question="O que é o ato?">
            <p>
              Ato é o <strong>sinal pago à construtora na assinatura</strong> do
              contrato. Geralmente 5-10% do valor do imóvel. É separado das
              parcelas mensais.
            </p>
          </FaqItem>

          <FaqItem question="O ato pode ser parcelado?">
            <p>
              Sim. Algumas construtoras permitem parcelar o sinal em 2-6 vezes.
              Mas <strong>atenção</strong>: nesses meses, a parcela mensal fica{" "}
              <em>suspensa</em> — você paga só o ato. Isso protege o cliente de
              um pico de pagamento no início.
            </p>
            <p>
              Exemplo: ato R$ 20.000 em 3× → m1, m2, m3 você paga R$ 6.667 cada
              (ato), mensal R$ 0. A partir do m4 começam as parcelas mensais.
              Como sobram só 32 meses para mensais (em vez de 35), a parcela
              sobe automaticamente para fechar a entrada.
            </p>
            <p>
              O simulador mostra um aviso âmbar "💡 Parcela mensal sugerida"
              quando detecta que sua parcela atual não bate com o cálculo
              correto.
            </p>
          </FaqItem>

          <FaqItem question="Ato 1× (à vista) é diferente?">
            <p>
              Sim. Ato à vista (1×) é pago no <strong>m0</strong> (assinatura) e
              abate o saldo devedor inicial junto com o FGTS. As parcelas
              mensais começam normalmente no m1 — não há suspensão.
            </p>
          </FaqItem>

          <FaqItem question="O ato é corrigido pelo INCC?">
            <p>
              <strong>Geralmente não</strong>, quando pago à vista no momento da
              assinatura. Mas se o ato for parcelado e cair em meses
              posteriores, alguns contratos preveem correção pelo INCC do mês.
              Você pode marcar "Corrige INCC: Sim" no formulário caso seu
              contrato preveja.
            </p>
          </FaqItem>
        </Section>

        <Section id="anuais" icon="📅" title="Parcelas anuais (reforço)">
          <FaqItem question="Por que existe parcela anual?">
            <p>
              Construtoras gostam de "reforços" anuais para reduzir as parcelas
              mensais regulares. O cliente paga R$ 5-10k uma vez por ano, e em
              troca a mensal fica menor.
            </p>
            <p>
              Tradicionalmente cai em <strong>Dezembro</strong>, casando com o
              13º salário do cliente. O simulador detecta isso automaticamente:
              você diz "todo Dezembro" e ele calcula em quais meses do contrato
              cai (m8, m20, m32 se o contrato começa em Maio, por exemplo).
            </p>
          </FaqItem>

          <FaqItem question="Posso configurar de outras formas?">
            <p>Sim, há 3 modos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Todo mês X</strong> (default Dezembro): incide em todo
                ocorrência daquele mês durante a obra.
              </li>
              <li>
                <strong>A cada N meses</strong>: começando no mês X, repete
                a cada N. Ex.: cada 6 meses começando em m6.
              </li>
              <li>
                <strong>Meses específicos</strong>: você marca manualmente quais
                meses recebem o reforço.
              </li>
            </ul>
          </FaqItem>

          <FaqItem question="Por que limitamos a 1 parcela anual?">
            <p>
              Para simplificar a UX. Na prática, contratos com mais de uma
              "anual" são raros — quando há, é mais comum ter o ato + uma
              anual + parcelas mensais. Se você precisar de múltiplas, use o
              modo "meses específicos" para combinar tudo.
            </p>
          </FaqItem>
        </Section>

        <Section id="itbi" icon="📄" title="ITBI e custos cartoriais">
          <FaqItem question="O que entra nos custos cartoriais?">
            <p>
              <strong>ITBI</strong> (Imposto de Transmissão de Bens Imóveis) +
              registro em cartório + emolumentos + outras taxas. Tudo pago no
              <strong> registro do imóvel</strong>, normalmente na entrega.
            </p>
          </FaqItem>

          <FaqItem question="Quanto custa?">
            <p>O ITBI varia por município:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>São Paulo capital: 3%</li>
              <li>Osasco, Carapicuíba, Guarulhos: 4%</li>
              <li>Barueri, Santana de Parnaíba: 5%</li>
            </ul>
            <p>
              Cartórios e taxas adicionais somam <strong>~3%</strong> do valor.
              Total típico: 6-8% do imóvel.
            </p>
          </FaqItem>

          <FaqItem question="Posso diluir nas parcelas mensais?">
            <p>
              Sim — o simulador permite. Em vez de pagar de uma vez na entrega,
              você divide o total em N parcelas mensais durante a obra. Vira
              uma "provisão" que entra no fluxo de caixa mensal.
            </p>
            <p>
              <strong>Atenção</strong>: se o ato for parcelado em N meses, as
              parcelas da documentação são automaticamente deslocadas para
              começarem após o último mês de ato (para não sobrecarregar o
              orçamento).
            </p>
          </FaqItem>

          <FaqItem question="Há 3 modos de cálculo. Qual escolher?">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Por alíquota</strong>: você pesquisou no município
                (ex.: 5%) e quer o cálculo automático. Pode incluir ~3% de
                cartórios.
              </li>
              <li>
                <strong>Valor total</strong>: você já tem o orçamento real do
                cartório, com tudo somado.
              </li>
              <li>
                <strong>Itemizado</strong>: máxima transparência — ITBI,
                cartório, taxas e outras despesas em campos separados.
              </li>
            </ul>
          </FaqItem>
        </Section>

        <Section id="teo" icon="🏦" title="TEO — taxa bancária durante a obra">
          <FaqItem question="O que é a TEO?">
            <p>
              <strong>TEO</strong> = Taxa de Evolução de Obra. Cobrada{" "}
              <strong>pelo banco</strong> durante a fase de obra, proporcional
              ao % concluído da construção. Aparece nos boletos junto com a
              parcela da construtora.
            </p>
          </FaqItem>

          <FaqItem question="Como é calculada?">
            <p>
              <strong>TEO mensal = parcela pós-entrega × % acumulado de obra</strong>
            </p>
            <p>
              Exemplo: parcela pós-entrega de R$ 2.996 (vinda da simulação CEF)
              e obra com 15% concluído acumulado → TEO = R$ 449/mês.
            </p>
            <Code>
              {`m1   (1% acum):   2.996 × 1%   = R$ 30
m12 (40% acum):   2.996 × 40%  = R$ 1.198
m35 (95% acum):   2.996 × 95%  = R$ 2.846  ← teto`}
            </Code>
          </FaqItem>

          <FaqItem question="Por que o teto é 95%?">
            <p>
              Convenção da aplicação. Em contratos reais, a curva de evolução
              chega a 95-100% antes da entrega. Limitamos a 95% para evitar
              cenários irrealistas (ex.: 100%+ acumulado).
            </p>
          </FaqItem>

          <FaqItem question="O que são as curvas Linear / Progressivo / Customizado?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Linear</strong>: mesma % todos os meses (95÷N). Modelo
                simplificado.
              </li>
              <li>
                <strong>Progressivo</strong> (default): lenta no início
                (fundação), acelera no meio (alvenaria), desacelera no fim
                (acabamento). Padrão de obras reais.
              </li>
              <li>
                <strong>Customizado</strong>: você define o % de cada mês
                manualmente.
              </li>
            </ul>
          </FaqItem>
        </Section>

        <Section id="saldo" icon="💰" title="Saldo devedor e financiamento">
          <FaqItem question="O que é o saldo inicial?">
            <p>
              <strong>Saldo inicial = valor do imóvel − ato − FGTS</strong>{" "}
              (quando o FGTS é configurado para abater no início).
            </p>
            <p>
              Exemplo: imóvel R$ 460k, ato R$ 20k, FGTS R$ 12k → saldo inicial
              R$ 428k.
            </p>
          </FaqItem>

          <FaqItem question="O que é o saldo final?">
            <p>
              É quanto sobra de saldo devedor com a construtora ao final da
              obra — o valor que <strong>vira o financiamento bancário</strong>.
              No mundo ideal, ele bate com o "valor financiado" da simulação
              CEF que você usou de referência.
            </p>
            <p>
              Quando bate: tudo certo. Quando o saldo final é{" "}
              <strong>maior</strong>: você está pagando menos do que o INCC
              corrige (modo &quot;saldo absorve INCC&quot;). O financiamento real
              sai mais alto que o simulado.
            </p>
          </FaqItem>

          <FaqItem question="Por que o FGTS pode ser usado de duas formas?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>FGTS abate o saldo (default)</strong>: aplicado junto
                com o ato no m0, reduzindo o saldo desde o início.
              </li>
              <li>
                <strong>FGTS guardado para a entrega</strong>: usado para abater
                o financiamento bancário no momento da assinatura do crédito.
                Algumas pessoas preferem essa estratégia.
              </li>
            </ul>
          </FaqItem>
        </Section>

        <Section id="cenarios" icon="⚖️" title="Cenários e comparativo">
          <FaqItem question="Quantos cenários posso criar?">
            <p>
              Até <strong>4 cenários</strong> simultâneos. Cada um tem sua
              configuração independente. Você pode renomear (duplo clique na
              tab), duplicar, e remover.
            </p>
          </FaqItem>

          <FaqItem question="Como o comparativo funciona?">
            <p>
              A aba "⚖️ Comparar" mostra cards lado a lado com os valores-chave,
              5 critérios em barras horizontais (Total geral, Pico anual, Mês
              normal máx, Documentação, Ato), gráfico comparativo de
              desembolso mensal e parecer dizendo qual cenário ganha em cada
              quesito.
            </p>
          </FaqItem>
        </Section>

        <Section id="privacidade" icon="🔒" title="Privacidade e dados">
          <FaqItem question="Meus dados ficam salvos onde?">
            <p>
              <strong>Localmente, no seu navegador</strong>, em{" "}
              <code className="font-mono text-[12px]">localStorage</code>.
              Nada vai para nenhum servidor — o app é uma SPA estática que
              roda 100% no client.
            </p>
          </FaqItem>

          <FaqItem question="Posso compartilhar uma simulação?">
            <p>
              Sim. Clique em "Compartilhar" no header — gera um URL com a
              configuração completa (compactada com lz-string). Quem abrir o
              link vê exatamente a mesma simulação que você. Não precisa criar
              conta nem cadastrar e-mail.
            </p>
          </FaqItem>

          <FaqItem question="Como limpo tudo?">
            <p>
              No header, "Resetar cenário" zera o cenário ativo. "Limpar tudo"
              remove todos os cenários e descarta o localStorage — começa do
              zero.
            </p>
          </FaqItem>

          <FaqItem question="O link compartilhado tem alguma data de expiração?">
            <p>
              Não. O conteúdo da simulação está no próprio URL (não há
              servidor). Funciona enquanto a aplicação existir e o navegador
              suportar a versão do schema. Há migrators que cuidam de URLs
              antigos automaticamente.
            </p>
          </FaqItem>
        </Section>

        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/* ============================================================
 *  Componentes da página
 * ============================================================ */

function Header() {
  return (
    <header className="bg-ink text-white border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80 transition-colors"
        >
          Consigo comprar?: Imóvel
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/80">
          <Link href="/" className="hover:text-white transition-colors">
            Início
          </Link>
          <Link href="/simulador" className="hover:text-white transition-colors">
            Simulador
          </Link>
          <Link href="/faq" className="text-white">
            FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="mb-12">
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-muted mb-3">
        Documentação
      </div>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight text-ink mb-4">
        Perguntas frequentes
      </h1>
      <p className="text-ink-soft text-lg leading-relaxed max-w-2xl">
        Tudo que você precisa saber sobre o simulador, com atenção especial
        para o <strong className="text-ink">INCC</strong> — o índice que faz a
        diferença entre uma simulação honesta e uma surpresa na entrega.
      </p>

      <nav className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12.5px]">
        <NavLink href="#incc" emoji="💸">INCC</NavLink>
        <NavLink href="#ato" emoji="✍️">Ato</NavLink>
        <NavLink href="#anuais" emoji="📅">Anuais</NavLink>
        <NavLink href="#itbi" emoji="📄">ITBI</NavLink>
        <NavLink href="#teo" emoji="🏦">TEO</NavLink>
        <NavLink href="#saldo" emoji="💰">Saldo</NavLink>
        <NavLink href="#cenarios" emoji="⚖️">Cenários</NavLink>
        <NavLink href="#privacidade" emoji="🔒">Privacidade</NavLink>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  emoji,
  children,
}: {
  href: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card hover:border-ink-soft hover:bg-paper-alt/40 text-ink-soft transition-colors"
    >
      <span aria-hidden>{emoji}</span>
      <span>{children}</span>
    </a>
  );
}

function Section({
  id,
  icon,
  tag,
  title,
  children,
}: {
  id: string;
  icon: string;
  tag?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 mb-12 md:mb-16">
      {tag && (
        <div className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase text-accent border border-accent/40 rounded-full px-2.5 py-1 mb-3">
          ⭐ {tag}
        </div>
      )}
      <h2 className="font-serif text-2xl md:text-3xl text-ink mb-5 flex items-center gap-3">
        <span aria-hidden className="text-3xl">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FaqItem({
  question,
  defaultOpen = false,
  children,
}: {
  question: string;
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
          {question}
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

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-ink text-white/90 rounded-md px-4 py-3 text-[12px] font-mono overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function CTA() {
  return (
    <div className="rounded-xl bg-ink text-white p-8 md:p-10 mt-16 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,151,58,.25) 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        <h2 className="font-serif text-2xl md:text-3xl mb-3">
          Pronto para colocar os números no papel?
        </h2>
        <p className="text-[#bcc6d0] mb-6 max-w-xl">
          Cinco minutos preenchendo um cenário e você sai com a confiança de
          quem leu o contrato antes de assinar.
        </p>
        <Link
          href="/simulador"
          className="inline-flex items-center gap-2 bg-accent text-ink font-semibold px-6 py-3 rounded-md hover:bg-accent/90 transition-colors"
        >
          Abrir o simulador
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-white/60 py-8 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[13px]">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent/80">
          Consigo comprar?: Imóvel
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/" className="hover:text-white transition-colors">
            Início
          </Link>
          <Link href="/simulador" className="hover:text-white transition-colors">
            Simulador
          </Link>
          <Link href="/faq" className="text-white">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
