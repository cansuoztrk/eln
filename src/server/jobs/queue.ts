/**
 * Veritabanı tabanlı görev kuyruğu (ek altyapı gerektirmez; PostgreSQL yeterlidir).
 *
 *  - Görev alma: `FOR UPDATE SKIP LOCKED` ile birden çok worker güvenle çalışır.
 *  - Aynı veri kaynağı için aynı anda tek görev çalışır (sağlayıcı hız sınırlarına saygı).
 *    Bu kontrol, işlem kapsamlı advisory lock altında yapıldığı için yarış koşuluna kapalıdır.
 *  - `dedupeKey` benzersizdir: aynı zaman penceresi için ikinci görev oluşturulamaz.
 *  - Tekrar deneme: yalnızca "retryable" hatalarda, üstel geri çekilmeyle, maxAttempts'e kadar.
 *  - Yanıt vermeyen (heartbeat'i kesilen) görevler geri alınır.
 */

import type { Prisma } from "@/generated/prisma/client";
import { MINUTE } from "@/lib/time";
import type { Db } from "../db";
import { IntegrationError } from "../integrations/types";

export type JobRow = {
  id: string;
  type: string;
  dataSourceId: string | null;
  payload: Prisma.JsonValue;
  attempt: number;
  maxAttempts: number;
  trigger: string;
  dedupeKey: string | null;
};

export type EnqueueInput = {
  type: string;
  dataSourceId?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
  runAt?: Date;
  priority?: number;
  trigger?: "SCHEDULE" | "MANUAL" | "CRON_HTTP" | "RETRY" | "EVENT";
  maxAttempts?: number;
  triggeredById?: string | null;
  retryOfId?: string | null;
};

/** Görev ekler. Aynı dedupeKey varsa yeni görev oluşturmaz ve null döner. */
export async function enqueueJob(db: Db, input: EnqueueInput): Promise<string | null> {
  const res = await db.ingestionJob.createManyAndReturn({
    data: [
      {
        type: input.type,
        dataSourceId: input.dataSourceId ?? null,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        dedupeKey: input.dedupeKey ?? null,
        runAt: input.runAt ?? new Date(),
        priority: input.priority ?? 0,
        trigger: input.trigger ?? "SCHEDULE",
        maxAttempts: input.maxAttempts ?? 3,
        triggeredById: input.triggeredById ?? null,
        retryOfId: input.retryOfId ?? null,
      },
    ],
    skipDuplicates: true,
    select: { id: true },
  });
  return res[0]?.id ?? null;
}

export async function claimNextJob(db: Db, workerId: string, types?: string[]): Promise<JobRow | null> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(727274)`;
    const typeFilter = types && types.length ? types : null;
    const rows = await tx.$queryRaw<JobRow[]>`
      UPDATE "IngestionJob"
      SET status = 'RUNNING', "startedAt" = now(), "lockedBy" = ${workerId}, "heartbeatAt" = now(), attempt = attempt + 1, "finishedAt" = NULL
      WHERE id = (
        SELECT j.id FROM "IngestionJob" j
        WHERE j.status = 'QUEUED' AND j."runAt" <= now()
          AND (${typeFilter}::text[] IS NULL OR j.type = ANY(${typeFilter}::text[]))
          AND (j."dataSourceId" IS NULL OR NOT EXISTS (
            SELECT 1 FROM "IngestionJob" r WHERE r.status = 'RUNNING' AND r."dataSourceId" = j."dataSourceId"
          ))
        ORDER BY j.priority DESC, j."runAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, type, "dataSourceId", payload, attempt, "maxAttempts", trigger::text AS trigger, "dedupeKey"`;
    return rows[0] ?? null;
  });
}

export async function heartbeat(db: Db, jobId: string): Promise<void> {
  await db.ingestionJob.update({ where: { id: jobId }, data: { heartbeatAt: new Date() } }).catch(() => {});
}

export async function completeJob(db: Db, jobId: string, startedAt: number, stats: unknown): Promise<void> {
  await db.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: "SUCCEEDED",
      finishedAt: new Date(),
      durationMs: Date.now() - startedAt,
      stats: (stats ?? {}) as Prisma.InputJsonValue,
      error: null,
      lockedBy: null,
    },
  });
}

export function retryDelayMs(attempt: number, err: unknown): number {
  if (err instanceof IntegrationError && err.retryAfterMs) return Math.max(err.retryAfterMs, MINUTE);
  return Math.min(60, 2 ** attempt) * MINUTE;
}

export function isRetryable(err: unknown): boolean {
  if (err instanceof IntegrationError) return err.retryable;
  // Veritabanı bağlantı sorunları gibi beklenmeyen hatalar sınırlı sayıda tekrar denenir.
  return true;
}

export async function failJob(db: Db, job: JobRow, startedAt: number, err: unknown): Promise<"RETRY" | "FAILED"> {
  const message = `${err instanceof IntegrationError ? `[${err.code}] ` : ""}${(err as Error)?.message ?? String(err)}`.slice(0, 2000);
  const retry = isRetryable(err) && job.attempt < job.maxAttempts;
  await db.ingestionJob.update({
    where: { id: job.id },
    data: {
      status: retry ? "QUEUED" : "FAILED",
      runAt: retry ? new Date(Date.now() + retryDelayMs(job.attempt, err)) : undefined,
      finishedAt: retry ? null : new Date(),
      durationMs: Date.now() - startedAt,
      error: message,
      lockedBy: null,
    },
  });
  return retry ? "RETRY" : "FAILED";
}

/** Heartbeat'i kesilmiş RUNNING görevleri kurtarır (worker çökmesi, dağıtım yeniden başlatması). */
export async function reapStuckJobs(db: Db, staleAfterMs = 10 * MINUTE): Promise<number> {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const stuck = await db.ingestionJob.findMany({ where: { status: "RUNNING", heartbeatAt: { lt: cutoff } }, select: { id: true, attempt: true, maxAttempts: true } });
  for (const j of stuck) {
    const retry = j.attempt < j.maxAttempts;
    await db.ingestionJob.update({
      where: { id: j.id },
      data: {
        status: retry ? "QUEUED" : "FAILED",
        runAt: new Date(Date.now() + MINUTE),
        error: "Worker yanıt vermedi (heartbeat kesildi); görev geri alındı.",
        lockedBy: null,
        finishedAt: retry ? null : new Date(),
      },
    });
  }
  return stuck.length;
}

/** Yönetici: başarısız bir görevi güvenli şekilde yeniden çalıştırır (yeni görev kaydı). */
export async function retryJobManually(db: Db, jobId: string, userId: string | null): Promise<string | null> {
  const job = await db.ingestionJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  if (job.status === "RUNNING" || job.status === "QUEUED") return null;
  return enqueueJob(db, {
    type: job.type,
    dataSourceId: job.dataSourceId,
    payload: (job.payload ?? {}) as Record<string, unknown>,
    trigger: "RETRY",
    priority: 5,
    triggeredById: userId,
    retryOfId: job.id,
    dedupeKey: `retry:${job.id}:${Date.now()}`,
  });
}
