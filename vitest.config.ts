import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // "server-only" yalnızca Next.js derlemesinde anlamlıdır; testlerde boş modüle eşlenir.
  "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
};

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://firsat:firsat@localhost:5432/firsatradar_test?schema=public";

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/support/integration-setup.ts"],
          env: { DATABASE_URL: testDatabaseUrl, TEST_DATABASE_URL: testDatabaseUrl, SHOW_TEST_DATA: "true" },
          // Testler aynı veritabanını paylaşır; sırayla çalışır
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
