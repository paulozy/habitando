import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Política de privacidade do Habitando — não coletamos nada. Seus dados ficam no seu navegador.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-full bg-paper">
      <header className="bg-ink text-white">
        <div className="max-w-[800px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-[12px] tracking-[0.2em] uppercase text-accent hover:text-accent/80"
          >
            Habitando
          </Link>
          <Link href="/faq" className="text-sm text-white/80 hover:text-white">
            FAQ
          </Link>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 md:px-10 py-12 prose-habitando">
        <h1 className="font-serif text-4xl text-ink mb-2">
          Política de Privacidade
        </h1>
        <p className="text-ink-soft text-sm mb-10">
          Última atualização: maio de 2026
        </p>

        <Section titulo="Resumo">
          <p>
            <strong>Não coletamos nada.</strong> O Habitando roda 100% no seu
            navegador. Não tem conta, não tem servidor, não tem analytics, não
            tem cookies de tracking. Você abre o site, simula, fecha — nada
            sai do seu dispositivo.
          </p>
        </Section>

        <Section titulo="Onde os dados ficam">
          <p>
            Seus cenários (valores do imóvel, renda, gastos, configurações de
            financiamento) ficam no <strong>localStorage</strong> do seu
            navegador, sob a chave{" "}
            <code className="font-mono text-[12px] bg-paper-alt px-1.5 py-0.5 rounded">
              can-i-buy:scenarios
            </code>
            . Se você limpar o histórico do navegador, os cenários somem
            junto.
          </p>
          <p>
            Se quiser fazer backup ou abrir do celular, use o botão{" "}
            <strong>Compartilhar</strong> no simulador — gera um link com o
            cenário inteiro embutido na própria URL (compactado). Salva esse
            link no e-mail, no bookmark ou onde preferir.
          </p>
        </Section>

        <Section titulo="O que NÃO fazemos">
          <ul>
            <li>Não pedimos cadastro nem login.</li>
            <li>Não usamos cookies de tracking.</li>
            <li>Não rodamos analytics (nem Google, nem Vercel, nem nada).</li>
            <li>Não temos servidor que receba seus dados.</li>
            <li>
              Não compartilhamos nada com terceiros porque não temos nada
              pra compartilhar.
            </li>
          </ul>
        </Section>

        <Section titulo="Hospedagem">
          <p>
            O site é estático e fica numa CDN. A CDN registra logs técnicos
            básicos (IP, user-agent, URL acessada) por questões operacionais
            — esses logs não são lidos por nós e seguem a política do
            provedor de CDN. Nenhum dado dos seus cenários passa por nenhum
            servidor.
          </p>
        </Section>

        <Section titulo="Contato">
          <p>
            Mesmo sem coletar dados, ficamos disponíveis pra qualquer dúvida
            sobre a ferramenta:
          </p>
          <p>
            E-mail:{" "}
            <a
              href="mailto:dev.pa.aabreu18@gmail.com"
              className="text-accent underline hover:text-accent/80"
            >
              dev.pa.aabreu18@gmail.com
            </a>
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-border text-[13px] text-ink-soft">
          <Link href="/" className="text-accent hover:text-accent/80 underline">
            ← Voltar ao Habitando
          </Link>
        </div>
      </main>

      <style>{`
        .prose-habitando h2 {
          font-family: var(--font-serif);
          font-size: 22px;
          color: var(--color-ink);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .prose-habitando p {
          color: var(--color-ink-soft);
          line-height: 1.65;
          margin: 0.75rem 0;
        }
        .prose-habitando ul {
          color: var(--color-ink-soft);
          line-height: 1.65;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          list-style: disc;
        }
        .prose-habitando li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}

function Section({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
