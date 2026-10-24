/** Entegrasyon testlerinde ortak veritabanı yardımcıları. */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://firsat:firsat@localhost:5432/firsatradar_test?schema=public";

export async function getDb() {
  const { db } = await import("../../src/server/db");
  return db;
}

export const silentCtx = (now = new Date()) => ({ jobId: null, dataSourceId: null, log: () => {}, now });
