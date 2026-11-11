import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests run against a production build and a freshly reset local
 * Supabase:
 *
 *   npm run db:reset && npm run build && npm run test:e2e
 *
 * They walk through the real first-run story once, in order, so they need an
 * empty database to start from.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  outputDir: "test-results",
  use: { baseURL: `http://127.0.0.1:${PORT}`, locale: "tr-TR", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
