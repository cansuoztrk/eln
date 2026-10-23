/**
 * Tek seferlik çalıştırma (cron sistemleri veya elle tetikleme için):
 *
 *   npm run jobs:run                       # planlayıcı + kuyruktaki görevler (en çok 5 dk)
 *   npm run jobs:run -- retail.refresh fixture-atlas   # belirli görev tipini belirli kaynak için kuyruğa ekleyip çalıştırır
 */
import "dotenv/config";
import { hostname } from "node:os";
import { db } from "../server/db";
import { enqueueJob } from "../server/jobs/queue";
import { tick } from "../server/jobs/runner";
import { ensureSchedules } from "../server/jobs/scheduler";

async function main() {
  const [type, sourceKey] = process.argv.slice(2);
  await ensureSchedules(db);
  if (type) {
    const source = sourceKey ? await db.dataSource.findUnique({ where: { key: sourceKey } }) : null;
    if (sourceKey && !source) throw new Error(`Veri kaynağı bulunamadı: ${sourceKey}`);
    const id = await enqueueJob(db, { type, dataSourceId: source?.id ?? null, trigger: "MANUAL", priority: 10, dedupeKey: `cli:${type}:${sourceKey ?? ""}:${Date.now()}` });
    console.log(`Görev kuyruğa eklendi: ${id}`);
  }
  const result = await tick(db, { workerId: `cli:${hostname()}:${process.pid}`, budgetMs: Number(process.env.JOBS_BUDGET_MS || 300_000) });
  for (const o of result.outcomes) console.log(`${o.type} → ${o.status} (${o.durationMs} ms)`);
  console.log(`Planlanan: ${result.planned}, kurtarılan: ${result.reaped}, çalışan: ${result.outcomes.length}`);
  await db.$disconnect();
  if (result.outcomes.some((o) => o.status === "FAILED")) process.exitCode = 1;
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
