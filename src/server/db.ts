import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Tekil Prisma istemcisi. Geliştirme ortamında sıcak yeniden yüklemede bağlantı havuzunun
 * çoğalmaması için globalThis üzerinde saklanır.
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");
  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
  });
  return new PrismaClient({ adapter, log: process.env.PRISMA_LOG === "query" ? ["query", "warn", "error"] : ["warn", "error"] });
}

export const db: PrismaClient = globalForPrisma.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = db;

export type Db = PrismaClient;
