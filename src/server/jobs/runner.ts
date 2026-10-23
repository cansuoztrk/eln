import type { Db } from "../db";
import { createJobLogger } from "./context";
import { claimNextJob, completeJob, failJob, heartbeat, type JobRow, reapStuckJobs } from "./queue";
import { jobHandlers } from "./registry";
import { planDueJobs } from "./scheduler";

export type RunOutcome = { jobId: string; type: string; status: "SUCCEEDED" | "RETRY" | "FAILED"; durationMs: number };

export async function runJob(db: Db, job: JobRow): Promise<RunOutcome> {
  const startedAt = Date.now();
  const handler = jobHandlers[job.type];
  const { log, flush } = createJobLogger(db, job.id, job.dataSourceId);
  if (!handler) {
    log("ERROR", `Bilinmeyen görev tipi: ${job.type}`);
    await flush();
    await failJob(db, { ...job, maxAttempts: 0 }, startedAt, new Error(`Bilinmeyen görev tipi: ${job.type}`));
    return { jobId: job.id, type: job.type, status: "FAILED", durationMs: Date.now() - startedAt };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), handler.timeoutMs);
  const hb = setInterval(() => void heartbeat(db, job.id), 30_000);
  log("INFO", `Görev başladı: ${handler.label} (deneme ${job.attempt}/${job.maxAttempts})`);
  try {
    const stats = await handler.run(db, { jobId: job.id, dataSourceId: job.dataSourceId, log, now: new Date(), signal: controller.signal }, (job.payload ?? {}) as Record<string, unknown>);
    await flush();
    await completeJob(db, job.id, startedAt, stats);
    return { jobId: job.id, type: job.type, status: "SUCCEEDED", durationMs: Date.now() - startedAt };
  } catch (err) {
    log("ERROR", `Görev hatası: ${(err as Error)?.message ?? String(err)}`);
    await flush();
    const status = await failJob(db, job, startedAt, controller.signal.aborted ? new Error(`Zaman aşımı (${Math.round(handler.timeoutMs / 60000)} dk)`) : err);
    return { jobId: job.id, type: job.type, status, durationMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
    clearInterval(hb);
  }
}

/**
 * Tek seferlik çalışma (HTTP cron veya CLI): planlayıcıyı çalıştırır, sonra süre bütçesi
 * dolana kadar kuyruktaki görevleri işler.
 */
export async function tick(db: Db, opts: { workerId: string; budgetMs: number; maxJobs?: number }): Promise<{ planned: number; reaped: number; outcomes: RunOutcome[] }> {
  const reaped = await reapStuckJobs(db);
  const { enqueued } = await planDueJobs(db);
  const deadline = Date.now() + opts.budgetMs;
  const outcomes: RunOutcome[] = [];
  while (Date.now() < deadline && outcomes.length < (opts.maxJobs ?? 50)) {
    const job = await claimNextJob(db, opts.workerId);
    if (!job) break;
    outcomes.push(await runJob(db, job));
  }
  return { planned: enqueued, reaped, outcomes };
}
