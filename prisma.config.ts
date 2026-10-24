import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Göçler için havuzsuz (doğrudan) bağlantı tercih edilir; yönetilen veritabanlarında
    // DATABASE_URL havuzlu adres olabilir (ör. Neon "-pooler"). Tanımlı değilse DATABASE_URL.
    url: process.env.DIRECT_DATABASE_URL ? process.env.DIRECT_DATABASE_URL : env("DATABASE_URL"),
  },
});
