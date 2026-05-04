import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Configuração do Playwright pra gravação de demo.
 * Não substitui os testes unitários (vitest) — é específico pra screencast.
 *
 * Rodar com: `pnpm demo:record`
 */

// Carrega .env (manualmente — Playwright não faz isso automaticamente).
// Mantém vars existentes em process.env (CI prevalece sobre .env local).
try {
  const raw = readFileSync(resolve(__dirname, ".env"), "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  /* sem .env — ok, env vars podem vir de outras fontes */
}
export default defineConfig({
  testDir: "./demo",
  outputDir: "./demo/output",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 5 * 60 * 1000, // 5 min — demo pode levar 1-2 min com pausas
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    video: {
      mode: "on",
      size: { width: 1920, height: 1080 },
    },
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Build estático + serve = sem indicador "Next.js dev mode" no canto.
    // -L disabled access logs (clean console).
    command: "pnpm build && pnpm exec serve out -p 3000 -L",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000, // build pode levar até 60s + serve start
  },
});
