import {
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import * as fs from "node:fs/promises";

/**
 * Walkthrough completo v2 — cobre auth + white-label + leads.
 *
 * Estrutura:
 *  Setup (sem vídeo): login com user de teste, salva storageState
 *  Parte 1 (vídeo):  corretor /perfil → simulador → compartilhar (vanity URL)
 *  Parte 2 (vídeo):  cliente abre vanity URL → orçamento → CTA leads
 *  Parte 3 (vídeo):  corretor /leads → criar cenário pra lead → resposta rápida
 *
 * Usa env vars DEMO_USER_EMAIL / DEMO_USER_PASSWORD (em web/.env, gitignored).
 */

const SHARE_URL_FILE = "demo/.share-url.txt";
const AUTH_STATE_FILE = "demo/.auth-state.json";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL;
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD;

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  throw new Error(
    "DEMO_USER_EMAIL e DEMO_USER_PASSWORD precisam estar em web/.env",
  );
}

const beat = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
 *  Cursor highlight injection (igual versão anterior)
 * ============================================================ */
function injectCursorHighlight(context: BrowserContext) {
  return context.addInitScript(() => {
    if ((window as unknown as { __cursorInjected?: boolean }).__cursorInjected)
      return;
    (window as unknown as { __cursorInjected: boolean }).__cursorInjected =
      true;
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      width: "24px",
      height: "24px",
      background: "rgba(201,151,58,0.45)",
      border: "2px solid rgba(201,151,58,0.95)",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "translate(-50%,-50%)",
      transition: "transform 80ms linear",
      boxShadow: "0 0 12px rgba(201,151,58,0.6)",
    } as Partial<CSSStyleDeclaration>);
    document.documentElement.appendChild(dot);
    document.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
      },
      { capture: true },
    );
    const style = document.createElement("style");
    style.textContent = `
      @keyframes cursorClickRing {
        from { opacity: 1; transform: translate(-50%,-50%) scale(0.4); }
        to   { opacity: 0; transform: translate(-50%,-50%) scale(1.8); }
      }
    `;
    document.head.appendChild(style);
    document.addEventListener(
      "click",
      (e: MouseEvent) => {
        const ring = document.createElement("div");
        Object.assign(ring.style, {
          position: "fixed",
          left: `${e.clientX}px`,
          top: `${e.clientY}px`,
          width: "48px",
          height: "48px",
          border: "3px solid rgba(201,151,58,1)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: "2147483646",
          animation: "cursorClickRing 600ms ease-out forwards",
        } as Partial<CSSStyleDeclaration>);
        document.documentElement.appendChild(ring);
        setTimeout(() => ring.remove(), 700);
      },
      { capture: true },
    );
  });
}

/**
 * Field input helper — encontra `<input>` dentro de um <Field label="...">.
 */
function fieldInput(page: Page, label: string) {
  return page
    .locator("label", { hasText: label })
    .locator("xpath=..")
    .locator("input")
    .first();
}

/**
 * Override window.open pra navegar na MESMA aba (mais limpo pra demo —
 * em uso real, o corretor abre nova aba, mas isso quebra o fluxo do vídeo).
 */
async function overrideWindowOpen(page: Page) {
  await page.evaluate(() => {
    window.open = ((url: string | URL | undefined) => {
      if (url) {
        window.location.href = String(url);
      }
      return null;
    }) as typeof window.open;
  });
}

/* ============================================================
 *  Login programático — não gravado
 * ============================================================ */
async function loginAndSaveState(browser: Browser): Promise<void> {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();
  await page.goto("/entrar/");
  await fieldInput(page, "E-mail").fill(DEMO_EMAIL!);
  await fieldInput(page, "Senha").fill(DEMO_PASSWORD!);
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await page.waitForURL(/meus-links/, { timeout: 15_000 });
  // Aguarda sessão estabilizar
  await beat(800);
  await ctx.storageState({ path: AUTH_STATE_FILE });
  await ctx.close();
}

/* ============================================================
 *  Test único com múltiplos contextos
 * ============================================================ */
