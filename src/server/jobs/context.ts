import type { Prisma } from "@/generated/prisma/client";
import type { Db } from "../db";
import type { LogFn } from "../integrations/types";

export type JobContext = {
  jobId: string | null;
  dataSourceId: string | null;
  log: LogFn;
  now: Date;
  signal?: AbortSignal;
};

/**
 * Görev günlüğü: IngestionLog tablosuna yazar ve konsola basar. DEBUG kayıtları yalnızca
 * LOG_DEBUG=true iken veritabanına yazılır (tablo şişmesin diye).
 */
export function createJobLogger(db: Db, jobId: string | null, dataSourceId: string | null): { log: LogFn; flush: () => Promise<void> } {
  const buffer: Prisma.IngestionLogCreateManyInput[] = [];
  const debug = process.env.LOG_DEBUG === "true";
  const log: LogFn = (level, message, context) => {
    const line = `[${new Date().toISOString()}] ${level} ${jobId ?? "-"} ${message}${context ? ` ${JSON.stringify(context).slice(0, 500)}` : ""}`;
    if (level === "ERROR") console.error(line);
    else if (level === "WARN") console.warn(line);
    else if (level !== "DEBUG" || debug) console.log(line);
    if (level === "DEBUG" && !debug) return;
    buffer.push({ jobId, dataSourceId, level, message: message.slice(0, 2000), context: context ? (JSON.parse(JSON.stringify(context)) as Prisma.InputJsonValue) : undefined });
    if (buffer.length >= 50) void flush();
  };
  async function flush() {
    if (buffer.length === 0) return;
    const rows = buffer.splice(0, buffer.length);
    try {
      await db.ingestionLog.createMany({ data: rows });
    } catch (err) {
      console.error("Günlük yazılamadı", err);
    }
  }
  return { log, flush };
}
