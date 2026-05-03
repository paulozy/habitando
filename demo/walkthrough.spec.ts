import { test, type BrowserContext, type Page } from "@playwright/test";
import * as fs from "node:fs/promises";

/**
 * Localiza um input dentro de um <Field label="..."> da UI.
 * Field renderiza <div><label>...</label>{children}</div>, então
 * partimos do label e subimos uma div pra encontrar o input descendente.
 */
function fieldInput(page: Page, label: string) {
  return page
    .locator("label", { hasText: label })
    .locator("xpath=..")
    .locator("input")
    .first();
}

/**
 * Walkthrough completo do Habitando — produz screencast de ~80s.
 *
 * Estrutura em 3 partes (cada uma vira um vídeo separado, mergeado depois
 * por demo/build-mp4.mjs):
 *
 *  1. Corretor: LP → simulador → identidade → cenário → resultados →
 *     compartilhar
 *  2. Cliente: abre o link → vê banner → edita renda/gastos → devolve
 *  3. Corretor revisita: reabre o link, vê alterações
 */

const SHARE_URL_FILE = "demo/.share-url.txt";
const CORRETOR_NOME = "João Silva";
const CORRETOR_WHATS = "11999998888";

/** Pause humanizada — momentos de "olhar pro que apareceu". */
const beat = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Injeta no browser um cursor visível (highlight dourado seguindo o mouse). */
function injectCursorHighlight(context: BrowserContext) {
  return context.addInitScript(() => {
    if ((window as unknown as { __cursorInjected?: boolean }).__cursorInjected) {
      return;
    }
    (window as unknown as { __cursorInjected: boolean }).__cursorInjected = true;

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

test.describe.serial("Habitando · walkthrough completo", () => {
  test("1. Corretor monta cenário e compartilha", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: "./demo/output/raw",
        size: { width: 1920, height: 1080 },
      },
    });
    await injectCursorHighlight(context);
    const page = await context.newPage();

    // ── 1. LP ────────────────────────────────────────────────────────────
    await page.goto("/");
    await beat(2000);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
    await beat(2200);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "smooth" }));
    await beat(2200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await beat(1200);
    await page.getByRole("link", { name: /ver demo/i }).first().click();
    await page.waitForURL(/\/simulador/);
    await beat(1800);

    // ── 2. Configura identidade ──────────────────────────────────────────
    await page.getByRole("button", { name: /minha identidade/i }).click();
    await beat(1000);
    await page.getByLabel(/seu nome/i).fill(CORRETOR_NOME);
    await beat(500);
    await page.getByLabel(/whatsapp/i).fill(CORRETOR_WHATS);
    await beat(700);
    await page.getByRole("button", { name: /salvar identidade/i }).click();
    await beat(1000);

    // ── 3. Preenche cenário ──────────────────────────────────────────────
    await page
      .getByPlaceholder(/Apartamento 60m²/i)
      .fill("Apartamento exemplo · 60m²");
    await beat(500);

    // Imóvel
    await fieldInput(page, "Valor total").fill("460151");
    await beat(300);
    await fieldInput(page, "Financiado pelo banco").fill("338000");
    await beat(300);
    await fieldInput(page, "FGTS disponível").fill("12000");
    await beat(300);
    await fieldInput(page, "Períodos").fill("35");
    await beat(500);

    // Entrada — parcela mensal e pós-entrega
    await fieldInput(page, "Parcela mensal").fill("1975,74");
    await beat(300);
    await fieldInput(page, "Parcela pós-entrega").fill("2996");
    await beat(300);

    // Ato (1× à vista, valor 20k)
    await fieldInput(page, "Valor total do ato").fill("20000");
    await beat(800);

    // ── 4. Resultados — indicadores, gráfico, tabela detalhada ──────────
    // Scroll pra StatCards (indicadores)
    await page.evaluate(() =>
      window.scrollTo({ top: 1600, behavior: "smooth" }),
    );
    await beat(2200);

    // Gráfico stacked bar
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
    await beat(2500);

    // Tabela detalhada (mês a mês com INCC/parcela/total/saldo)
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight - 800, behavior: "smooth" }),
    );
    await beat(3500);

    // ── 5. Comparativo: cria 2º cenário com ato 3× ─────────────────────
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await beat(1200);

    // Duplica o 1º cenário (preserva todos os valores) — depois vamos
    // mudar só o ato pra 3 parcelas
    await page.locator('button[title="Duplicar"]').first().click();
    await beat(1500);

    // No 2º cenário, muda só o ato pra 3 parcelas
    await fieldInput(page, "Parcelado em").fill("3");
    await beat(800);

    // Aba "Comparar"
    await page.getByRole("tab", { name: /comparar/i }).click();
    await beat(2500);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await beat(2500);
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await beat(2500);

    // ── 6. Exportar PDF ────────────────────────────────────────────────
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await beat(800);
    await page.getByRole("tab", { name: /configura/i }).click();
    await beat(1000);

    // Click "Exportar PDF" → abre popup. Pegamos a URL e navegamos no
    // mesmo tab pra capturar no vídeo.
    const pdfPopupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: /exportar pdf/i }).click();
    const pdfPopup = await pdfPopupPromise;
    const pdfUrl = pdfPopup.url();
    await pdfPopup.close();

    await page.goto(pdfUrl);
    await beat(2500);
    // Scroll pelo PDF: capa → cenário 1 → cenário 2 → comparativo
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
    await beat(2500);
    await page.evaluate(() => window.scrollTo({ top: 1700, behavior: "smooth" }));
    await beat(2500);
    await page.evaluate(() => window.scrollTo({ top: 2700, behavior: "smooth" }));
    await beat(2500);
    await page.evaluate(() => window.scrollTo({ top: 3600, behavior: "smooth" }));
    await beat(2500);

    // ── 7. Volta pro simulador e compartilha ───────────────────────────
    await page.goto("/simulador/");
    await beat(2000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await beat(800);

    // Override clipboard pra capturar a URL
    await page.evaluate(() => {
      (window as unknown as { __captured?: string }).__captured = "";
      const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async (text: string) => {
        (window as unknown as { __captured: string }).__captured = text;
        return orig(text);
      };
    });

    await page.getByRole("button", { name: /^compartilhar$/i }).click();
    // Aguarda a Promise do createShare resolver e o feedback "copiado"
    await beat(3000);

    const sharedUrl = await page.evaluate(
      () => (window as unknown as { __captured?: string }).__captured ?? "",
    );
    if (!sharedUrl) {
      throw new Error(
        "Não capturou a URL — verifique se Supabase está configurado em .env.local",
      );
    }

    await fs.mkdir("./demo", { recursive: true });
    await fs.writeFile(SHARE_URL_FILE, sharedUrl, "utf-8");

    await beat(1500);
    await page.close();
    await context.close();
  });

  test("2. Cliente abre o link, edita Orçamento e devolve", async ({
    browser,
  }) => {
    const url = await fs.readFile(SHARE_URL_FILE, "utf-8");
    const localUrl = url.replace(/^https?:\/\/[^/]+/, "");

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: "./demo/output/raw",
        size: { width: 1920, height: 1080 },
      },
    });
    await injectCursorHighlight(context);
    const page = await context.newPage();

    // Cliente fresh — sem identidade, sem cenários antigos
    await page.goto(localUrl);
    await page.waitForLoadState("networkidle");
    // Espera o banner do cliente aparecer (sinal que received foi setado)
    await page
      .getByText(/compartilhou esse cenário com você/i)
      .waitFor({ timeout: 15_000 });
    // Hidratação + scroll automático + highlight
    await beat(2500);

    // Cliente preenche renda do Comprador 1
    await fieldInput(page, "Renda líquida").fill("14580");
    await beat(800);

    // Cliente preenche gastos fixos
    await fieldInput(page, "Gastos fixos mensais").fill("5000");
    await beat(1000);

    // Scroll pra mostrar resultados atualizados
    await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
    await beat(2500);

    // Volta pra cima pra mostrar o banner + botão Devolver
    await page.evaluate(() =>
      document.getElementById("secao-orcamento")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
    await beat(2000);

    // Intercepta o popup do WhatsApp pra não tentar abrir externamente
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await page
      .getByRole("button", { name: /mandar pra/i })
      .first()
      .click();
    const popup = await popupPromise;
    await beat(1800);
    if (popup) await popup.close().catch(() => {});

    await beat(800);
    await page.close();
    await context.close();
  });

  test("3. Corretor reabre e vê alterações do cliente", async ({ browser }) => {
    const url = await fs.readFile(SHARE_URL_FILE, "utf-8");
    const localUrl = url.replace(/^https?:\/\/[^/]+/, "");

    // Pré-carrega identidade do corretor pra simular self-detection
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: "./demo/output/raw",
        size: { width: 1920, height: 1080 },
      },
      storageState: {
        cookies: [],
        origins: [
          {
            origin: "http://localhost:3000",
            localStorage: [
              {
                name: "habitando:corretor-own",
                value: JSON.stringify({
                  nome: CORRETOR_NOME,
                  whatsapp: "55" + CORRETOR_WHATS,
                }),
              },
            ],
          },
        ],
      },
    });
    await injectCursorHighlight(context);
    const page = await context.newPage();

    await page.goto(localUrl);
    await beat(3500);

    // Scroll pra Orçamento mostrar valores que cliente preencheu
    await page.evaluate(() =>
      document.getElementById("secao-orcamento")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
    await beat(3000);

    // Scroll mais pra ver o resultado atualizado
    await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
    await beat(3000);

    await page.close();
    await context.close();
  });
});
