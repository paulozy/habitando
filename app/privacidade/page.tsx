import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Política de privacidade do Habitando — quais dados coletamos, por que, e como você pode apagar.",
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
          <Link
            href="/faq"
            className="text-sm text-white/80 hover:text-white"
          >
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

        <Section titulo="Quem é o controlador">
          <p>
            <strong>Habitando</strong> (esta aplicação) é o controlador dos
            dados pessoais coletados aqui. Para qualquer dúvida, exercício de
            direito (acesso, exclusão, portabilidade) ou denúncia, entre em
            contato:
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

        <Section titulo="Quais dados coletamos">
          <h3>Sobre o corretor (usuário do sistema)</h3>
          <ul>
            <li>Nome, e-mail e senha (login)</li>
            <li>WhatsApp (opcional, pra aparecer no link compartilhado)</li>
            <li>
              Branding: logo, cor primária, tagline e slug (escolhidos no
              perfil)
            </li>
            <li>Cenários de simulação que você cria</li>
          </ul>

          <h3>Sobre o cliente (quem abre seu link)</h3>
          <ul>
            <li>
              <strong>Apenas se voluntariamente</strong> preencher o formulário
              "Quer receber o resumo em PDF?":
              <ul>
                <li>Nome (opcional)</li>
                <li>E-mail OU WhatsApp (um dos dois é obrigatório)</li>
                <li>
                  Snapshot dos números do cenário no momento do envio (pra
                  contexto)
                </li>
              </ul>
            </li>
            <li>
              User-agent do navegador e momento do consentimento (pra
              auditabilidade da LGPD)
            </li>
          </ul>
          <p>
            Não usamos cookies de tracking, analytics de terceiros ou
            fingerprinting.
          </p>
        </Section>

        <Section titulo="Por que coletamos">
          <ul>
            <li>
              <strong>Corretor</strong>: prestar o serviço de simulação imobiliária
              com sua marca, salvar seus cenários, e identificar você como dono
              dos links compartilhados (execução de contrato — Art. 7º, V LGPD)
            </li>
            <li>
              <strong>Cliente</strong>: permitir que o corretor envie o
              resumo em PDF e tire dúvidas sobre o imóvel proposto
              (consentimento explícito — Art. 7º, I LGPD)
            </li>
          </ul>
        </Section>

        <Section titulo="Com quem compartilhamos">
          <ul>
            <li>
              Os dados do cliente que deixou contato são visíveis{" "}
              <strong>apenas pro corretor que compartilhou o link</strong>{" "}
              naquele cenário específico
            </li>
            <li>
              Hospedagem e banco de dados: <strong>Supabase</strong>{" "}
              (infraestrutura) e <strong>Vercel</strong> (frontend). Esses
              fornecedores têm seus próprios termos LGPD-compliant
            </li>
            <li>
              Não vendemos, alugamos ou trocamos dados com terceiros pra
              marketing
            </li>
          </ul>
        </Section>

        <Section titulo="Por quanto tempo guardamos">
          <ul>
            <li>
              <strong>Conta do corretor</strong>: enquanto a conta estiver
              ativa. Quando excluída, todos os dados associados (cenários,
              leads, branding) são apagados em até 30 dias.
            </li>
            <li>
              <strong>Leads (clientes)</strong>: até 90 dias após criação,
              após o que são purgados automaticamente — exceto se o corretor
              ainda mantiver a conta E o link ainda for válido.
            </li>
            <li>
              <strong>Logs de acesso</strong>: até 30 dias (padrão Supabase).
            </li>
          </ul>
        </Section>

        <Section titulo="Seus direitos (LGPD Art. 18)">
          <ul>
            <li>
              <strong>Acesso</strong>: pedir cópia dos dados que temos sobre
              você
            </li>
            <li>
              <strong>Correção</strong>: corrigir dados imprecisos
            </li>
            <li>
              <strong>Exclusão</strong>: pedir pra apagar dados
            </li>
            <li>
              <strong>Portabilidade</strong>: receber seus dados em formato
              estruturado
            </li>
            <li>
              <strong>Revogação de consentimento</strong>: parar o tratamento
              que dependia de consentimento
            </li>
          </ul>
          <p>
            Pra exercer qualquer um deles, mande e-mail pra{" "}
            <a
              href="mailto:dev.pa.aabreu18@gmail.com"
              className="text-accent underline hover:text-accent/80"
            >
              dev.pa.aabreu18@gmail.com
            </a>{" "}
            com seu nome e o e-mail/WhatsApp que você usou. Respondemos em
            até 15 dias úteis.
          </p>
        </Section>

        <Section titulo="Segurança">
          <ul>
            <li>HTTPS em todas as comunicações</li>
            <li>
              Senhas armazenadas com hashing forte (Supabase Auth, padrão
              bcrypt)
            </li>
            <li>
              Row-level security (RLS) garante que cada usuário só acessa os
              próprios dados
            </li>
            <li>
              Backups diários do banco de dados (Supabase managed)
            </li>
          </ul>
        </Section>

        <Section titulo="Mudanças nesta política">
          <p>
            Se mudarmos algo material, atualizamos a data no topo e
            notificamos os usuários ativos por e-mail. Mudanças menores
            (typo, clarification) podem ir sem aviso.
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
        .prose-habitando h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-ink);
          margin-top: 1rem;
          margin-bottom: 0.4rem;
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
        .prose-habitando ul ul {
          margin-top: 0.25rem;
          padding-left: 1.5rem;
          list-style: circle;
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
