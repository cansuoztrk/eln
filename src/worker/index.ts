/**
 * Arka plan worker'ı — tarayıcıdan bağımsız, sürekli çalışan sunucu süreci.
 *
 *   npm run worker
 *
 * Döngü: (1) zamanı gelen zamanlamaları kuyruğa ekle, (2) kuyruktan görev al ve çalıştır,
 * (3) heartbeat'i kesilen görevleri kurtar. Birden çok worker güvenle paralel çalışabilir.
 * SIGTERM/SIGINT alındığında yeni görev almayı bırakır ve çalışan görevlerin bitmesini bekler.
 */
import "dotenv/config";
import { hostname } from "node:os";
import { db } from "../server/db";
import { claimNextJob, reapStuckJobs } from "../server/jobs/queue";
import { runJob } from "../server/jobs/runner";
import { ensureSchedules, planDueJobs } from "../server/jobs/scheduler";

const concurrency = Math.max(1, Number(process.env.WORKER_CONCURRENCY || 2));
const pollMs = Math.max(500, Number(process.env.WORKER_POLL_MS || 3000));
const workerId = `${hostname()}:${process.pid}`;
let stopping = false;
const running = new Set<Promise<unknown>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function slot(index: number) {
  while (!stopping) {
    try {
      const job = await claimNextJob(db, `${workerId}#${index}`);
      if (!job) {
        await sleep(pollMs);
        continue;
      }
      const p = runJob(db, job);
      running.add(p);
      const outcome = await p;
      running.delete(p);
      console.log(`[worker] ${outcome.type} → ${outcome.status} (${outcome.durationMs} ms)`);
    } catch (err) {
      // Veritabanı geçici olarak erişilemiyorsa döngü çökmez; bekleyip tekrar dener.
      console.error("[worker] döngü hatası:", (err as Error).message);
      await sleep(Math.min(pollMs * 5, 30_000));
    }
  }
}

async function planner() {
  while (!stopping) {
    try {
      const reaped = await reapStuckJobs(db);
      const { enqueued } = await planDueJobs(db);
      if (enqueued || reaped) console.log(`[planner] ${enqueued} görev planlandı, ${reaped} takılı görev kurtarıldı`);
    } catch (err) {
      console.error("[planner] hata:", (err as Error).message);
    }
    await sleep(30_000);
  }
}

async function main() {
  console.log(`[worker] başlatılıyor: ${workerId}, eşzamanlılık=${concurrency}`);
  await ensureSchedules(db);
  const loops = [planner(), ...Array.from({ length: concurrency }, (_, i) => slot(i))];
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`[worker] ${signal} alındı; çalışan ${running.size} görevin bitmesi bekleniyor…`);
    const timeout = sleep(60_000).then(() => "timeout");
    await Promise.race([Promise.allSettled([...running]), timeout]);
    await db.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  await Promise.all(loops);
}

main().catch((err) => {
  console.error("[worker] başlatılamadı:", err);
  process.exit(1);
});