test("walkthrough completo v2", async ({ browser }) => {
  test.setTimeout(5 * 60 * 1000);

  // ── Setup: login (sem gravação) ──────────────────────────────────
  await loginAndSaveState(browser);

  // ── Parte 1: corretor — perfil → simulador → compartilhar ──────
  const corretorCtx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: "./demo/output/raw",
      size: { width: 1920, height: 1080 },
    },
    storageState: AUTH_STATE_FILE,
  });
  await injectCursorHighlight(corretorCtx);
  const corretor = await corretorCtx.newPage();

  // /meus-links — quick visit pra mostrar nav
  await corretor.goto("/meus-links/");
  await beat(2000);

  // Hover/click "Perfil" no nav
  await corretor.getByRole("link", { name: /^perfil$/i }).click();
  await corretor.waitForURL(/perfil/);
  await beat(2500);

  // Scroll suave pelas seções de marca
  await corretor.evaluate(() =>
    window.scrollTo({ top: 350, behavior: "smooth" }),
  );
  await beat(2500);
  await corretor.evaluate(() =>
    window.scrollTo({ top: 800, behavior: "smooth" }),
  );
  await beat(2500);
  await corretor.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await beat(800);

  // Click "Simulador" no nav
  await corretor.getByRole("link", { name: /simulador/i }).first().click();
  await corretor.waitForURL(/simulador/);
  await beat(1500);

  // Reset cenário pra começar fresh (caso tenha state local)
  const limparBtn = corretor.getByRole("button", { name: /limpar tudo/i });
  if (await limparBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    corretor.once("dialog", (d) => d.accept());
    await limparBtn.click();
    await beat(500);
  }

  // Preenche cenário (fast-forward)
  await corretor
    .getByPlaceholder(/Apartamento 60m²/i)
    .fill("Apartamento exemplo · 60m²");
  await beat(400);
  await fieldInput(corretor, "Valor total").fill("460151");
  await beat(250);
  await fieldInput(corretor, "Financiado pelo banco").fill("338000");
  await beat(250);
  await fieldInput(corretor, "FGTS disponível").fill("12000");
  await beat(250);
  await fieldInput(corretor, "Períodos").fill("35");
  await beat(400);
  await fieldInput(corretor, "Parcela mensal").fill("1975,74");
  await beat(250);
  await fieldInput(corretor, "Parcela pós-entrega").fill("2996");
  await beat(250);
  await fieldInput(corretor, "Valor total do ato").fill("20000");
  await beat(700);

  // Scroll pra ver resultados (StatCards + tabela)
  await corretor.evaluate(() =>
    window.scrollTo({ top: 1600, behavior: "smooth" }),
  );
  await beat(2200);
  await corretor.evaluate(() =>
    window.scrollBy({ top: 600, behavior: "smooth" }),
  );
  await beat(2200);

  // Volta pro topo
  await corretor.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await beat(1000);

  // Captura URL do compartilhar
  await corretor.evaluate(() => {
    (window as unknown as { __captured?: string }).__captured = "";
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text: string) => {
      (window as unknown as { __captured: string }).__captured = text;
      return orig(text);
    };
  });

  await corretor
    .getByRole("button", { name: /^compartilhar$/i })
    .click();
  await beat(2800);

  const sharedUrl = await corretor.evaluate(
    () => (window as unknown as { __captured?: string }).__captured ?? "",
  );
  if (!sharedUrl) {
    throw new Error("Não capturou URL do compartilhar.");
  }

  await fs.mkdir("./demo", { recursive: true });
  await fs.writeFile(SHARE_URL_FILE, sharedUrl, "utf-8");

  await beat(800);
  await corretor.close();
  await corretorCtx.close();

  // ── Parte 2: cliente abre vanity URL + preenche + lead ──────────
  const url = await fs.readFile(SHARE_URL_FILE, "utf-8");
  const localUrl = url.replace(/^https?:\/\/[^/]+/, "");

  const clienteCtx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: "./demo/output/raw",
      size: { width: 1920, height: 1080 },
    },
  });
  await injectCursorHighlight(clienteCtx);
  const cliente = await clienteCtx.newPage();

  cliente.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[cliente console.${msg.type()}]`, msg.text());
    }
  });
  cliente.on("response", (resp) => {
    if (resp.url().includes("/leads") && resp.status() >= 400) {
      console.log(`[cliente leads HTTP ${resp.status()}]`, resp.url());
    }
  });

  await cliente.goto(localUrl);
  // Aguarda hidratação + scroll automático pra Orçamento + ring highlight
  await cliente.waitForSelector("#secao-orcamento", { timeout: 10_000 });
  await beat(3500);

  // Preenche renda + gastos
  await fieldInput(cliente, "Renda líquida").fill("8000");
  await beat(700);
  await fieldInput(cliente, "Gastos fixos mensais").fill("3000");
  await beat(1200);

  // Scroll pra ver resultados atualizados
  await cliente.evaluate(() =>
    window.scrollBy({ top: 600, behavior: "smooth" }),
  );
  await beat(2200);

  // Scroll pra ver o CTA de leads (após ResultsPanel)
  await cliente.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight - 600, behavior: "smooth" }),
  );
  await beat(2500);

  // Preenche o form do lead
  await fieldInput(cliente, "Como podemos te chamar").fill("Maria Demo");
  await beat(600);
  await fieldInput(cliente, "Seu WhatsApp").fill("11988887777");
  await beat(600);

  // LGPD checkbox
  await cliente.locator('input[type="checkbox"]').click();
  await beat(800);

  // Override window.open pra não abrir popup do PDF (deixa em-process só)
  await overrideWindowOpen(cliente);

  // Submit (precisa esperar 1.5s do anti-bot — já passou pelos beats)
  await cliente
    .getByRole("button", { name: /receber resumo em pdf/i })
    .click();
  await beat(2500);
  // Verifica se foi enviado (DoneCard aparece)
  const enviado = await cliente
    .getByText(/contato enviado pra/i)
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (!enviado) {
    console.log("[ALERTA] DoneCard não apareceu — submit pode ter falhado");
    // Pega texto de erro se houver
    const errMsg = await cliente
      .locator(".bg-red-soft")
      .first()
      .textContent({ timeout: 1000 })
      .catch(() => null);
    if (errMsg) console.log("[Erro inline]", errMsg);
  } else {
    console.log("[OK] Lead Maria Demo enviado");
  }

  await cliente.close();
  await clienteCtx.close();

  // ── Parte 3: corretor /leads + criar cenário + resposta rápida ──
  const corretor2Ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: "./demo/output/raw",
      size: { width: 1920, height: 1080 },
    },
    storageState: AUTH_STATE_FILE,
  });
  await injectCursorHighlight(corretor2Ctx);
  const corretor2 = await corretor2Ctx.newPage();

  await corretor2.goto("/leads/");
  await beat(2500);

  // Mostra a Maria Demo no topo da lista — espera renderizar
  await corretor2
    .getByText(/Maria Demo/i)
    .first()
    .waitFor({ timeout: 10_000 });
  await beat(2000);

  // Override window.open pra "Criar cenário" navegar na mesma aba
  await overrideWindowOpen(corretor2);

  // Click "Criar cenário pra esse lead" no card da Maria Demo
  // (primeiro botão com esse texto = lead mais recente)
  await corretor2
    .getByRole("button", { name: /criar cenário pra esse lead/i })
    .first()
    .click();
  await corretor2.waitForURL(/simulador/);
  await beat(2500);

  // Banner amarelo "Criando cenário pro lead Maria Demo" deve aparecer
  // Scroll suave pra mostrar o cenário pré-populado
  await corretor2.evaluate(() =>
    window.scrollTo({ top: 600, behavior: "smooth" }),
  );
  await beat(2000);

  // Corretor ajusta ato pra 3 parcelas (exemplo de customização)
  await fieldInput(corretor2, "Parcelado em").fill("3");
  await beat(1000);

  // Volta pro topo + Compartilhar
  await corretor2.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await beat(1000);

  await corretor2.evaluate(() => {
    (window as unknown as { __captured?: string }).__captured = "";
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text: string) => {
      (window as unknown as { __captured: string }).__captured = text;
      return orig(text);
    };
  });

  await corretor2
    .getByRole("button", { name: /^compartilhar$/i })
    .click();
  await beat(2500);

  // Volta pra /leads (simulador não tem AppHeader — navega direto)
  await corretor2.goto("/leads/");
  await beat(2500);

  // Maria agora tem badge "respondido"
  // Click "Resposta rápida" no card da Maria
  await corretor2
    .getByRole("button", { name: /resposta rápida/i })
    .first()
    .click();
  await beat(3500);

  // Popover com template visível por uns segundos pra leitor ler
  // Click "Mandar via WhatsApp" — overrride não abre wa.me, mas botão clicado
  const mandarBtn = corretor2.getByRole("button", {
    name: /mandar via whatsapp/i,
  });
  if (await mandarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await mandarBtn.click();
    await beat(1500);
  }

  await beat(800);
  await corretor2.close();
  await corretor2Ctx.close();
});
