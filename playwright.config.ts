import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

/**
 * Uçtan uca testler demo veritabanına karşı çalışır (npm run db:seed && npm run db:seed:demo).
 * Testlerdeki tüm ürün/fiyat/uçuş verileri "Test verisi" etiketli fixture kaynaklarından gelir.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL, locale: "tr-TR", timezoneId: "Europe/Istanbul", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run dev -- --port ${port}`, url: `${baseURL}/api/health`, reuseExistingServer: true, timeout: 180_000 },
});
